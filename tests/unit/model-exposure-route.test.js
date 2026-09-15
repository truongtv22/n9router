import { describe, expect, it } from "vitest";
import { applyWhitelist, toDiscoveryList } from "@/lib/modelExposure.js";

const SAMPLES = [
  { id: "deepseek/deepseek-v4-flash", object: "model", owned_by: "deepseek" },
  { id: "kimi/kimi-k3", object: "model", owned_by: "kimi" },
  { id: "glm/glm-5.2", object: "model", owned_by: "glm" },
  { id: "my-combo", object: "model", owned_by: "combo" },
];

describe("applyWhitelist", () => {
  it("keeps only whitelisted ids plus combos", () => {
    const out = applyWhitelist(SAMPLES, ["deepseek/deepseek-v4-flash"]);
    const ids = out.map((m) => m.id);
    expect(ids).toEqual(["deepseek/deepseek-v4-flash", "my-combo"]);
  });

  it("returns all when whitelist empty", () => {
    expect(applyWhitelist(SAMPLES, [])).toEqual(SAMPLES);
  });

  it("returns all when whitelist not array", () => {
    expect(applyWhitelist(SAMPLES, null)).toEqual(SAMPLES);
  });
});

describe("toDiscoveryList", () => {
  it("prefixes claude-- and adds display_name", () => {
    const out = toDiscoveryList(SAMPLES);
    expect(out[0]).toMatchObject({
      id: "claude--deepseek/deepseek-v4-flash",
      owned_by: "deepseek",
      display_name: expect.any(String),
    });
    expect(out[1].id).toBe("claude--kimi/kimi-k3");
  });

  it("keeps display_name when provided", () => {
    const out = toDiscoveryList([{ id: "kimi/kimi-k3", owned_by: "kimi", display_name: "Kimi K3" }]);
    expect(out[0].display_name).toBe("Kimi K3");
  });

  it("does not leak unprefixed ids (non-claude)", () => {
    const out = toDiscoveryList(SAMPLES);
    for (const m of out) {
      if (/^(claude|anthropic)/i.test(m.id)) continue;
      expect(m.id).toMatch(/^claude--/);
    }
  });

  it("keeps ids that already start with claude/anthropic unprefixed", () => {
    const out = toDiscoveryList([{ id: "claude-opus-4-6", owned_by: "combo" }]);
    expect(out[0].id).toBe("claude-opus-4-6");
  });

  it("prefixes provider-scoped claude ids so they survive the CLI start-anchor filter", () => {
    const out = toDiscoveryList([{ id: "cc/claude-sonnet-5", owned_by: "cc" }]);
    expect(out[0].id).toBe("claude--cc/claude-sonnet-5");
  });
});
