import json

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models.transfer import ApiTransfer, TransferDirection, TransferStatus
from app.models.user import User
from app.schemas.api_transfer import SenderDispatch, TransferList, TransferPublic
from app.services.sender import dispatch_outbound

router = APIRouter(prefix="/api/v1/sender", tags=["api-sender"])


@router.post("/dispatch", response_model=TransferPublic, status_code=status.HTTP_201_CREATED)
async def send_request(
    body: SenderDispatch,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send HTTP request to external URL (production API sender)."""
    headers = {**body.headers, "User-Agent": "Shiva-API-Sender/1.0"}
    request_body = ""
    if body.body is not None:
        request_body = (
            body.body
            if isinstance(body.body, str)
            else json.dumps(body.body)
        )[: settings.api_sender_max_body_bytes]

    transfer = ApiTransfer(
        user_id=user.id,
        direction=TransferDirection.OUTBOUND.value,
        status=TransferStatus.PENDING.value,
        method=body.method.upper(),
        url=str(body.url),
        request_headers=json.dumps(headers),
        request_body=request_body,
        environment=settings.api_environment,
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    transfer = await dispatch_outbound(
        transfer=transfer,
        url=str(body.url),
        method=body.method,
        headers=headers,
        body=body.body,
        timeout_seconds=body.timeout_seconds,
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return TransferPublic.model_validate(transfer)


@router.get("/messages", response_model=TransferList)
def list_sent(
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = min(max(limit, 1), 100)
    q = (
        db.query(ApiTransfer)
        .filter(
            ApiTransfer.user_id == user.id,
            ApiTransfer.direction == TransferDirection.OUTBOUND.value,
        )
        .order_by(ApiTransfer.id.desc())
    )
    total = q.count()
    items = q.limit(limit).all()
    return TransferList(
        items=[TransferPublic.model_validate(t) for t in items],
        total=total,
    )
