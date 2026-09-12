from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketState

from app.database import SessionLocal
from app import models, auth
from app.websocket_manager import manager

router = APIRouter()

# Message envelope convention (all JSON):
# {
#   "type": "offer" | "answer" | "ice-candidate" | "chat" | "join" | "leave"
#          | "participants" | "meeting-ended",
#   "from": "<user_id>",       # set by server for outgoing relay
#   "to": "<user_id>",         # required for offer/answer/ice-candidate
#   "payload": {...}           # SDP, ICE candidate, chat text, etc.
# }


@router.websocket("/ws/meeting/{meeting_code}")
async def meeting_signaling(
    websocket: WebSocket,
    meeting_code: str,
    token: str = Query(...),
):
    db: Session = SessionLocal()
    try:
        user = auth.get_user_from_ws_token(token, db)
        if user is None:
            await websocket.accept()
            await websocket.close(code=4401)  # custom code: unauthorized
            return

        meeting = db.query(models.Meeting).filter(models.Meeting.code == meeting_code).first()
        if meeting is None or not meeting.is_active:
            await websocket.accept()
            await websocket.close(code=4404)  # custom code: not found / ended
            return

        user_id = user.id
        user_name = user.name
    finally:
        db.close()

    await manager.connect(meeting_code, user_id, user_name, websocket)

    # Tell everyone else someone joined, and send the new joiner the current roster
    await manager.broadcast(
        meeting_code,
        {"type": "join", "from": user_id, "payload": {"name": user_name}},
        exclude_user_id=user_id,
    )
    await manager.send_to(
        meeting_code,
        user_id,
        {"type": "participants", "from": "server", "payload": manager.participants(meeting_code)},
    )

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            to_user = data.get("to")
            payload = data.get("payload")

            if msg_type in ("offer", "answer", "ice-candidate") and to_user:
                # Direct relay to a specific peer — server never inspects SDP/ICE content
                await manager.send_to(
                    meeting_code,
                    to_user,
                    {"type": msg_type, "from": user_id, "payload": payload},
                )
            elif msg_type == "media-state":
                await manager.broadcast(
                    meeting_code,
                    {"type": "media-state", "from": user_id, "payload": payload},
                    exclude_user_id=user_id,
                )
            elif msg_type == "chat":
                await manager.broadcast(
                    meeting_code,
                    {
                        "type": "chat",
                        "from": user_id,
                        "payload": {"name": user_name, "text": payload.get("text", "")},
                    },
                )
            elif msg_type == "reaction":
                await manager.broadcast(
                    meeting_code,
                    {
                        "type": "reaction",
                        "from": user_id,
                        "payload": {
                            "name": user_name,
                            "emoji": payload.get("emoji", "👍") if payload else "👍",
                        },
                    },
                )
            elif msg_type == "raise-hand":
                await manager.broadcast(
                    meeting_code,
                    {
                        "type": "raise-hand",
                        "from": user_id,
                        "payload": {
                            "name": user_name,
                            "raised": payload.get("raised", True) if payload else True,
                        },
                    },
                )
            elif msg_type == "leave":
                break
            # Unknown message types are silently ignored rather than crashing the socket

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(meeting_code, user_id)
        try:
            if websocket.client_state != WebSocketState.DISCONNECTED:
                await websocket.close()
        except Exception:
            pass
        try:
            await manager.broadcast(
                meeting_code, {"type": "leave", "from": user_id, "payload": {"name": user_name}}
            )
        except Exception:
            pass
