import os
import time
import hashlib
import asyncio
from pathlib import Path
from typing import Optional, Tuple
from ..config import settings
from ..security import generate_download_token

class StorageService:
    @staticmethod
    def get_job_directory(job_id: str) -> Path:
        job_dir = settings.STORAGE_PATH / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        return job_dir

    @staticmethod
    def compute_checksum(filepath: str) -> str:
        md5 = hashlib.md5()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                md5.update(chunk)
        return md5.hexdigest()

    @staticmethod
    def create_signed_download_url(job_id: str, filename: str) -> Tuple[str, int]:
        expires_at = int(time.time()) + settings.DOWNLOAD_TTL_SECONDS
        token = generate_download_token(job_id, filename, expires_at)
        download_url = f"/api/downloads/{token}?filename={filename}"
        return download_url, expires_at

    @staticmethod
    async def cleanup_expired_files():
        try:
            now = time.time()
            storage_path = settings.STORAGE_PATH
            if not storage_path.exists():
                return

            for job_dir in storage_path.iterdir():
                if job_dir.is_dir():
                    dir_age = now - job_dir.stat().st_mtime
                    if dir_age > settings.DOWNLOAD_TTL_SECONDS:
                        for f in job_dir.glob("*"):
                            try:
                                f.unlink()
                            except Exception:
                                pass
                        try:
                            job_dir.rmdir()
                        except Exception:
                            pass
        except Exception as e:
            print(f"Error during storage cleanup: {e}")
