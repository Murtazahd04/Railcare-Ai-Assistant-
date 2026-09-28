import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { BarChart3, LogOut, Star, ArrowUpCircle, RefreshCw } from "lucide-react";

import { API_BASE } from "./config";
const COLORS = ["#3B82C4", "#2FBF71", "#F5A623", "#E5484D", "#64748B", "#0284C7", "#64748B", "#9B7FE8", "#4CC9C0", "#D97757"];
const AUTO_REFRESH_MS = 15000;

export default function AnalyticsDashboard({ token, onLogout }) {
  const [kpis, setKpis] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [topIntents, setTopIntents] = useState([]);
  const [ratings, setRatings] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [escalations, setEscalations] = useState(null);
  const [escalating, setEscalating] = useState(null); // complaint _id currently being escalated
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshEscalations = useCallback((headers) => {
    fetch(`${API_BASE}/complaints/escalations/summary`, { headers }).then((r) => r.json()).then(setEscalations).catch(() => {});
  }, []);

  // Single source of truth for "load everything" — used on mount, on the
  // auto-refresh timer, and by the manual refresh button, so this dashboard
  // stays in sync with complaints/ratings/escalations happening over on the
  // Executive Console or Passenger Portal without a manual page reload.
  const refreshAll = useCallback(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE}/calls/analytics`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/calls/analytics/timeseries?days=14`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/calls/analytics/top-intents`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/calls/analytics/ratings`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/calls/analytics/executives`, { headers }).then((r) => r.json()),
    ])
      .then(([k, t, i, r, e]) => { setKpis(k); setTimeseries(t); setTopIntents(i); setRatings(r); setExecutives(e); setError(null); setLastUpdated(new Date()); })
      .catch(() => setError("Could not reach the backend. Is it running on port 4000?"));
    refreshEscalations(headers);
  }, [token, refreshEscalations]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  useEffect(() => {
    const id = setInterval(refreshAll, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [refreshAll]);

  async function handleEscalate(complaintId) {
    setEscalating(complaintId);
    try {
      await fetch(`${API_BASE}/complaints/${complaintId}/escalate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      refreshEscalations({ Authorization: `Bearer ${token}` });
    } catch {
      // best-effort — the auto-sweep will still catch it eventually
    } finally {
      setEscalating(null);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-screen bg-[#F4F6FA] text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="border-b border-[#E2E8F0] px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#0284C7]" />
          <div className="text-sm font-semibold">SRLMS Analytics</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#2FBF71] opacity-70 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2FBF71]" />
            </span>
            {lastUpdated ? `synced ${lastUpdated.toLocaleTimeString()}` : "syncing…"}
          </div>
          <button onClick={refreshAll} title="Refresh now" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#FFFFFF] text-xs text-[#475569]">
            <RefreshCw size={12} />
          </button>
          {onLogout && (
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#FFFFFF] text-xs text-[#475569]">
              <LogOut size={13} /> Log out
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="m-6 text-xs text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {kpis && (
        <div className="px-4 sm:px-6 pt-5 flex gap-3 flex-wrap">
          <Kpi label="Total calls" value={kpis.total} />
          <Kpi label="Completed" value={kpis.completed} />
          <Kpi label="Missed" value={kpis.missed} />
          <Kpi label="Transferred" value={kpis.transferred} />
          <Kpi label="AI resolution" value={`${kpis.aiResolutionPct}%`} />
          <Kpi label="Avg handle time" value={`${Math.floor(kpis.avgHandleTimeSec / 60)}:${(kpis.avgHandleTimeSec % 60).toString().padStart(2, "0")}`} />
          {ratings && <Kpi label="Avg rating" value={ratings.totalRated ? `${ratings.averageRating} ★` : "—"} />}
          {escalations && <Kpi label="Escalated (open)" value={escalations.level1 + escalations.level2} />}
        </div>
      )}

      <div className="px-4 sm:px-6 py-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-3">Call Volume — last 14 days</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeseries}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="#3B82C4" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="completed" stroke="#2FBF71" strokeWidth={2} dot={false} name="Completed" />
              <Line type="monotone" dataKey="missed" stroke="#E5484D" strokeWidth={2} dot={false} name="Missed" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-3">Top Intents</div>
          {topIntents.length === 0 ? (
            <div className="text-xs text-[#64748B] py-10 text-center">No intent data yet — make a few test calls first.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topIntents} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="intent" tick={{ fill: "#475569", fontSize: 11 }} width={140} />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topIntents.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {kpis && (
          <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 xl:col-span-2">
            <div className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-3">Outcome Breakdown</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Completed", value: kpis.completed },
                    { name: "Transferred", value: kpis.transferred },
                    { name: "Missed", value: kpis.missed },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  <Cell fill="#2FBF71" />
                  <Cell fill="#F5A623" />
                  <Cell fill="#E5484D" />
                </Pie>
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-3">Executive Performance</div>
          {executives.length === 0 ? (
            <div className="text-xs text-[#64748B] py-10 text-center">No executive-handled calls yet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[#64748B] border-b border-[#E2E8F0]">
                  <th className="pb-2 font-medium">Executive</th>
                  <th className="pb-2 font-medium text-right">Calls</th>
                  <th className="pb-2 font-medium text-right">Avg handle time</th>
                  <th className="pb-2 font-medium text-right">Avg rating</th>
                </tr>
              </thead>
              <tbody>
                {executives.map((ex) => (
                  <tr key={ex.executiveName} className="border-b border-[#E2E8F0]/60">
                    <td className="py-2 text-[#0F172A]">{ex.executiveName}</td>
                    <td className="py-2 text-right font-mono">{ex.callsHandled}</td>
                    <td className="py-2 text-right font-mono">{Math.floor(ex.avgHandleTimeSec / 60)}:{(ex.avgHandleTimeSec % 60).toString().padStart(2, "0")}</td>
                    <td className="py-2 text-right">
                      {ex.avgRating != null ? (
                        <span className="flex items-center justify-end gap-1 text-[#F5A623]">
                          <Star size={11} fill="currentColor" /> {ex.avgRating} <span className="text-[#64748B]">({ex.ratedCalls})</span>
                        </span>
                      ) : <span className="text-[#64748B]">no ratings yet</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-3">Passenger Satisfaction</div>
          {!ratings || ratings.totalRated === 0 ? (
            <div className="text-xs text-[#64748B] py-10 text-center">No ratings submitted yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratings.distribution}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="stars" tickFormatter={(s) => `${s}★`} tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="count" fill="#F5A623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium uppercase tracking-wider text-[#64748B]">Escalation Ladder — Open Complaints</div>
            {escalations && (
              <div className="flex gap-3 text-[11px] text-[#64748B]">
                <span>Agent: <span className="text-[#0F172A] font-mono">{escalations.level0}</span></span>
                <span className="text-[#F5A623]">Supervisor: <span className="font-mono">{escalations.level1}</span></span>
                <span className="text-[#E5484D]">Divisional Officer: <span className="font-mono">{escalations.level2}</span></span>
              </div>
            )}
          </div>
          {!escalations || escalations.escalated.length === 0 ? (
            <div className="text-xs text-[#64748B] py-6 text-center">Nothing currently escalated — everything's with the agent.</div>
          ) : (
            <div className="space-y-2">
              {escalations.escalated.map((c) => (
                <div key={c._id} className="flex items-center justify-between px-3 py-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs">
                  <div>
                    <span className={c.escalationLevel === 2 ? "text-[#E5484D]" : "text-[#F5A623]"}>
                      {c.escalationLevel === 2 ? "Divisional Officer" : "Supervisor"}
                    </span>
                    <span className="text-[#64748B]"> · {c.intent} · {c.passengerName} · PNR {c.pnr}</span>
                  </div>
                  {c.escalationLevel < 2 && (
                    <button onClick={() => handleEscalate(c._id)} disabled={escalating === c._id}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#3B82C4]/15 border border-[#3B82C4]/40 text-[#0284C7] disabled:opacity-50">
                      <ArrowUpCircle size={12} /> Escalate now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {escalations && escalations.withAgent.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
              <div className="text-[11px] text-[#64748B] mb-2">Still with the agent (oldest first) — escalate now if urgent</div>
              <div className="space-y-2">
                {escalations.withAgent.map((c) => (
                  <div key={c._id} className="flex items-center justify-between px-3 py-2 rounded-md bg-[#FFFFFF]/60 border border-[#E2E8F0]/60 text-xs">
                    <span className="text-[#64748B]">{c.intent} · {c.passengerName} · PNR {c.pnr}</span>
                    <button onClick={() => handleEscalate(c._id)} disabled={escalating === c._id}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B] disabled:opacity-50">
                      <ArrowUpCircle size={12} /> Escalate now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 20px -6px rgba(0,61,165,0.15)" }}
      transition={{ duration: 0.18 }}
      className="flex-1 min-w-[130px] rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] p-4"
    >
      <div className="text-[11px] uppercase tracking-wider text-[#64748B] font-medium mb-2">{label}</div>
      <div className="font-mono text-2xl text-[#0F172A] font-semibold leading-none">{value}</div>
    </motion.div>
  );
}
