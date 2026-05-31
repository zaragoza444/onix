from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, HttpUrl, field_validator


class ReceiverConfig(BaseModel):
    receiver_key: str
    hook_url: str
    ingest_url: str
    environment: str
    webhook_secret_header: str


class InboundIngest(BaseModel):
    payload: dict[str, Any] | list[Any] | str | int | float | bool | None = None
    event_type: str = Field(default="message", max_length=120)
    metadata: dict[str, Any] = Field(default_factory=dict)


class SenderDispatch(BaseModel):
    url: HttpUrl
    method: str = "POST"
    headers: dict[str, str] = Field(default_factory=dict)
    body: dict[str, Any] | list[Any] | str | None = None
    timeout_seconds: float | None = Field(default=None, ge=1, le=120)

    @field_validator("method")
    @classmethod
    def normalize_method(cls, v: str) -> str:
        allowed = {"GET", "POST", "PUT", "PATCH", "DELETE"}
        upper = v.upper()
        if upper not in allowed:
            raise ValueError("method must be GET, POST, PUT, PATCH, or DELETE")
        return upper


class TransferPublic(BaseModel):
    id: int
    direction: str
    status: str
    method: str
    url: str
    request_body: str
    response_status: int | None
    response_body: str | None
    error_message: str | None
    environment: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TransferList(BaseModel):
    items: list[TransferPublic]
    total: int
