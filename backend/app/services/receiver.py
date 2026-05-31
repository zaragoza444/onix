import json
from typing import Any

from fastapi import Request

from app.config import settings
from app.models.transfer import ApiTransfer, TransferDirection, TransferStatus


def _serialize_payload(payload: Any) -> str:
    if payload is None:
        return ""
    if isinstance(payload, str):
        return payload[: settings.api_receiver_max_body_bytes]
    return json.dumps(payload)[: settings.api_receiver_max_body_bytes]


async def record_inbound(
    *,
    user_id: int,
    request: Request,
    payload: Any,
    event_type: str,
    metadata: dict[str, Any],
    method: str = "POST",
) -> ApiTransfer:
    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in ("authorization", "cookie")
    }
    body_doc = {
        "event_type": event_type,
        "payload": payload,
        "metadata": metadata,
    }
    transfer = ApiTransfer(
        user_id=user_id,
        direction=TransferDirection.INBOUND.value,
        status=TransferStatus.SUCCESS.value,
        method=method,
        url=str(request.url),
        request_headers=json.dumps(headers),
        request_body=_serialize_payload(body_doc),
        response_status=200,
        response_body=json.dumps({"accepted": True, "event_type": event_type}),
        environment=settings.api_environment,
        source_ip=request.client.host if request.client else None,
    )
    return transfer
