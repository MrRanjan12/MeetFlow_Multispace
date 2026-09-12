import React, { useEffect, useState, useRef } from "react";
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
  const [viewMode, setViewMode] = useState("gallery"); // "gallery" | "speaker"
  const [pinnedId, setPinnedId] = useState(null); // null | "local" | participant_id
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dismissWarning, setDismissWarning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Guest join state
  const [guestName, setGuestName] = useState("");
  const [joiningGuest, setJoiningGuest] = useState(false);
  const [guestError, setGuestError] = useState("");

  // Accidental Tab Exit Prevention Clause
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave the meeting?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Call duration counter
  useEffect(() => {
    if (!meetingInfo) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [meetingInfo]);

  const formatDuration = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

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
    if (!token) return;

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
    reactions,
    raisedHands,
    handRaised,
    reconnecting,
    toggleCam,
    toggleMic,
    toggleScreenShare,
    sendChat,
    sendReaction,
    toggleRaiseHand,
    flipCamera,
    leaveMeeting,
  } = useMeetingRoom(meetingInfo ? code : null, token, user?.name);

  // Screen Share Clause: Mobile devices don't support getDisplayMedia
  const handleToggleScreenShare = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen sharing is not supported on this mobile browser. Please join from a desktop computer to share your screen.");
      return;
    }
    toggleScreenShare();
  };

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

  // 1. If not authenticated, show Zoom-style Guest Join Screen
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
  const allParticipants = (participants || []).some((p) => p.user_id === user?.id)
    ? participants
    : [{ user_id: user?.id, name: user?.name || "You" }, ...(participants || [])];

  const tileCount = remoteParticipants.length + 1;

  // Dynamic responsive grid layout for Gallery View
  const galleryGridClass =
    tileCount === 1
      ? "grid-cols-1 max-w-4xl"
      : tileCount === 2
      ? "grid-cols-1 md:grid-cols-2 max-w-5xl"
      : tileCount <= 4
      ? "grid-cols-1 sm:grid-cols-2 max-w-5xl"
      : tileCount <= 6
      ? "grid-cols-2 lg:grid-cols-3 max-w-6xl"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl";

  // Speaker View Calculations
  let speakerParticipant = null;
  if (pinnedId === "local") {
    speakerParticipant = { isLocal: true, user_id: "local", name: `${user?.name || "You"} (You)` };
  } else if (pinnedId) {
    const found = remoteParticipants.find((p) => p.user_id === pinnedId);
    if (found) speakerParticipant = { isLocal: false, ...found };
  }
  if (!speakerParticipant) {
    if (remoteParticipants.length > 0) {
      speakerParticipant = { isLocal: false, ...remoteParticipants[0] };
    } else {
      speakerParticipant = { isLocal: true, user_id: "local", name: `${user?.name || "You"} (You)` };
    }
  }

  const renderTileFor = (p, isPinnedTile = false) => {
    if (p.isLocal || p.user_id === "local" || p.user_id === user?.id) {
      return (
        <VideoTile
          key="local"
          stream={localStream}
          name={`${user?.name || "You"} (You)`}
          muted={true}
          isMicMuted={!micOn}
          videoOff={!camOn}
          isHandRaised={handRaised}
          isPinned={pinnedId === "local"}
          onPin={() => setPinnedId(pinnedId === "local" ? null : "local")}
        />
      );
    }
    const stream = remoteStreams[p.user_id];
    const isCamOff = !stream || remoteMediaStates[p.user_id]?.camOn === false;
    const isMicOff = remoteMediaStates[p.user_id]?.micOn === false;
    const hasHandRaised = !!raisedHands[p.user_id];
    return (
      <VideoTile
        key={p.user_id}
        stream={stream}
        name={p.name || "Participant"}
        videoOff={isCamOff}
        isMicMuted={isMicOff}
        isHandRaised={hasHandRaised}
        isPinned={pinnedId === p.user_id}
        onPin={() => setPinnedId(pinnedId === p.user_id ? null : p.user_id)}
      />
    );
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans antialiased select-none">
      {/* Main Call Stage */}
      <div className="flex flex-1 flex-col h-full relative overflow-hidden">
        {/* Top Header - Zoom Style */}
        <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-neutral-900/80 backdrop-blur-xl border-b border-white/5 z-20">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            {/* Green Encryption Shield */}
            <div className="flex items-center gap-1 text-emerald-400" title="End-to-End Encrypted Session">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
            </div>

            <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-white truncate max-w-[110px] sm:max-w-xs">
              {meetingInfo.title}
            </h1>

            <div className="h-3.5 w-px bg-neutral-800 hidden xs:block"></div>

            {/* Room Code Badge */}
            <button
              onClick={copyMeetingCode}
              className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-[11px] sm:text-xs font-mono transition cursor-pointer border border-neutral-700/50 flex-shrink-0"
              title="Click to copy room code"
            >
              <span>{code}</span>
              <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {copied && <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline">Copied!</span>}

            {/* Invite Link Button */}
            <button
              onClick={copyInviteLink}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition cursor-pointer border border-indigo-500/30 flex-shrink-0"
              title="Copy meeting link to share"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Share Link</span>
            </button>
            {copiedLink && <span className="text-[10px] text-indigo-400 font-medium hidden sm:inline">Link Copied!</span>}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Live Elapsed Meeting Timer */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/60 border border-neutral-700/50 text-[11px] sm:text-xs font-mono text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>

            {/* View Mode Switcher (Speaker vs Gallery) */}
            <div className="flex items-center bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-700/50">
              <button
                onClick={() => setViewMode("gallery")}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === "gallery" ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-400 hover:text-white"
                }`}
                title="Gallery View"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("speaker")}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === "speaker" ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-400 hover:text-white"
                }`}
                title="Speaker View"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {/* Mobile Camera Flip Button */}
            <button
              onClick={flipCamera}
              className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/50 transition cursor-pointer sm:hidden"
              title="Flip Camera (Front/Back)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        {/* Reconnecting Network Banner */}
        {reconnecting && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-amber-300 animate-pulse z-10">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
            <span>Re-establishing server connection… Audio & video remain active.</span>
          </div>
        )}

        {/* Media Warning Toast */}
        {mediaWarning && !dismissWarning && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300 z-10">
            <span>{mediaWarning}</span>
            <button
              onClick={() => setDismissWarning(true)}
              className="text-amber-400 hover:text-white ml-3 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Video Canvas Stage */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-28 sm:pb-32 flex flex-col items-center justify-center relative">
          {viewMode === "gallery" ? (
            /* Gallery Mode: Balanced Multi-tile Grid */
            <div className={`grid ${galleryGridClass} w-full gap-3 sm:gap-4 items-center justify-center my-auto`}>
              {/* Local Tile */}
              {renderTileFor({ isLocal: true, user_id: "local" })}

              {/* Remote Participants */}
              {remoteParticipants.map((p) => renderTileFor(p))}
            </div>
          ) : (
            /* Speaker Mode: Main Spotlight Stage + Filmstrip */
            <div className="flex flex-col w-full h-full max-w-6xl gap-3 justify-center items-center">
              {/* Main Focused Stage */}
              <div className="flex-1 w-full max-h-[75vh] flex items-center justify-center">
                {renderTileFor(speakerParticipant, true)}
              </div>

              {/* Thumbnail Filmstrip */}
              <div className="flex items-center gap-2.5 overflow-x-auto max-w-full py-1 px-2 no-scrollbar">
                {/* Local in Filmstrip if not active speaker */}
                {speakerParticipant.user_id !== "local" && (
                  <div
                    onClick={() => setPinnedId("local")}
                    className="w-28 sm:w-40 aspect-video flex-shrink-0 cursor-pointer rounded-xl overflow-hidden border border-neutral-700 hover:border-indigo-500 transition"
                  >
                    {renderTileFor({ isLocal: true, user_id: "local" })}
                  </div>
                )}

                {/* Remotes in Filmstrip */}
                {remoteParticipants
                  .filter((p) => p.user_id !== speakerParticipant.user_id)
                  .map((p) => (
                    <div
                      key={p.user_id}
                      onClick={() => setPinnedId(p.user_id)}
                      className="w-28 sm:w-40 aspect-video flex-shrink-0 cursor-pointer rounded-xl overflow-hidden border border-neutral-700 hover:border-indigo-500 transition"
                    >
                      {renderTileFor(p)}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>

        {/* Floating Reaction Emojis Overlay */}
        <div className="pointer-events-none fixed bottom-24 left-4 sm:left-8 z-30 flex flex-col gap-2">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="animate-float-up flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-2xl"
            >
              <span className="text-xl sm:text-2xl">{r.emoji}</span>
              <span className="text-[11px] sm:text-xs font-semibold text-neutral-200">{r.name}</span>
            </div>
          ))}
        </div>

        {/* Zoom-Style Floating Bottom Control Bar */}
        <div className="pointer-events-none fixed inset-x-0 bottom-4 sm:bottom-6 flex justify-center z-30 px-2">
          <div className="pointer-events-auto">
            <ControlBar
              micOn={micOn}
              camOn={camOn}
              screenSharing={screenSharing}
              isHost={isHost}
              participantCount={allParticipants.length}
              unreadCount={panel === "chat" ? 0 : chatMessages?.length || 0}
              handRaised={handRaised}
              onToggleMic={toggleMic}
              onToggleCam={toggleCam}
              onToggleScreenShare={handleToggleScreenShare}
              onToggleChat={() => setPanel(panel === "chat" ? null : "chat")}
              onToggleParticipants={() => setPanel(panel === "participants" ? null : "participants")}
              onSendReaction={sendReaction}
              onToggleRaiseHand={toggleRaiseHand}
              onLeave={handleLeave}
              onEndMeeting={handleEndMeeting}
            />
          </div>
        </div>
      </div>

      {/* Side Panel: Responsive Slide-up Drawer on Mobile, Sleek Sidebar on Desktop */}
      {panel && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setPanel(null)}
          />

          <aside className="fixed inset-x-0 bottom-0 top-16 sm:static sm:w-80 sm:h-full z-50 transition-all duration-300 shadow-2xl">
            <SidePanel
              panel={panel}
              participants={allParticipants}
              chatMessages={chatMessages || []}
              selfId={user?.id}
              onSendChat={sendChat}
              onSwitchPanel={(newPanel) => setPanel(newPanel)}
              onClose={() => setPanel(null)}
            />
          </aside>
        </>
      )}
    </div>
  );
}
