import { describe, it, expect } from "vitest";
import { applyCustomHeaders, normalizeCustomHeaders } from "open-sse/utils/customHeaders.js";

describe("applyCustomHeaders", () => {
  const withCustom = (customHeaders) => ({ providerSpecificData: { customHeaders } });

  it("no-ops when no custom headers configured", () => {
    const h = { "Content-Type": "application/json" };
    expect(applyCustomHeaders(h, {})).toEqual({ "Content-Type": "application/json" });
    expect(applyCustomHeaders(h, withCustom(undefined))).toEqual({ "Content-Type": "application/json" });
  });

  it("adds new headers", () => {
    const h = {};
    applyCustomHeaders(h, withCustom({ "X-Foo": "bar" }));
    expect(h["X-Foo"]).toBe("bar");
  });

  it("overrides an existing header case-insensitively (no duplicate keys)", () => {
    const h = { Authorization: "Bearer old" };
    applyCustomHeaders(h, withCustom({ authorization: "Bearer new" }));
    expect(h.authorization).toBe("Bearer new");
    expect(h.Authorization).toBeUndefined();
  });

  it("empty value deletes an existing default header", () => {
    const h = { "anthropic-beta": "claude-code-20250219", Keep: "yes" };
    applyCustomHeaders(h, withCustom({ "anthropic-beta": "" }));
    expect(h["anthropic-beta"]).toBeUndefined();
    expect(h.Keep).toBe("yes");
  });

  it("never overrides protected framing headers", () => {
    const h = {};
    applyCustomHeaders(h, withCustom({ "content-length": "999", Host: "evil.example" }));
    expect(h["content-length"]).toBeUndefined();
    expect(h.Host).toBeUndefined();
  });

  it("ignores prototype-polluting header names", () => {
    const h = {};
    // JSON.parse yields a real own "__proto__" key (the classic pollution vector),
    // unlike an object literal where __proto__ is the prototype-setter syntax.
    const custom = JSON.parse('{"__proto__":"polluted","constructor":"x","X-Ok":"1"}');
    applyCustomHeaders(h, withCustom(custom));
    expect(Object.prototype.hasOwnProperty.call(h, "__proto__")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(h, "constructor")).toBe(false);
    expect(h["X-Ok"]).toBe("1"); // safe headers alongside still applied
    expect({}.polluted).toBeUndefined();
  });

  it("coerces non-string values to string", () => {
    const h = {};
    applyCustomHeaders(h, withCustom({ "X-Num": 42 }));
    expect(h["X-Num"]).toBe("42");
  });
});

describe("normalizeCustomHeaders", () => {
  it("returns empty object for null/undefined", () => {
    expect(normalizeCustomHeaders(null)).toEqual({ value: {} });
    expect(normalizeCustomHeaders(undefined)).toEqual({ value: {} });
  });

  it("rejects non-object input", () => {
    expect(normalizeCustomHeaders("x").error).toBeTruthy();
    expect(normalizeCustomHeaders([["a", "b"]]).error).toBeTruthy();
  });

  it("trims names and drops blank names", () => {
    expect(normalizeCustomHeaders({ "  X-A  ": "1", "": "skip" })).toEqual({ value: { "X-A": "1" } });
  });

  it("rejects invalid header names", () => {
    expect(normalizeCustomHeaders({ "Bad Name": "1" }).error).toBeTruthy();
    expect(normalizeCustomHeaders({ "colon:name": "1" }).error).toBeTruthy();
  });

  it("rejects protected header names", () => {
    expect(normalizeCustomHeaders({ "Content-Length": "1" }).error).toBeTruthy();
  });

  it("rejects prototype-polluting header names", () => {
    expect(normalizeCustomHeaders(JSON.parse('{"__proto__":"1"}')).error).toBeTruthy();
    expect(normalizeCustomHeaders({ constructor: "1" }).error).toBeTruthy();
    expect(normalizeCustomHeaders({ prototype: "1" }).error).toBeTruthy();
  });

  it("blocks CRLF header injection in values", () => {
    expect(normalizeCustomHeaders({ "X-A": "a\r\nEvil: 1" }).error).toBeTruthy();
  });

  it("keeps empty string value (delete-at-runtime marker)", () => {
    expect(normalizeCustomHeaders({ "X-A": "" })).toEqual({ value: { "X-A": "" } });
  });
});
