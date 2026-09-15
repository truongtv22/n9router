// Pure helpers for /v1/models model exposure + Claude Code discovery.
// Kept Next-free so unit tests can import them without the server runtime.

// Claude Code gateway discovery (CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1)
// keeps only ids containing "claude"/"anthropic", so prefix with "claude--".
export const DISCOVERY_PREFIX = "claude--";

// Whitelist mode: hide models not in the whitelist (combos kept — user-made).
export function applyWhitelist(data, whitelist) {
  if (!Array.isArray(whitelist) || whitelist.length === 0) return data;
  const set = new Set(whitelist);
  return data.filter((m) => m.owned_by === "combo" || set.has(m.id));
}

// Discovery transform — prefix "claude--" so ids survive the claude/anthropic
// filter. Only the prefixed variant is returned (one row per model in picker).
// Ids that already start with claude/anthropic (e.g. combos named claude-*) are
// kept as-is to avoid "claude--claude-*" duplicates. display_name comes from an
// optional lookup map keyed "alias/model".
export function toDiscoveryList(data, nameLookup = null) {
  return data.map((m) => {
    const needsPrefix = !/^(claude|anthropic)/i.test(m.id);
    const id = needsPrefix ? `${DISCOVERY_PREFIX}${m.id}` : m.id;
    const entry = { id, object: "model", owned_by: m.owned_by || "unknown" };
    entry.display_name = m.display_name || (nameLookup && nameLookup.get(m.id)) || m.id.split("/").pop();
    return entry;
  });
}
