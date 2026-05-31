"""Lightweight schema patches for SQLite dev (no Alembic)."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def patch_schema(engine: Engine) -> None:
    if not str(engine.url).startswith("sqlite"):
        return

    insp = inspect(engine)
    if "users" not in insp.get_table_names():
        return

    cols = {c["name"] for c in insp.get_columns("users")}
    with engine.begin() as conn:
        if "receiver_key" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN receiver_key VARCHAR(64)"))
        if "webhook_secret" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN webhook_secret VARCHAR(128)"))
