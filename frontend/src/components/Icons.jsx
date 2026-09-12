import React from "react";

const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" };

export function MicIcon({ off }) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      {off && <line x1="2" y1="2" x2="22" y2="22" />}
    </svg>
  );
}

export function CameraIcon({ off }) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      {off && <line x1="1" y1="1" x2="23" y2="23" />}
    </svg>
  );
}

export function ScreenShareIcon() {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <polyline points="9 10 12 7 15 10" />
      <line x1="12" y1="7" x2="12" y2="14" />
    </svg>
  );
}

export function ChatIcon() {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function LeaveIcon() {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10c5-4.5 13-4.5 18 0l-3 3.2c-1-.8-2-1.3-3-1.6v-2a12 12 0 0 0-6 0v2c-1 .3-2 .8-3 1.6z" />
      <line x1="4" y1="4" x2="20" y2="20" />
    </svg>
  );
}
