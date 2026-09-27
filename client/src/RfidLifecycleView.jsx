import React, { useEffect, useState } from "react";
import { Radio, Search, LogOut, Package } from "lucide-react";

import { API_BASE } from "./config";

const STAGE_META = [
  { key: "laundry", label: "Laundry", color: "#3B82C4" },
  { key: "store", label: "Store", color: "#6BA9DE" },
  { key: "transport", label: "Transport", color: "#F5A623" },
  { key: "train", label: "Train", color: "#2FBF71" },
  { key: "coach", label: "Coach", color: "#2FBF71" },
  { key: "berth", label: "Berth (with passenger)", color: "#4AD98A" },
  { key: "return", label: "Return", color: "#8B98B8" },
];

async function apiGet(path, token) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function RfidLifecycleView({ token, onLogout }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [tagId, setTagId] = useState("");
  const [tag, setTag] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet("/rfid/stats", token).then(setStats).catch((e) => setError(e.message));
  }, [token]);

  async function handleLookup(e) {
    e.preventDefault();
    setLoading(true);
    setLookupError(null);
    try {
      const t = await apiGet(`/rfid/${tagId.trim()}`, token);
      setTag(t);
    } catch (err) {
      setTag(null);
      setLookupError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const maxCount = stats ? Math.max(1, ...STAGE_META.map((s) => stats.counts[s.key] || 0)) : 1;

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E7ECF6]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="border-b border-[#1E293F] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-[#6BA9DE]" />
          <div>
            <div className="text-sm font-semibold">SRLMS — Linen RFID Lifecycle</div>
            <div className="text-[11px] text-[#6B7A99]">Live tracking across every stage</div>
          </div>
        </div>
        {onLogout && (
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2C3B5C] bg-[#19243B] hover:bg-[#212F4D] text-xs text-[#C7D0E2]">
            <LogOut size={13} /> Log out
          </button>
        )}
      </div>

      {error && (
        <div className="m-6 text-xs text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-md px-3 py-2">{error}</div>
      )}

      {/* the flow diagram */}
      <div className="px-6 py-6">
        <div className="rounded-lg border border-[#24314D] bg-[#0F1728] p-6">
          <div className="text-xs font-medium uppercase tracking-wider text-[#6B7A99] mb-1">
            {stats ? `${stats.total} linen kits tracked` : "Loading…"}
          </div>
          <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
            {STAGE_META.map((stage, i) => {
              const count = stats?.counts[stage.key] || 0;
              const heightPct = Math.max(8, (count / maxCount) * 100);
              const isTagHere = tag?.currentStage === stage.key;
              return (
                <React.Fragment key={stage.key}>
                  <div className="flex flex-col items-center min-w-[110px]">
                    <div className="text-[10px] text-[#6B7A99] font-mono mb-1">{count}</div>
                    <div className="w-full h-28 flex items-end justify-center">
                      <div
                        className="w-14 rounded-t-md transition-all"
                        style={{
                          height: `${heightPct}%`,
                          background: stage.color,
                          opacity: isTagHere ? 1 : 0.65,
                          boxShadow: isTagHere ? `0 0 0 2px ${stage.color}, 0 0 16px ${stage.color}80` : "none",
                        }}
                      />
                    </div>
                    <div className={`text-[11px] mt-2 text-center px-1 ${isTagHere ? "text-[#E7ECF6] font-semibold" : "text-[#8B98B8]"}`}>
                      {stage.label}
                    </div>
                    {isTagHere && (
                      <div className="text-[10px] text-[#2FBF71] mt-0.5 flex items-center gap-1">
                        <Package size={10} /> {tag.tagId}
                      </div>
                    )}
                  </div>
                  {i < STAGE_META.length - 1 && (
                    <div className="flex items-center px-1 text-[#3A4767] shrink-0">→</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* tag lookup */}
      <div className="px-6 pb-6">
        <div className="rounded-lg border border-[#24314D] bg-[#0F1728] p-5">
          <form onSubmit={handleLookup} className="flex gap-2 mb-4">
            <input
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              placeholder="e.g. RFID-1000"
              className="flex-1 max-w-xs bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#3B82C4]/50"
            />
            <button disabled={loading} className="px-4 py-2 rounded-md bg-[#3B82C4]/20 border border-[#3B82C4]/40 text-[#6BA9DE] text-sm font-medium hover:bg-[#3B82C4]/30 disabled:opacity-50 flex items-center gap-1.5">
              <Search size={14} /> {loading ? "Looking up…" : "Track tag"}
            </button>
          </form>

          {lookupError && <div className="text-xs text-[#E5484D] mb-3">{lookupError}</div>}

          {tag && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <InfoTile label="Tag" value={tag.tagId} />
                <InfoTile label="Kit type" value={tag.kitType} />
                <InfoTile label="Current stage" value={tag.currentStage} />
                <InfoTile label="Train / Coach" value={`${tag.trainNumber || "—"} / ${tag.coach || "—"}`} />
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6B7A99] mb-2">History</div>
                <div className="space-y-1.5">
                  {[...tag.history].reverse().map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs border-l-2 border-[#3B82C4]/40 pl-3 py-1">
                      <span className="font-mono text-[#6BA9DE] capitalize w-20">{h.stage}</span>
                      <span className="text-[#6B7A99] font-mono">{new Date(h.at).toLocaleString()}</span>
                      {h.note && <span className="text-[#8B98B8]">— {h.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-md border border-[#24314D] bg-[#121B2E] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[#6B7A99] mb-1">{label}</div>
      <div className="font-mono text-[13px] capitalize truncate">{value}</div>
    </div>
  );
}
