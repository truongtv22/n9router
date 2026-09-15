/**
 * `9router claude [claude args...]` — launch Claude Code wired to the local gateway.
 * Enables /model "From gateway" discovery (Claude Code >= 2.1.129).
 */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { buildClaudeEnv, defaultBaseUrl, targetsLocalProxy } = require("./claudeLaunch");
const { refreshGatewayModelCacheFromProxy } = require("./claudeGatewayCache");

const DEFAULT_PORT = 20128;
const CLAUDE_INSTALL_HINT = "❌ `claude` CLI not found. Install it first: npm install -g @anthropic-ai/claude-code";

const HELP = `
Usage: 9router claude [claude args...]

Launch Claude Code against the local 9router gateway and populate
the /model picker ("From gateway") via gateway model discovery.

Options (consumed by 9router, not forwarded):
  --port, -p <n>      Gateway port (default: ${DEFAULT_PORT} or $PORT)
                      -p only when the next token is digits (else forwarded)
  --dry-run           Print env + refresh cache, do not exec claude
  --                  Forward the rest to claude unchanged
  -h, --help          Show this help (only when it is the sole argument)

Examples:
  9router claude
  9router claude --version
  9router claude --dry-run
`;

function parseLauncherArgs(argv) {
  const out = { port: Number(process.env.PORT) || DEFAULT_PORT, dryRun: false, claudeArgs: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      out.claudeArgs.push(...argv.slice(i + 1));
      break;
    }
    if (a === "--port" || (a === "-p" && /^\d+$/.test(String(argv[i + 1] || "")))) {
      out.port = parseInt(argv[++i], 10) || out.port;
    } else if (a === "--dry-run") {
      out.dryRun = true;
    } else {
      out.claudeArgs.push(a);
    }
  }
  return out;
}

const PROBE_HOSTS = ["localhost", "127.0.0.1", "::1"];

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.setTimeout(400, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function resolveLiveHost(port) {
  for (const host of PROBE_HOSTS) {
    if (await isPortOpen(port, host)) return host;
  }
  return null;
}

async function waitPort(port, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await resolveLiveHost(port)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function tryStartGateway(port) {
  const cliJs = path.join(__dirname, "../../../cli.js");
  const standalone = path.join(__dirname, "../../../app/server.js");
  if (!fs.existsSync(cliJs) || !fs.existsSync(standalone)) return false;
  const child = spawn(process.execPath, [cliJs, "--no-browser", "--skip-update", "--tray", "-p", String(port)], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, PORT: String(port) },
  });
  child.unref();
  return true;
}

async function resolveApiKey(port, host = "localhost") {
  const fromEnv = process.env.NINE_ROUTER_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const api = require("../api/client");
    api.configure({ host: host === "::1" ? "localhost" : host, port });
    const result = await api.getApiKeys();
    const key = result.success && result.data?.keys?.find((k) => k?.key)?.key;
    if (key) return key;
  } catch { /* fall through */ }
  return "sk_9router";
}

function spawnClaude(args, env) {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    const child = isWin
      ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "claude", ...args], {
        stdio: "inherit",
        env,
        windowsHide: false,
      })
      : spawn("claude", args, { stdio: "inherit", env });

    child.on("error", (err) => {
      if (err.code === "ENOENT") console.error(CLAUDE_INSTALL_HINT);
      else console.error(`❌ Failed to launch claude: ${err.message}`);
      resolve(1);
    });
    child.on("exit", (code, signal) => {
      if (process.platform === "win32" && code === 9009 && !signal) {
        console.error(CLAUDE_INSTALL_HINT);
        return resolve(1);
      }
      resolve(signal ? 1 : code ?? 0);
    });
  });
}

async function run(argv) {
  if (argv.length === 1 && (argv[0] === "-h" || argv[0] === "--help")) {
    process.stdout.write(HELP);
    return 0;
  }

  const opts = parseLauncherArgs(argv);
  let host = await resolveLiveHost(opts.port);
  if (!host && tryStartGateway(opts.port)) {
    console.error(`⏳ Starting 9router on port ${opts.port}...`);
    const up = await waitPort(opts.port);
    host = up ? await resolveLiveHost(opts.port) : null;
  }
  if (!host) {
    console.error(`❌ Gateway not running on port ${opts.port}`);
    console.error("   Start it first: 9router   (or PORT=20128 npm run dev)");
    return 1;
  }

  const apiKey = await resolveApiKey(opts.port, host);
  const env = buildClaudeEnv({ port: opts.port, apiKey, host, base: process.env });
  const baseUrl = env.ANTHROPIC_BASE_URL || defaultBaseUrl(opts.port, host);

  try {
    const cachePath = targetsLocalProxy(baseUrl, opts.port)
      ? await refreshGatewayModelCacheFromProxy({
        port: opts.port,
        apiKey: env.ANTHROPIC_AUTH_TOKEN || apiKey,
        baseUrl,
        host,
      })
      : null;
    if (!cachePath) {
      console.error("⚠ Gateway model cache could not be refreshed; the model picker may be stale.");
    }
  } catch (error) {
    console.error(`⚠ Gateway model cache could not be refreshed: ${error.message}`);
  }

  if (opts.dryRun) {
    console.log(`ANTHROPIC_BASE_URL=${baseUrl}`);
    console.log(`CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=${env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY || ""}`);
    console.log(`CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=${env.CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST || ""}`);
    console.log(`ANTHROPIC_AUTH_TOKEN=${env.ANTHROPIC_AUTH_TOKEN ? "[set]" : "[unset]"}`);
    return 0;
  }

  return spawnClaude(opts.claudeArgs, env);
}

module.exports = { run, parseLauncherArgs, isPortOpen, resolveLiveHost, HELP };
