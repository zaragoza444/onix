import json
from typing import Any

import httpx

from app.config import settings
from app.models.transfer import ApiTransfer, TransferDirection, TransferStatus


async def dispatch_outbound(
    *,
    transfer: ApiTransfer,
    url: str,
    method: str,
    headers: dict[str, str],
    body: Any,
    timeout_seconds: float | None,
) -> ApiTransfer:
    timeout = timeout_seconds or settings.api_sender_timeout_seconds
    transfer.status = TransferStatus.PENDING.value
    transfer.method = method.upper()
    transfer.url = url

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            kwargs: dict[str, Any] = {"headers": headers}
            if body is not None and method.upper() not in ("GET", "DELETE"):
                if isinstance(body, (dict, list)):
                    kwargs["json"] = body
                else:
                    kwargs["content"] = str(body)

            response = await client.request(method.upper(), url, **kwargs)
            transfer.response_status = response.status_code
            transfer.response_body = response.text[: settings.api_sender_max_body_bytes]
            transfer.status = (
                TransferStatus.SUCCESS.value
                if response.is_success
                else TransferStatus.FAILED.value
            )
            if not response.is_success:
                transfer.error_message = f"HTTP {response.status_code}"
    except httpx.HTTPError as exc:
        transfer.status = TransferStatus.FAILED.value
        transfer.error_message = str(exc)[:512]

    return transfer
