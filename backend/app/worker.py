import asyncio
import os
import re
import datetime
from pathlib import Path
from typing import Optional
import yt_dlp
import httpx
from .config import settings, get_cookie_file_path
from .models import Job
from .queue import job_queue
from .services.ffmpeg_service import FFmpegService, get_ffmpeg_path
from .services.storage_service import StorageService
from .services.metadata_service import format_bytes

class MediaWorker:
    def __init__(self, worker_id: int = 1):
        self.worker_id = worker_id
        self.is_running = True

    async def start(self):
        print(f"[Worker-{self.worker_id}] Started media processing worker loop.")
        while self.is_running:
            try:
                job_data = await job_queue.dequeue()
                if job_data:
                    await self.process_job(job_data)
                    job_queue.task_done()
                else:
                    await asyncio.sleep(0.1)
            except asyncio.CancelledError:
                self.is_running = False
                break
            except Exception as e:
                print(f"[Worker-{self.worker_id}] Error in worker loop: {e}")
                await asyncio.sleep(0.5)

    def stop(self):
        self.is_running = False

    async def update_job_status(
        self,
        job_id: str,
        status: str,
        progress: float,
        phase: str,
        speed: Optional[str] = None,
        eta: Optional[str] = None,
        message: Optional[str] = None,
        error: Optional[str] = None,
        file_name: Optional[str] = None,
        file_path: Optional[str] = None,
        file_size: Optional[int] = None,
        download_url: Optional[str] = None,
        checksum: Optional[str] = None,
        expires_at: Optional[int] = None
    ):
        existing_job = await Job.get(job_id)
        if existing_job and existing_job.status in ("completed", "failed", "cancelled"):
            if status not in ("completed", "failed", "cancelled"):
                return # Do not allow delayed progress updates to revert a terminal state

        update_fields = {
            "status": status,
            "progress": progress,
            "phase": phase,
        }
        if speed is not None: update_fields["speed"] = speed
        if eta is not None: update_fields["eta"] = eta
        if message is not None: update_fields["message"] = message
        if error is not None: update_fields["error"] = error
        if file_name is not None: update_fields["file_name"] = file_name
        if file_path is not None: update_fields["file_path"] = file_path
        if file_size is not None:
            update_fields["file_size"] = file_size
            update_fields["file_size_str"] = format_bytes(file_size)
        if download_url is not None: update_fields["download_url"] = download_url
        if checksum is not None: update_fields["checksum"] = checksum
        if expires_at is not None: update_fields["expires_at"] = expires_at
        if status in ("completed", "failed", "cancelled"):
            update_fields["finished_at"] = datetime.datetime.utcnow().isoformat()

        await Job.update(job_id, **update_fields)
        job = await Job.get(job_id)
        if job:
            await job_queue.broadcast_progress(job_id, job.to_dict())

    async def process_job(self, job_data: dict):
        job_id = job_data["job_id"]
        url = job_data["url"]
        media_type = job_data.get("media_type", "video")
        target_ext = job_data.get("target_ext", "mp4").lower().replace(".", "")
        format_id = job_data.get("format_id")
        target_quality = job_data.get("target_quality")
        trim_start = job_data.get("trim_start")
        trim_end = job_data.get("trim_end")
        audio_bitrate = job_data.get("audio_bitrate", "320k")
        compress_crf = job_data.get("compress_crf", 26)

        job_dir = StorageService.get_job_directory(job_id)
        raw_download_path = str(job_dir / f"source_{job_id}")
        output_file_name = f"mediaflow_{job_id[:8]}.{target_ext}"
        final_output_path = str(job_dir / output_file_name)

        await self.update_job_status(
            job_id, status="downloading", progress=5.0, phase="Downloading media stream..."
        )

        loop = asyncio.get_running_loop()

        def progress_hook(d):
            if job_queue.is_cancelled(job_id):
                raise ValueError("Job cancelled by user.")
            if d['status'] == 'downloading':
                total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate')
                downloaded = d.get('downloaded_bytes', 0)
                pct = 5.0 + ((downloaded / total_bytes) * 55.0) if total_bytes else 30.0
                speed_str = d.get('_speed_str', '')
                eta_str = d.get('_eta_str', '')
                asyncio.run_coroutine_threadsafe(
                    self.update_job_status(
                        job_id, status="downloading", progress=pct,
                        phase="Downloading stream...", speed=speed_str, eta=eta_str
                    ),
                    loop
                )

        try:
            is_direct = any(url.split("?")[0].lower().endswith(ext) for ext in (".mp4", ".mp3", ".webm", ".mkv", ".wav"))
            downloaded_file = None

            if is_direct:
                async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                    async with client.stream("GET", url) as resp:
                        direct_target = f"{raw_download_path}.{target_ext}"
                        with open(direct_target, "wb") as f:
                            async for chunk in resp.aiter_bytes(chunk_size=1024 * 1024):
                                if job_queue.is_cancelled(job_id):
                                    raise ValueError("Job cancelled by user.")
                                f.write(chunk)
                        downloaded_file = direct_target
            else:
                def run_ytdlp():
                    # Precise resolution targeting based on selected format & quality
                    target_height = None
                    if target_quality:
                        m = re.search(r'(\d+)p', str(target_quality))
                        if m:
                            target_height = int(m.group(1))

                    if format_id and format_id != "best":
                        if target_height:
                            target_format = f"{format_id}+bestaudio/bestvideo[height<={target_height}]+bestaudio/{format_id}/best"
                        else:
                            target_format = f"{format_id}+bestaudio/bestvideo+bestaudio/{format_id}/best"
                    elif media_type == "audio":
                        target_format = "bestaudio/best"
                    else:
                        if target_height:
                            target_format = f"bestvideo[height<={target_height}]+bestaudio/bestvideo+bestaudio/best"
                        else:
                            target_format = "bestvideo+bestaudio/best"

                    is_youtube = any(domain in url.lower() for domain in ("youtube.com", "youtu.be"))
                    cookie_file = get_cookie_file_path()

                    primary_opts = {
                        'outtmpl': f"{raw_download_path}.%(ext)s",
                        'progress_hooks': [progress_hook],
                        'quiet': True,
                        'no_warnings': True,
                        'noplaylist': True,
                        'socket_timeout': 30,
                        'retries': 3,
                        'ffmpeg_location': get_ffmpeg_path(),
                        'format': target_format,
                        'merge_output_format': target_ext,
                    }
                    if is_youtube and not cookie_file:
                        primary_opts['extractor_args'] = {
                            'youtube': {
                                'player_client': ['android']
                            }
                        }
                    if cookie_file:
                        primary_opts['cookiefile'] = cookie_file

                    import shutil
                    if shutil.which("node"):
                        primary_opts['js_runtimes'] = {'node': {}}

                    try:
                        with yt_dlp.YoutubeDL(primary_opts) as ydl:
                            ydl.download([url])
                    except Exception as primary_err:
                        print(f"[Worker-{self.worker_id}] Primary download attempt hit {primary_err}. Attempting fallback...")
                        fallback_opts = {
                            'outtmpl': f"{raw_download_path}.%(ext)s",
                            'progress_hooks': [progress_hook],
                            'quiet': True,
                            'no_warnings': True,
                            'noplaylist': True,
                            'socket_timeout': 30,
                            'retries': 5,
                            'ffmpeg_location': get_ffmpeg_path(),
                            'format': f"{target_format}/18/bestaudio/best",
                        }
                        if is_youtube:
                            fallback_opts['extractor_args'] = {
                                'youtube': {
                                    'player_client': ['android', 'ios']
                                }
                            }
                        if cookie_file:
                            fallback_opts['cookiefile'] = cookie_file
                        if shutil.which("node"):
                            fallback_opts['js_runtimes'] = {'node': {}}

                        with yt_dlp.YoutubeDL(fallback_opts) as ydl:
                            ydl.download([url])

                await loop.run_in_executor(None, run_ytdlp)

                # Find downloaded file, skipping temp/part files
                candidate_files = [
                    item for item in job_dir.glob(f"source_{job_id}.*")
                    if item.suffix.lower() not in ('.part', '.ytdl', '.temp')
                ]
                if candidate_files:
                    downloaded_file = str(candidate_files[0])

            if not downloaded_file or not os.path.exists(downloaded_file):
                raise ValueError("Failed to retrieve media stream.")

            await self.update_job_status(
                job_id, status="processing", progress=65.0, phase="Hardware FFmpeg transcoding & optimization..."
            )

            def ffmpeg_progress(pct: float, speed_val: str):
                actual_pct = 65.0 + (pct * 0.3)
                asyncio.create_task(
                    self.update_job_status(
                        job_id, status="processing", progress=actual_pct,
                        phase="FFmpeg encoding stream...", speed=speed_val
                    )
                )

            if media_type == "audio":
                await FFmpegService.extract_audio(
                    downloaded_file, final_output_path, target_ext=target_ext,
                    bitrate=audio_bitrate, progress_callback=ffmpeg_progress,
                    cancel_check=lambda: job_queue.is_cancelled(job_id)
                )
            elif media_type == "trim" and trim_start and trim_end:
                await FFmpegService.trim_media(
                    downloaded_file, final_output_path, start_time=trim_start,
                    end_time=trim_end, progress_callback=ffmpeg_progress,
                    cancel_check=lambda: job_queue.is_cancelled(job_id)
                )
            elif media_type == "gif":
                await FFmpegService.create_gif(
                    downloaded_file, final_output_path,
                    start_time=trim_start or "00:00:00",
                    end_time=trim_end or "00:00:05",
                    progress_callback=ffmpeg_progress,
                    cancel_check=lambda: job_queue.is_cancelled(job_id)
                )
            elif media_type == "compress":
                await FFmpegService.compress_video(
                    downloaded_file, final_output_path, crf=compress_crf,
                    progress_callback=ffmpeg_progress,
                    cancel_check=lambda: job_queue.is_cancelled(job_id)
                )
            elif media_type == "thumbnail":
                final_output_path = str(job_dir / f"thumbnail_{job_id[:8]}.jpg")
                output_file_name = f"thumbnail_{job_id[:8]}.jpg"
                cmd = [get_ffmpeg_path(), "-y", "-i", downloaded_file, "-vframes", "1", "-q:v", "2", final_output_path]
                proc = await asyncio.create_subprocess_exec(*cmd)
                await proc.wait()
            else:
                await FFmpegService.transcode_video(
                    downloaded_file, final_output_path, target_ext=target_ext,
                    progress_callback=ffmpeg_progress,
                    cancel_check=lambda: job_queue.is_cancelled(job_id)
                )

            if not os.path.exists(final_output_path):
                if os.path.exists(downloaded_file):
                    final_output_path = downloaded_file
                else:
                    raise ValueError("FFmpeg output file generation failed.")

            file_size = os.path.getsize(final_output_path)
            checksum = StorageService.compute_checksum(final_output_path)
            download_url, expires_at = StorageService.create_signed_download_url(job_id, output_file_name)

            await self.update_job_status(
                job_id,
                status="completed",
                progress=100.0,
                phase="Completed",
                message="File ready for download",
                file_name=output_file_name,
                file_path=final_output_path,
                file_size=file_size,
                download_url=download_url,
                checksum=checksum,
                expires_at=expires_at
            )

        except Exception as e:
            if job_queue.is_cancelled(job_id):
                await self.update_job_status(
                    job_id, status="cancelled", progress=0.0, phase="Cancelled",
                    message="Cancelled by user"
                )
            else:
                await self.update_job_status(
                    job_id, status="failed", progress=0.0, phase="Failed",
                    error=str(e), message="Processing failed"
                )
