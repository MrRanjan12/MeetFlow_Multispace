import React, { useState } from "react";

export default function SidePanel({
  panel,
  participants = [],
  chatMessages = [],
  selfId,
  onSendChat,
  onClose,
}) {
  const [text, setText] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendChat(text);
    setText("");
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 text-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <h2 className="text-sm font-semibold tracking-wide text-white capitalize">
          {panel === "chat" ? "In-Call Messages" : `People (${participants?.length || 1})`}
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {panel === "participants" && (
          <div className="space-y-2">
            {participants.map((p, idx) => (
              <div
                key={p.user_id || idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-semibold">
                    {(p.name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-100">
                      {p.name} {p.user_id === selfId && "(You)"}
                    </p>
                    <p className="text-[10px] text-neutral-400">{p.role || "Attendee"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {panel === "chat" && (
          <div className="space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-500">
                No messages yet. Send a message to everyone in the room!
              </div>
            ) : (
              chatMessages.map((m, idx) => {
                const isMe = m.senderId === selfId;
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-neutral-400 font-medium">{m.sender}</span>
                      <span className="text-[9px] text-neutral-500">{m.time}</span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700/50"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      {panel === "chat" && (
        <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 bg-neutral-900">
          <div className="flex items-center bg-neutral-800/80 rounded-xl px-3 py-2 border border-neutral-700/60 focus-within:border-indigo-500">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 bg-transparent text-xs text-neutral-100 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="ml-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-40 cursor-pointer"
            >
              <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
