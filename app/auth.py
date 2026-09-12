import uuid
from datetime import datetime, timedelta
from typing import Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class GuestUser:
    """Lightweight in-memory user representation for unauthenticated guests."""

    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name
        self.email = None
        self.is_guest = True


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_guest_access_token(name: str) -> tuple[str, GuestUser]:
    guest_id = f"guest_{uuid.uuid4().hex[:8]}"
    guest_user = GuestUser(id=guest_id, name=name.strip())
    token = create_access_token(
        {"sub": guest_id, "name": guest_user.name, "is_guest": True},
        expires_delta=timedelta(hours=12),
    )
    return token, guest_user


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Union[models.User, GuestUser]:
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    if payload.get("is_guest"):
        return GuestUser(id=user_id, name=payload.get("name", "Guest"))

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    user.is_guest = False
    return user


def get_user_from_ws_token(token: str, db: Session) -> Optional[Union[models.User, GuestUser]]:
    """Same as get_current_user but for WebSocket handshakes, which don't
    carry an Authorization header — the token is passed as a query param
    instead, so failures are handled by the caller (closing the socket)
    rather than raising HTTPException."""
    try:
        payload = decode_access_token(token)
    except HTTPException:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None

    if payload.get("is_guest"):
        return GuestUser(id=user_id, name=payload.get("name", "Guest"))

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.is_guest = False
    return user
