from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ---- Auth ----

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GuestLogin(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class UserOut(BaseModel):
    id: str
    name: str
    email: Optional[EmailStr] = None
    is_guest: bool = False

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---- Meetings ----

class MeetingCreate(BaseModel):
    title: str = Field(default="Untitled Meeting", max_length=200)


class MeetingOut(BaseModel):
    id: str
    code: str
    title: str
    host_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MeetingJoinInfo(BaseModel):
    id: str
    code: str
    title: str
    is_active: bool
    host_id: str
