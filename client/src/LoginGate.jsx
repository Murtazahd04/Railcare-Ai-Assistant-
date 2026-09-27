import React, { useState } from "react";
import { login } from "./api";
import { Train } from "lucide-react";

/**
 * Minimal login screen against the real /api/v1/auth/login endpoint.
 * Demo users (created by `npm run seed` on the server):
 *   admin / supervisor / priya / karan   — all password: password123
 */
export default function LoginGate({ onLoggedIn }) {
  const [username, setUsername] = useState("priya");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login(username, password);
      onLoggedIn({ token, user });
    } catch (err) {
      setError(err.message || "Could not reach the server. Is it running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E7ECF6] flex items-center justify-center p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-[#24314D] bg-[#0F1728] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Train size={18} className="text-[#6BA9DE]" />
          <div className="text-sm font-semibold">SRLMS Executive Console</div>
        </div>

        <div>
          <label className="text-xs text-[#6B7A99]">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mt-1 bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82C4]/50"
          />
        </div>
        <div>
          <label className="text-xs text-[#6B7A99]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82C4]/50"
          />
        </div>

        {error && (
          <div className="text-xs text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-[#3B82C4]/20 border border-[#3B82C4]/40 text-[#6BA9DE] text-sm font-medium hover:bg-[#3B82C4]/30 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="text-[11px] text-[#6B7A99] text-center">
          Demo accounts: admin · supervisor · priya · karan · farah · vikas · sneha — password: password123
        </div>
        <a href="#/" className="block text-[11px] text-[#6B7A99] hover:text-[#8B98B8] text-center underline underline-offset-2">← Back to home</a>
      </form>
    </div>
  );
}
