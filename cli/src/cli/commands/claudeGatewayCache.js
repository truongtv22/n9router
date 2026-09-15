/**
 * Pre-write ~/.claude/cache/gateway-models.json so /model "From gateway" is fresh.
 * Schema: { baseUrl, fetchedAt, models: [{ id, display_name? }] } mode 0600.
 * Claude Code keeps only ids matching /^(claude|anthropic)/i and baseUrl === ANTHROPIC_BASE_URL.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");

function claudeConfigDir(env = process.env) {
  const custom = env.CLAUDE_CONFIG_DIR;
  return custom && custom.length > 0 ? custom : path.join(os.homedir(), ".claude");
}

function writeGatewayModelCache(baseUrl, models, configDir = claudeConfigDir()) {
  try {
    const usable = (models || []).filter((m) => typeof m?.id === "string" && /^(claude|anthropic)/i.test(m.id));
    if (usable.length === 0) return null;
    const cacheDir = path.join(configDir, "cache");
    fs.mkdirSync(cacheDir, { recursive: true });
    const filePath = path.join(cacheDir, "gateway-models.json");
    const payload = {
      baseUrl,
      fetchedAt: Date.now(),
      models: usable.map((m) => (
        typeof m.display_name === "string" ? { id: m.id, display_name: m.display_name } : { id: m.id }
      )),
    };
    fs.writeFileSync(filePath, JSON.stringify(payload), { encoding: "utf8", mode: 0o600 });
    return filePath;
  } catch {
    return null;
  }
}

function fetchModels(port, apiKey, timeoutMs = 3000, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const headers = {
      Accept: "application/json",
      "anthropic-version": "2023-06-01",
      "user-agent": "claude-cli/9router",
    };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const req = http.request({
      hostname: host,
      port,
      path: "/v1/models?limit=1000",
      family: host === "127.0.0.1" ? 4 : undefined,
      method: "GET",
      headers,
    }, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return resolve(null);
        try {
          const body = JSON.parse(data);
          resolve(Array.isArray(body.data) ? body.data : null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

async function refreshGatewayModelCacheFromProxy({ port, apiKey, baseUrl, configDir, timeoutMs, host } = {}) {
  const rows = await fetchModels(port, apiKey, timeoutMs, host);
  if (!rows) return null;
  const models = rows
    .filter((m) => typeof m?.id === "string" && m.id.length > 0)
    .map((m) => ({
      id: m.id,
      display_name: typeof m.display_name === "string" ? m.display_name : undefined,
    }));
  return writeGatewayModelCache(baseUrl, models, configDir);
}

module.exports = {
  claudeConfigDir,
  writeGatewayModelCache,
  fetchModels,
  refreshGatewayModelCacheFromProxy,
};
