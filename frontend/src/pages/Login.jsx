import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { API_URL, setApiUrl } from "../api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Guest tab state
  const [mode, setMode] = useState("login"); // "login" | "guest"
  const [guestName, setGuestName] = useState("");
  const [guestCode, setGuestCode] = useState("");

  // Backend URL config toggle
  const [showConfig, setShowConfig] = useState(false);
  const [serverInput, setServerInput] = useState(API_URL);

  const { login, joinAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const redirectTarget = queryParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate(redirectTarget);
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    const name = guestName.trim();
    const code = guestCode.trim();
    if (!name || !code) {
      setError("Please enter both your name and the meeting code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await joinAsGuest(name);
      navigate(`/meeting/${code}`);
    } catch (err) {
      setError(err.message || "Failed to join as guest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        {/* Toggle between Account Login and Guest Join */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === "login"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("guest");
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === "guest"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Join as Guest
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {mode === "login" ? "Welcome back" : "Join a Meeting"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === "login"
              ? "Sign in to host or manage your meetings."
              : "No account required. Just enter your name and meeting code."}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <p>{error}</p>
            {error.includes("Unable to reach backend") && (
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                className="text-xs font-semibold underline text-red-800 hover:text-red-900 cursor-pointer block"
              >
                Configure Backend URL →
              </button>
            )}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-semibold text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Meeting Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. abc-defg-hij"
                value={guestCode}
                onChange={(e) => setGuestCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Your Display Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Connor"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-semibold text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Connecting..." : "Join Meeting Now"}
            </button>
          </form>
        )}

        {mode === "login" && (
          <p className="mt-6 text-center text-xs text-slate-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Create one for free
            </Link>
          </p>
        )}

        {/* Backend Connectivity Helper */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>API: <code className="text-slate-600 font-mono">{API_URL}</code></span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">change</span>
          </button>

          {showConfig && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
              <label className="block text-slate-600 font-medium">Backend Render URL:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverInput}
                  onChange={(e) => setServerInput(e.target.value)}
                  placeholder="https://your-backend.onrender.com"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:outline-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setApiUrl(serverInput)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
