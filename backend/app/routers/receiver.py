import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models.transfer import ApiTransfer, TransferDirection
from app.models.user import User
from app.schemas.api_transfer import (
    InboundIngest,
    ReceiverConfig,
    TransferList,
    TransferPublic,
)
from app.services.keys import ensure_user_api_keys
from app.services.receiver import record_inbound

router = APIRouter(prefix="/api/v1/receiver", tags=["api-receiver"])


def _base_url(request: Request) -> str:
    return str(request.base_url).rstrip("/")


@router.get("/config", response_model=ReceiverConfig)
def receiver_config(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = ensure_user_api_keys(user, db)
    base = _base_url(request)
    key = user.receiver_key or ""
    return ReceiverConfig(
        receiver_key=key,
        hook_url=f"{base}/api/v1/receiver/hook/{key}",
        ingest_url=f"{base}/api/v1/receiver/ingest",
        environment=settings.api_environment,
        webhook_secret_header=settings.api_webhook_secret_header,
    )


@router.post("/ingest", response_model=TransferPublic, status_code=status.HTTP_201_CREATED)
async def ingest_authenticated(
    body: InboundIngest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Receive payload from your apps (Bearer JWT). Production ingest endpoint."""
    transfer = await record_inbound(
        user_id=user.id,
        request=request,
        payload=body.payload,
        event_type=body.event_type,
        metadata=body.metadata,
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return TransferPublic.model_validate(transfer)


@router.post("/hook/{receiver_key}", response_model=TransferPublic, status_code=status.HTTP_201_CREATED)
async def ingest_webhook(
    receiver_key: str,
    request: Request,
    db: Session = Depends(get_db),
    webhook_secret: str | None = Header(default=None, alias="X-Shiva-Webhook-Secret"),
):
    """Public webhook receiver — use receiver_key in URL + optional webhook secret."""
    user = db.query(User).filter(User.receiver_key == receiver_key).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid receiver key")

    user = ensure_user_api_keys(user, db)
    if user.webhook_secret and webhook_secret != user.webhook_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")

    raw = await request.body()
    if len(raw) > settings.api_receiver_max_body_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Body too large")

    try:
        payload = json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        payload = raw.decode("utf-8", errors="replace")

    transfer = await record_inbound(
        user_id=user.id,
        request=request,
        payload=payload,
        event_type="webhook",
        metadata={"content_type": request.headers.get("content-type", "")},
        method=request.method,
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return TransferPublic.model_validate(transfer)


@router.get("/messages", response_model=TransferList)
def list_received(
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = min(max(limit, 1), 100)
    q = (
        db.query(ApiTransfer)
        .filter(
            ApiTransfer.user_id == user.id,
            ApiTransfer.direction == TransferDirection.INBOUND.value,
        )
        .order_by(ApiTransfer.id.desc())
    )
    total = q.count()
    items = q.limit(limit).all()
    return TransferList(
        items=[TransferPublic.model_validate(t) for t in items],
        total=total,
    )
