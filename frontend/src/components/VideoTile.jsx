import React, { useEffect, useRef } from "react";

export default function VideoTile({
  stream,
  name,
  muted = false,
  isMicMuted = false,
  videoOff = false,
  isSpeaking = false,
  isHandRaised = false,
  isPinned = false,
  isScreenShare = false,
  onPin,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = (name || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative w-full h-full min-h-[160px] aspect-video bg-neutral-900/95 rounded-2xl overflow-hidden shadow-xl border transition-all duration-300 flex items-center justify-center group select-none ${
        isSpeaking
          ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/40"
          : isScreenShare
          ? "border-emerald-500/80 ring-1 ring-emerald-500/40"
          : isPinned
          ? "border-indigo-500 ring-1 ring-indigo-500/30"
          : "border-neutral-800/80 hover:border-neutral-700"
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full ${
          isScreenShare ? "object-contain bg-neutral-950" : "object-cover"
        } transform ${muted && !isScreenShare ? "scale-x-[-1]" : ""} ${
          videoOff ? "hidden" : "block"
        }`}
      />

      {/* Avatar Fallback when Camera is Off and Not Screen Sharing */}
      {videoOff && (
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white font-semibold text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-white/10">
            {initials}
          </div>
          <span className="text-xs font-medium text-neutral-300 truncate max-w-[120px] sm:max-w-[160px]">
            {name}
          </span>
        </div>
      )}

      {/* Top Right Badges: Screen Share, Hand Raise & Pin button */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
        {isScreenShare && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white text-[10px] sm:text-[11px] font-semibold shadow-md">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Screen</span>
          </div>
        )}

        {isHandRaised && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/90 text-white text-[11px] font-bold shadow-lg animate-bounce">
            <span>✋</span>
            <span className="hidden sm:inline text-[10px]">Hand Raised</span>
          </div>
        )}

        {onPin && (
          <button
            onClick={onPin}
            className={`p-1.5 rounded-lg backdrop-blur-md border transition cursor-pointer opacity-0 group-hover:opacity-100 ${
              isPinned
                ? "bg-indigo-600/80 border-indigo-400/40 text-white opacity-100"
                : "bg-black/50 border-white/10 text-neutral-400 hover:text-white"
            }`}
            title={isPinned ? "Unpin video" : "Pin video"}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}

        {/* Network Quality Indicator (3 bars) */}
        <div className="flex items-end gap-0.5 px-1.5 py-1 rounded bg-black/40 backdrop-blur-sm border border-white/5" title="Connection Quality: Good">
          <div className="w-0.5 h-1.5 bg-emerald-400 rounded-full"></div>
          <div className="w-0.5 h-2 bg-emerald-400 rounded-full"></div>
          <div className="w-0.5 h-2.5 bg-emerald-400 rounded-full"></div>
        </div>
      </div>

      {/* Bottom Left: Name Badge with Audio Status */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[11px] sm:text-xs font-medium text-white shadow-md max-w-[85%] z-10">
        {(muted || isMicMuted) ? (
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z M3 3l18 18" />
            </svg>
          </div>
        ) : (
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${isSpeaking ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-400"}`}>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        )}
        <span className="truncate">{name}</span>
      </div>
    </div>
  );
}
