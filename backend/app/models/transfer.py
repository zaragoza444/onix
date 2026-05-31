from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TransferDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class TransferStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class ApiTransfer(Base):
    __tablename__ = "api_transfers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    direction: Mapped[str] = mapped_column(String(16), index=True)
    status: Mapped[str] = mapped_column(String(16), default=TransferStatus.PENDING.value)
    method: Mapped[str] = mapped_column(String(16), default="POST")
    url: Mapped[str] = mapped_column(String(2048), default="")
    request_headers: Mapped[str] = mapped_column(Text, default="{}")
    request_body: Mapped[str] = mapped_column(Text, default="")
    response_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(512), nullable=True)
    source_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    environment: Mapped[str] = mapped_column(String(32), default="production")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
