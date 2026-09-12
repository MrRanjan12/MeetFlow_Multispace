import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function Dashboard() {
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingCode, setMeetingCode] = useState("");
  const [myMeetings, setMyMeetings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    api
      .listMyMeetings()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setMyMeetings(data);
        }
      })
      .catch((err) => {
        console.warn("Failed to load meetings history:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateMeeting = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const title = meetingTitle.trim() || "Team Meeting";
      const data = await api.createMeeting(title);
      const code = data.code || data.id;
      navigate(`/meeting/${code}`);
    } catch (err) {
      setError(err.message || "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    const code = meetingCode.trim();
    if (!code) return;

    setError("");
    setLoading(true);
    try {
      await api.getMeetingByCode(code);
      navigate(`/meeting/${code}`);
    } catch (err) {
      setError(err.message || "Invalid or ended meeting code");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100 antialiased">
      <div className="w-full max-w-lg bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-700/80 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">Welcome, <span className="text-indigo-400 font-medium">{user?.name || user?.email}</span></p>
          </div>
          <button
            onClick={logout}
            className="text-xs text-rose-400 hover:text-rose-300 transition font-medium px-2.5 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
          >
            Sign out
          </button>
        </div>

        {error && (
          <div className="p-3 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            {error}
          </div>
        )}

        {/* Start Meeting Section */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Start a Meeting
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Meeting Topic (e.g. Design Sync)"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleCreateMeeting}
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20 whitespace-nowrap"
            >
              {loading ? "Creating..." : "Start Now"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase font-medium">or join existing</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        {/* Join Meeting Section */}
        <form onSubmit={handleJoinMeeting} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Room Code (e.g. abc-defg-hij)"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="submit"
            disabled={loading || !meetingCode.trim()}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition disabled:opacity-50 cursor-pointer"
          >
            Join
          </button>
        </form>

        {/* Recent Meetings */}
        {myMeetings.length > 0 && (
          <div className="pt-2 border-t border-slate-700/80 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Your Recent Meetings
            </h2>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {myMeetings.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-slate-600 transition"
                >
                  <div className="overflow-hidden mr-2">
                    <p className="text-xs font-medium text-slate-200 truncate">{m.title}</p>
                    <p className="text-[11px] font-mono text-slate-400">{m.code}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyCode(m.code)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                    >
                      {copiedCode === m.code ? "Copied" : "Copy"}
                    </button>
                    {m.is_active ? (
                      <button
                        onClick={() => navigate(`/meeting/${m.code}`)}
                        className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        Rejoin
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Ended</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
