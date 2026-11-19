import asyncio
import os
from typing import Dict, Any, List, Optional, Union
import yt_dlp
import httpx
from ..schemas import MediaInfoResponse, VideoFormatSchema, AudioFormatSchema, SubtitleSchema

def format_duration(seconds: Optional[Union[int, float]]) -> Optional[str]:
    if not seconds:
        return None
    try:
        secs_int = int(seconds)
        mins, secs = divmod(secs_int, 60)
        hrs, mins = divmod(mins, 60)
        if hrs > 0:
            return f"{hrs:d}:{mins:02d}:{secs:02d}"
        return f"{mins:d}:{secs:02d}"
    except Exception:
        return None

def format_bytes(size: Optional[Union[int, float]]) -> Optional[str]:
    if not size:
        return None
    try:
        size_f = float(size)
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_f < 1024.0:
                return f"{size_f:.1f} {unit}"
            size_f /= 1024.0
        return f"{size_f:.1f} TB"
    except Exception:
        return None

class MetadataService:
    @staticmethod
    async def extract_metadata(url: str) -> MediaInfoResponse:
        loop = asyncio.get_running_loop()
        try:
            info = await loop.run_in_executor(None, MetadataService._sync_extract, url)
            return info
        except Exception as e:
            direct_meta = await MetadataService._probe_direct_media(url)
            if direct_meta:
                return direct_meta
            raise e

    @staticmethod
    def _sync_extract(url: str) -> MediaInfoResponse:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'extract_flat': False,
            'noplaylist': True,
            'socket_timeout': 20,
            'retries': 3,
            'js_runtimes': {'node': {}},
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            raw_info = ydl.extract_info(url, download=False)
            if not raw_info:
                raise ValueError("Could not extract media metadata from the provided URL.")

            if 'entries' in raw_info and raw_info['entries']:
                raw_info = raw_info['entries'][0]

            media_id = str(raw_info.get('id') or 'media')
            title = str(raw_info.get('title') or 'Unknown Title')
            duration = raw_info.get('duration')
            
            # Thumbnail extraction
            thumb_candidate = raw_info.get('thumbnail')
            if not isinstance(thumb_candidate, str) and isinstance(raw_info.get('thumbnails'), list) and raw_info['thumbnails']:
                last_thumb = raw_info['thumbnails'][-1]
                thumb_candidate = last_thumb.get('url') if isinstance(last_thumb, dict) else str(last_thumb)
            thumbnail = str(thumb_candidate) if thumb_candidate and isinstance(thumb_candidate, str) else None

            uploader = raw_info.get('uploader') or raw_info.get('channel') or raw_info.get('artist')
            channel_url = raw_info.get('uploader_url') or raw_info.get('channel_url')
            view_count = raw_info.get('view_count')
            like_count = raw_info.get('like_count')
            upload_date = str(raw_info.get('upload_date')) if raw_info.get('upload_date') else None
            extractor = str(raw_info.get('extractor') or 'web')
            extractor_key = str(raw_info.get('extractor_key') or 'Web')
            description = str(raw_info.get('description')) if raw_info.get('description') else None

            raw_formats = raw_info.get('formats', [])
            video_formats: List[VideoFormatSchema] = []
            audio_formats: List[AudioFormatSchema] = []
            seen_resolutions = set()

            for f in raw_formats:
                height = f.get('height')
                width = f.get('width')
                vcodec = f.get('vcodec')
                acodec = f.get('acodec')
                ext = str(f.get('ext') or 'mp4').lower()
                filesize = f.get('filesize') or f.get('filesize_approx')
                fps = f.get('fps')
                tbr = f.get('tbr')

                has_video = vcodec is not None and vcodec != 'none'
                has_audio = acodec is not None and acodec != 'none'

                # Safe numeric parsing
                height_int = int(height) if height and str(height).isdigit() else None
                width_int = int(width) if width and str(width).isdigit() else None
                
                try:
                    fps_val = float(fps) if fps is not None else None
                except (ValueError, TypeError):
                    fps_val = None

                try:
                    tbr_val = float(tbr) if tbr is not None else None
                except (ValueError, TypeError):
                    tbr_val = None

                # Video streams
                if has_video and height_int and height_int >= 144:
                    res_key = f"{height_int}p"
                    if res_key not in seen_resolutions:
                        seen_resolutions.add(res_key)
                        
                        quality_label = f"{height_int}p"
                        if height_int >= 2160:
                            quality_label = "4K UHD (2160p)"
                        elif height_int >= 1440:
                            quality_label = "2K QHD (1440p)"
                        elif height_int >= 1080:
                            quality_label = "Full HD (1080p)"
                        elif height_int >= 720:
                            quality_label = "HD (720p)"

                        video_formats.append(VideoFormatSchema(
                            format_id=str(f.get('format_id') or f"{height_int}p"),
                            ext=ext if ext in ('mp4', 'webm', 'mkv') else 'mp4',
                            resolution=f"{width_int or '?'}x{height_int}",
                            height=height_int,
                            width=width_int,
                            fps=round(fps_val, 1) if fps_val else None,
                            filesize=filesize,
                            filesize_str=format_bytes(filesize),
                            vcodec=str(vcodec) if vcodec else None,
                            acodec=str(acodec) if acodec else None,
                            tbr=round(tbr_val, 1) if tbr_val else None,
                            quality_label=quality_label,
                            has_audio=has_audio,
                            has_video=True
                        ))

                # Pure audio streams
                elif has_audio and not has_video:
                    abr = f.get('abr') or 128
                    try:
                        abr_val = float(abr)
                    except (ValueError, TypeError):
                        abr_val = 128.0

                    audio_formats.append(AudioFormatSchema(
                        format_id=str(f.get('format_id') or f"audio_{int(abr_val)}"),
                        ext=ext if ext in ('mp3', 'm4a', 'opus', 'webm', 'aac', 'flac') else 'mp3',
                        abr=abr_val,
                        filesize=filesize,
                        filesize_str=format_bytes(filesize),
                        acodec=str(acodec) if acodec else None,
                        quality_label=f"{int(abr_val)} kbps"
                    ))

            if not video_formats:
                video_formats.append(VideoFormatSchema(
                    format_id="best",
                    ext="mp4",
                    resolution="Original High Definition",
                    quality_label="Best Quality Available",
                    has_audio=True,
                    has_video=True
                ))
            else:
                video_formats.sort(key=lambda x: (x.height or 0), reverse=True)

            if not audio_formats:
                for br in [320, 256, 192, 128]:
                    audio_formats.append(AudioFormatSchema(
                        format_id=f"mp3_{br}",
                        ext="mp3",
                        abr=float(br),
                        quality_label=f"MP3 {br} kbps"
                    ))

            subtitles: List[SubtitleSchema] = []
            raw_subs = raw_info.get('subtitles', {})
            raw_auto_subs = raw_info.get('automatic_captions', {})

            if isinstance(raw_subs, dict):
                for lang, tracks in raw_subs.items():
                    name = str(tracks[0].get('name') or lang).upper() if tracks and isinstance(tracks, list) and isinstance(tracks[0], dict) else str(lang).upper()
                    subtitles.append(SubtitleSchema(lang=str(lang), name=name, is_auto=False))

            if isinstance(raw_auto_subs, dict):
                for lang, tracks in raw_auto_subs.items():
                    if not any(s.lang == lang for s in subtitles):
                        name = str(tracks[0].get('name') or lang).upper() + " (Auto)" if tracks and isinstance(tracks, list) and isinstance(tracks[0], dict) else str(lang).upper() + " (Auto)"
                        subtitles.append(SubtitleSchema(lang=str(lang), name=name, is_auto=True))

            return MediaInfoResponse(
                id=media_id,
                title=title,
                webpage_url=str(raw_info.get('webpage_url') or url),
                description=description[:300] if description else None,
                duration=duration,
                duration_str=format_duration(duration),
                thumbnail=thumbnail,
                author=str(uploader) if uploader else None,
                channel_url=str(channel_url) if channel_url else None,
                view_count=view_count,
                like_count=like_count,
                upload_date=upload_date,
                extractor=extractor,
                extractor_key=extractor_key,
                video_formats=video_formats,
                audio_formats=audio_formats,
                subtitles=subtitles[:15],
            )

    @staticmethod
    async def _probe_direct_media(url: str) -> Optional[MediaInfoResponse]:
        try:
            async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                res = await client.head(url)
                content_type = res.headers.get("content-type", "")
                content_length = res.headers.get("content-length")
                size = int(content_length) if content_length and content_length.isdigit() else None

                filename = os.path.basename(url.split("?")[0]) or "direct_media"
                ext = filename.split(".")[-1].lower() if "." in filename else "mp4"

                if "video" in content_type or ext in ("mp4", "webm", "mkv", "mov", "avi"):
                    return MediaInfoResponse(
                        id="direct-video",
                        title=filename,
                        webpage_url=url,
                        extractor="Direct Media Link",
                        extractor_key="Direct",
                        video_formats=[
                            VideoFormatSchema(
                                format_id="direct",
                                ext=ext,
                                resolution="Original Quality",
                                filesize=size,
                                filesize_str=format_bytes(size),
                                quality_label="Direct Source Stream",
                                has_audio=True,
                                has_video=True
                            )
                        ],
                        audio_formats=[
                            AudioFormatSchema(format_id="mp3-320", ext="mp3", abr=320.0, quality_label="MP3 320 kbps"),
                            AudioFormatSchema(format_id="flac", ext="flac", quality_label="FLAC Lossless"),
                        ]
                    )
                elif "audio" in content_type or ext in ("mp3", "wav", "flac", "ogg", "aac", "m4a"):
                    return MediaInfoResponse(
                        id="direct-audio",
                        title=filename,
                        webpage_url=url,
                        extractor="Direct Audio Link",
                        extractor_key="Direct",
                        video_formats=[],
                        audio_formats=[
                            AudioFormatSchema(
                                format_id="direct",
                                ext=ext,
                                filesize=size,
                                filesize_str=format_bytes(size),
                                quality_label="Direct Audio Stream"
                            ),
                            AudioFormatSchema(format_id="mp3-320", ext="mp3", abr=320.0, quality_label="MP3 320 kbps"),
                        ]
                    )
        except Exception:
            pass
        return None
