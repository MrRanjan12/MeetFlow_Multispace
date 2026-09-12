from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """
    Tracks active WebSocket connections per meeting room.

    NOTE: this is in-memory, so it only works with a single backend process/
    worker. If you deploy with multiple workers or instances later, you'll
    need a shared layer (Redis pub/sub) for signaling to work across them.
    """

    def __init__(self):
        # meeting_code -> {user_id: WebSocket}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}
        # meeting_code -> {user_id: user_name}  (handy for participant lists)
        self.participant_names: Dict[str, Dict[str, str]] = {}

    async def connect(self, meeting_code: str, user_id: str, user_name: str, ws: WebSocket):
        await ws.accept()
        self.rooms.setdefault(meeting_code, {})[user_id] = ws
        self.participant_names.setdefault(meeting_code, {})[user_id] = user_name

    def disconnect(self, meeting_code: str, user_id: str):
        self.rooms.get(meeting_code, {}).pop(user_id, None)
        self.participant_names.get(meeting_code, {}).pop(user_id, None)
        if not self.rooms.get(meeting_code):
            self.rooms.pop(meeting_code, None)
            self.participant_names.pop(meeting_code, None)

    def participants(self, meeting_code: str) -> List[dict]:
        return [
            {"user_id": uid, "name": name}
            for uid, name in self.participant_names.get(meeting_code, {}).items()
        ]

    async def send_to(self, meeting_code: str, to_user_id: str, message: dict):
        ws = self.rooms.get(meeting_code, {}).get(to_user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(meeting_code, to_user_id)

    async def broadcast(self, meeting_code: str, message: dict, exclude_user_id: str = None):
        dead_uids = []
        for uid, ws in list(self.rooms.get(meeting_code, {}).items()):
            if uid == exclude_user_id:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead_uids.append(uid)
        for uid in dead_uids:
            self.disconnect(meeting_code, uid)


manager = ConnectionManager()
