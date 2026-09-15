/**
 * Tests for `9router claude` env assembly + gateway-model cache writer.
 * No real Claude CLI spawn. Cache writes go to a temp CLAUDE_CONFIG_DIR.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildClaudeEnv,
  DISCOVERY_FLAG,
  HOST_MANAGED_FLAG,
  FIRST_PARTY_FLAG,
  targetsLocalProxy,
} = require("../../cli/src/cli/commands/claudeLaunch.js");
const {
  writeGatewayModelCache,
  refreshGatewayModelCacheFromProxy,
} = require("../../cli/src/cli/commands/claudeGatewayCache.js");
const { parseLauncherArgs } = require("../../cli/src/cli/commands/claude.js");

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "9r-claude-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("buildClaudeEnv", () => {
  it("sets discovery, host-managed, token, and loopback base URL", () => {
    const env = buildClaudeEnv({ port: 20128, apiKey: "sk_test", base: {} });
    expect(env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:20128");
    expect(env[DISCOVERY_FLAG]).toBe("1");
    expect(env[HOST_MANAGED_FLAG]).toBe("1");
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe("sk_test");
    expect(env[FIRST_PARTY_FLAG]).toBeUndefined();
  });

  it("uses the probed host when 127.0.0.1 is unreachable", () => {
    const env = buildClaudeEnv({ port: 20128, apiKey: "sk_test", host: "localhost", base: {} });
    expect(env.ANTHROPIC_BASE_URL).toBe("http://localhost:20128");
  });

  it("lets a user-exported ANTHROPIC_BASE_URL win on the same port", () => {
    const env = buildClaudeEnv({
      port: 20128,
      apiKey: "sk_test",
      base: { ANTHROPIC_BASE_URL: "http://localhost:20128/v1" },
    });
    expect(env.ANTHROPIC_BASE_URL).toBe("http://localhost:20128/v1");
    expect(env[DISCOVERY_FLAG]).toBe("1");
  });

  it("replaces a stale loopback URL on a different port", () => {
    const env = buildClaudeEnv({
      port: 20128,
      apiKey: "sk_test",
      base: { ANTHROPIC_BASE_URL: "http://127.0.0.1:10100" },
    });
    expect(env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:20128");
  });

  it("does not overwrite a user-exported auth token", () => {
    const env = buildClaudeEnv({
      port: 20128,
      apiKey: "sk_ours",
      base: { ANTHROPIC_AUTH_TOKEN: "sk_user" },
    });
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe("sk_user");
  });

  it("strips the first-party flag so discovery stays eligible", () => {
    const env = buildClaudeEnv({
      port: 20128,
      apiKey: "sk_test",
      base: { [FIRST_PARTY_FLAG]: "1" },
    });
    expect(env[FIRST_PARTY_FLAG]).toBeUndefined();
  });

  it("does not inject a token when the user set ANTHROPIC_API_KEY", () => {
    const env = buildClaudeEnv({
      port: 20128,
      apiKey: "sk_ours",
      base: { ANTHROPIC_API_KEY: "sk-ant-user" },
    });
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
    expect(env[HOST_MANAGED_FLAG]).toBeUndefined();
  });
});

describe("targetsLocalProxy", () => {
  it("accepts loopback http on the same port", () => {
    expect(targetsLocalProxy("http://127.0.0.1:20128", 20128)).toBe(true);
    expect(targetsLocalProxy("http://localhost:20128/v1", 20128)).toBe(true);
    expect(targetsLocalProxy("http://127.0.0.1:20128", 3000)).toBe(false);
    expect(targetsLocalProxy("https://example.com", 20128)).toBe(false);
  });
});

describe("writeGatewayModelCache", () => {
  it("keeps only claude/anthropic ids and writes the CLI schema", () => {
    const file = writeGatewayModelCache(
      "http://127.0.0.1:20128",
      [
        { id: "claude--kimi/kimi-k3", display_name: "Kimi K3" },
        { id: "kimi/kimi-k3" },
        { id: "anthropic/claude-sonnet-4" },
      ],
      tmpDir,
    );
    expect(file).toBe(path.join(tmpDir, "cache", "gateway-models.json"));
    const body = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(body.baseUrl).toBe("http://127.0.0.1:20128");
    expect(typeof body.fetchedAt).toBe("number");
    expect(body.models).toEqual([
      { id: "claude--kimi/kimi-k3", display_name: "Kimi K3" },
      { id: "anthropic/claude-sonnet-4" },
    ]);
  });
});

describe("refreshGatewayModelCacheFromProxy", () => {
  it("fetches /v1/models with anthropic-version and writes matching baseUrl", async () => {
    const server = await new Promise((resolve) => {
      const s = http.createServer((req, res) => {
        expect(req.headers["anthropic-version"]).toBe("2023-06-01");
        expect(req.url).toContain("/v1/models");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          object: "list",
          data: [
            { id: "claude--deepseek/deepseek-v4-flash", display_name: "DeepSeek" },
            { id: "ignored/plain" },
          ],
        }));
      });
      s.listen(0, "127.0.0.1", () => resolve(s));
    });
    const port = server.address().port;
    const file = await refreshGatewayModelCacheFromProxy({
      port,
      apiKey: "sk_test",
      baseUrl: `http://127.0.0.1:${port}`,
      configDir: tmpDir,
    });
    await new Promise((r) => server.close(r));
    const body = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(body.models.map((m) => m.id)).toEqual(["claude--deepseek/deepseek-v4-flash"]);
    expect(body.baseUrl).toBe(`http://127.0.0.1:${port}`);
  });
});

describe("parseLauncherArgs", () => {
  it("forwards claude args and strips our flags", () => {
    const opts = parseLauncherArgs(["--port", "3001", "--dry-run", "--version"]);
    expect(opts.port).toBe(3001);
    expect(opts.dryRun).toBe(true);
    expect(opts.claudeArgs).toEqual(["--version"]);
  });

  it("does not steal Claude Code -p print when the next token is not a port", () => {
    const opts = parseLauncherArgs(["-p", "hello"]);
    expect(opts.claudeArgs).toEqual(["-p", "hello"]);
  });

  it("treats -p 3001 as our port flag", () => {
    const opts = parseLauncherArgs(["-p", "3001", "chat"]);
    expect(opts.port).toBe(3001);
    expect(opts.claudeArgs).toEqual(["chat"]);
  });
});

describe("writeGatewayModelCache empty list", () => {
  it("does not overwrite cache with an empty filtered list", () => {
    const existing = path.join(tmpDir, "cache", "gateway-models.json");
    fs.mkdirSync(path.dirname(existing), { recursive: true });
    fs.writeFileSync(existing, JSON.stringify({ models: [{ id: "claude-keep" }] }));
    expect(writeGatewayModelCache("http://localhost:20128", [{ id: "kimi/kimi-k3" }], tmpDir)).toBeNull();
    expect(JSON.parse(fs.readFileSync(existing, "utf8")).models[0].id).toBe("claude-keep");
  });
});
