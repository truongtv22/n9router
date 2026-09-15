"use client";

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Card, Button } from "@/shared/components";
import CustomHeadersEditor from "@/shared/components/CustomHeadersEditor";

// Convert the stored { name: value } header map to/from editable rows.
const headerObjectToRows = (obj) =>
  obj && typeof obj === "object" && !Array.isArray(obj)
    ? Object.entries(obj).map(([name, value]) => ({ name, value: String(value ?? "") }))
    : [];

const rowsToHeaderObject = (rows) => {
  const out = {};
  for (const { name, value } of rows) {
    const key = (name || "").trim();
    if (key) out[key] = value ?? "";
  }
  return out;
};

/**
 * Provider-level custom headers editor shown on the provider detail page.
 *
 * Headers apply to EVERY connection of this provider. They are stored at provider
 * level in /api/settings under providerCustomHeaders[providerId], mirroring the
 * providerThinking / providerStrategies pattern. The parent owns the persisted
 * values (single source of truth) and passes them in as `value`; this component
 * holds a local draft and persists only on Save. `onSave` receives the merged
 * provider-level map so the parent reports success (e.g. refetch settings).
 */
export default function CustomHeadersSection({
  providerId,
  value = {},
  onSave,
}) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Load persisted headers into the draft whenever the persisted value changes
  // (initial load + after a successful external save).
  useEffect(() => {
    setRows(headerObjectToRows(value));
    setDirty(false);
    setError("");
    setSaving(false);
    setSaved(false);
  }, [value]);

  const handleSave = async () => {
    if (saving) return;
    const customHeaders = rowsToHeaderObject(rows);
    const hasContent = Object.keys(customHeaders).length > 0;
    const hasPersisted = value && Object.keys(value).length > 0;
    if (!hasContent && !hasPersisted) {
      setDirty(false);
      setSaved(false);
      setError("");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerCustomHeaders: { [providerId]: customHeaders },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to save custom headers");
        return;
      }
      setDirty(false);
      setSaved(true);
      if (onSave) onSave();
    } catch (e) {
      setError(e?.message || "Failed to save custom headers");
    } finally {
      setSaving(false);
    }
  };

  const hasAnything = rows.length > 0 || (value && Object.keys(value).length > 0);

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Custom Headers</h2>
          <p className="text-sm text-text-muted">
            Applied to every connection of this provider.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="add"
            onClick={() => { setRows((prev) => [...prev, { name: "", value: "" }]); setDirty(true); setSaved(false); }}
          >
            Add
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || (!dirty && !hasAnything)}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <CustomHeadersEditor rows={rows} onChange={(next) => { setRows(next); setDirty(true); setSaved(false); }} />

      {dirty && <p className="mt-2 text-xs text-text-muted">Unsaved changes.</p>}
      {saved && <p className="mt-2 text-xs text-text-muted">Saved.</p>}
      {error && <p className="mt-2 text-xs text-red-500 break-words">{error}</p>}
    </Card>
  );
}

CustomHeadersSection.propTypes = {
  providerId: PropTypes.string.isRequired,
  value: PropTypes.object,
  onSave: PropTypes.func,
};
