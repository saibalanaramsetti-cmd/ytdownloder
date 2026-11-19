import datetime
from typing import Optional, Dict, Any
from .database import execute_query, execute_write

class Job:
    def __init__(
        self,
        id: str,
        url: str,
        media_type: str = "video",
        target_ext: str = "mp4",
        target_quality: Optional[str] = None,
        status: str = "queued",
        progress: float = 0.0,
        speed: Optional[str] = None,
        eta: Optional[str] = None,
        phase: str = "Queued",
        message: Optional[str] = None,
        file_name: Optional[str] = None,
        file_path: Optional[str] = None,
        file_size: Optional[int] = None,
        file_size_str: Optional[str] = None,
        download_url: Optional[str] = None,
        checksum: Optional[str] = None,
        error: Optional[str] = None,
        expires_at: Optional[int] = None,
        created_at: Optional[str] = None,
        finished_at: Optional[str] = None
    ):
        self.id = id
        self.url = url
        self.media_type = media_type
        self.target_ext = target_ext
        self.target_quality = target_quality
        self.status = status
        self.progress = progress
        self.speed = speed
        self.eta = eta
        self.phase = phase
        self.message = message
        self.file_name = file_name
        self.file_path = file_path
        self.file_size = file_size
        self.file_size_str = file_size_str
        self.download_url = download_url
        self.checksum = checksum
        self.error = error
        self.expires_at = expires_at
        self.created_at = created_at or datetime.datetime.utcnow().isoformat()
        self.finished_at = finished_at

    @classmethod
    async def create(
        cls,
        id: str,
        url: str,
        media_type: str = "video",
        target_ext: str = "mp4",
        target_quality: Optional[str] = None
    ) -> 'Job':
        now_str = datetime.datetime.utcnow().isoformat()
        job = cls(
            id=id,
            url=url,
            media_type=media_type,
            target_ext=target_ext,
            target_quality=target_quality,
            status="queued",
            progress=0.0,
            phase="Queued in background pipeline",
            created_at=now_str
        )
        sql = """
        INSERT INTO jobs (id, url, media_type, target_ext, target_quality, status, progress, phase, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        await execute_write(sql, (
            job.id, job.url, job.media_type, job.target_ext, job.target_quality,
            job.status, job.progress, job.phase, job.created_at
        ))
        return job

    @classmethod
    async def get(cls, job_id: str) -> Optional['Job']:
        rows = await execute_query("SELECT * FROM jobs WHERE id = ?", (job_id,))
        if not rows:
            return None
        return cls(**rows[0])

    @classmethod
    async def update(cls, job_id: str, **kwargs):
        if not kwargs:
            return
        fields = []
        params = []
        for k, v in kwargs.items():
            fields.append(f"{k} = ?")
            params.append(v)
        params.append(job_id)
        sql = f"UPDATE jobs SET {', '.join(fields)} WHERE id = ?"
        await execute_write(sql, tuple(params))

    def to_dict(self) -> Dict[str, Any]:
        now_ts = int(datetime.datetime.utcnow().timestamp())
        expires_in = max(0, self.expires_at - now_ts) if self.expires_at else 3600
        return {
            "job_id": self.id,
            "status": self.status,
            "progress": self.progress,
            "phase": self.phase,
            "speed": self.speed,
            "eta": self.eta,
            "message": self.message,
            "file_name": self.file_name,
            "file_size": self.file_size,
            "file_size_str": self.file_size_str,
            "download_url": self.download_url,
            "checksum": self.checksum,
            "error": self.error,
            "expires_in_seconds": expires_in,
            "created_at": self.created_at,
            "finished_at": self.finished_at,
        }
