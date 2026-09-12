import React, { useState, useRef, useEffect } from "react";

export default function SidePanel({
  panel,
  participants = [],
  chatMessages = [],
  selfId,
  onSendChat,
  onSwitchPanel,
  onClose,
}) {
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (panel === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, panel]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendChat(text);
    setText("");
  };

  const filteredParticipants = participants.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 text-neutral-200 select-none">
      {/* Zoom-style Header with Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/60">
        <div className="flex items-center gap-2 bg-neutral-800/60 p-1 rounded-xl">
          <button
            onClick={() => onSwitchPanel && onSwitchPanel("participants")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              panel === "participants"
                ? "bg-neutral-700 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            People ({participants.length})
          </button>
          <button
            onClick={() => onSwitchPanel && onSwitchPanel("chat")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              panel === "chat"
                ? "bg-neutral-700 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Chat
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          title="Close Panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Participants View */}
      {panel === "participants" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-neutral-800/60">
            <input
              type="text"
              placeholder="Search participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-neutral-800 text-xs text-white placeholder:text-neutral-500 border border-neutral-700/60 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filteredParticipants.map((p, idx) => {
              const isSelf = p.user_id === selfId;
              return (
                <div
                  key={p.user_id || idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-800/40 hover:bg-neutral-800/80 transition"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {(p.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium text-white truncate">
                        {p.name} {isSelf && <span className="text-indigo-400 font-normal">(You)</span>}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {isSelf ? "Local Participant" : "In Meeting"}
                      </p>
                    </div>
                  </div>

                  {/* Status Icons */}
                  <div className="flex items-center gap-1.5 text-neutral-400 text-xs flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat View */}
      {panel === "chat" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                  💬
                </div>
                <p className="text-xs font-medium text-neutral-300">No messages yet</p>
                <p className="text-[11px] text-neutral-500">Messages sent here can be seen by everyone in the room.</p>
              </div>
            ) : (
              chatMessages.map((m, idx) => {
                const isMe = m.senderId === selfId || m.senderId === "local";
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-0.5 px-1">
                      <span className="text-[10px] text-neutral-400 font-semibold">{m.sender}</span>
                      <span className="text-[9px] text-neutral-500">{m.time}</span>
                    </div>
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words shadow-sm leading-relaxed ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-neutral-800 text-neutral-100 rounded-tl-none border border-neutral-700/50"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 bg-neutral-900/90">
            <div className="flex items-center bg-neutral-800/80 rounded-xl px-3 py-2 border border-neutral-700/60 focus-within:border-indigo-500">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Send a message to everyone..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="ml-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 cursor-pointer transition p-1"
                title="Send"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
