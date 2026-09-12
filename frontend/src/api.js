const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:8000`;
    }
    // Smart fallback if hosted on Render
    if (hostname.includes(".onrender.com")) {
      const backendHost = hostname.replace(/-frontend(\.onrender\.com)/, "-backend$1");
      return `https://${backendHost}`;
    }
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    return `${protocol}//${hostname}:8000`;
  }
  return "http://localhost:8000";
};

export const API_URL = getApiUrl();

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  get: (url) => request(url, { method: "GET" }),
  post: (url, body) => request(url, { method: "POST", body: JSON.stringify(body) }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  joinAsGuest: (name) =>
    request("/auth/guest", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  me: () => request("/auth/me", { method: "GET" }),

  // Meeting endpoints
  createMeeting: (title = "New Meeting") =>
    request("/meetings", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  getMeetingByCode: (code) =>
    request(`/meetings/${code}`, { method: "GET" }),

  listMyMeetings: () => request("/meetings/mine", { method: "GET" }),

  endMeeting: (code) =>
    request(`/meetings/${code}/end`, {
      method: "POST",
    }),
};
