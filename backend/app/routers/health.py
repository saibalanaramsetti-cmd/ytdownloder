import time
import os
from fastapi import APIRouter
from ..schemas import SystemHealthResponse
from ..services.ffmpeg_service import FFmpegService
from ..config import settings, get_cookie_file_path
from ..queue import job_queue

router = APIRouter(prefix="/health", tags=["health"])

START_TIME = time.time()

@router.get("", response_model=SystemHealthResponse)
async def get_system_health():
    ffmpeg_ver = FFmpegService.get_version()
    ffmpeg_ok = "version" in ffmpeg_ver.lower() or "ffmpeg" in ffmpeg_ver.lower()
    active_subs = sum(len(q_list) for q_list in job_queue.subscribers.values())
    cookie_path = get_cookie_file_path()

    return SystemHealthResponse(
        status="healthy",
        ffmpeg_available=ffmpeg_ok,
        ffmpeg_version=ffmpeg_ver,
        storage_type="Temporary S3 / Local SSD Cache",
        queue_type="Redis Distributed Queue" if job_queue.is_connected_to_redis else "Asynchronous Multi-Worker Queue",
        active_jobs=active_subs,
        uptime_seconds=round(time.time() - START_TIME, 1),
        cookies_configured=bool(cookie_path and os.path.exists(cookie_path))
    )
