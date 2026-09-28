import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import {
  Users, Headphones, PhoneForwarded, PhoneOff, Radio, LogOut, TrendingUp, Siren,
} from "lucide-react";
import { useSupervisorMonitor } from "./useSupervisorMonitor";

import { SIGNALING_URL, API_BASE } from "./config";

const STATUS_META = {
  available: { label: "Available", dot: "bg-[#2FBF71]", text: "text-[#2FBF71]" },
  busy: { label: "On call", dot: "bg-[#F5A623]", text: "text-[#F5A623]" },
};

function fmtDuration(startedAt) {
  if (!startedAt) return "--:--";
  const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SupervisorDashboard({ user, token, onLogout }) {
  const socket = useMemo(() => io(SIGNALING_URL, { auth: { token } }), [token]);
  const monitor = useSupervisorMonitor(socket);

  const [roster, setRoster] = useState([]);
  const [tick, setTick] = useState(0);
  const [kpis, setKpis] = useState(null);
  const [transferTargetFor, setTransferTargetFor] = useState(null); // executiveId currently picking a transfer target
  const [sosAlerts, setSosAlerts] = useState([]); // recent SOS presses — persist on screen until dismissed, doesn't auto-expire

  useEffect(() => {
    socket.emit("supervisor:register", { name: user?.name || "Supervisor" });
    const onRoster = (list) => setRoster(list);
    const onSos = (alert) => setSosAlerts((prev) => [{ ...alert, id: `${alert.at}-${alert.customerName}` }, ...prev]);
    socket.on("executives:roster", onRoster);
    socket.on("sos:alert", onSos);
    return () => { socket.off("executives:roster", onRoster); socket.off("sos:alert", onSos); };
  }, [socket, user]);

  // re-render every second so call durations tick up live
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/calls/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setKpis)
      .catch(() => {});
  }, [token]);

  const busyCount = roster.filter((r) => r.status === "busy").length;
  const availableCount = roster.filter((r) => r.status === "available").length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-screen bg-[#F4F6FA] text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[#0284C7]" />
          <div>
            <div className="text-sm font-semibold">SRLMS Supervisor Console</div>
            <div className="text-[11px] text-[#64748B] font-mono">{user?.name}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#FFFFFF] text-xs text-[#475569]"
        >
          <LogOut size={13} /> Log out
        </button>
      </div>

      {/* SOS alerts — stay on screen until a supervisor explicitly dismisses
          them, don't auto-expire; a missed emergency alert is worse than an
          overly persistent one. */}
      {sosAlerts.length > 0 && (
        <div className="px-6 pt-4 space-y-2">
          {sosAlerts.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-md bg-[#E5484D]/15 border border-[#E5484D]/50 text-[#E5484D] text-xs animate-pulse">
              <div className="flex items-center gap-2 font-semibold">
                <Siren className="w-4 h-4 shrink-0" /> SOS — {a.customerName}{a.pnr ? ` (PNR ${a.pnr})` : ""} · {new Date(a.at).toLocaleTimeString()}
              </div>
              <button onClick={() => setSosAlerts((prev) => prev.filter((x) => x.id !== a.id))} className="text-[#E5484D] underline underline-offset-2 shrink-0">
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KPI strip */}
      <div className="px-6 pt-5 flex gap-3 flex-wrap">
        <KpiCard label="Executives online" value={roster.length} sub={`${availableCount} available · ${busyCount} on call`} />
        <KpiCard label="Total calls (all time)" value={kpis?.total ?? "—"} />
        <KpiCard label="AI resolution" value={kpis ? `${kpis.aiResolutionPct}%` : "—"} />
        <KpiCard label="Transfer rate" value={kpis ? `${kpis.transferPct}%` : "—"} />
        <KpiCard label="Avg handle time" value={kpis ? fmtSec(kpis.avgHandleTimeSec) : "—"} />
      </div>

      {/* live roster */}
      <div className="px-6 py-5">
        <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
            <Radio size={14} className="text-[#64748B]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[#64748B]">Live Executive Roster</span>
          </div>

          {roster.length === 0 ? (
            <div className="text-xs text-[#64748B] p-6 text-center">No executives online right now.</div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {roster.map((r) => {
                const meta = STATUS_META[r.status] || STATUS_META.available;
                const isMonitoring = monitor.monitoringExecutiveId === r.id;
                return (
                  <div key={r.id} className="px-4 py-3 flex items-center gap-4">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{r.name}</div>
                      <div className={`text-[11px] ${meta.text}`}>
                        {meta.label}
                        {r.status === "busy" && r.peerName && (
                          <span className="text-[#64748B]"> · with {r.peerName} · {fmtDuration(r.callStartedAt)}</span>
                        )}
                      </div>
                    </div>

                    {r.status === "busy" && (
                      <div className="flex items-center gap-2">
                        {isMonitoring ? (
                          <button
                            onClick={monitor.stopMonitoring}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E5484D]/30 bg-[#E5484D]/10 text-[#E5484D] text-[11px]"
                          >
                            <PhoneOff size={12} /> Stop listening
                          </button>
                        ) : (
                          <button
                            onClick={() => monitor.startMonitoring(r.id)}
                            disabled={!!monitor.monitoringExecutiveId}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#3B82C4]/30 bg-[#3B82C4]/10 text-[#0284C7] text-[11px] disabled:opacity-30"
                          >
                            <Headphones size={12} /> Join / Listen
                          </button>
                        )}

                        {transferTargetFor === r.id ? (
                          <div className="flex items-center gap-1.5">
                            {roster.filter((x) => x.status === "available").map((x) => (
                              <button
                                key={x.id}
                                onClick={() => { monitor.forceTransfer(r.id, x.id); setTransferTargetFor(null); }}
                                className="px-2 py-1.5 rounded-md border border-[#F5A623]/30 bg-[#F5A623]/10 text-[#F5A623] text-[11px]"
                              >
                                → {x.name}
                              </button>
                            ))}
                            <button onClick={() => setTransferTargetFor(null)} className="text-[11px] text-[#64748B] px-1">cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setTransferTargetFor(r.id)}
                            disabled={availableCount === 0}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#FFFFFF] text-[#475569] text-[11px] disabled:opacity-30"
                          >
                            <PhoneForwarded size={12} /> Force transfer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {monitor.monitoringExecutiveId && (
          <div className="mt-3 rounded-md border border-[#3B82C4]/30 bg-[#3B82C4]/10 px-4 py-2.5 text-xs text-[#0284C7] flex items-center gap-2">
            <Headphones size={13} className="animate-pulse" />
            Listening in — you can hear both sides of this call. You're not sending any audio.
            <audio ref={monitor.audioRef} autoPlay />
          </div>
        )}
      </div>
    </div>
  );
}

function fmtSec(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function KpiCard({ label, value, sub }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 20px -6px rgba(0,61,165,0.15)" }}
      transition={{ duration: 0.18 }}
      className="flex-1 min-w-[150px] rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] p-4"
    >
      <div className="text-[11px] uppercase tracking-wider text-[#64748B] font-medium mb-2 flex items-center justify-between">
        {label} <TrendingUp size={13} className="text-[#3B82C4]" />
      </div>
      <div className="font-mono text-2xl text-[#0F172A] font-semibold leading-none">{value}</div>
      {sub && <div className="text-[11px] text-[#64748B] mt-1.5">{sub}</div>}
    </motion.div>
  );
}
