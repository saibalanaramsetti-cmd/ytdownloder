import uuid
import json
import asyncio
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from ..models import Job
from ..schemas import CreateJobRequest, JobResponse
from ..security import validate_url_security, check_rate_limit
from ..queue import job_queue

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.post("/create", response_model=JobResponse, dependencies=[Depends(check_rate_limit)])
async def create_job(req: CreateJobRequest):
    valid, reason = validate_url_security(req.url)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"URL check failed: {reason}")

    job_id = str(uuid.uuid4())
    job = await Job.create(
        id=job_id,
        url=req.url,
        media_type=req.media_type,
        target_ext=req.target_ext,
        target_quality=req.target_quality
    )

    payload = {
        "job_id": job_id,
        "url": req.url,
        "media_type": req.media_type,
        "format_id": req.format_id,
        "target_ext": req.target_ext,
        "target_quality": req.target_quality,
        "trim_start": req.trim_start,
        "trim_end": req.trim_end,
        "subtitle_lang": req.subtitle_lang,
        "audio_bitrate": req.audio_bitrate,
        "compress_crf": req.compress_crf,
    }
    await job_queue.enqueue(payload)

    return JobResponse(**job.to_dict())

@router.get("/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobResponse(**job.to_dict())

@router.post("/{job_id}/cancel")
async def cancel_job(job_id: str):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    job_queue.cancel_job(job_id)
    await Job.update(
        job_id,
        status="cancelled",
        phase="Cancelled",
        message="Cancelled by user"
    )
    job_updated = await Job.get(job_id)
    if job_updated:
        await job_queue.broadcast_progress(job_id, job_updated.to_dict())
    return {"success": True, "message": "Job cancellation initiated"}

@router.get("/{job_id}/events")
async def stream_job_events(job_id: str):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    async def event_generator():
        q = job_queue.subscribe(job_id)
        try:
            yield f"data: {json.dumps(job.to_dict())}\n\n"

            while True:
                try:
                    data = await asyncio.wait_for(q.get(), timeout=20.0)
                    yield f"data: {json.dumps(data)}\n\n"
                    if data.get("status") in ("completed", "failed", "cancelled"):
                        break
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            job_queue.unsubscribe(job_id, q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
