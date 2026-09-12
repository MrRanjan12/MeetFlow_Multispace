from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.websocket_manager import manager

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("", response_model=schemas.MeetingOut, status_code=201)
def create_meeting(
    payload: schemas.MeetingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    if getattr(current_user, "is_guest", False):
        raise HTTPException(
            status_code=403,
            detail="Guests cannot host or create meetings. Please sign in or register.",
        )

    meeting = models.Meeting(title=payload.title, host_id=current_user.id)
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.get("/mine", response_model=List[schemas.MeetingOut])
def my_meetings(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    if getattr(current_user, "is_guest", False):
        return []

    return (
        db.query(models.Meeting)
        .filter(models.Meeting.host_id == current_user.id)
        .order_by(models.Meeting.created_at.desc())
        .all()
    )


@router.get("/{code}", response_model=schemas.MeetingJoinInfo)
def get_meeting_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    meeting = db.query(models.Meeting).filter(models.Meeting.code == code).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if not meeting.is_active:
        raise HTTPException(status_code=410, detail="This meeting has ended")
    return meeting


@router.post("/{code}/end")
async def end_meeting(
    code: str,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    meeting = db.query(models.Meeting).filter(models.Meeting.code == code).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can end this meeting")

    meeting.is_active = False
    meeting.ended_at = datetime.utcnow()
    db.commit()

    # Notify everyone currently connected via WebSocket that the meeting is over
    await manager.broadcast(code, {"type": "meeting-ended", "from": "server"})
    return {"detail": "Meeting ended"}
