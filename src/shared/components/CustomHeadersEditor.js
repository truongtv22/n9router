"use client";

import PropTypes from "prop-types";
import Input from "@/shared/components/Input";

// Presentational editor for a provider's custom headers.
// `rows` = [{ name, value }]; the parent owns state, converts to/from the stored
// { name: value } map, and renders the Add button. Empty value = remove that
// header at request time.
export default function CustomHeadersEditor({ rows, onChange }) {
  const update = (idx, patch) =>
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRow = (idx) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <div className="bg-sidebar/50 p-4 rounded-lg border border-border">
      <p className="text-xs text-text-muted mb-3">
        Applied to standard API and OpenAI/Anthropic-compatible connections, overriding
        built-in headers. Leave a value empty to strip a default header. Native CLI
        providers (Cursor, Kiro, Vertex, Grok, Perplexity…) craft their own headers and
        may ignore these.
      </p>

      {rows.length === 0 ? (
        <p className="text-xs text-text-muted">No custom headers.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Input
                aria-label="Header name"
                value={row.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="X-Custom-Header"
                className="flex-1"
              />
              <Input
                aria-label="Header value"
                value={row.value}
                onChange={(e) => update(idx, { value: e.target.value })}
                placeholder="value"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="pt-2.5 text-text-muted hover:text-red-500"
                title="Remove header"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

CustomHeadersEditor.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.string,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};
