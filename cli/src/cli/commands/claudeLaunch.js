/**
 * Pure env assembly for `9router claude`.
 * Mirrors ocx claude: discovery ON, never first-party base URL (that kills the picker).
 */

const DISCOVERY_FLAG = "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY";
const HOST_MANAGED_FLAG = "CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST";
const FIRST_PARTY_FLAG = "_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL";

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || "").toLowerCase().replace(/\.$/, "");
  return normalized === "localhost"
    || normalized === "127.0.0.1"
    || normalized === "::1"
    || normalized === "[::1]";
}

function targetsLocalProxy(value, port) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    const effectivePort = parsed.port === "" ? 80 : Number(parsed.port);
    return parsed.protocol === "http:"
      && isLoopbackHostname(parsed.hostname)
      && effectivePort === Number(port)
      && parsed.username === ""
      && parsed.password === "";
  } catch {
    return false;
  }
}

function defaultBaseUrl(port, host = "127.0.0.1") {
  const hostname = host === "::1" ? "[::1]" : host;
  return `http://${hostname}:${port}`;
}

/**
 * Build the spawn env. User-exported values win except a stale loopback
 * ANTHROPIC_BASE_URL pointing at a different local port.
 */
function buildClaudeEnv({ port, apiKey, host = "127.0.0.1", base = process.env } = {}) {
  const env = { ...base };
  const setDefault = (name, value) => {
    if (value === undefined || value === null || String(value).length === 0) return;
    if (env[name] !== undefined && env[name] !== "") return;
    env[name] = String(value);
  };

  setDefault("ANTHROPIC_BASE_URL", defaultBaseUrl(port, host));

  const existing = env.ANTHROPIC_BASE_URL;
  if (existing) {
    try {
      const parsed = new URL(existing);
      const effectivePort = parsed.port === "" ? 80 : Number(parsed.port);
      if (parsed.protocol === "http:" && isLoopbackHostname(parsed.hostname) && effectivePort !== Number(port)) {
        env.ANTHROPIC_BASE_URL = defaultBaseUrl(port, host);
      }
    } catch {
      // keep unparseable user values
    }
  }

  const hasUserApiKey = Boolean(env.ANTHROPIC_API_KEY?.trim());
  const local = targetsLocalProxy(env.ANTHROPIC_BASE_URL, port);
  if (local && !hasUserApiKey) {
    setDefault("ANTHROPIC_AUTH_TOKEN", apiKey || "sk_9router");
  }

  if (local) env[DISCOVERY_FLAG] = "1";

  const token = env.ANTHROPIC_AUTH_TOKEN;
  const hostOwnsAuth = local && !hasUserApiKey && typeof token === "string" && token.trim().length > 0;
  if (hostOwnsAuth) setDefault(HOST_MANAGED_FLAG, "1");

  // First-party assumption disables gateway discovery (Claude Code eligibility check).
  delete env[FIRST_PARTY_FLAG];

  return env;
}

module.exports = {
  DISCOVERY_FLAG,
  HOST_MANAGED_FLAG,
  FIRST_PARTY_FLAG,
  isLoopbackHostname,
  targetsLocalProxy,
  defaultBaseUrl,
  buildClaudeEnv,
};
