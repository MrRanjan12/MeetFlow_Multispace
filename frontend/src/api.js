export const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // 1. Check URL query param: ?api_url=https://my-backend.onrender.com
    const params = new URLSearchParams(window.location.search);
    const queryApi = params.get("api_url");
    if (queryApi && queryApi.trim()) {
      const clean = queryApi.trim().replace(/\/+$/, "");
      localStorage.setItem("custom_api_url", clean);
      return clean;
    }

    // 2. Check saved custom API URL in localStorage
    const saved = localStorage.getItem("custom_api_url");
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, "");
    }

    const hostname = window.location.hostname;
    // 3. Localhost development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:8000`;
    }

    // 4. Render auto-derivation:
    // If frontend is meeting-app-frontend-xxxx.onrender.com, derive meeting-app-backend-xxxx.onrender.com
    if (hostname.includes(".onrender.com")) {
      const derived = hostname.replace(/-frontend(\.onrender\.com)/, "-backend$1");
      if (derived !== hostname) {
        return `https://${derived}`;
      }
    }
  }

  // 5. Environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // 6. Real Render production backend fallback
  return "https://meeting-app-backend-4fu8.onrender.com";
};

export const API_URL = getApiUrl();

export const setApiUrl = (url) => {
  if (typeof window !== "undefined" && url && url.trim()) {
    localStorage.setItem("custom_api_url", url.trim().replace(/\/+$/, ""));
    window.location.reload();
  }
};

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
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
  } catch (err) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      throw new Error(
        `Unable to reach backend at ${API_URL}. If your backend URL is different, please verify it in Render or configure it below.`
      );
    }
    throw err;
  }
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
