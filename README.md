# Team Meeting App — Backend

FastAPI backend for a 10-person Zoom/Meet-style video meeting app.

## Setup

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Optionally create a `.env` file to override defaults (see `app/config.py`):

```
SECRET_KEY=some-long-random-string
DATABASE_URL=sqlite:///./meeting_app.db
FRONTEND_ORIGINS=http://localhost:5173
```

## Run

```bash
uvicorn app.main:app --reload
```

API docs at http://localhost:8000/docs

## What's here

- `app/auth.py` — JWT creation/validation, password hashing, `get_current_user` dependency
- `app/routers/auth.py` — POST /auth/register, POST /auth/login, GET /auth/me
- `app/routers/meetings.py` — create meeting, list my meetings, get by code, end meeting (host only)
- `app/websocket_manager.py` — in-memory room registry (user_id -> WebSocket) per meeting
- `app/routers/ws.py` — `ws://.../ws/meeting/{meeting_code}?token=<jwt>` — signaling relay for WebRTC (offer/answer/ICE), plus join/leave/chat broadcasts

## Signaling message format

Every WebSocket message is JSON:
```json
{"type": "offer|answer|ice-candidate|chat|join|leave", "to": "<user_id>", "payload": {...}}
```
The server relays `offer`/`answer`/`ice-candidate` directly to the named peer without
inspecting the payload, and broadcasts `join`/`leave`/`chat`/`meeting-ended` to the room.

## Known limitations to fix before real deployment

- In-memory connection manager means this only works with a single backend
  process. Scale beyond that needs Redis pub/sub or similar.
- No TURN server configured — add one (e.g. coturn) so peers behind
  restrictive NATs can actually connect; STUN alone won't be enough for everyone.
- `Base.metadata.create_all` is fine for dev; switch to Alembic migrations
  once the schema needs to evolve safely.
- `SECRET_KEY` default must be overridden via environment variable in any
  real deployment.
