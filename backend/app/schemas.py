from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class UrlValidateRequest(BaseModel):
    url: str

class UrlValidateResponse(BaseModel):
    valid: bool
    normalized_url: Optional[str] = None
    reason: Optional[str] = None

class VideoFormatSchema(BaseModel):
    format_id: str
    ext: str = "mp4"
    resolution: str = "Auto"
    height: Optional[int] = None
    width: Optional[int] = None
    fps: Optional[Union[int, float]] = None
    filesize: Optional[Union[int, float]] = None
    filesize_str: Optional[str] = None
    vcodec: Optional[str] = None
    acodec: Optional[str] = None
    tbr: Optional[Union[int, float]] = None
    quality_label: str = "Standard"
    has_audio: bool = True
    has_video: bool = True

class AudioFormatSchema(BaseModel):
    format_id: str
    ext: str = "mp3"
    abr: Optional[Union[int, float]] = 128
    filesize: Optional[Union[int, float]] = None
    filesize_str: Optional[str] = None
    acodec: Optional[str] = None
    quality_label: str = "Audio"

class SubtitleSchema(BaseModel):
    lang: str
    name: Optional[str] = None
    ext: str = "vtt"
    is_auto: bool = False

class MediaInfoResponse(BaseModel):
    id: str = "media"
    title: str = "Unknown Title"
    webpage_url: str
    description: Optional[str] = None
    duration: Optional[Union[int, float]] = None
    duration_str: Optional[str] = None
    thumbnail: Optional[str] = None
    author: Optional[str] = None
    channel_url: Optional[str] = None
    view_count: Optional[Union[int, float]] = None
    like_count: Optional[Union[int, float]] = None
    upload_date: Optional[str] = None
    extractor: str = "web"
    extractor_key: str = "Web"
    video_formats: List[VideoFormatSchema] = []
    audio_formats: List[AudioFormatSchema] = []
    subtitles: List[SubtitleSchema] = []

class CreateJobRequest(BaseModel):
    url: str
    media_type: str = Field(default="video")
    format_id: Optional[str] = None
    target_ext: str = "mp4"
    target_quality: Optional[str] = None
    trim_start: Optional[str] = None
    trim_end: Optional[str] = None
    subtitle_lang: Optional[str] = None
    audio_bitrate: Optional[str] = "320k"
    compress_crf: Optional[int] = 26

class JobResponse(BaseModel):
    job_id: str
    status: str
    progress: float = 0.0
    phase: str = "Queued"
    speed: Optional[str] = None
    eta: Optional[str] = None
    message: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[Union[int, float]] = None
    file_size_str: Optional[str] = None
    download_url: Optional[str] = None
    checksum: Optional[str] = None
    expires_in_seconds: Optional[int] = 3600
    error: Optional[str] = None
    created_at: Optional[str] = None
    finished_at: Optional[str] = None

class SystemHealthResponse(BaseModel):
    status: str
    ffmpeg_available: bool
    ffmpeg_version: Optional[str] = None
    storage_type: str
    queue_type: str
    active_jobs: int
    uptime_seconds: float
    cookies_configured: bool = False
