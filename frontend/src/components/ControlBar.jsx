import React, { useState, useRef, useEffect } from "react";

export default function ControlBar({
  micOn,
  camOn,
  screenSharing,
  isHost,
  unreadCount = 0,
  participantCount = 1,
  handRaised = false,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onSendReaction,
  onToggleRaiseHand,
  onLeave,
  onEndMeeting,
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const reactionRef = useRef(null);

  const emojis = ["👏", "👍", "❤️", "😆", "😮", "🎉"];

  useEffect(() => {
    function handleClickOutside(e) {
      if (reactionRef.current && !reactionRef.current.contains(e.target)) {
        setShowReactions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative flex items-center justify-between gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 max-w-[96vw] sm:max-w-fit mx-auto">
        {/* Audio (Mute/Unmute) */}
        <button
          onClick={onToggleMic}
          className={`flex flex-col items-center justify-center w-11 h-12 sm:w-14 sm:h-13 rounded-xl transition-all cursor-pointer ${
            micOn
              ? "text-neutral-200 hover:bg-neutral-800/80 hover:text-white"
              : "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25"
          }`}
          title={micOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {micOn ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            )}
          </svg>
          <span className="text-[9px] sm:text-[10px] font-medium tracking-tight mt-0.5">
            {micOn ? "Mute" : "Unmute"}
          </span>
        </button>

        {/* Video (Start/Stop) */}
        <button
          onClick={onToggleCam}
          className={`flex flex-col items-center justify-center w-11 h-12 sm:w-14 sm:h-13 rounded-xl transition-all cursor-pointer ${
            camOn
              ? "text-neutral-200 hover:bg-neutral-800/80 hover:text-white"
              : "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25"
          }`}
          title={camOn ? "Stop Video" : "Start Video"}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {camOn ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            )}
          </svg>
          <span className="text-[9px] sm:text-[10px] font-medium tracking-tight mt-0.5">
            {camOn ? "Stop Video" : "Start Video"}
          </span>
        </button>

        {/* Screen Share (Desktop/Tablet) */}
        <button
          onClick={onToggleScreenShare}
          className={`hidden xs:flex flex-col items-center justify-center w-11 h-12 sm:w-14 sm:h-13 rounded-xl transition-all cursor-pointer ${
            screenSharing
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "text-neutral-200 hover:bg-neutral-800/80 hover:text-white"
          }`}
          title="Share Screen"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-[9px] sm:text-[10px] font-medium tracking-tight mt-0.5 text-emerald-400">
            {screenSharing ? "Sharing" : "Share"}
          </span>
        </button>

        {/* Reactions & Raise Hand Button */}
        <div className="relative" ref={reactionRef}>
          <button
            onClick={() => setShowReactions(!showReactions)}
            className={`flex flex-col items-center justify-center w-11 h-12 sm:w-14 sm:h-13 rounded-xl transition-all cursor-pointer ${
              handRaised
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-neutral-200 hover:bg-neutral-800/80 hover:text-white"
            }`}
            title="Reactions & Hand Raise"
          >
            <span className="text-sm sm:text-base leading-none">
              {handRaised ? "✋" : "😀"}
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium tracking-tight mt-1">
              {handRaised ? "Hand Up" : "React"}
            </span>
          </button>

          {/* Reaction Popup Menu */}
          {showReactions && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl shadow-2xl z-50 flex flex-col gap-2 min-w-[200px] sm:min-w-[220px]">
              {/* Emojis row */}
              <div className="flex items-center justify-between gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSendReaction(emoji);
                      setShowReactions(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition transform active:scale-95 cursor-pointer rounded-lg hover:bg-neutral-800"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="h-px bg-white/10"></div>
              {/* Raise Hand Button */}
              <button
                onClick={() => {
                  onToggleRaiseHand();
                  setShowReactions(false);
                }}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  handRaised
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                    : "bg-neutral-800 hover:bg-neutral-700 text-white"
                }`}
              >
                <span>✋</span>
                <span>{handRaised ? "Lower Hand" : "Raise Hand"}</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-neutral-800 mx-0.5"></div>

        {/* Participants */}
        <button
          onClick={onToggleParticipants}
          className="relative flex flex-col items-center justify-center w-11 h-12 sm:w-14 sm:h-13 rounded-xl text-neutral-200 hover:bg-neutral-800/80 hover:text-white transition cursor-pointer"
          title="Participants"
        >
          <div className="relative">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="absolute -top-1.5 -right-2.5 bg-neutral-700 text-neutral-200 text-[9px] font-bold px-1 py-0.2 rounded-full border border-neutral-600">
              {participantCount}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium tracking-tight mt-0.5">
            People
          </span>
        </button>

        {/* Chat */}
        <button
          onClick={onToggleChat}
          className="relative flex flex-col items-center justify-center w-11 h-12 sm:w-14 sm:h-13 rounded-xl text-neutral-200 hover:bg-neutral-800/80 hover:text-white transition cursor-pointer"
          title="In-call Chat"
        >
          <div className="relative">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-indigo-500 text-white text-[9px] font-bold px-1 py-0.2 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium tracking-tight mt-0.5">
            Chat
          </span>
        </button>

        <div className="w-px h-6 bg-neutral-800 mx-0.5"></div>

        {/* End / Leave Button (Zoom Red) */}
        <button
          onClick={() => setShowLeaveModal(true)}
          className="px-3 sm:px-4 h-9 sm:h-10 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5 ml-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">{isHost ? "End / Leave" : "Leave"}</span>
        </button>
      </div>

      {/* Confirmation Leave Modal (Clause check: prevents accidental click) */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-center">
            <h3 className="text-sm font-semibold text-white">Leave Meeting?</h3>
            <p className="text-xs text-neutral-400">
              {isHost
                ? "You are the host. Do you want to end the meeting for everyone or just leave?"
                : "Are you sure you want to leave this meeting?"}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {isHost && (
                <button
                  onClick={() => {
                    setShowLeaveModal(false);
                    onEndMeeting();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  End Meeting for All
                </button>
              )}
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  onLeave();
                }}
                className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                {isHost ? "Leave Meeting Only" : "Leave Meeting"}
              </button>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-full py-2 text-neutral-400 hover:text-white text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
