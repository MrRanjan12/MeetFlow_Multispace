import React, { useEffect, useRef } from "react";

export default function VideoTile({
  stream,
  name,
  muted = false,
  isMicMuted = false,
  videoOff = false,
  isSpeaking = false,
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
      className={`relative w-full aspect-video bg-neutral-900/90 rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300 flex items-center justify-center group ${
        isSpeaking ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-neutral-800/80 hover:border-neutral-700"
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover transform ${muted ? "scale-x-[-1]" : ""} ${
          videoOff ? "hidden" : "block"
        }`}
      />

      {/* Avatar Fallback when Camera is Off */}
      {videoOff && (
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-semibold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            {initials}
          </div>
          <span className="text-xs font-medium text-neutral-400">{name}</span>
        </div>
      )}

      {/* Modern Frosted Name Badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-white/90 shadow-md">
        {(muted || isMicMuted) && (
          <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
        <span className="truncate max-w-[140px]">{name}</span>
      </div>
    </div>
  );
}
