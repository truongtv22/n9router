// Custom per-provider headers: user-defined header overrides stored on a connection
// (providerSpecificData.customHeaders as a { name: value } map) and applied last,
// so they win over the executor's built-in headers.
//
// Value semantics:
//   - non-empty string → sets/replaces the header (case-insensitive)
//   - empty string     → deletes the header (lets users strip an unwanted default)
//
// By design, auth headers (Authorization, x-api-key) ARE overridable: a user may point
// a connection at a custom gateway that needs its own auth. This is intentional in a
// single-tenant self-hosted gateway — only transport-framing headers are protected.

// Headers users must not control — overriding these breaks request framing or routing.
const PROTECTED_HEADERS = new Set([
  "content-length",
  "host",
  "connection",
  "transfer-encoding",
]);

// Object-property names that would corrupt the prototype chain rather than set a header.
const UNSAFE_HEADER_NAMES = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Overlay a connection's custom headers onto an already-built header object.
 * Mutates and returns `headers`. No-op when no custom headers are configured.
 */
export function applyCustomHeaders(headers, credentials) {
  const custom = credentials?.providerSpecificData?.customHeaders;
  if (!custom || typeof custom !== "object" || Array.isArray(custom)) return headers;

  for (const [rawName, rawValue] of Object.entries(custom)) {
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const lower = name.toLowerCase();
    if (!name || PROTECTED_HEADERS.has(lower) || UNSAFE_HEADER_NAMES.has(lower)) continue;

    // Remove any existing header with the same case-insensitive name so the custom
    // value fully replaces it (built headers mix casings, e.g. "Authorization").
    for (const existing of Object.keys(headers)) {
      if (existing.toLowerCase() === lower) delete headers[existing];
    }

    if (rawValue == null || rawValue === "") continue; // empty → delete only
    headers[name] = String(rawValue);
  }
  return headers;
}

// Valid HTTP header name per RFC 7230 token rule.
const HEADER_NAME_RE = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

/**
 * Validate + sanitize a user-supplied custom-headers map for persistence.
 * Returns { value } with a clean { name: stringValue } object (empty value = delete
 * at runtime), or { error } describing the first invalid entry.
 */
export function normalizeCustomHeaders(input) {
  if (input == null) return { value: {} };
  if (typeof input !== "object" || Array.isArray(input)) {
    return { error: "customHeaders must be an object of header name/value pairs" };
  }

  const out = {};
  for (const [rawName, rawValue] of Object.entries(input)) {
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (!name) continue;
    if (!HEADER_NAME_RE.test(name)) return { error: `Invalid header name: "${rawName}"` };
    if (PROTECTED_HEADERS.has(name.toLowerCase())) return { error: `Header "${name}" cannot be overridden` };
    if (UNSAFE_HEADER_NAMES.has(name.toLowerCase())) return { error: `Header "${name}" is not allowed` };
    if (rawValue == null) { out[name] = ""; continue; }
    if (typeof rawValue === "object") return { error: `Header "${name}" value must be a string` };
    const value = String(rawValue);
    // Block header-injection via CR/LF in the value.
    if (/[\r\n]/.test(value)) return { error: `Header "${name}" value contains invalid characters` };
    out[name] = value;
  }
  return { value: out };
}
