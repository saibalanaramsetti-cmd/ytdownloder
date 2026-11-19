import asyncio
import os
import traceback
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import ResponseValidationError, RequestValidationError

from .config import settings
from .database import init_db
from .queue import job_queue
from .worker import MediaWorker
from .services.storage_service import StorageService
from .routers import media, jobs, downloads, health

worker_tasks = []
cleanup_task = None

async def periodic_cleanup():
    while True:
        try:
            await asyncio.sleep(300)
            await StorageService.cleanup_expired_files()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in cleanup loop: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[MediaFlow] Initializing database...")
    await init_db()

    print("[MediaFlow] Initializing worker queue...")
    await job_queue.connect()

    global worker_tasks, cleanup_task
    for w_id in range(1, settings.WORKER_CONCURRENCY + 1):
        worker = MediaWorker(worker_id=w_id)
        task = asyncio.create_task(worker.start())
        worker_tasks.append(task)

    cleanup_task = asyncio.create_task(periodic_cleanup())
    print(f"[MediaFlow] Started {len(worker_tasks)} media processing background workers.")

    yield

    print("[MediaFlow] Shutting down workers...")
    for t in worker_tasks:
        t.cancel()
    if cleanup_task:
        cleanup_task.cancel()
    await asyncio.gather(*worker_tasks, return_exceptions=True)
    print("[MediaFlow] Shutdown completed.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Global error handlers
@app.exception_handler(ResponseValidationError)
async def response_validation_exception_handler(request: Request, exc: ResponseValidationError):
    print(f"[ResponseValidationError] {request.method} {request.url.path}: {exc.errors()}")
    # Return 200 with the data unvalidated or a clean error message
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Data schema mismatch: {str(exc.errors()[0].get('msg', 'Validation error'))}"}
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"[UnhandledException] {request.method} {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(media.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(downloads.router, prefix="/api")
app.include_router(health.router, prefix="/api")

frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(frontend_dist / "index.html"))
