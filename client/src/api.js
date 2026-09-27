import { API_BASE } from "./config";

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Login failed");
  return res.json(); // { token, user }
}

export async function authFetch(path, token, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed: ${path}`);
  return res.json();
}
