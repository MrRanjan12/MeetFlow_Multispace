import uuid
import secrets
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


def gen_meeting_code() -> str:
    # Short, human-shareable code, e.g. "kx7-92pq-am4"
    part = lambda n: secrets.token_hex(n // 2 + 1)[:n]
    return f"{part(3)}-{part(4)}-{part(3)}"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meetings_hosted = relationship("Meeting", back_populates="host")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=gen_uuid)
    code = Column(String, unique=True, index=True, default=gen_meeting_code)
    title = Column(String, default="Untitled Meeting")
    host_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    host = relationship("User", back_populates="meetings_hosted")
