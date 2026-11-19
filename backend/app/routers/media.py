from fastapi import APIRouter, HTTPException, Depends, Request, status
from ..schemas import UrlValidateRequest, UrlValidateResponse, MediaInfoResponse
from ..security import validate_url_security, check_rate_limit
from ..services.metadata_service import MetadataService

router = APIRouter(prefix="/media", tags=["media"])

@router.post("/validate", response_model=UrlValidateResponse, dependencies=[Depends(check_rate_limit)])
async def validate_url(req: UrlValidateRequest):
    valid, reason = validate_url_security(req.url)
    return UrlValidateResponse(
        valid=valid,
        normalized_url=req.url.strip() if valid else None,
        reason=reason if not valid else None
    )

@router.post("/info", response_model=MediaInfoResponse, dependencies=[Depends(check_rate_limit)])
async def get_media_info(req: UrlValidateRequest):
    valid, reason = validate_url_security(req.url)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security verification failed: {reason}"
        )
        
    try:
        metadata = await MetadataService.extract_metadata(req.url)
        return metadata
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract media information: {str(e)}"
        )
