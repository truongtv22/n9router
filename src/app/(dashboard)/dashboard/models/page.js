"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, Button } from "@/shared/components";

const PUBLISH = async (body) => {
  const res = await fetch("/api/models/exposure", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update exposure");
  return res.json();
};

function groupModels(providers) {
  return providers || [];
}

export default function ModelsPage() {
  const [exposure, setExposure] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeProvider, setActiveProvider] = useState("all");
  const [expanded, setExpanded] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [expRes, listRes] = await Promise.all([
          fetch("/api/models/exposure").then((r) => r.json()),
          fetch("/api/models/exposure/list").then((r) => r.json()),
        ]);
        setExposure(expRes.error ? { enabled: true, mode: "all", whitelist: [], favorites: [] } : expRes);
        // listRes = { exposure, providers }
        setProviders(groupModels(listRes.providers));
      } catch (e) {
        setMessage({ type: "error", text: "Failed to load models: " + e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const whitelistSet = useMemo(() => new Set(exposure?.whitelist || []), [exposure]);
  const favoritesSet = useMemo(() => new Set(exposure?.favorites || []), [exposure]);

  // Chip counts: shown/total per provider (shown = whitelist when mode whitelist)
  const providerCounts = useMemo(() => {
    const map = {};
    for (const p of providers) {
      const list = p.models || [];
      const total = list.length;
      const shown = exposure?.mode === "whitelist"
        ? list.filter((m) => whitelistSet.has(m.id)).length
        : total;
      map[p.alias] = { total, shown };
    }
    return map;
  }, [providers, exposure, whitelistSet]);

  // Search filter: provider name/id + model name/id
  const filteredProviders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return providers;
    return providers
      .map((p) => ({
        ...p,
        models: (p.models || []).filter((m) =>
          (m.name || "").toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          p.alias.toLowerCase().includes(q)
        ),
      }))
      .filter((p) => p.models.length > 0);
  }, [providers, query]);

  const save = useCallback(async (body) => {
    setSaving(true);
    setMessage(null);
    try {
      const next = await PUBLISH(body);
      setExposure((prev) => ({ ...prev, ...next }));
    } catch (e) {
      setMessage({ type: "error", text: "Save failed: " + e.message });
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleEnabled = (enabled) => save({ enabled });
  const setMode = (mode) => save({ mode });

  const setWhitelist = (ids) => save({ whitelist: ids });
  const setFavorites = (ids) => save({ favorites: ids });

  const toggleModelWhitelist = (id) => {
    const next = new Set(whitelistSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setWhitelist(Array.from(next));
  };
  const toggleFavorite = (id) => {
    const next = new Set(favoritesSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(Array.from(next));
  };

  const applyToProvider = (provAlias, fn) => {
    const p = filteredProviders.find((x) => x.alias === provAlias) || providers.find((x) => x.alias === provAlias);
    if (!p) return;
    const oldArr = exposure?.mode === "whitelist" ? [...exposure.whitelist] : [];
    const next = fn(oldArr, p.models.map((m) => m.id));
    setWhitelist(Array.from(next));
  };
  const checkAll = (alias) => applyToProvider(alias, (_old, ids) => new Set([...whitelistSet, ...ids]));
  const uncheckAll = (alias) => applyToProvider(alias, (old, ids) => {
    const remove = new Set(ids);
    return old.filter((id) => !remove.has(id));
  });
  const invertAll = (alias) => applyToProvider(alias, (old, ids) => {
    const set = new Set(old);
    ids.forEach((id) => set.has(id) ? set.delete(id) : set.add(id));
    return set;
  });

  const expandAll = () => {
    const next = {};
    filteredProviders.forEach((p) => { next[p.alias] = true; });
    setExpanded(next);
  };
  const collapseAll = () => setExpanded({});
  const toggleExpand = (alias) => setExpanded((prev) => ({ ...prev, [alias]: !prev[alias] }));

  if (loading) {
    return <Card><div className="p-4 text-text-muted">Loading model exposure...</div></Card>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card padding="md">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg font-semibold text-text-main">Model Exposure</h1>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!exposure.enabled}
                  onChange={(e) => toggleEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 accent-primary cursor-pointer"
                />
                <span className="text-xs text-text-main">Enable Claude Code discovery</span>
              </label>
              <Button size="sm" variant="outline" onClick={async () => {
                const res = await fetch("/api/models/exposure/clear-cache", { method: "POST" });
                const data = await res.json();
                setMessage({ type: "success", text: data.cleared ? "Discovery cache cleared" : "No cache to clear" });
              }}>
                Clear discovery cache
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>Mode:</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="mode" checked={exposure.mode === "all"} onChange={() => setMode("all")} className="accent-primary" />
              All models
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="mode" checked={exposure.mode === "whitelist"} onChange={() => setMode("whitelist")} className="accent-primary" />
              Whitelist only
            </label>
          </div>

          {message && (
            <div className={`text-xs px-2 py-1.5 rounded ${message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
              {message.text}
            </div>
          )}
        </div>
      </Card>

      {/* Filter + quick access */}
      <Card padding="md">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search provider/name/id..."
              className="w-64 px-2 py-1.5 bg-surface rounded border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveProvider("all")}
                className={`px-2 py-1 rounded text-xs border ${activeProvider === "all" ? "bg-primary/20 border-primary text-text-main" : "bg-surface border-border text-text-muted hover:border-primary"}`}
              >
                All providers
              </button>
              {filteredProviders.map((p) => {
                const c = providerCounts[p.alias] || { shown: 0, total: 0 };
                return (
                  <button
                    key={p.alias}
                    onClick={() => setActiveProvider(p.alias)}
                    className={`px-2 py-1 rounded text-xs border ${activeProvider === p.alias ? "bg-primary/20 border-primary text-text-main" : "bg-surface border-border text-text-muted hover:border-primary"}`}
                  >
                    {p.alias} <span className="opacity-60">({c.shown}/{c.total})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={expandAll}>Expand all</Button>
            <Button size="sm" variant="ghost" onClick={collapseAll}>Collapse all</Button>
          </div>
        </div>
      </Card>

      {/* Provider groups */}
      <div className="flex flex-col gap-3">
        {filteredProviders
          .filter((p) => activeProvider === "all" || p.alias === activeProvider)
          .map((p) => (
            <Card key={p.alias} padding="sm">
              <div className="flex items-center justify-between gap-2 cursor-pointer select-none" onClick={() => toggleExpand(p.alias)}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`material-symbols-outlined text-text-muted text-[18px] transition-transform ${expanded[p.alias] ? "rotate-90" : ""}`}>chevron_right</span>
                  <span className="font-medium text-sm text-text-main truncate">{p.alias}</span>
                  <span className="text-xs text-text-muted shrink-0">({providerCounts[p.alias]?.shown ?? 0}/{p.models.length})</span>
                </div>
                {/* Tool buttons moved to expanded area below */}
              </div>

              {expanded[p.alias] && (
                <div className="mt-2 border-t border-border pt-2 flex flex-col">
                  {/* Inline batch controls: icon-based */}
                  <div className="flex items-center gap-1 px-1 pb-1.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => checkAll(p.alias)} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface border border-border text-text-muted hover:border-primary hover:text-text-main" title="Check all">
                      <span className="material-symbols-outlined text-[14px]">select_all</span>
                    </button>
                    <button onClick={() => uncheckAll(p.alias)} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface border border-border text-text-muted hover:border-primary hover:text-text-main" title="Uncheck all">
                      <span className="material-symbols-outlined text-[14px]">deselect</span>
                    </button>
                    <button onClick={() => invertAll(p.alias)} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface border border-border text-text-muted hover:border-primary hover:text-text-main" title="Invert">
                      <span className="material-symbols-outlined text-[14px]">toggle_off</span>
                    </button>
                  </div>
                  {p.models.length === 0 ? (
                    <div className="text-xs text-text-muted px-1 py-2">No models match filter</div>
                  ) : (
                    p.models.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 px-1 py-1.5 hover:bg-bg rounded">
                        <input
                          type="checkbox"
                          disabled={exposure.mode !== "whitelist"}
                          checked={whitelistSet.has(m.id)}
                          onChange={() => toggleModelWhitelist(m.id)}
                          className="w-3.5 h-3.5 accent-primary"
                        />
                        <button
                          onClick={() => toggleFavorite(m.id)}
                          title="Favorite"
                          className={`material-symbols-outlined text-[18px] ${favoritesSet.has(m.id) ? "text-amber-500" : "text-text-muted"}`}
                        >
                          {favoritesSet.has(m.id) ? "star" : "star_border"}
                        </button>
                        <span className="text-xs text-text-main truncate">{m.name || m.id}</span>
                        <span className="text-xs text-text-muted truncate ml-auto">{m.id}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        {filteredProviders.length === 0 && (
          <Card padding="md"><div className="text-sm text-text-muted">No providers/model found.</div></Card>
        )}
      </div>
      {saving && <div className="text-xs text-text-muted">Saving...</div>}
    </div>
  );
}
