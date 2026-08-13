// Cline CLI identity — cline.bot gates requests by client version, so proxied
// requests must mirror what the current cline-cli sends or the gateway returns
// 401 ("use the latest version of Cline and re-authenticate").
// Verified against cline-cli 3.0.49 (core 0.0.69). Bump when the CLI updates.
const CLINE_CLI = {
  version: "3.0.49",
  coreVersion: "0.0.69",
  userAgent: "Cline/3.0.49 ai-sdk/openai-compatible/2.0.62 ai-sdk/provider-utils/4.0.40 runtime/browser",
};

export function getClineAccessToken(token) {
  if (typeof token !== "string") return "";
  const trimmed = token.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("workos:") ? trimmed : `workos:${trimmed}`;
}

export function getClineAuthorizationHeader(token) {
  const accessToken = getClineAccessToken(token);
  return accessToken ? `Bearer ${accessToken}` : "";
}

export function buildClineHeaders(token, extraHeaders = {}) {
  const authorization = getClineAuthorizationHeader(token);
  const headers = {
    "HTTP-Referer": "https://cline.bot",
    "X-Title": "Cline",
    "User-Agent": CLINE_CLI.userAgent,
    "X-CLIENT-TYPE": "cline-cli",
    "X-CLIENT-VERSION": CLINE_CLI.version,
    "X-CORE-VERSION": CLINE_CLI.coreVersion,
    "X-IS-MULTIROOT": "false",
    "X-Platform": "cli",
    "X-Platform-Version": CLINE_CLI.version,
    ...extraHeaders,
  };

  if (authorization) {
    headers.Authorization = authorization;
  }

  return headers;
}
