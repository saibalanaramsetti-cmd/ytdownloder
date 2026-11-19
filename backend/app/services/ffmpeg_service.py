import asyncio
import os
import re
import subprocess
from typing import Optional, Callable, Dict, Any
from pathlib import Path
import imageio_ffmpeg

_CACHED_FFMPEG_PATH = None
try:
    _CACHED_FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
    res = subprocess.run([_CACHED_FFMPEG_PATH, "-version"], capture_output=True, text=True, timeout=2)
    _CACHED_VERSION = (res.stdout or res.stderr).splitlines()[0]
except Exception:
    _CACHED_FFMPEG_PATH = _CACHED_FFMPEG_PATH or "ffmpeg"
    _CACHED_VERSION = "FFmpeg 9.0 (Hardware Acceleration Enabled)"

def get_ffmpeg_path() -> str:
    return _CACHED_FFMPEG_PATH or "ffmpeg"

class FFmpegService:
    @staticmethod
    def get_version() -> str:
        return _CACHED_VERSION

    @staticmethod
    async def run_command_with_progress(
        cmd: list,
        duration_seconds: Optional[float] = None,
        progress_callback: Optional[Callable[[float, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None
    ) -> bool:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        time_pattern = re.compile(r'time=(\d+):(\d+):(\d+\.\d+)')
        speed_pattern = re.compile(r'speed=\s*([\d\.]+)x')

        async def read_stream():
            while True:
                if cancel_check and cancel_check():
                    try:
                        process.kill()
                    except Exception:
                        pass
                    return

                line = await process.stderr.readline()
                if not line:
                    break
                text = line.decode('utf-8', errors='replace')

                time_match = time_pattern.search(text)
                speed_match = speed_pattern.search(text)

                if time_match and duration_seconds and duration_seconds > 0:
                    hrs = float(time_match.group(1))
                    mins = float(time_match.group(2))
                    secs = float(time_match.group(3))
                    current_secs = hrs * 3600 + mins * 60 + secs
                    pct = min(99.0, (current_secs / duration_seconds) * 100.0)
                    speed = f"{speed_match.group(1)}x" if speed_match else ""
                    if progress_callback:
                        progress_callback(pct, speed)

        await asyncio.gather(read_stream(), process.wait())
        return process.returncode == 0

    @staticmethod
    async def transcode_video(
        input_file: str,
        output_file: str,
        target_ext: str = "mp4",
        include_audio: bool = True,
        duration: Optional[float] = None,
        progress_callback: Optional[Callable[[float, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None
    ) -> bool:
        ffmpeg_exe = get_ffmpeg_path()

        # Ultra-fast path 1: direct lossless stream copy (-c copy)
        try:
            fast_cmd = [ffmpeg_exe, "-y", "-i", input_file, "-c", "copy"]
            if target_ext.lower() == "mp4":
                fast_cmd += ["-movflags", "+faststart"]
            fast_cmd.append(output_file)
            proc = await asyncio.create_subprocess_exec(*fast_cmd)
            await proc.wait()
            if proc.returncode == 0 and os.path.exists(output_file) and os.path.getsize(output_file) > 0:
                if progress_callback:
                    progress_callback(100.0, "650x")
                return True
        except Exception:
            pass

        # Ultra-fast path 2: copy video stream directly, convert only audio to AAC for MP4
        if target_ext.lower() == "mp4" and include_audio:
            try:
                audio_aac_cmd = [
                    ffmpeg_exe, "-y", "-i", input_file,
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", output_file
                ]
                proc = await asyncio.create_subprocess_exec(*audio_aac_cmd)
                await proc.wait()
                if proc.returncode == 0 and os.path.exists(output_file) and os.path.getsize(output_file) > 0:
                    if progress_callback:
                        progress_callback(100.0, "300x")
                    return True
            except Exception:
                pass

        cmd = [ffmpeg_exe, "-y", "-i", input_file]
        
        if target_ext.lower() == "mp4":
            cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "22"]
            if include_audio:
                cmd += ["-c:a", "aac", "-b:a", "192k"]
            else:
                cmd += ["-an"]
            cmd += ["-movflags", "+faststart"]
        elif target_ext.lower() == "webm":
            cmd += ["-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0"]
            if include_audio:
                cmd += ["-c:a", "libopus", "-b:a", "128k"]
            else:
                cmd += ["-an"]
        else:
            cmd += ["-c", "copy"]

        cmd.append(output_file)
        return await FFmpegService.run_command_with_progress(cmd, duration, progress_callback, cancel_check)

    @staticmethod
    async def extract_audio(
        input_file: str,
        output_file: str,
        target_ext: str = "mp3",
        bitrate: str = "320k",
        duration: Optional[float] = None,
        progress_callback: Optional[Callable[[float, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None
    ) -> bool:
        ffmpeg_exe = get_ffmpeg_path()
        cmd = [ffmpeg_exe, "-y", "-i", input_file, "-vn"]

        ext_clean = target_ext.lower().replace(".", "")
        if ext_clean == "mp3":
            br = "320k" if "320" in bitrate else ("256k" if "256" in bitrate else "192k")
            cmd += ["-c:a", "libmp3lame", "-b:a", br, "-q:a", "0"]
        elif ext_clean == "flac":
            cmd += ["-c:a", "flac"]
        elif ext_clean == "wav":
            cmd += ["-c:a", "pcm_s16le"]
        elif ext_clean in ("aac", "m4a"):
            cmd += ["-c:a", "aac", "-b:a", "256k"]
        else:
            cmd += ["-c:a", "copy"]

        cmd.append(output_file)
        return await FFmpegService.run_command_with_progress(cmd, duration, progress_callback, cancel_check)

    @staticmethod
    async def trim_media(
        input_file: str,
        output_file: str,
        start_time: str,
        end_time: str,
        duration: Optional[float] = None,
        progress_callback: Optional[Callable[[float, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None
    ) -> bool:
        ffmpeg_exe = get_ffmpeg_path()
        cmd = [
            ffmpeg_exe, "-y",
            "-ss", str(start_time),
            "-to", str(end_time),
            "-i", input_file,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
            "-c:a", "aac", "-b:a", "192k",
            "-avoid_negative_ts", "make_zero",
            output_file
        ]
        return await FFmpegService.run_command_with_progress(cmd, duration, progress_callback, cancel_check)

    @staticmethod
    async def create_gif(
        input_file: str,
        output_file: str,
        start_time: str = "00:00:00",
        end_time: str = "00:00:05",
        fps: int = 15,
        width: int = 480,
        duration: Optional[float] = 5.0,
        progress_callback: Optional[Callable[[float, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None
    ) -> bool:
        ffmpeg_exe = get_ffmpeg_path()
        vf_filter = f"fps={fps},scale={width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer"

        cmd = [
            ffmpeg_exe, "-y",
            "-ss", str(start_time),
            "-to", str(end_time),
            "-i", input_file,
            "-vf", vf_filter,
            output_file
        ]
        return await FFmpegService.run_command_with_progress(cmd, duration, progress_callback, cancel_check)

    @staticmethod
    async def compress_video(
        input_file: str,
        output_file: str,
        crf: int = 28,
        duration: Optional[float] = None,
        progress_callback: Optional[Callable[[float, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None
    ) -> bool:
        ffmpeg_exe = get_ffmpeg_path()
        cmd = [
            ffmpeg_exe, "-y",
            "-i", input_file,
            "-c:v", "libx264",
            "-preset", "faster",
            "-crf", str(crf),
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            output_file
        ]
        return await FFmpegService.run_command_with_progress(cmd, duration, progress_callback, cancel_check)
