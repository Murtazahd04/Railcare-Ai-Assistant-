import React, { useEffect, useState, useCallback } from "react";
import {
  Brain, FolderPlus, Plus, X, ChevronRight, Sparkles, LogOut,
  Tag, MessageSquare, Wand2, Target, Gauge, PlayCircle, Loader2,
  AlertCircle, Check, ArrowRight,
} from "lucide-react";

import { API_BASE } from "./config";

async function api(path, token, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${path}`);
  return data;
}

function UnansweredQueriesPanel({ rows, loading, intents, token, onRefresh }) {
  const [addingTo, setAddingTo] = useState(null); // row._id currently picking an intent for
  const [busyId, setBusyId] = useState(null);

  async function markReviewed(row) {
    setBusyId(row._id);
    try {
      await api(`/kb/unanswered/${row._id}`, token, { method: "PATCH", body: JSON.stringify({ reviewed: true }) });
      onRefresh();
    } finally {
      setBusyId(null);
    }
  }

  async function addToIntent(row, intentId) {
    setBusyId(row._id);
    try {
      await api(`/kb/unanswered/${row._id}/add-to-intent`, token, { method: "POST", body: JSON.stringify({ intentId }) });
      setAddingTo(null);
      onRefresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-3">
      <div className="text-sm text-[#8B98B8]">
        Every query the AI transferred to a human because nothing in the knowledge base was a confident enough
        match — real gaps, not guesses. Most-repeated first.
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[#6B7A99] py-10 justify-center"><Loader2 size={14} className="animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-[#6B7A99] py-10 text-center border border-dashed border-[#24314D] rounded-md">
          Nothing unreviewed right now — the knowledge base is covering what people are asking.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row._id} className="rounded-md border border-[#24314D] bg-[#0F1728] p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm text-[#E7ECF6] break-words">"{row.utterance}"</div>
                {row.occurrences > 1 && (
                  <span className="shrink-0 text-[10px] bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30 rounded-full px-2 py-0.5">
                    asked {row.occurrences}×
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#6B7A99]">
                best confidence reached: {Math.round((row.bestConfidence || 0) * 100)}% · via {row.source || "classifier"}
              </div>

              {addingTo === row._id ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <select
                    className="bg-[#121B2E] border border-[#24314D] rounded-md text-xs px-2 py-1.5 text-[#C7D0E2] max-w-full"
                    onChange={(e) => e.target.value && addToIntent(row, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Pick an intent…</option>
                    {intents.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
                  </select>
                  <button onClick={() => setAddingTo(null)} className="text-[11px] text-[#6B7A99]">Cancel</button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => setAddingTo(row._id)} disabled={busyId === row._id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#3B82C4]/10 hover:bg-[#3B82C4]/20 border border-[#3B82C4]/30 text-[#6BA9DE] text-[11px] disabled:opacity-50">
                    <ArrowRight size={11} /> Add as training question to an intent
                  </button>
                  <button onClick={() => markReviewed(row)} disabled={busyId === row._id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#19243B] hover:bg-[#212F4D] border border-[#2C3B5C] text-[#8B98B8] text-[11px] disabled:opacity-50">
                    <Check size={11} /> Mark reviewed (no action needed)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminTrainingDashboard({ user, token, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [intents, setIntents] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("kb"); // "kb" | "unanswered"
  const [unanswered, setUnanswered] = useState([]);
  const [unansweredLoading, setUnansweredLoading] = useState(false);

  const loadUnanswered = useCallback((silent = false) => {
    if (!silent) setUnansweredLoading(true);
    api("/kb/unanswered", token).then(setUnanswered).catch((e) => !silent && setError(e.message)).finally(() => setUnansweredLoading(false));
  }, [token]);

  const loadCategories = useCallback(() => {
    api("/kb/categories", token).then(setCategories).catch((e) => setError(e.message));
  }, [token]);
  const loadIntents = useCallback(() => {
    api("/kb/intents", token).then(setIntents).catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => { loadCategories(); loadIntents(); }, [loadCategories, loadIntents]);
  useEffect(() => { if (view === "unanswered") loadUnanswered(); }, [view, loadUnanswered]);

  // Keeps categories/intents/unanswered-count in sync in the background —
  // safe to do because IntentEditor keeps its own local edit state and only
  // reads from the `intent` prop once on mount, so a background refetch here
  // never clobbers an in-progress unsaved edit.
  useEffect(() => {
    const AUTO_REFRESH_MS = 15000;
    const id = setInterval(() => {
      loadCategories();
      loadIntents();
      loadUnanswered(true); // keeps the badge count live even while on the KB view, without flickering the spinner
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [loadCategories, loadIntents, loadUnanswered]);

  const visibleIntents = selectedCategoryId
    ? intents.filter((i) => (i.categoryId?._id || i.categoryId) === selectedCategoryId)
    : intents;

  async function refreshSelectedIntent(id) {
    const fresh = await api(`/kb/intents/${id}`, token);
    setSelectedIntent(fresh);
    loadIntents();
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E7ECF6]" style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      <div className="border-b border-[#1E293F] px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-[#6BA9DE]" />
          <div>
            <div className="text-sm font-semibold">SRLMS AI Training</div>
            <div className="text-[11px] text-[#6B7A99]">{user?.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-[#121B2E] border border-[#24314D] rounded-md p-0.5">
          <button onClick={() => setView("kb")}
            className={`px-3 py-1.5 rounded text-xs ${view === "kb" ? "bg-[#19243B] text-[#E7ECF6]" : "text-[#6B7A99]"}`}>
            Knowledge Base
          </button>
          <button onClick={() => setView("unanswered")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs ${view === "unanswered" ? "bg-[#19243B] text-[#E7ECF6]" : "text-[#6B7A99]"}`}>
            <AlertCircle size={12} /> Unanswered
            {unanswered.length > 0 && <span className="bg-[#E5484D]/20 text-[#E5484D] rounded-full px-1.5">{unanswered.length}</span>}
          </button>
        </div>
        {onLogout && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-[#4A5675]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#2FBF71] opacity-70 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2FBF71]" />
              </span>
              live sync
            </div>
            <a href="#/analytics" className="px-3 py-1.5 rounded-md border border-[#2C3B5C] bg-[#19243B] hover:bg-[#212F4D] text-xs text-[#C7D0E2]">
              Analytics
            </a>
            <a href="#/rfid" className="px-3 py-1.5 rounded-md border border-[#2C3B5C] bg-[#19243B] hover:bg-[#212F4D] text-xs text-[#C7D0E2]">
              RFID
            </a>
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2C3B5C] bg-[#19243B] hover:bg-[#212F4D] text-xs text-[#C7D0E2]">
              <LogOut size={13} /> Log out
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="m-6 text-xs text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-md px-3 py-2">{error}</div>
      )}

      {view === "unanswered" ? (
        <UnansweredQueriesPanel
          rows={unanswered}
          loading={unansweredLoading}
          intents={intents}
          token={token}
          onRefresh={loadUnanswered}
        />
      ) : (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_260px_1fr] gap-0 min-h-[calc(100vh-65px)]">
        {/* categories */}
        <div className="border-r border-[#1E293F] p-3 space-y-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] uppercase tracking-wider text-[#6B7A99]">Categories</span>
            <button onClick={() => setShowNewCategory(true)} className="text-[#6BA9DE] hover:text-[#8FC0EA]">
              <FolderPlus size={14} />
            </button>
          </div>
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs ${!selectedCategoryId ? "bg-[#19243B] text-[#E7ECF6]" : "text-[#8B98B8] hover:bg-[#121B2E]"}`}
          >
            All intents ({intents.length})
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCategoryId(c._id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between ${selectedCategoryId === c._id ? "bg-[#19243B] text-[#E7ECF6]" : "text-[#8B98B8] hover:bg-[#121B2E]"}`}
            >
              <span className="truncate">{c.name}</span>
              <span className="text-[#4A5675] font-mono">
                {intents.filter((i) => (i.categoryId?._id || i.categoryId) === c._id).length}
              </span>
            </button>
          ))}
        </div>

        {/* intents list */}
        <div className="border-r border-[#1E293F] p-3 space-y-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] uppercase tracking-wider text-[#6B7A99]">Intents</span>
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-1 text-[11px] text-[#2FBF71] hover:text-[#4AD98A]"
            >
              <Plus size={13} /> New
            </button>
          </div>
          {visibleIntents.length === 0 && (
            <div className="text-[11px] text-[#6B7A99] px-2 py-4">No intents yet — click New to train one.</div>
          )}
          {visibleIntents.map((i) => (
            <button
              key={i._id}
              onClick={() => api(`/kb/intents/${i._id}`, token).then(setSelectedIntent)}
              className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center justify-between ${selectedIntent?._id === i._id ? "bg-[#19243B] text-[#E7ECF6]" : "text-[#8B98B8] hover:bg-[#121B2E]"}`}
            >
              <div className="min-w-0">
                <div className="truncate">{i.name}</div>
                <div className="text-[10px] text-[#4A5675] font-mono flex items-center gap-1.5 flex-wrap">
                  <span>{(i.questions || []).length} questions</span>
                  {i.languages?.length > 2 && (
                    <span className="text-[#6BA9DE] bg-[#3B82C4]/10 rounded px-1">{i.languages.length} languages</span>
                  )}
                </div>
              </div>
              <ChevronRight size={13} className="shrink-0 text-[#3A4767]" />
            </button>
          ))}
        </div>

        {/* editor + tester */}
        <div className="p-5 space-y-5">
          {selectedIntent ? (
            <IntentEditor
              key={selectedIntent._id}
              intent={selectedIntent}
              token={token}
              onChanged={() => refreshSelectedIntent(selectedIntent._id)}
            />
          ) : (
            <div className="text-sm text-[#6B7A99] py-10 text-center">
              Select an intent on the left, or click <span className="text-[#2FBF71]">New</span> to train one from scratch.
            </div>
          )}

          <LiveTester token={token} />
        </div>
      </div>

      {showNewCategory && (
        <NewCategoryModal
          token={token}
          onClose={() => setShowNewCategory(false)}
          onCreated={() => { setShowNewCategory(false); loadCategories(); }}
        />
      )}
      {showWizard && (
        <NewIntentWizard
          token={token}
          categories={categories}
          defaultCategoryId={selectedCategoryId}
          onClose={() => setShowWizard(false)}
          onCreated={(intent) => { setShowWizard(false); loadIntents(); setSelectedIntent(intent); }}
        />
      )}
      </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function NewCategoryModal({ token, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/kb/categories", token, { method: "POST", body: JSON.stringify({ name, description }) });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="New category">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs text-[#6B7A99]">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full mt-1 bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Linen Issues" />
        </div>
        <div>
          <label className="text-xs text-[#6B7A99]">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none" placeholder="optional" />
        </div>
        {error && <div className="text-xs text-[#E5484D]">{error}</div>}
        <button disabled={saving} className="w-full py-2 rounded-md bg-[#3B82C4]/20 border border-[#3B82C4]/40 text-[#6BA9DE] text-sm font-medium hover:bg-[#3B82C4]/30 disabled:opacity-50">
          {saving ? "Creating…" : "Create category"}
        </button>
      </form>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
const WIZARD_STEPS = ["Category", "Name", "Questions", "Synonyms", "Keywords", "Action", "Answer", "Threshold"];

function NewIntentWizard({ token, categories, defaultCategoryId, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    categoryId: defaultCategoryId || categories[0]?._id || "",
    name: "",
    questions: [],
    synonyms: [],
    keywords: [],
    expectedAction: "",
    expectedAnswer: "",
    confidenceThreshold: 0.7,
  });
  const [draftItem, setDraftItem] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function addToList(field) {
    if (!draftItem.trim()) return;
    setForm((f) => ({ ...f, [field]: [...f[field], draftItem.trim()] }));
    setDraftItem("");
  }
  function removeFromList(field, idx) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  }

  const canAdvance = () => {
    if (step === 0) return !!form.categoryId;
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.questions.length >= 1;
    return true;
  };

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const created = await api("/kb/intents", token, { method: "POST", body: JSON.stringify(form) });
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="Train a new intent" wide>
      {/* step indicator */}
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        {WIZARD_STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`text-[10px] px-2 py-1 rounded-full border ${i === step ? "border-[#3B82C4] text-[#6BA9DE] bg-[#3B82C4]/10" : i < step ? "border-[#2FBF71]/40 text-[#2FBF71]" : "border-[#2C3B5C] text-[#4A5675]"}`}>
              {i + 1}. {label}
            </div>
            {i < WIZARD_STEPS.length - 1 && <div className="w-2 h-px bg-[#2C3B5C]" />}
          </React.Fragment>
        ))}
      </div>

      <div className="min-h-[220px]">
        {step === 0 && (
          <StepBlock icon={Tag} title="Which category does this belong to?">
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none"
            >
              {categories.length === 0 && <option value="">No categories yet — create one first</option>}
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </StepBlock>
        )}

        {step === 1 && (
          <StepBlock icon={Sparkles} title="What's this intent called?">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Missing Blanket"
              className="w-full bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none"
              autoFocus
            />
          </StepBlock>
        )}

        {step === 2 && (
          <StepBlock icon={MessageSquare} title="Add sample training questions" hint="Mix English, Hindi, and Hinglish phrasings — the more variety, the better the AI will match real callers. Add at least 5-10.">
            <ListEditor field="questions" form={form} draftItem={draftItem} setDraftItem={setDraftItem} addToList={addToList} removeFromList={removeFromList} placeholder="e.g. Mera kambal kaha hai" />
          </StepBlock>
        )}

        {step === 3 && (
          <StepBlock icon={Wand2} title="Add synonyms" hint="Alternate words for the same concept, e.g. blanket / kambal / bedroll.">
            <ListEditor field="synonyms" form={form} draftItem={draftItem} setDraftItem={setDraftItem} addToList={addToList} removeFromList={removeFromList} placeholder="e.g. kambal" />
          </StepBlock>
        )}

        {step === 4 && (
          <StepBlock icon={Tag} title="Add keywords" hint="Short trigger words used as a fallback signal alongside the questions above.">
            <ListEditor field="keywords" form={form} draftItem={draftItem} setDraftItem={setDraftItem} addToList={addToList} removeFromList={removeFromList} placeholder="e.g. missing" />
          </StepBlock>
        )}

        {step === 5 && (
          <StepBlock icon={Target} title="What should the system automatically do?" hint="A short action code your backend/team recognizes, e.g. notify_coach_attendant.">
            <input
              value={form.expectedAction}
              onChange={(e) => setForm((f) => ({ ...f, expectedAction: e.target.value }))}
              placeholder="e.g. notify_coach_attendant"
              className="w-full bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm font-mono focus:outline-none"
            />
          </StepBlock>
        )}

        {step === 6 && (
          <StepBlock icon={MessageSquare} title="What should the AI say back?" hint="Use {placeholders} like {passenger_name}, {coach}, {berth}, {pnr}, {train_number} — these get filled in at call time.">
            <textarea
              value={form.expectedAnswer}
              onChange={(e) => setForm((f) => ({ ...f, expectedAnswer: e.target.value }))}
              placeholder="e.g. I'm sorry about that, {passenger_name}. I've notified the coach attendant for coach {coach}."
              rows={3}
              className="w-full bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
            />
          </StepBlock>
        )}

        {step === 7 && (
          <StepBlock icon={Gauge} title="Confidence threshold" hint="Below this score, the call transfers to a human instead of the AI answering. 0.7 is a reasonable default.">
            <div className="flex items-center gap-3">
              <input
                type="range" min="0.3" max="0.95" step="0.05"
                value={form.confidenceThreshold}
                onChange={(e) => setForm((f) => ({ ...f, confidenceThreshold: parseFloat(e.target.value) }))}
                className="flex-1"
              />
              <span className="font-mono text-sm w-12 text-right">{form.confidenceThreshold.toFixed(2)}</span>
            </div>
          </StepBlock>
        )}
      </div>

      {error && <div className="text-xs text-[#E5484D] mt-3">{error}</div>}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1E293F]">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-3 py-1.5 rounded-md text-xs text-[#8B98B8] hover:text-[#E7ECF6] disabled:opacity-30"
        >
          Back
        </button>
        {step < WIZARD_STEPS.length - 1 ? (
          <button
            onClick={() => canAdvance() && setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="px-4 py-2 rounded-md bg-[#3B82C4]/20 border border-[#3B82C4]/40 text-[#6BA9DE] text-xs font-medium hover:bg-[#3B82C4]/30 disabled:opacity-30"
          >
            Next
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-[#2FBF71]/15 border border-[#2FBF71]/40 text-[#2FBF71] text-xs font-medium hover:bg-[#2FBF71]/25 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create intent"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}

function StepBlock({ icon: Icon, title, hint, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon size={15} className="text-[#3B82C4]" /> {title}
      </div>
      {hint && <div className="text-[11px] text-[#6B7A99]">{hint}</div>}
      <div className="pt-1">{children}</div>
    </div>
  );
}

function ListEditor({ field, form, draftItem, setDraftItem, addToList, removeFromList, placeholder }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={draftItem}
          onChange={(e) => setDraftItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToList(field); } }}
          placeholder={placeholder}
          className="flex-1 bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none"
          autoFocus
        />
        <button onClick={() => addToList(field)} type="button" className="px-3 py-2 rounded-md bg-[#19243B] border border-[#2C3B5C] text-xs">Add</button>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {form[field].map((item, i) => (
          <span key={i} className="flex items-center gap-1 text-[11px] bg-[#121B2E] border border-[#24314D] rounded-full px-2.5 py-1">
            {item}
            <button onClick={() => removeFromList(field, i)} className="text-[#4A5675] hover:text-[#E5484D]"><X size={11} /></button>
          </span>
        ))}
        {form[field].length === 0 && <span className="text-[11px] text-[#4A5675]">Nothing added yet.</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function IntentEditor({ intent, token, onChanged }) {
  const [action, setAction] = useState(intent.expectedAction || "");
  const [answer, setAnswer] = useState(intent.expectedAnswer || "");
  const [threshold, setThreshold] = useState(intent.confidenceThreshold ?? 0.7);
  const [newQuestion, setNewQuestion] = useState("");
  const [newSynonym, setNewSynonym] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveMeta() {
    setSaving(true);
    try {
      await api(`/kb/intents/${intent._id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ expectedAction: action, expectedAnswer: answer, confidenceThreshold: threshold }),
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  }
  async function addQuestion() {
    if (!newQuestion.trim()) return;
    await api(`/kb/intents/${intent._id}/questions`, token, { method: "POST", body: JSON.stringify({ question: newQuestion.trim() }) });
    setNewQuestion("");
    onChanged();
  }
  async function addSynonym() {
    if (!newSynonym.trim()) return;
    await api(`/kb/intents/${intent._id}/synonyms`, token, { method: "POST", body: JSON.stringify({ synonym: newSynonym.trim() }) });
    setNewSynonym("");
    onChanged();
  }
  async function addKeyword() {
    if (!newKeyword.trim()) return;
    await api(`/kb/intents/${intent._id}/keywords`, token, { method: "POST", body: JSON.stringify({ keyword: newKeyword.trim() }) });
    setNewKeyword("");
    onChanged();
  }

  return (
    <div className="rounded-lg border border-[#24314D] bg-[#0F1728] p-5 space-y-5">
      <div>
        <div className="text-base font-semibold">{intent.name}</div>
        <div className="text-[11px] text-[#6B7A99] font-mono">{intent.categoryId?.name}</div>
      </div>

      <ChipSection label="Questions" items={intent.questions} draft={newQuestion} setDraft={setNewQuestion} onAdd={addQuestion} placeholder="Add another sample question…" />
      <ChipSection label="Synonyms" items={intent.synonyms} draft={newSynonym} setDraft={setNewSynonym} onAdd={addSynonym} placeholder="Add a synonym…" />
      <ChipSection label="Keywords" items={intent.keywords} draft={newKeyword} setDraft={setNewKeyword} onAdd={addKeyword} placeholder="Add a keyword…" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#6B7A99]">Expected action</label>
          <input value={action} onChange={(e) => setAction(e.target.value)} className="w-full mt-1 bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm font-mono focus:outline-none" />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#6B7A99]">Confidence threshold: {threshold.toFixed(2)}</label>
          <input type="range" min="0.3" max="0.95" step="0.05" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} className="w-full mt-2" />
        </div>
      </div>
      <div>
        <label className="text-[11px] uppercase tracking-wider text-[#6B7A99]">Expected answer</label>
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} className="w-full mt-1 bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none resize-none" />
      </div>
      <button onClick={saveMeta} disabled={saving} className="px-4 py-2 rounded-md bg-[#3B82C4]/20 border border-[#3B82C4]/40 text-[#6BA9DE] text-xs font-medium hover:bg-[#3B82C4]/30 disabled:opacity-50">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function ChipSection({ label, items, draft, setDraft, onAdd, placeholder }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-[#6B7A99]">{label} ({(items || []).length})</label>
      <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
        {(items || []).map((item, i) => (
          <span key={i} className="text-[11px] bg-[#121B2E] border border-[#24314D] rounded-full px-2.5 py-1">{item}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="flex-1 bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-1.5 text-xs focus:outline-none"
        />
        <button onClick={onAdd} className="px-3 py-1.5 rounded-md bg-[#19243B] border border-[#2C3B5C] text-xs">Add</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function LiveTester({ token }) {
  const [utterance, setUtterance] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runTest(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api("/kb/test", token, { method: "POST", body: JSON.stringify({ utterance }) });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#24314D] bg-[#0F1728] p-5">
      <div className="flex items-center gap-2 text-sm font-medium mb-3">
        <PlayCircle size={15} className="text-[#2FBF71]" /> Try it — test the live classifier
      </div>
      <form onSubmit={runTest} className="flex gap-2 mb-3">
        <input
          value={utterance}
          onChange={(e) => setUtterance(e.target.value)}
          placeholder="Type what a passenger might say…"
          className="flex-1 bg-[#121B2E] border border-[#24314D] rounded-md px-3 py-2 text-sm focus:outline-none"
        />
        <button disabled={loading} className="px-4 py-2 rounded-md bg-[#2FBF71]/15 border border-[#2FBF71]/40 text-[#2FBF71] text-xs font-medium hover:bg-[#2FBF71]/25 disabled:opacity-50 flex items-center gap-1.5">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <PlayCircle size={13} />} Test
        </button>
      </form>

      {error && <div className="text-xs text-[#E5484D] mb-2">{error}</div>}

      {result && (
        <div className="rounded-md border border-[#24314D] bg-[#121B2E] p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span>Matched intent</span>
            <span className={result.matchedIntent ? "text-[#6BA9DE]" : "text-[#6B7A99]"}>{result.matchedIntent || "none"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Confidence</span>
            <span className="font-mono">{(result.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Threshold met</span>
            <span className={result.thresholdMet ? "text-[#2FBF71]" : "text-[#F5A623]"}>{result.thresholdMet ? "yes" : "no — would transfer to human"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Classifier source</span>
            <span className="font-mono text-[#8B98B8]">{result.source || "unknown"}</span>
          </div>
          {result.reply && (
            <div className="pt-2 border-t border-[#24314D] text-[#C7D0E2]">"{result.reply}"</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function ModalShell({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-sm"} rounded-lg border border-[#24314D] bg-[#0F1728] p-5`} style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-[#E7ECF6]">{title}</div>
          <button onClick={onClose} className="text-[#6B7A99] hover:text-[#E7ECF6]"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
