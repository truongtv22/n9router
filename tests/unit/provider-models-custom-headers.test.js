import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProviderConnectionById: vi.fn(),
  getSettings: vi.fn(),
}));

vi.mock("@/lib/localDb", () => ({
  getProviderConnectionById: mocks.getProviderConnectionById,
  getSettings: mocks.getSettings,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json(body, init = {}) {
      return new Response(JSON.stringify(body), {
        status: init.status || 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  },
}));

const originalFetch = global.fetch;
let GET;

// Note: importing the route pulls in open-sse services that patch globalThis.fetch
// at module init, so we import once up front (module is then cached and the patch
// does not re-run), and only stub fetch afterwards in beforeEach.
beforeAll(async () => {
  ({ GET } = await import("../../src/app/api/providers/[id]/models/route.js"));
});

// The /models import must hit the upstream with the same custom headers
// (provider-level + per-connection) that real chat requests use.
describe("provider [id]/models route custom headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSettings.mockResolvedValue({});
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [{ id: "gpt-4o" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("merges provider-level + per-connection custom headers into the upstream fetch", async () => {
    mocks.getProviderConnectionById.mockResolvedValue({
      id: "conn-x",
      provider: "openai-compatible-abc",
      apiKey: "sk-test",
      providerSpecificData: {
        baseUrl: "https://gw.example.com/v1",
        customHeaders: { "x-gateway-tenant": "tenant-a" },
      },
    });
    // provider-level override for the same header
    mocks.getSettings.mockResolvedValue({
      providerCustomHeaders: {
        "openai-compatible-abc": { "x-gateway-tenant": "tenant-b", "x-provider-level": "yes" },
      },
    });

    const res = await GET(new Request("http://localhost/api/providers/conn-x/models"), {
      params: Promise.resolve({ id: "conn-x" }),
    });
    expect(res.status).toBe(200);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("https://gw.example.com/v1/models");
    // per-connection wins over provider-level for the same key
    expect(opts.headers["x-gateway-tenant"]).toBe("tenant-a");
    expect(opts.headers["x-provider-level"]).toBe("yes");
    expect(opts.headers.Authorization).toBe("Bearer sk-test");
  });

  it("applies custom headers on the anthropic-compatible path", async () => {
    mocks.getProviderConnectionById.mockResolvedValue({
      id: "conn-y",
      provider: "anthropic-compatible-xyz",
      apiKey: "sk-ant-test",
      providerSpecificData: {
        baseUrl: "https://gw.example.com/api/messages",
        customHeaders: { "anthropic-beta": "custom-beta" },
      },
    });

    const res = await GET(new Request("http://localhost/api/providers/conn-y/models"), {
      params: Promise.resolve({ id: "conn-y" }),
    });
    expect(res.status).toBe(200);

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("https://gw.example.com/api/models");
    expect(opts.headers["anthropic-beta"]).toBe("custom-beta");
  });
});
