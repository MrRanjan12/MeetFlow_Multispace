import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMeetingRoom } from "../hooks/useMeetingRoom.js";
import VideoTile from "../components/VideoTile.jsx";
import ControlBar from "../components/ControlBar.jsx";
import SidePanel from "../components/SidePanel.jsx";

export default function Meeting() {
  const { code } = useParams();
  const { token, user, joinAsGuest } = useAuth();
  const navigate = useNavigate();

  const [meetingInfo, setMeetingInfo] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [panel, setPanel] = useState(null); // null | "chat" | "participants"
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dismissWarning, setDismissWarning] = useState(false);

  // Guest join state
  const [guestName, setGuestName] = useState("");
  const [joiningGuest, setJoiningGuest] = useState(false);
  const [guestError, setGuestError] = useState("");

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setGuestError("");
    setJoiningGuest(true);
    try {
      await joinAsGuest(guestName.trim());
    } catch (err) {
      setGuestError(err.message || "Failed to join as guest");
      setJoiningGuest(false);
    }
  };

  useEffect(() => {
    if (!code || code === "undefined") return;
    if (!token) return; // Wait until authenticated (registered or guest)

    let isMounted = true;
    api
      .getMeetingByCode(code)
      .then((data) => {
        if (isMounted) setMeetingInfo(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err.message || "Failed to load meeting");
      });

    return () => {
      isMounted = false;
    };
  }, [code, token]);

  const {
    localStream,
    remoteStreams,
    remoteMediaStates,
    participants,
    chatMessages,
    camOn,
    micOn,
    screenSharing,
    meetingEnded,
    connectionError,
    mediaWarning,
    toggleCam,
    toggleMic,
    toggleScreenShare,
    sendChat,
    leaveMeeting,
  } = useMeetingRoom(meetingInfo ? code : null, token, user?.name);

  useEffect(() => {
    if (meetingEnded) {
      leaveMeeting();
      if (user?.is_guest) {
        navigate("/login");
      } else {
        navigate("/dashboard");
      }
    }
  }, [meetingEnded, leaveMeeting, navigate, user]);

  function handleLeave() {
    leaveMeeting();
    if (user?.is_guest) {
      navigate("/login");
    } else {
      navigate("/dashboard");
    }
  }

  async function handleEndMeeting() {
    try {
      await api.endMeeting(code);
    } catch (err) {
      console.error("Failed to end meeting on backend:", err);
    } finally {
      leaveMeeting();
      if (user?.is_guest) {
        navigate("/login");
      } else {
        navigate("/dashboard");
      }
    }
  }

  const copyMeetingCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 1. If not authenticated, show Guest Join Screen
  if (!token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100 p-4 font-sans antialiased">
        <div className="w-full max-w-md bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Join Meeting</h1>
            <p className="text-xs text-neutral-400 font-mono bg-neutral-800/80 inline-block px-3 py-1 rounded-full border border-neutral-700/60">
              Room: {code}
            </p>
          </div>

          {guestError && (
            <div className="p-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              {guestError}
            </div>
          )}

          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Alex Smith"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-800/90 border border-neutral-700 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={joiningGuest || !guestName.trim()}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              {joiningGuest ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining…</span>
                </>
              ) : (
                <span>Join as Guest</span>
              )}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink mx-3 text-neutral-500 text-[11px] uppercase font-medium">or</span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate(`/login?redirect=/meeting/${code}`)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline cursor-pointer"
            >
              Have an account? Sign in here →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100">
        <div className="text-center p-8 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-neutral-200 mb-6">{loadError}</p>
          <button
            onClick={() => navigate(user?.is_guest ? "/login" : "/dashboard")}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition cursor-pointer"
          >
            {user?.is_guest ? "Return to Login" : "Back to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  if (!meetingInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium tracking-wide">Connecting to room…</span>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100 px-4">
        <div className="max-w-md text-center p-8 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <p className="text-sm text-rose-400 mb-4">{connectionError}</p>
          <button
            onClick={() => navigate(user?.is_guest ? "/login" : "/dashboard")}
            className="rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold hover:bg-neutral-700 transition cursor-pointer"
          >
            {user?.is_guest ? "Return to Login" : "Return to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  const isHost = meetingInfo.host_id === user?.id;
  const remoteParticipants = (participants || []).filter((p) => p.user_id !== user?.id);
  const tileCount = remoteParticipants.length + 1;
  const gridLayout =
    tileCount === 1
      ? "grid-cols-1 max-w-4xl"
      : tileCount === 2
      ? "grid-cols-1 md:grid-cols-2 max-w-5xl"
      : tileCount <= 4
      ? "grid-cols-2 max-w-6xl"
      : "grid-cols-3 max-w-7xl";

  const allParticipants = (participants || []).some((p) => p.user_id === user?.id)
    ? participants
    : [{ user_id: user?.id, name: user?.name || "You" }, ...(participants || [])];

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans antialiased">
      {/* Main Call Area */}
      <div className="flex flex-1 flex-col h-full relative">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3.5 bg-neutral-900/60 backdrop-blur-md border-b border-white/5 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-tight text-white">{meetingInfo.title}</h1>
            <div className="h-4 w-px bg-neutral-800"></div>

            {/* Room Code Badge */}
            <button
              onClick={copyMeetingCode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition cursor-pointer border border-neutral-700/50"
              title="Click to copy room code"
            >
              <span>{code}</span>
              <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {copied && <span className="text-[11px] text-emerald-400 font-medium">Code Copied!</span>}

            {/* Invite Link Button */}
            <button
              onClick={copyInviteLink}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition cursor-pointer border border-indigo-500/30"
              title="Copy meeting link to share"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Share Link</span>
            </button>
            {copiedLink && <span className="text-[11px] text-indigo-400 font-medium">Link Copied!</span>}
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Call
            </span>
            {isHost && (
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-medium">
                Host
              </span>
            )}
          </div>
        </header>

        {/* Media Fallback Warning Toast */}
        {mediaWarning && !dismissWarning && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
            <span>{mediaWarning}</span>
            <button
              onClick={() => setDismissWarning(true)}
              className="text-amber-400 hover:text-white ml-3 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Video Grid Canvas */}
        <main className="flex-1 overflow-y-auto p-6 pb-28 flex items-center justify-center">
          <div className={`grid ${gridLayout} w-full gap-4 items-center justify-center`}>
            {/* Local Tile */}
            <VideoTile
              stream={localStream}
              name={`${user?.name || "You"} (You)`}
              muted={true}
              isMicMuted={!micOn}
              videoOff={!camOn}
            />

            {/* Remote Participants */}
            {remoteParticipants.map((p) => {
              const stream = remoteStreams[p.user_id];
              const isCamOff = !stream || remoteMediaStates[p.user_id]?.camOn === false;
              const isMicOff = remoteMediaStates[p.user_id]?.micOn === false;
              return (
                <VideoTile
                  key={p.user_id}
                  stream={stream}
                  name={p.name || "Participant"}
                  videoOff={isCamOff}
                  isMicMuted={isMicOff}
                />
              );
            })}
          </div>
        </main>

        {/* Floating Zoom-style Pill Control Bar */}
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center z-20">
          <div className="pointer-events-auto">
            <ControlBar
              micOn={micOn}
              camOn={camOn}
              screenSharing={screenSharing}
              isHost={isHost}
              participantCount={allParticipants.length}
              unreadCount={panel === "chat" ? 0 : chatMessages?.length || 0}
              onToggleMic={toggleMic}
              onToggleCam={toggleCam}
              onToggleScreenShare={toggleScreenShare}
              onToggleChat={() => setPanel(panel === "chat" ? null : "chat")}
              onToggleParticipants={() => setPanel(panel === "participants" ? null : "participants")}
              onLeave={handleLeave}
              onEndMeeting={handleEndMeeting}
            />
          </div>
        </div>
      </div>

      {/* Modern Slide-in Side Drawer */}
      {panel && (
        <aside className="w-80 h-full z-30 transition-all duration-300">
          <SidePanel
            panel={panel}
            participants={allParticipants}
            chatMessages={chatMessages || []}
            selfId={user?.id}
            onSendChat={sendChat}
            onClose={() => setPanel(null)}
          />
        </aside>
      )}
    </div>
  );
}
