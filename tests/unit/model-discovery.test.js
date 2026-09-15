import { describe, expect, it, vi, beforeEach } from "vitest";
import { stripDiscoveryPrefix, getModelInfoCore } from "open-sse/services/model.js";

const mocks = vi.hoisted(() => ({
  getModelAliases: vi.fn(),
  getComboByName: vi.fn(),
  getProviderNodes: vi.fn(),
}));

vi.mock("@/lib/localDb", () => ({
  getModelAliases: mocks.getModelAliases,
  getComboByName: mocks.getComboByName,
  getProviderNodes: mocks.getProviderNodes,
}));

// Import after vi.mock so the localDb dependency is stubbed
import { getModelInfo, getComboModels } from "@/sse/services/model.js";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getModelAliases.mockResolvedValue({});
  mocks.getComboByName.mockResolvedValue(null);
  mocks.getProviderNodes.mockResolvedValue([]);
});

describe("claude-- discovery prefix stripping", () => {
  it("strips claude-- prefix before parsing", async () => {
    const info = await getModelInfo("claude--deepseek/deepseek-v4-flash");
    expect(info.provider).toBe("deepseek");
    expect(info.model).toBe("deepseek-v4-flash");
  });

  it("leaves plain provider/model untouched", async () => {
    const info = await getModelInfo("deepseek/deepseek-v4-flash");
    expect(info.provider).toBe("deepseek");
    expect(info.model).toBe("deepseek-v4-flash");
  });

  it("stripDiscoveryPrefix handles non-string and no-prefix", () => {
    expect(stripDiscoveryPrefix("claude--kimi/kimi-k3")).toBe("kimi/kimi-k3");
    expect(stripDiscoveryPrefix("kimi/kimi-k3")).toBe("kimi/kimi-k3");
    expect(stripDiscoveryPrefix(undefined)).toBe(undefined);
  });

  it("resolves a claude-- prefixed alias via getModelInfoCore", async () => {
    mocks.getModelAliases.mockResolvedValue({ "my-combo": "deepseek/deepseek-v4-flash" });
    const info = await getModelInfo("claude--my-combo");
    expect(info.provider).toBe("deepseek");
    expect(info.model).toBe("deepseek-v4-flash");
  });

  it("detects a claude-- prefixed combo as combo", async () => {
    const combo = { id: "c1", name: "my-combo", models: ["deepseek/deepseek-v4-flash"] };
    mocks.getComboByName.mockImplementation(async (name) => (name === "my-combo" ? combo : null));
    const info = await getModelInfo("claude--my-combo");
    expect(info.provider).toBe(null);
    expect(info.model).toBe("my-combo");
  });

  it("leaves plain alias untouched", async () => {
    mocks.getModelAliases.mockResolvedValue({ "my-combo": "deepseek/deepseek-v4-flash" });
    const info = await getModelInfo("my-combo");
    expect(info.provider).toBe("deepseek");
    expect(info.model).toBe("deepseek-v4-flash");
  });

  it("getModelInfoCore strips prefix when aliases are provided inline", async () => {
    const info = await getModelInfoCore("claude--my-combo", { "my-combo": "kimi/kimi-k3" });
    expect(info.provider).toBe("kimi");
    expect(info.model).toBe("kimi-k3");
  });

  it("getComboModels finds combo by stripped name", async () => {
    const combo = { id: "c1", name: "my-combo", models: ["deepseek/deepseek-v4-flash"] };
    mocks.getComboByName.mockImplementation(async (name) => (name === "my-combo" ? combo : null));
    const result = await getComboModels("claude--my-combo");
    expect(result).toEqual(["deepseek/deepseek-v4-flash"]);
  });
});
