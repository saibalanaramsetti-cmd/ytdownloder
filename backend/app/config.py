import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", str(BASE_DIR / "temp_storage")))
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    APP_NAME: str = "MediaFlow API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/mediaflow.db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    USE_REDIS_IF_AVAILABLE: bool = True
    
    # Security & Storage
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mediaflow-secret-production-token-2026-key-signature")
    DOWNLOAD_TTL_SECONDS: int = int(os.getenv("DOWNLOAD_TTL_SECONDS", "3600")) # 1 hour
    MAX_FILE_SIZE_BYTES: int = int(os.getenv("MAX_FILE_SIZE_BYTES", str(2 * 1024 * 1024 * 1024))) # 2 GB
    MAX_DURATION_SECONDS: int = int(os.getenv("MAX_DURATION_SECONDS", str(3 * 3600))) # 3 hours
    STORAGE_PATH: Path = STORAGE_DIR
    
    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE: int = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "60"))
    
    # Worker concurrency
    WORKER_CONCURRENCY: int = int(os.getenv("WORKER_CONCURRENCY", "4"))

settings = Settings()
