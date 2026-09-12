import React from "react";

export default function ControlBar({
  micOn,
  camOn,
  screenSharing,
  isHost,
  unreadCount = 0,
  participantCount = 1,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onLeave,
  onEndMeeting,
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80">
      {/* Mic Button */}
      <button
        onClick={onToggleMic}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all cursor-pointer ${
          micOn
            ? "bg-neutral-800 text-white hover:bg-neutral-700"
            : "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
        }`}
        title={micOn ? "Mute Microphone" : "Unmute Microphone"}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {micOn ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          )}
        </svg>
      </button>

      {/* Camera Button */}
      <button
        onClick={onToggleCam}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all cursor-pointer ${
          camOn
            ? "bg-neutral-800 text-white hover:bg-neutral-700"
            : "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
        }`}
        title={camOn ? "Turn Off Camera" : "Turn On Camera"}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {camOn ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          )}
        </svg>
      </button>

      {/* Screen Share Button */}
      <button
        onClick={onToggleScreenShare}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all cursor-pointer ${
          screenSharing
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
            : "bg-neutral-800 text-white hover:bg-neutral-700"
        }`}
        title="Share Screen"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>

      <div className="w-px h-7 bg-neutral-800 mx-1"></div>

      {/* Participants Toggle */}
      <button
        onClick={onToggleParticipants}
        className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 transition cursor-pointer"
        title="Participants"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="absolute -top-1 -right-1 bg-neutral-700 text-neutral-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {participantCount}
        </span>
      </button>

      {/* Chat Toggle */}
      <button
        onClick={onToggleChat}
        className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 transition cursor-pointer"
        title="In-call Messages"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      <div className="w-px h-7 bg-neutral-800 mx-1"></div>

      {/* Leave Meeting (Red Button) */}
      <button
        onClick={onLeave}
        className="px-4 h-12 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Leave</span>
      </button>

      {/* Host-only End Meeting Button */}
      {isHost && (
        <button
          onClick={onEndMeeting}
          className="px-3 h-12 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          End for All
        </button>
      )}
    </div>
  );
}
