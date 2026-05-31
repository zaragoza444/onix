import secrets

from sqlalchemy.orm import Session

from app.models.user import User


def ensure_user_api_keys(user: User, db: Session) -> User:
    changed = False
    if not user.receiver_key:
        user.receiver_key = secrets.token_urlsafe(32)
        changed = True
    if not user.webhook_secret:
        user.webhook_secret = secrets.token_urlsafe(24)
        changed = True
    if changed:
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
