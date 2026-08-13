import { describe, it, expect } from "vitest";
import { buildClineHeaders, getClineAccessToken } from "open-sse/shared/clineAuth.js";

describe("buildClineHeaders — current cline-cli identity", () => {
  const h = buildClineHeaders("tok");

  it("sends the cli platform (not terminal)", () => {
    expect(h["X-Platform"]).toBe("cli");
  });

  it("mirrors cline-cli 3.0.49 / core 0.0.69 versions", () => {
    expect(h["X-CLIENT-VERSION"]).toBe("3.0.49");
    expect(h["X-Platform-Version"]).toBe("3.0.49");
    expect(h["X-CORE-VERSION"]).toBe("0.0.69");
  });

  it("uses the ai-sdk compound User-Agent", () => {
    expect(h["User-Agent"]).toContain("Cline/3.0.49");
    expect(h["User-Agent"]).toContain("ai-sdk/openai-compatible");
  });

  it("prefixes the bearer token with workos: exactly once", () => {
    expect(buildClineHeaders("raw").Authorization).toBe("Bearer workos:raw");
    expect(buildClineHeaders("workos:raw").Authorization).toBe("Bearer workos:raw");
    expect(getClineAccessToken("raw")).toBe("workos:raw");
  });

  it("lets extraHeaders override defaults", () => {
    expect(buildClineHeaders("t", { Accept: "application/json" }).Accept).toBe("application/json");
  });
});
