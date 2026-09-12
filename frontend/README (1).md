# Team Meeting App — Frontend

React + Vite + Tailwind frontend for the 10-person meeting app, wired to the
FastAPI backend's exact routes and WebSocket signaling protocol.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL if your backend isn't on localhost:8000
npm run dev
```

Runs at http://localhost:5173 — make sure the backend is running at the URL
in `.env` (default http://localhost:8000) and that its `FRONTEND_ORIGINS`
setting includes `http://localhost:5173` for CORS.

## Structure

- `src/api.js` — every backend call in one place (auth, meetings, signaling URL)
- `src/context/AuthContext.jsx` — JWT + current user, persisted in localStorage
- `src/hooks/useMeetingRoom.js` — the WebRTC mesh + signaling logic: opens the
  WebSocket, creates one `RTCPeerConnection` per remote participant, relays
  offers/answers/ICE candidates, exposes mic/camera/screen-share toggles and chat
- `src/pages/Login.jsx`, `Register.jsx` — auth forms
- `src/pages/Dashboard.jsx` — create meeting, join by code, list your meetings
- `src/pages/Meeting.jsx` — the call screen: video grid, controls, chat/participants panel
- `src/components/` — `VideoTile`, `ControlBar`, `SidePanel`, icons

## Design notes

- Call screen is dark (video is the content); dashboard/auth are light. One
  accent color (indigo-blue) used consistently for primary actions and active states.
- Mesh WebRTC tops out comfortably around 10 participants (matches the
  backend's target) — each client connects directly to every other client,
  so there's no SFU/media server to run.
- Screen share swaps the outgoing video track on existing peer connections
  via `replaceTrack` rather than renegotiating — keeps it fast and simple.

## Known gaps to close before real use

- No STUN/TURN override UI — currently hardcoded to Google's public STUN
  server in `useMeetingRoom.js`. Add a TURN server there for reliable
  connections across restrictive NATs.
- No reconnection logic if the signaling WebSocket drops — a dropped
  connection currently just breaks signaling for that user.
- No mobile-specific layout tuning for the video grid yet.
