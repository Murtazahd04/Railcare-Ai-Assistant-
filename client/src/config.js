// Dynamic configuration for local and network/mobile access.
// If VITE_BACKEND_URL is set in environment, use that.
// Otherwise, dynamically detect current browser hostname (e.g. 10.181.125.35 or localhost)
// so mobile devices automatically reach the backend on port 4000 of the same host machine.

const getBackendHost = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:4000`;
  }
  return "http://localhost:4000";
};

export const BACKEND_URL = getBackendHost();
export const API_BASE = `${BACKEND_URL}/api/v1`;
export const SIGNALING_URL = BACKEND_URL;
