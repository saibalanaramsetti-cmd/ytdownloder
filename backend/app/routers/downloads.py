import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import FileResponse, StreamingResponse
from ..security import verify_download_token
from ..config import settings

router = APIRouter(prefix="/downloads", tags=["downloads"])

@router.get("/{token}")
@router.head("/{token}")
async def download_file(token: str, filename: str = Query(...), request: Request = None):
    valid, job_id = verify_download_token(token, filename)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Download access denied: {job_id}"
        )

    file_path = settings.STORAGE_PATH / job_id / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested media file was not found or has been cleaned up."
        )

    file_size = file_path.stat().st_size
    range_header = request.headers.get("range") if request else None

    if range_header:
        try:
            h = range_header.replace("bytes=", "").split("-")
            start = int(h[0]) if h[0] else 0
            end = int(h[1]) if len(h) > 1 and h[1] else file_size - 1
            start = max(0, start)
            end = min(file_size - 1, end)
            content_length = end - start + 1

            def iterfile():
                with open(file_path, "rb") as f:
                    f.seek(start)
                    bytes_remaining = content_length
                    while bytes_remaining > 0:
                        chunk_size = min(65536, bytes_remaining)
                        data = f.read(chunk_size)
                        if not data:
                            break
                        bytes_remaining -= len(data)
                        yield data

            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
                "Content-Disposition": f'attachment; filename="{filename}"',
            }
            return StreamingResponse(
                iterfile(),
                status_code=status.HTTP_206_PARTIAL_CONTENT,
                headers=headers,
                media_type="application/octet-stream"
            )
        except Exception:
            pass

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream",
        headers={"Accept-Ranges": "bytes"}
    )
