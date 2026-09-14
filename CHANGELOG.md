# Changelog

# v0.5.75 (2026-09-10)

## Features
- **Video**: add OpenRouter and Vertex AI (Veo) video generation on `/v1/videos/*` via a provider adapter layer; poll requests resolve their provider from `x-connection-id` or `?provider=`
- **Antigravity**: add weekly quota tracking (Gemini weekly / Claude & GPT weekly) and free-tier handling from `retrieveUserQuotaSummary` (#3892)
- **Codex**: add GPT Image 2.5, Flare and Sunburst image models with multi-image support; add the same ids to the OpenAI catalog
- **Qoder**: surface usage to all clients and stop inlining large attachments — images upload through `/api/v2/image/upload` like qodercli, oversized file blocks become stubs, context tier auto-escalates
- **OpenCode Go**: add newly published models (glm-5.3, kimi-k3, deepseek-flash, longcat-2.0, hy4-preview, hy3 on chat/completions; qwen3.8-max, qwen3.8-flash on `/messages`; grok-4.6, gpt-5.6-luna on Responses) and list `deepseek-v4.1-flash` first in the catalog
- **CLI tools**: group the model selector by provider with full-text search and manual custom model ID entry
- **CodeBuddy-CN**: replace `deepseek-v4-flash` with `deepseek-v4.1-flash`

## Fixes
- **Tools**: scope Claude tool type defaulting to gateways declaring `requireClaudeToolType` — the global default broke Anthropic-compatible endpoints that only accept the legacy typeless tool shape (#3905)
- **Claude**: cap re-anchored `cache_control` at the 4-marker budget so a spent budget no longer 400s and triggers a full combo failover; wrap bare single-object content turns before the mid-conversation-system fold
- **Cline / Airforce**: unwrap the `{"success":true,"data":…}` envelope on non-stream chat completions (#3644); add the live Cline/ClinePass model catalog and refresh Airforce free models
- **Cline**: stop `workos:`-prefixing ClinePass API keys (401 on every request, #2333) and add clinepass token refresh
- **Kiro**: never send a top-level `systemPrompt` (`400 REQUEST_BODY_INVALID`); route requests through current runtime surfaces (#3776)
- **Codex**: strip Unicode-property tool schema patterns the validator rejects (#3922); restore the `Version` header and single-source the CLI version
- **DeepSeek**: keep Anthropic-only tool types when forwarding to `/anthropic/v1/messages`
- **Qoder**: drop the Responses usage plumbing from shared translator/handler code, which changed token accounting for every provider, not just Qoder
- **Antigravity**: normalize contents and handle intermediate tool responses; protect the OAuth token-refresh path from Google anti-abuse rate limits (#3813)
- **Providers**: clear stale connection health state (`modelLock_*`, `backoffLevel`, `rateLimitedUntil`, `errorCode`) when a connection is re-validated (#3810, #3830); remove the duplicate `qwen` provider that shadowed `alims-intl`
- **Video / Vertex**: reject job ids and model ids that would escape the request URL path (SSRF)
- **Usage**: parse the Fable weekly limit from `limits[]` instead of fabricating a row (#3847)
- **Auth**: set a 24h `maxAge` on the dashboard session cookie

# v0.5.69 (2026-09-05)

## Features
- **Codex**: add GPT 6.0 Astra (`gpt-6-astra`) with vision, thinking and search capabilities
- **Usage**: add Claude Fable quota tracker support with weekly window normalization (`weekly fable (7d)`)
- **Dashboard**: group Antigravity Gemini and Claude quotas in Quota Tracker, prune stale hidden keys
- **OpenCode Go**: add `muse-spark-1.3-contributor` model and support parallel tool calls on Responses path (#3819)
- **Providers & Models**: align CodeBuddy-CN catalog/capabilities with server config; add GPT-5.6 Sol, Terra, Luna image aliases on Codex (#3806); refresh Qoder catalog with capability mapping and image pass-through
- **CLI tools**: replace Copilot MITM with VS Code extension setup guide
- **Gemini**: persist and replay `thoughtSignature` scoped by session namespace

## Fixes
- **Claude**: normalize adaptive auto effort (`output_config.effort`) (#3792)
- **Antigravity**: prevent Google anti-abuse rate limits during multi-account refresh (#3813)
- **Anthropic-compatible**: forward Claude beta flags to nodes fronting Anthropic (#3797)
- **Dashboard**: dynamic mode label for local/remote detection (#3801)
- **Codex**: format reset credit API errors cleanly (#3778)
- **Security**: guard cowork MCP tools probe against SSRF (#3783)
- **OpenCode Go**: track OpenCode Go quota (#3791) and send stable session headers (#3800)
- **Logger**: suppress noisy background token refresh logs
- **CLI**: export packed `.tgz` directly into workspace root instead of parent directory

# v0.5.65 (2026-09-03)

## Features
- **Fetch**: add Ollama Cloud web fetch provider
- **Gemini / Antigravity**: add Gemini 3.8 Flash support and bump IDE fingerprint to 2.11.0
- **Claude**: add Claude Fable 5.1 support (adaptive thinking with `output_config.effort`), bump Claude Code fingerprint to 2.1.258 for new-model access
- **Providers**: add client-side status filter (All / Active / Inactive / No connection) on the Providers dashboard; add max height and scroll for connection list
- **Providers & Models**: streamline tokenrouter model catalog down to 22 flagship/newest models and add missing provider icons; refresh Codebuddy-CN catalog (add hy4-preview/hy3/glm-5.3/kimi-k3-1, drop EOL glm-5.0/glm-4.7)
- **Models**: capability toggles (vision, reasoning) when adding custom models with upsert and live caps refresh
- **CLI tools**: support saving and managing custom API key presets
- **Quota**: add usage and rate-limit tracking for Groq via `x-ratelimit-*` headers
- **i18n**: complete Indonesian translation (1391 keys)

## Fixes
- **Security**: close SSRF guard bypasses in `ssrfGuard.js` (alternate IPv6 encodings, hostname trailing dots, wildcard DNS resolution check, safe redirect handling) (#3714)
- **Model markers**: strip the `[1m]` context marker Claude Code appends to model names (`claude-opus-5[1m]`) preventing model resolution failures (#3690)
- **Claude**: drop `server_tool_use` blocks carrying foreign IDs to avoid Anthropic 400 rejections; never anchor cache breakpoints on `defer_loading` tools (#3567)
- **Antigravity**: strike-break optimistic quota readings that keep 429ing by blocking the connection+model pair for 15m after 3 strikes (#3681); preserve client identity on model catalog requests (#3414)
- **Auth**: protect root `/responses` rewrite requiring API key validation in dashboardGuard
- **Chat & Docker**: return 503 Service Unavailable when all credentials are rate-limited; explicitly bundle `node-machine-id` into standalone Docker runtime image
- **OpenCode**: route Muse Spark models to `/zen/v1/responses` and declare vision support; filter inactive free model
- **Kiro**: preserve inline images as OpenAI-compatible `image_url` parts in OpenAI MITM; remove redundant top-level `systemPrompt` from payload
- **Usage**: read Responses-shape `cached_tokens` in `extractUsageFromResponse` for non-streaming traffic
- **Models**: support single model lookup with provider-prefixed IDs (e.g. `cc/claude-sonnet-5`)
- **Translator**: route Gemini thinking through `reasoning_effort` on OpenAI-compatible wire; convert `prefixItems` and ensure array items in Gemini schema sanitizer
- **UI**: apply persisted theme before first paint to prevent flash on reload; translate combo vision adapter label

# v0.5.59 (2026-08-29)

## Features
- **Search**: new web search providers — Antigravity (Google Search grounding
  on the existing OAuth account pool, citations keyed and merged by URL) and
  Xquik (X search with `x-api-key` auth, cursor pagination, credit-based
  usage), both on `POST /v1/search`. Based on #3437 by @Nautilaceae
- **Search**: ollama-search and zai-search borrow a chat provider's API key
  instead of requiring their own connection, driven by a new
  `credentialFallback` registry field. zai-search later folded into the `glm`
  provider itself so the web search page shows the shared connection
- **Models**: daily background sync of model capabilities from models.dev —
  modalities keyed by model id (majority of sources must declare one),
  context/output limits keyed by provider + model, strictly additive and
  sitting below the hand-written tables. ETag + mtime cache, 60s startup
  delay, `MODEL_CATALOG_SYNC=off` to disable
- **Models**: add GLM-5.3-Flash (1M context, natively multimodal), DeepSeek
  V4 Vision, Grok 4.5/4.6 (500k context); correct glm-4.6v/4.5v video input
  and output limits, backfill glm-4.6v on glm-cn
- **Usage**: show the Zed plan quota on the dashboard — plan, edit
  predictions, hosted model requests and billing-cycle reset; unlimited rows
  render as "N used · Unlimited"
- **Usage**: track GPT-5.3-Codex-Spark quota windows (spark_session /
  spark_weekly) from the Codex usage response (#3431)
- **Antigravity**: quota-aware routing — on 409/429 fetch live quota for the
  exact per-model resetAt and skip only the exhausted account/model pair;
  report the earliest reset when every account is blocked (#3561)
- **Antigravity**: map image `size` to the aspect-ratio model suffix (-WxH);
  add the Gemini 3.7 Flash tiers to MITM defaultModels so they show up in
  the dashboard model-mapping table
- **Dashboard**: bulk import Grok CLI accounts from JSON — paste an array or
  drag-drop multiple .json files, all OAuth connections created in a single
  call, mirroring the codex flow
- **CLI tools**: endpoint presets shared across every tool card through one
  live-resyncing store, instead of per-card localStorage copies that never
  saw each other's saved endpoints
- **Token Saver**: configurable compression timeout (`headroomTimeoutMs`) —
  the fixed 3000 ms made busy machines time out and send inconsistently
  compressed bodies, hurting prompt caching
- **i18n**: pt-BR expanded to 1132 terms

## Fixes
- **Claude Code**: add Claude Fable 5.1 and advertise Claude Code 2.1.258 in
  both the request header and billing identity; use its permanent adaptive-thinking
  mode with `output_config.effort`
- **Stream**: record usage when a client closes on the terminal event — the
  Responses API has no [DONE] sentinel, so codex closed the socket on
  `response.completed` and cancelled the reader before flush() ran its usage
  side effects; the tail now lives in a once-guarded finalizeStream(). Also
  stop logging a disconnect for every completed Responses call
- **Stream**: parse the trailing NDJSON line an Ollama stream leaves behind
  without a closing newline — the final chunk carrying `done_reason` and the
  token counts was dropped
- **Session**: read the Claude Code session id from the
  `x-claude-code-session-id` header — `metadata.user_id` is dropped by
  Responses translation, splitting one conversation across several
  `prompt_cache_key` values and missing the upstream prefix cache
- **Usage**: preserve nested `cached_tokens` — the top-level-only read
  persisted `cached_tokens: 0` for every Responses-format provider (codex,
  grok-cli, …), billing cache hits at the full input rate
- **Usage**: GLM quotas accept CREDIT_LIMIT plans and multi-interval windows
  (5h session / 7d weekly) instead of overwriting a single "session" key
- **Models**: the catalog sync no longer erases its own output — deltas were
  measured against the previous run's writes (the second run cut `providers`
  from 20 entries to 5); one vote per provider in the modality tally, ETag
  restored from file on startup, and the worker thread dropped after the
  bundler rewrote its path into a module-not-found error
- **Executor**: CommandCode returns errors as a `type:"error"` event inside
  an HTTP 200 NDJSON stream — peek the first events before committing, abort
  and return a real 4xx/5xx so combo/account fallback triggers instead of
  streaming the error text as content
- **Search**: scope failure locks on the credential-fallback path — a failing
  search locked `modelLock___all` and took the shared glm key offline for
  chat as well; locks are now attributed to the connection's owner and
  scoped to `websearch:<provider>`
- **Providers**: connection tests get a 15s AbortSignal timeout instead of
  hanging and exhausting the browser socket pool; guard undefined provider
  names on the providers page
- **Antigravity**: sanitize competing-client branding via a config-driven
  rule table (Zed's Claude-agent prompt, opencode → antigravity) — upstream
  answers 429 Quota Exhausted. Applied in the executor so the shared
  openai-to-gemini translator leaves gemini/vertex/zed untouched
- **MiniMax**: preserve images on the sourceFormat-matched OpenAI transport
  — MiniMax-M3 resolved a Claude-shaped body posted to the OpenAI endpoint,
  silently dropping `image_url` blocks (#3418)
- **Claude**: decloak tool names in same-format streaming passthrough —
  OAuth-cloaked names (CLAUDE_TOOL_SUFFIX) leaked to the client and every
  tool call was rejected as unknown
- **Tools**: default a missing `tools[].type` to "custom" on Claude-format
  requests — strict Anthropic-compatible gateways (MiniMax) reject the
  request with 400 otherwise
- **Translator**: zai thinkingFormat sends the top-level `reasoning_effort`
  object GLM-5.2+ requires — every GLM-5.x request ran at the model default
  (max); gated on GLM-5.2+ since older GLM does not read it (#2721)
- **RTK**: system prompt injection matches each target wire format
  (Chat/Responses/Claude/Gemini/Kiro) and is exact-idempotent across retries,
  so distinct prompts sharing a long prefix are no longer collapsed (#3202).
  Also set the diagnostic before the silent null return on Responses
  translation failure so the panel is no longer blank
- **OpenCode**: route muse-spark through /zen/v1/responses (it 500s on
  chat/completions), normalizing the Chat fields the Responses API rejects
  and clamping max/ultra effort to xhigh
- **CLI**: install better-sqlite3 without build tools on Node 22+ (N-API
  13.0.3 ships per-platform prebuilds, `--ignore-scripts` skips the implicit
  node-gyp build); Node < 22 stays on 12.6.2, working installs untouched
- **CLI tools**: send the API key Codex actually reads —
  `[model_providers.9router.http_headers]` instead of auth.json (which left
  every request 401 and clobbered an existing ChatGPT login); subagent model
  moved to `agents.default_subagent_model`
- **OAuth**: refresh Cline tokens with the extension JSON contract
- **Dashboard**: clamp the API key mask length — keys shorter than 8 chars
  threw RangeError and crashed the media-provider detail page
- **UI**: wait for the Material Symbols font itself before revealing icons —
  `document.fonts.ready` resolved before the 4MB woff2 even started loading,
  leaving icons blank until a second load

# v0.5.55 (2026-08-14)

## Features
- **Auth**: native SAML 2.0 SSO alongside OIDC — AuthnRequest generation, ACS
  assertion handling, SP metadata export, admin config test, replay-protected
  via a `saml_state` cookie matched against `InResponseTo`
- **Providers**: add Alibaba Token Plan (`token-plan.ap-southeast-1`) — the
  fourth Alibaba key type, Singapore-only and OpenAI-compatible transport only
- **Providers**: add `glm-5.3` to GLM Coding and GLM (China)
- **Providers**: Kimchi accepts API keys as well as OAuth (dual auth), with a
  working Test Connection for both modes
- **Antigravity**: add Gemini 3.7 Flash and its tiered high/medium/low variants
  (also in the Gemini registry) with pricing and quota tracking
- **TTS**: add Fish Audio — model id travels in an HTTP `model` header, voice
  is a `reference_id` (preset or cloned voice model)
- **OpenCode-Go**: route by request format via declared transports instead of
  forcing every client into `/messages` — Codex/OpenAI clients no longer pay a
  lossy Responses→OpenAI→Claude double translation. Per-model `supportedFormats`
  guard; the bespoke executor is gone (its shared `_lastModel` cache could cross
  auth headers between concurrent requests)
- **Usage**: dedup + cache Claude quota calls (120s TTL keyed by access token,
  in-flight promise dedup, last-good read on soft failure) to stop multiple
  tabs tripping 429; manual refresh (↻) sends `force=1` to bypass the cache

## Fixes
- **Docker**: ship `sql.js` in the image so the pure-JS DB fallback can start —
  file tracing carried the package's JS without `dist/sql-wasm.wasm`, so a
  container with no native driver aborted with ENOENT and never got a database
  (#3248)
- **Usage**: read Gemini `usageMetadata` out of the antigravity `{ response }`
  envelope — every non-streaming antigravity request logged `IN 0 | OUT 0`
  (#3260)
- **Claude**: re-anchor passthrough cache breakpoints — the client's own
  `cache_control` markers point at pre-normalization offsets, so the tail was
  re-cached every request. Last system block and last tool pinned at 1h TTL,
  last assistant turn at 5m, mid-conversation system messages folded into the
  neighbouring user turn instead of hoisted into `body.system`
- **Combos**: detect images from Hermes and attachment payloads (`images[]`,
  `experimental_attachments`, message-level `image_url`/`audio_url`, inline
  `data:` URIs) so the Vision Adapter auto-switch fires for Hermes/Ollama/
  Vercel AI SDK shapes
- **Kiro**: intercept chat via `x-amz-target` — Kiro IDE 1.0.228+ moved
  `GenerateAssistantResponse` to `POST /` + header, bypassing MITM. Also emit
  the now-mandatory initial-response frame and map the `auto` model slot
- **Kiro**: report real output tokens and stop discarding usable turns
- **Qoder**: detect billing blocks at stream start and return a synthetic 403
  so combo/account fallback triggers instead of leaking the error into chat
- **Antigravity**: strip competitive system prompts (Zed IDE's Claude-agent
  prompt) that Antigravity flags with a 429 Quota Exhausted
- **OpenCode**: send the official client fingerprint on free-tier requests so
  the Console stops classifying traffic as unidentified and rate-limiting it;
  session id resolves conversation-stable to preserve prompt caching
- **Responses**: don't close the message on an empty `tool_calls` array — some
  providers attach one to every chunk, and the truthy check ended the message
  on the first content token (#3234)
- **Translator**: preserve `prompt_cache_key` when converting chat to responses
- **Models**: expose snake_case token limits on `/v1/models`
- **Combos**: strip `stream_options` from the Fusion panel fan-out to avoid a
  DeepSeek 400 (#3024); raise the dashboard model-test probe budget to 1024 and
  soft-pass reasoning-only responses (#3010)
- **Headroom**: the toggle reflects the `headroomEnabled` setting even when the
  proxy is down — it previously showed OFF while the engine kept calling
  `/v1/compress`; proxy status stays visible via the status chip
- **Hermes**: add the `api_key` parameter to the model block in YAML config
- **Providers**: add llm7 to provider test support

## Docs
- **i18n**: add Spanish, French, and Brazilian Portuguese README translations

## Security
- **Real IP**: `x-9r-real-ip` and the Host fallback were trusted from
  client-controlled headers whenever `custom-server.js` was not in the request
  path (`npm run start`, `start:bun`), letting a remote caller pose as local to
  skip API key auth and reach `LOCAL_ONLY_PATHS` (`/api/mcp/*`,
  `/api/tunnel/enable`, `/api/auth/reset-password`). The server now stamps a
  per-process `x-9r-peer-token` on every request it sanitizes and only trusts
  `x-9r-real-ip` behind it — falling back to Host in development and failing
  closed in production (GHSA-pjm4-8fpg-f9p6). Also fixes IPv6 loopback
  detection (`::1`, `::ffff:127.0.0.1`) and routes `npm run start` /
  `start:bun` through `custom-server.js`
- **Search**: `resolveBaseUrl()` rejects client-supplied non-public baseUrls
  (SSRF guard on `/v1/search`)
- **Login**: fresh-install remote login with the default password returns 403
  without issuing a JWT
- **Usage**: `/api/usage/request-details` redacts request/response payloads

# v0.5.50 (2026-08-05)

## Features
- **Providers**: add TokenRouter (300+ models via OpenAI-compatible gateway) with
  exact per-model pricing for 110 models and `reasoning_effort` thinking config
- **Providers**: add Self-hosted STT / TTS / Embedding — point 9Router at your own
  OpenAI-compatible speech and embedding servers (whisper.cpp, faster-whisper,
  Kokoro-FastAPI, llama-server, vLLM, Infinity). Unlike the named cloud providers
  these read `baseUrl` per connection, so one provider can front several machines
- **Combos**: default-enable vision/audio capacity adapter (auto-routes to a
  vision/audio-capable model when the target lacks that capability, falling back
  to `oc/mimo-v2.5-free`), wired into chat handler routing
- **Endpoint**: auto-provision a "Default Key" for first-time users so `/v1`
  works without a manual dashboard step
- **Codex**: support GPT-5.6 Max/Ultra reasoning-level overrides (cx/ routes only)
- **Qoder**: support PAT (Personal Access Token) connections end-to-end, alongside
  OAuth device flow
- **CLI tools**: add OpenDesign (manalkaff/opendesign) support
- **Headroom**: report effective payload savings (tool schema/history bytes broken
  out, byte-savings % reflects actual outbound reduction)
- **Ollama**: Cloud quota tracker (session + weekly) + proactive background OAuth
  token refresh scheduler for all providers

## Fixes
- **Providers**: remove Qwen (OAuth flow stopped working reliably)
- **Passthrough**: detect codex-tui/Codex Desktop as native Codex client — they
  were falling through to the translator and losing fields like `reasoning.summary`
- **OAuth**: scope antigravity header fixes to loadCodeAssist/onboardUser only
- **OAuth**: keep `open` external in the build so xAI/Grok token refresh works on
  Windows
- **OAuth**: declare missing `searchParams` in register-session handler (was a
  500 instead of JSON on error)
- **DB**: `ENABLE_REQUEST_LOGS` env var now overrides the UI setting correctly;
  observability defaults to off (opt-in)
- **Translator**: preserve Codex Responses Lite tool use across chat-native
  OpenAI-compatible providers
- **Translator**: don't drop image-only user messages in `prepareClaudeRequest`
- **Translator**: drop JSON Schema keywords Gemini rejects (`uniqueItems`,
  `contains`, `multipleOf`, `unevaluatedProperties`, `unevaluatedItems`,
  `contentSchema`)
- **Claude**: remove global header cache that leaked one client's identity
  headers onto another client/account sharing the server; gate `anthropic-beta`
  by model instead
- **Antigravity**: drop retired Gemini 3.0 quota tiers, show Gemini 3.6 Flash
  usage bars
- **Cloudflare AI**: declare API key authentication (dashboard showed "No
  connections" despite an active key)
- **GitHub Copilot**: hold monthly-exhausted accounts until UTC month reset
  instead of only cooling down 120s
- **CodeBuddy**: dodge Tencent CN content filter, add usage tracking, normalize
  codebuddy-intl messages
- **Usage**: stop losing cached prompt tokens in the forced-SSE→JSON path
- **Grok CLI**: display the public subscription tier from the OAuth token claim
- **Providers**: count apikey connections for Ollama free-tier card; free-tier/
  apikey providers without `authModes` now default to apikey (were treated
  oauth-only)
- **Build**: include static/public assets in standalone output (login page hung
  on 404s when run via PM2)
- **Server**: support IntelliJ IDEA OpenAI-compatible clients over HTTP (h2c
  upgrade handling)
- **Auth**: redirect already-logged-in sessions away from `/login`
- **CLI tools**: enable Apply button for dynamic OpenAI/Anthropic-compatible
  provider connections
- **CLI**: include complete API artifacts in the CLI package
- **TTS**: a bare self-hosted model name is the MODEL, not the voice — `kokoro`
  was parsed as a voice against a default model, 404ing or synthesising with the
  wrong one
- **Embeddings**: self-hosted embeddings no longer fall back to `api.openai.com`
  when a connection has no `baseUrl` — that silently sent the input text and API
  key to OpenAI under a provider named "Self-hosted"
- **Embeddings**: an adapter that rejects a misconfigured connection now returns
  400 with the reason instead of escaping the handler uncaught
- **Embeddings**: bound the upstream fetch with `FETCH_CONNECT_TIMEOUT_MS` — an
  endpoint that drops packets never returns headers, so the request previously
  hung indefinitely

## Docs
- **i18n**: fix port typo, add RTK Token Saver feature descriptions

# v0.5.45 (2026-07-30)

## Features
- **TTS**: add Xiaomi MiMo text-to-speech (preset voices 冰糖/茉莉/苏打/白桦/Mia/Chloe/Milo/Dean, style control, language hint dropdown with Auto-detect, i18n for Style label/placeholder)
- **Providers**: add Poolside (OpenAI-compatible)
- **Providers**: add api-airforce, baidu, bazaarlink, bluesminds, kilo-gateway, llm7, morph, sambanova, tencent
- **OAuth**: zed / trae / windsurf providers + harden callback proxies
- **CLI tools**: set Claude Code max context tokens
- **Qoder**: PAT auth + refresh model list
- **Gemini**: Gemini 3.6 Flash tier routing + Gemini 3.5 Flash Lite
- **Claude**: bump default Opus to `claude-opus-5`
- **Kiro**: add Claude Opus 5 models
- **Usage**: Kimi and DeepSeek usage handlers
- **Usage**: SuperGrok weekly pool via gRPC-web

## Fixes
- **Refresh**: rotate `refresh_token` between retry attempts
- **Kiro**: canonicalize tool history and route API keys correctly
- **Kiro**: normalize dashboard thinking intensity models
- **Cursor**: stop leaking agent tool errors as text
- **Gemini**: fill empty tool schemas after `$ref` strip
- **Antigravity**: strip `stream_options` from non-stream requests
- **Jina-reader**: recover after transient errors, use JSON POST API
- **Usage**: record exact embedding tokens
- **Tunnel**: preserve successor cloudflared PID
- **Console-log**: initialize capture at server boot + prevent SSE proxy buffering
- **Dashboard**: count dual-auth, free-tier OAuth and API-key connections correctly
- **Dashboard**: flex quota rows, thin global scrollbars, no hidden-row overflow

## Docs
- **i18n**: expand pt-BR translation to 986 terms
- README: Indonesian translation

# v0.5.40 (2026-07-20)

## Features
- **i18n**: add Khmer (km) translations
- **CLI tools**: configure Grok Build subagent models
- **Kimi**: merge OAuth into dual-auth provider, add K3 / K2.7 models
- **Dashboard**: ProviderTopology flow animation

## Fixes
- **DB**: resolve better-sqlite3 parameter binding crash
- **Translator**: pass `service_tier` through OpenAI → Responses conversion
- **Kiro**: map GPT-5.6 reasoning effort fields
- **Kiro**: validate terminal streams before emitting output
- **Kiro**: map GPT reasoning effort fields
- **Codex**: current `client_version` + refresh-aware model sync
- **Alicode-intl**: split into Coding Plan + Model Studio providers
- **Cursor**: HTTP/2 AgentService support + version bump 3.12.17
- **Dashboard**: cut duplicate API/icon spam, lazy-load provider assets


# v0.5.35 (2026-07-16)

## Features
- **xAI**: Grok Imagine video generation (`/v1/videos`) + CLI
- **CLI tools**: Grok Build setup — choose separate main/general-purpose/explore/plan models and preserve each model's context window
- **GitHub Copilot**: route Claude models through Copilot's native `/v1/messages`
- **Kiro**: add GPT-5.6 model family (#2596)
- **RTK**: `X-9Router-Token-Saver` header to bypass token savers per request
- **Providers**: quota visibility settings
- **Translator**: drop temperature for all Claude models
- **i18n**: Thai (th) + Persian (fa) translations / README

## Fixes
- **Providers**: bulk-add API keys no longer overwrite existing keys (gap-fill `Key N`)
- **Anthropic**: lowercase `anthropic-version` header to prevent duplication on `/v1/messages`
- **Alicode-intl**: use DashScope compatible-mode endpoint so standard keys work
- **Grok CLI**: align Grok Build with current subscription protocol (#2590)
- **Grok CLI**: surface `expiresAt` so proactive token refresh fires (#2546)
- **Kiro**: improve direct session cache reuse
- **Models**: populate capabilities for live-catalog LLM models
- **Models**: list compatible provider models in `/v1/models`
- **Thinking**: send explicit `thinking:{type:adaptive}` alongside `output_config.effort`
- **Translator**: strip `client_metadata` when converting openai-responses → openai

## Improvements
- **Perf**: skip inactive background services on startup

## Docs
- README: Persian YouTube tutorial

# v0.5.30 (2026-07-10)

## Features
- **Perplexity**: add Agent API provider (#2492)
- **Grok CLI**: add Grok CLI / Grok Build provider with OAuth device-code flow (#2502)
- **Featherless**: add OpenAI-compatible provider presets
- **SearXNG**: configure endpoint via SEARXNG_URL env (#2499)
- **Providers**: add max thinking level for gpt-5.6-sol (#2500)
- **Headroom**: add extras detection and install UI (#2403)
- **Headroom**: activate/uninstall extras + fix interpreter detection
- **PXPipe**: PXPIPE token saver — multimodal prompt compression (#2465)
- **Proxy-Pools**: auto-rotate strategy for no-auth providers (#2409)

## Fixes
- **Cloudflare-AI**: support accountId in bulk key import (#2449)
- **DB**: backup on schema change, MCP child cleanup, codex models, usage providers OOM
- **Codex**: avoid bare-email OAuth dedup (#2477)
- **CLI**: allow staged app bundle builds (#2479)
- **Headroom**: compress Kiro conversation state (#2488)
- **Gemini-CLI**: raise output floor for thinking and add validated toolConfig (#2486)
- **GitHub**: label Copilot profiles by account identity (#2498)
- **OpenAI-to-Claude**: unwrap bare {function:{…}} tools without parent type (#2473)
- **Translator**: clamp thinking effort max->xhigh for OpenAI format (#2466)
- **RTK/find**: detect and group Windows backslash-style find output (#2448)
- **Codex**: handle fast tier and capacity SSE (#2452)
- **Volcengine-ark**: clamp Kimi max_tokens to 32768 endpoint cap
- **Antigravity**: align provider fingerprint with IDE Desktop 2.1.1 (#2389)
- **Pricing**: update Claude/Codex model rates and add new models

## Improvements
- **i18n(zh-CN)**: complete Chinese translations for all UI strings (#2436)
- **API**: caching for tunnel and version status endpoints
- **Perf**: faster dev startup and lighter bundle

# v0.5.20 (2026-07-07)

## Features
- **Thinking**: per-model thinking level picker on provider page — appends `(level)` suffix to copied model names for forced reasoning effort across all formats (openai, claude, gemini, deepseek, kimi, qwen, zai, minimax, hunyuan, step)
- **RTK**: add JS-native git-log filter (#2423)
- **Caveman**: add targeted upstream-aligned style rules (#2424)
- **i18n**: add Farsi (fa) language support (#2385)

## Fixes
- **Thinking**: strip `(level)` suffix from upstream `body.model` so providers no longer reject requests
- **Translator**: preserve developer instructions in openai-responses conversion (#2434)
- **count_tokens**: count structured Anthropic blocks (#2419)
- **Volcengine-ark**: clamp GLM-5 max_tokens to model output ceiling (#2428)
- **Kimi**: normalize reasoning_effort to backend enum (#2427)
- **Claude**: reconcile max_tokens vs thinking budget and lift per-model ceiling (#2381)
- **Kiro**: deliver system prompt natively, add Opus 4.5/4.7/4.8, tolerate dash version ids (#2366)
- **Headroom**: proxy dashboard through app (#2372)
- **MITM**: recover from stale lock file on server start

# v0.5.18 (2026-07-03)

## Features
- **Usage**: track cached tokens + correct input/output/cache cost (#2209) — hodtien
- **Codex**: show reset credit expiry details (#2290) — Rafli Ahmad Zulfikar
- **NVIDIA**: add new models and capabilities — decolua
- **ClinePass**: add provider support — sternelee

## Fixes
- **Usage**: dedupe streaming request-details log entries — Qin Li
- **Claude**: drop foreign thinking signatures in passthrough — decolua
- Prevent non-SSE stream pipe crash and cross-IdP account overwrites (#2244) — KunN-21
- **Kiro**: route IdC auth to regional CodeWhisperer surface (#2297) — Volodymyr Saakian
- **Kiro**: add Claude Sonnet 5 model support (#2264) — Edison42
- **Xiaomi-tokenplan**: region selector, key validation, multi-connection (#2251) — MiQieR
- **Translator**: strict Anthropic content block compliance (#2225) — Sahrul Ramadhan Hardiansyah
- **Kimchi**: strip reasoning_content echo to bound multi-turn input tokens — KunN-21
- **Kimchi**: bump User-Agent to kimchi/0.1.40 (#2256) — Ansh7473
- **Codebuddy-cn**: strip empty tool_calls arrays to preserve reasoning — zmf
- **Antigravity**: preserve Claude tool delta index (#2223) — Sutarto Jordan Chrisfivo
- **MITM**: generate root CA on server startup (#2228) — Sutarto Jordan Chrisfivo

# v0.5.15 (2026-06-29)

## Features
- Add Kimchi OAuth provider — Nant361
- Refine Qwen vision/video + thinking model patterns — decolua
- Opt-in Codex auto-ping quota keep-alive — Emirhan

## Fixes
- **Responses**: handle response.done terminal events (#2142) — rifuki
- **Headroom**: skip unsafe responses tool history (#2132) — Sutarto Jordan Chrisfivo
- **Translator**: map mid-conversation system message to user (claude→openai) — decolua
- **Gemini**: normalize contents to prevent 400 invalid_argument (#2192) — warelik
- **Gemini**: backfill thoughtSignature + suppress stream done sentinel — WARELIK
- **Alicode**: preserve cache_control for DashScope providers (#2069) — Rex
- **Antigravity**: strip deprecated/readOnly/writeOnly from tool schemas — iletai, Yudhistira-Official
- **CodeBuddy CN**: show bonus packs as one-time, not monthly-replenishing — whale9820
- **Kiro**: strip leaked <thinking> tags from content stream (#2158) — hamsa0x7
- **Tray**: make Windows context menu DPI-aware — Emirhan
- **Kilocode**: expose full gateway catalog in combo model picker — jellylarper
- **OpenCode**: fix Go GLM — decolua

# v0.5.12 (2026-06-26)

## Features
- Add token-saver dashboard page — decolua
- Add bulk delete for provider connections — teddytkz
- Resolve GitHub Copilot model catalog from upstream — caiqinzhou
- Add Venice AI provider — Brokenc0de
- Add Kiro external_idp import for Microsoft SSO (CLIProxyAPI) — Stevanus Pangau
- Overhaul Blackbox provider catalog + WebUI test support — suryacagur

## Fixes
- Provider thinking compatibility (DeepSeek/Gemini) — Mink Nguyen
- Stop double-counting streaming usage at source — decolua
- Usage logging dedupe to reduce stats churn — Mink Nguyen
- Prevent non-JSON SSE lines / duplicate [DONE] from breaking clients (PR #2046) — qianze
- Resolve Gemini TTS models from catalog — nguyenha935
- Support Kiro IDC (organization) token import — quanturbo
- Preserve forced streaming for JSON clients (#2031) — Joseph Yaksich
- Preserve Responses text format (Codex) — tenglong
- Support Gemini native TTS generateContent endpoint — nguyenha935
- Add missing zh-CN endpoint key label (i18n) — weimaozhen
- CodeBuddy: only send reasoning params when client requests reasoning (#2071) — Rex
- CodeBuddy CN: show one-shot bonus packs as expiring, not monthly-replenishing
- Show custom provider models in combo picker — Sapto
- Docker: add docker-compose.yml with headroom enabled by default — nitsuahlabs
- Clarify token diagnostics vs provider billing (headroom, #1998) — Sutarto Jordan Chrisfivo
- Translate openai-responses input through OpenAI for compression (#1998) — Ankit
- Kiro: report 1M context window for claude-opus-4.8 — EdisonPVE
- Avoid stale redirects after auth changes (#2100) — Emirhan
- Mark Claude Opus 4.7 (dashed id) as 1M context — Brokenc0de
- Preserve reasoning effort through Codex translations — ntdung6868
- Token-saver: full width card layout — decolua
- Antigravity: retry transient upstream failures — Sutarto Jordan Chrisfivo
- Param-support: handle strip rules without match/drop (#1960) — Joseph Yaksich
- Translator: resolve custom provider prefix in debug endpoint (#1083) — hamsa0x7

# v0.5.8 (2026-06-21)

## Features
- **Antigravity**: native image generation support (image models tagged kind:image, hiển thị trong media-providers UI)
- **CodeBuddy CN**: API key auth + credit quota tracker
- **CodeBuddy CN**: short model prefix alias "cbcn"

## Fixes
- **MiniMax-M3**: enable vision capability
- **Headroom**: support Docker sidecar proxy
- **Antigravity**: image executor fixes
- **mimo-free**: Chrome User-Agent rotation to bypass anti-abuse gate
- **cloudflare-ai**: flatten content-part arrays to string to avoid oneOf 400 (#1926)
- **Translator**: normalize tools to Anthropic-native shape for non-Anthropic providers
- **CLI**: handle Next.js 16 nested standalone output path (#1940)
- **Codex**: preserve custom tools during request normalization
- **next.config**: add new route for responses endpoint to API

# v0.5.6 (2026-06-20)

## Features
- **Ponytail**: minimalist code generation feature
- **Headroom**: proxy lifecycle management + dashboard UI (one-click start/stop, install detection, status probing, token saver, claude↔openai shape conversion)
- **CodeBuddy CN**: new OAuth provider (copilot.tencent.com) — 15-model catalog, /v2 inference, forced streaming, OpenAI-style reasoning
- **OpenCode-Go**: align models with official endpoints; route Qwen 3.7 MiniMax via /v1/messages, GLM/Kimi/DeepSeek/MiMo via /chat/completions

## Fixes
- **Anthropic-compatible validation**: use POST /v1/messages (GET /models not spec, false "invalid" for valid keys)
- **CLI tools**: tolerate JSONC configs in all 8 settings routes (opencode, openclaw, kilo, droid, cowork, copilot, claude, cline)
- **Gemini/Antigravity**: preserve 'pattern' in tool schema translation (glob/grep)
- **Combo/Fusion**: flatten Anthropic-style tool messages in panel calls (prevent 503)
- **Models**: store provider custom models by provider scope
- **Perplexity**: use /v1/models endpoint for key validation

# v0.5.4 (2026-06-18)

## Fixes
- **Kiro**: honor thinking effort budgets
- **AG/Kiro/Xiaomi**: provider fixes
- **Combo/Fusion**: flatten tool history in panel calls to prevent 503
- **LLM selector**: show custom vision models in selector and model list
- **Image**: prevent compatible nodes from shadowing provider aliases

# v0.5.2 (2026-06-17)

## Features
- **Combo Fusion strategy** — fans the prompt out to all member models in parallel, then a configurable judge model synthesizes one final answer (quorum-grace, anonymized sources, graceful degradation)
- **Per-combo strategy selector** — pick `fallback` / `round-robin` / `fusion` / `capacity` per combo (replaces the old round-robin toggle), with a judge picker for fusion
- **Capacity auto-switch** — reorders models per request so images/PDFs route to capable models first
- **Kiro headless API-key auth** (`ksk_`) + direct `claude↔kiro` route that avoids the lossy OpenAI two-hop pivot
- **Claude auto-ping** — warms the 5h quota window right after reset so a fresh window starts immediately (per-connection toggle)

## Fixes
- **Claude 429**: stop hammering the OAuth usage endpoint — cache resetAt, throttle quota refresh to 3 min, cool down after a 429 (chat unaffected)
- **Usage logs always empty**: missing `await` on `getAdapter()` in `getRecentLogs` made `/api/usage/logs` & `/api/usage/request-logs` return nothing
- **Executors**: strip params unsupported by the provider/model (drops deprecated `temperature` for claude-opus-4 → Anthropic 400)
- **Translator**: derive deterministic tool_call ids for gemini/antigravity → OpenAI so function call/response pair correctly (fixes tool-pairing 400s)
- **Antigravity**: strip `optional` from tool schemas before sending to Gemini
- **Claude-to-OpenAI**: handle OpenAI-format responses in the non-streaming path (e.g. xiaomi-tokenplan)
- **Usage views**: show edited connection names consistently across Providers & Quota Tracker
- **Security**: hardened reverse-proxy local-access trust
- **Security**: SSRF hardening on web fetch

## Internal
- Large **open-sse / translator refactor** (~40 commits): unified provider/model registry (LiteLLM-style `models[]` + `kind` field, 100 co-located registry files), single-sourced media/OAuth/refresh/token URLs, registry-based dispatch for usage & token-refresh, DRY translator concerns (buildUsage, encodeDataUri, finishReasonMap, chunkBuilder, reasoningDelta…), ESM-safe registry init, large-file splits, dead-code removal, and golden/no-regression test gates

# v0.4.80 (2026-06-13)

## Features
- Vercel AI Gateway: support embeddings, images and credit usage (#1183)
- Add MiMo Free no-auth provider (#1789)
- Vertex: support ADC `authorized_user` credential
- Cowork: re-enable Claude Cowork with preset-only stdio MCP
- Codex: bulk add accounts via JSON (#1719)
- Kiro: enable multi-endpoint failover for GenerateAssistantResponse (#1722)

## Fixes
- Security: re-auth on DB export/import + SSRF guard on web fetch
- Auth: real client IP rate-limiting + remote default-password guard
- Cerebras/Mistral: strip unsupported `client_metadata` from downstream requests (#1742)
- SiliconFlow: update baseUrl `.cn` -> `.com` + curate verified model list (#1760)
- Gemini-to-OpenAI: route unsigned thought parts to `reasoning_content` (#1752)
- Claude-to-OpenAI: strip Anthropic billing header from system prompt (#1765)
- Anthropic-compatible: send Bearer auth for third-party gateways (#1795)
- Usage-stats: avoid partial stats on initial SSE race (#1767)
- Proxy: use `export default` in proxy.js for Next.js 16 middleware detection
- Claude passthrough: add body normalization
- GitHub Copilot: refresh missing/expired token on models discovery (#1727) + add mappable gpt-5-mini/gpt-5.4-nano slots for Copilot MITM (#1653)
- Kiro: auto-resolve profileArn to prevent 403 on IDC login, enhance profile ARN resolution, update endpoint to `runtime.us-east-1.kiro.dev` (#1713)
- Tunnel: detect system-installed Tailscale via dual-socket probe (#1723) + non-blocking probes to prevent UI freeze
- CommandCode: force `stream=true` in transformRequest (#1706)
- Qoder: increase timeouts for reasoning models and improve stream handling
- Dashboard: show provider node name instead of connection name in topology (#1770) + show explicit `kind="llm"` combos on combos page (#1684)

## Docs
- README: add Indonesian 9Router tutorial video (#1709)

# v0.4.71 (2026-06-06)

## Features
- Caveman: add wenyan classical Chinese levels and sync upstream prompts; locale-based visibility on endpoint page
- i18n: endpoint exposure notice across multiple languages + Russian README
- Antigravity: add gemini-3.5-flash-extra-low (Low) model
- xiaomi-tokenplan: add Claude-native MiMo V2.5 Pro alias via dedicated executor
- Qoder: fetch latest model + dashboard import-model button (#1642)
- MiniMax: add MiniMax-M3 + update Quota Tracker coding/CN (#1631)

## Fixes
- Codex: harden streaming timeouts (stall/connect raised to 60s, configurable per-provider), accept `response.done` event, and always emit a terminal `response.failed` + `[DONE]` for Responses passthrough when a stream closes, stalls, or aborts before a terminal event — prevents codex clients from hanging (#1648, #1680, #1688, #1618)
- Codex: durable OAuth refresh lifecycle (#1664)
- Tunnel: skip virtual interfaces to prevent false netchange watchdog
- Claude: fix forced tool_choice 400 on cc/ OAuth route (#1592)
- Proxy: raise Next client body limit to 128MB via `NINEROUTER_PROXY_CLIENT_MAX_BODY_SIZE` (#1529, #1572)
- MiniMax: echo `reasoning_content` on follow-up turns to avoid 400 (#1543)
- Kiro: handle 400 on tool-bearing history without client tools; add mappable "auto" model slot; fix binary EventStream crash + add models & TTS tool filtering
- Antigravity: passthrough tab-autocomplete + mark default agent slot mandatory
- Qoder: allow `qmodel_latest` model key (#1638)
- Providers: restore one-connection guard for compatible/embedding nodes
- Model-test: route image/STT probes to their real endpoints, harden STT ping; add opencode-go + xiaomi-tokenplan to connection test (#1576, #1628)

## Improvements
- Dashboard: reorganize menu actions across sidebar/header/profile
- Translator: add data-driven coverage, bug-exposing cases, and real provider smoke tests

# v0.4.66 (2026-05-29)

## Features
- Add Qoder provider: device-flow OAuth, COSY signing, WAF-bypass body encoding, live model catalog, dashboard quota tracker, 11 models (#1372)
- Add new models: Claude Opus 4.8 (Claude Code), GPT 5.4 Mini (Codex)

## Fixes
- DeepSeek thinking mode: echo `reasoning_content` back on follow-up/tool-call turns so OpenCode-free and custom providers no longer 400 with "reasoning_content must be passed back" (#1543)
- Reasoning injector: match deepseek/kimi model ids case-insensitively (covers custom providers using capitalized model names)
- OpenCode suggested-models: include free models without the `-free` suffix, e.g. `big-pickle` (#1535)

## Improvements
- Codex: trim sunset models, keep gpt-5.5 / gpt-5.4 / gpt-5.3-codex family, add gpt-5.4-mini
- volcengine-ark: refresh model list (add DeepSeek-V4-Flash/Pro, drop EOL entries)
- Lower stream stall timeout 35s → 30s for faster hang detection

# v0.4.63 (2026-05-26)

## Fixes
- GitHub Copilot: never route Gemini/Claude models to the `/responses` endpoint; prevents misleading "does not support Responses API" 400s (#1062)
- proxyFetch: restore missing `Readable` import causing runtime `ReferenceError` in DNS-bypass fetch path

## Improvements
- Lower stream stall timeout from 60s → 35s for faster hang detection

# v0.4.62 (2026-05-26)

## Fixes
- Codex: auto-retry when upstream drops mid-stream (no more hangs)
- Codex: fix random 400/404 errors, tool-calling failures, and unstable prompt cache
- MITM: support Antigravity 2.x 
- Sanitize Read tool args to prevent retry loops from non-Anthropic models (#1144)
- Implement json_schema fallback for OpenAI-compatible providers without native Structured Output (#1343)
- Strip empty Read pages argument in OpenAI-to-Claude translator (#1354)
- Forward Gemini output dimensions for embeddings (#1366)
- Resolve setState-in-effect errors in dashboard components (#1362)
- Gemini CLI: reuse stored OAuth project IDs for quota checks and show clearer setup guidance when the project is missing (#1271, #1428)

## Features
- Add Cloudflare Workers proxy deployer and pool integration (#1360)
- Add Deno Deploy relays support and improved proxy pools dashboard layout (#1437)

## Improvements
- Refactor Tunnel into dedicated Cloudflare and Tailscale manager modules
- Refactor tokenRefresh service with in-flight dedup to prevent refresh_token_reused errors

# v0.4.59 (2026-05-21)

## Fixes
- OAuth: fix login flow on Windows

# v0.4.58 (2026-05-21)

## Features
- xAI Grok provider (OAuth, API key, image)
- Provider limits: paginated accounts with page size controls

## Fixes
- Tailscale: fix connection status on Windows (#1300)
- Tunnel: fix false "checking" when tunnel URL is reachable
- Stream: fix pipe errors on client disconnect/abort

# v0.4.55 (2026-05-18)

## Features
- Xiaomi MiMo Token Plan: region selector (Singapore / China / Europe) — keys are cluster-specific
- Antigravity: risk confirmation dialog before first connection
- Gemini CLI: surface upstream retry delay on 429 errors

## Fixes
- MITM: cannot kill process on macOS under sudo (lsof not found in PATH)
- Stream: false-positive stall timeout on Claude reasoning / Kiro responses
- Tunnel: cannot re-enable after disable (stuck state)
- Tunnel: cloudflared error messages now include log tail for easier debugging
- Language switcher: applies selected locale immediately on close (#1234)
- Antigravity OAuth: metadata now matches the official client

## Improvements
- Gemini CLI: bump engine to 0.34.0
- Re-hide `qwen` (OAuth EOL) and `iflow` (not ready) providers

# v0.4.52 (2026-05-17)

## Features
- Add Vercel AI Gateway provider support (#1183)
- rtk: Kiro format tool result compression — handle conversationState.history & currentMessage, preserve error results, ~13.6% savings (#1194)

## Fixes
- openclaw: normalize agent.model object form `{primary, fallbacks}` before .startsWith → fix TypeError & 'not configured' status (#1216)
- Usage Details pagination: stay inside mobile viewport <640px (#1218)
- Fix test model error
- Fix MIMO provider in Codex
- Disable log file creation when using MITM AG

## v0.4.59 (2026-09-11)

### Features & Improvements
- **Custom Models Capability Persistence**: Fixed `addCustomModel()` in `src/lib/localDb.js` to persist capability flags (`caps`) in DB and allow updating existing custom models, ensuring manual toggles (like Vision and Reasoning) are preserved.
- **DeepSeek V4.1 Vision Support**: Added native pattern matching for `deepseek-v4.1` with multimodal vision and reasoning capabilities in `open-sse/providers/capabilities.js`.
- **Dynamic Model Catalog Sync Across Webpack Bundles**: Stored `catalogSource` on `globalThis.__9r_catalogSource` so that Next.js API route handlers (`/api/models`, `/v1/models`) share the dynamically synced `models.dev` catalog with `instrumentation.js`.
- **AgentKit Integration**: Added AgentKit promo component to sidebar and updated documentation.

## v0.4.58 (2026-09-05)

### Upstream merge
- **9router v0.5.65**: Merged latest upstream capabilities, model catalog refresh, and protocol improvements.
- **Web Search & Fetch**: Added Ollama Cloud remote web fetch (`/v1/fetch`), Google Search grounded via Antigravity OAuth (`/v1/search`), native Xquik X/Twitter search provider with cursor pagination, and credential fallback for Ollama/ZAI/GLM search.
- **Dynamic Model Catalog**: Integrated daily background sync of model capabilities, modalities, and context limits from `models.dev` (with ETag/mtime caching and `MODEL_CATALOG_SYNC=off` toggle). Added custom model capability switches for vision/reasoning with live refresh. Converted `/v1/models/[kind]` to catch-all `/v1/models/[...model]` for single-model inspection with provider-prefixed IDs.
- **Catalog Refreshes**: Added Claude Fable 5.1 with adaptive thinking (`output_config.effort`) and updated Claude Code fingerprint (2.1.258); GLM-5.3 & GLM-5.3-Flash with 1M context, vision/multimodal, and reasoning effort; DeepSeek V4 Vision and Grok 4.5/4.6 (500k context); CodeBuddy-CN preview models; streamlined TokenRouter seed models; added provider icons for alims-intl, alitp-intl, fish-audio, selfhosted-*, and xquik.
- **Antigravity Quota Routing**: Added 429 strike-breaker circuit breaker (blocks connection/model in RAM for 15m after 3 strikes within 60s, clears on success); reset-aware fallback returning earliest upstream `resetAt` when exhausted; automatic `-WxH` aspect-ratio suffix mapping for image models; and competitive branding prompt sanitization (stripping Zed Claude prompt and rewriting OpenCode references). Bumped default Antigravity IDE version to 2.11.0 with dual-signature override support.
- **CLI Tools & Dashboard**: Added Bulk Grok CLI account batch import modal; centralized unified CLI endpoint and API key presets across all tool cards; provider status filter (`All`, `Active`, `Inactive`, `No connection`); connection list scrollable UX; and flash-of-unstyled-theme fix on first paint.
- **Quota Tracking & Observability**: Added Groq rate-limit headers tracking (`x-ratelimit-*`), Zed plan quotas (edit predictions, hosted requests, billing cycle reset), GPT-5.3-Codex-Spark quota windows (`spark_session` and `spark_weekly`), GLM multi-interval quotas (`CREDIT_LIMIT` and 5h/7d intervals), and captured `cached_tokens` on non-streaming OpenAI Responses/Codex requests.
- **Security & Protocols**: SSRF guard hardening against alternate IPv6 encodings, trailing dots, and DNS rebinding; protected `/responses` in dashboard guard; stripped Claude Code `[1m]` context markers; dropped foreign `server_tool_use` IDs; prevented caching on `defer_loading` tools; tool name decloaking in same-format streaming; CommandCode in-stream error frame translation; Kiro MITM AWS EventStream binary and inline image forwarding; and consolidated stream disconnect handling.

### n9router preservation
- **State DB**: Preserved lowdb (`db.json`) storage with atomic writes and corruption recovery, rejecting upstream SQLite migration.
- **Runtime**: Retained native `node:sqlite` for usage limiting and CLI hooks, rejecting `better-sqlite3` and `sql.js`.
- **Fork capabilities**: Preserved Antigravity Token Swap with 503 backoff retries, account health monitor (`healthStore.js`), Gemini 3.8 Flash tiered models (`gemini-3.8-flash-high|medium|low`), stream watchdog, Cursor BYOK catalog, ApiKeyUsageReport, UsageFlexReport, and EndpointPresetControl.

## v0.4.57 (2026-09-04)

### Improvements
- **SQLite Engine (`node:sqlite`)**: Replaced third-party `better-sqlite3` native C++ dependency with Node.js built-in `node:sqlite` (`DatabaseSync`). Eliminates `node-gyp` compilation requirements, C++ build tools (`python3`, `make`, `g++`, `linux-headers`) in Docker, and over 400 lines of brittle prebuild-install and runtime self-healing hooks.
- **Cursor Auto-Import**: Migrated local Cursor SQLite database (`state.vscdb`) token extraction to `node:sqlite` in read-only mode (`{ readOnly: true }`).
- **Dependencies & Build**: Removed `better-sqlite3` from dependencies and Next.js external packages, added Node engine requirement `>=22.13.0`, and cleaned up standalone build and publish scripts.

## v0.4.56 (2026-09-04)

### Features
- **Antigravity Gemini 3.8 Flash**: Added `gemini-3.8-flash-high|medium|low`, Gemini direct API `gemini-3.8-flash`, MITM proxy extraction/synonyms, quota tracking, and capabilities.

### Fixes
- **Antigravity MITM (Windows)**: Added platform capability flags (`isWin`, `needsSudoPassword: !isWin`) to the Antigravity MITM status endpoint to avoid triggering sudo password prompts on Windows hosts.
- **CommandCode vision (#7)**: Preserved image inputs for vision-capable CommandCode models by correcting capability detection, translating OpenAI/Claude image blocks to the upstream AI SDK format, and prefetching remote images as base64 before dispatch.

## v0.4.55 (2026-08-27)

### Improvements
- **MITM status feedback**: Improved error reporting and diagnostics on the CLI tools dashboard card (`MitmServerCard`), gracefully surfacing HTTP 401/403 auth hints and network error details when connecting to the Antigravity MITM status endpoint.

## v0.4.54 (2026-08-25)

### Upstream merge
- **9router v0.5.55**: Adopted refreshed provider catalog, authentication, translation, streaming, and CLI packaging improvements.
- **SAML 2.0 SSO**: Added native SAML 2.0 Single Sign-On integration, IdP metadata XML & certificate uploaders, SSO protocol switcher, dynamic SAML sign-in button, and SAML user badges.
- **Providers and models**: Added Alibaba Token Plan (`token-plan.ap-southeast-1`), Kimchi dual auth (OAuth + API key), Fish Audio text-to-speech provider, `glm-5.3` for GLM Coding and GLM (China) registries, Opencode-Go transport format routing with per-model guards, and `llm7` test support.
- **Routing and translation**: Added Kiro multi-surface auth-aware endpoint routing, integrity-gate streaming, header-based interception (`x-amz-target`), `auto` model slot, and accurate output token accounting. Added early billing error detection in Qoder SSE for failover. Fixed OpenAI Responses empty `tool_calls` array premature termination (#3234) and preserved `prompt_cache_key` when converting chat to responses (#3216).
- **Quota and client handling**: Strip competitive system prompts in Antigravity to prevent 429 quota errors from Zed IDE. Forward official client headers for free-tier Opencode requests. Added 120s TTL caching and promise dedup for Claude quota calls with `?force=1` bypass for manual refresh. Re-anchored Claude passthrough cache breakpoints with 1h TTL.
- **Combos and adapters**: Vision adapter image detection from Hermes and attachment payloads; stripped `stream_options` from Fusion panel fan-out; added `api_key` parameter in Hermes YAML config.
- **Documentation and i18n**: Added Spanish (`README.es.md`), French (`README.fr.md`), and Brazilian Portuguese (`README.pt-BR.md`) documentation translations.

### Security
- **Socket peer validation**: Require proof that `x-9r-real-ip` originates from trusted local socket connections (GHSA-pjm4-8fpg-f9p6).
- **SSRF guard**: Validate and reject non-public base URLs on web/search endpoints.
- **Authentication**: Block fresh-install remote login using default password (returns 403 without issuing JWT).
- **Privacy**: Redacted sensitive payload contents on `/api/usage/request-details`.

### n9router preservation
- **State DB**: Retained lowdb (`db.json`) as the sole state persistence layer, rejecting upstream SQLite migration.
- **Fork capabilities**: Preserved MITM token pool swapping, retry classification, token cooldowns, stream watchdog controls, API-key limits, token-swap usage observer, Antigravity account-type badges, cached-token tracking, ApiKeyUsageReport, UsageFlexReport, Cursor BYOK installer, and fork branding.

## v0.4.53 (2026-08-15)

### Features
- **Antigravity Gemini 3.7 Flash**: Added `ag/gemini-3.7-flash-high|medium|low`, Gemini API `gemini-3.7-flash`, MITM aliases/slots, pricing, and capabilities.

### Fixes
- **Quota Tracker**: Antigravity now fingerprints as IDE **2.5.5**, the first client version whose `fetchAvailableModels` response includes Gemini 3.7 Flash quotas.
- **Quota parsing**: Keep the live `gemini-3.7-flash-tiered` bucket as a fallback when Google has not split high/medium/low keys.

## v0.4.52 (2026-08-08)

### Fixes
- **Cursor BYOK**: Restored the dashboard installer card and updated the installer to resolve the latest upstream `main` commit before downloading its immutable source tarball.
- **macOS Cursor BYOK**: Avoid unnecessary sudo when Cursor’s atomic-write targets are user-writable, preventing the `EPERM` install failure.

## v0.4.51 (2026-08-07)

### Upstream merge
- **9router v0.5.50**: Adopted refreshed provider, quota, pricing, OAuth, usage, dashboard, media-provider, and CLI packaging improvements.
- **Routing and translation**: Added Kiro direct Claude routing, conversation/session continuity improvements, native reasoning mapping, custom-tool Responses handling, cache-inclusive token accounting, and stronger terminal-stream handling.
- **Providers**: Added or expanded Devin CLI, Trae, Windsurf, Zed, CodeBuddy International, TokenRouter, and self-hosted embedding/STT/TTS support.

### Fixes
- **Vision Adapter**: Removing the last model now actually clears the pool and disables that adapter; enabling it again explicitly restores its default fallback model.
- **Antigravity project IDs**: Stopped proactive OAuth-refresh onboarding retries. Existing project IDs remain intact; lookup still occurs only for an explicit import/onboarding flow or a request-time cold miss.
- **Merge compatibility**: Restored Kiro session/continuation helpers and the Kiro thinking-field guard; updated background token refresh and usage-provider lookup to use n9router's lowdb persistence.

### n9router preservation
- Retained lowdb (`db.json`) as the sole state store, including MITM token swapping/retry/cooldowns, stream watchdog and `[DONE]` handling, API-key limits, usage reports, Cursor BYOK, selective import, and fork branding.

### Validation
- Added capacity-adapter model-control regression coverage; the focused test suite and production build pass.

## v0.4.50 (2026-07-18)

### Features
- **XAI Grok Imagine video**: Added OpenAI-compatible `/v1/videos/*` proxy routes, account-aware generation/polling, and the `n9router xai video` CLI command.
- **Grok Build**: Added dashboard setup/status integration, live model discovery, subscription-aware billing and quota reporting, token-expiry propagation, and current protocol support.
- **Usage and providers**: Added per-provider quota visibility controls, safer bulk API-key additions, expanded `/v1/models` capability handling, Kiro GPT-5.6 slots, and Alibaba International endpoint compatibility.
- **Token saver control**: Added a per-request bypass header for token-saver features.

### n9router merge policy
- **Preserved fork behavior**: Retained lowdb/db.json persistence, Cursor BYOK, token-pool and stream-watchdog safeguards, usage reporting, and n9router branding.
- **Excluded translation updates**: Did not adopt upstream locale updates or request-format/Kiro session-replay translator changes.

### Tests
- Added upstream coverage for XAI video, Grok Build, quota visibility, bulk API-key naming, provider updates, and Grok CLI usage.

## v0.4.49 (2026-07-11)

### Features
- **New providers**: Added Grok CLI OAuth/device-code routing, Featherless presets, Perplexity Agent API, configurable SearXNG, and updated provider/model catalogs.
- **PXPipe token saver**: Added multimodal prompt compression with dashboard controls and lifecycle, status, log, and statistics APIs.
- **Headroom**: Added extras detection, installation, restart, and app-proxied dashboard support.
- **Routing and translation**: Added per-model thinking levels, stronger OpenAI Responses multi-turn conversion, structured Anthropic token counting, and RTK git-log/Windows parsing.
- **Dashboard and i18n**: Added Farsi, expanded Chinese translations, cached-token display, and provider-model UI refinements.

### Improvements
- **Reliability**: Improved Codex fast-tier/capacity handling, provider refresh and usage tracking, Antigravity IDE fingerprinting/usage headers, and request-detail handling.
- **Coverage**: Added regression tests for Grok CLI, PXPipe, token counting, thinking levels, request details, and translator edge cases.

### n9router preservation
- **Persistence**: Rejected the upstream SQLite migration; n9router continues to use lowdb at `~/.n9router/db.json`.
- **MITM and streaming**: Retained token-swap cooldown/retry behavior, watchdog controls, terminal `[DONE]` handling, and raw-source MITM runtime packaging.
- **Fork capabilities**: Retained Cursor BYOK, selective database import, usage reporting, API-key limits, MoMo donations, and n9router branding.

## v0.4.48 (2026-07-06)

### Fixes
- **MITM lock contention**: Reverted the `.mitm.lock` file introduced by the security-audit patch. A crash or kill during startup could leave a stale lock that permanently blocked both auto-start and manual Start with "MITM server is already starting (lock contention)". Startup now guards on the in-process handle and PID file, as it did before.

## v0.4.47 (2026-07-05)

### Features
- **Cursor BYOK installer**: Added a guided CLI installer for bringing your own API key to Cursor, with step-by-step process cards, step indicators, and a quick-guide reference section.
- **Cursor BYOK Windows support**: Implemented the full BYOK workflow on Windows including UAC elevation handling and restore-state management.
- **Cursor BYOK macOS hardening**: Implemented secure macOS code-signature validation for the BYOK workflow and improved restore-state management.

### Improvements
- **Dashboard navigation**: Added a MITM proxy navigation link to the dashboard sidebar for easier access to proxy settings.
- **Endpoint page**: Updated the endpoint page UI.


## v0.4.46 (2026-07-04)

### Fixes
- **ClinePass connection tests**: Added ClinePass OAuth/API-key validation support so dashboard provider tests no longer report unsupported or invalid credentials when real requests work.
- **ClinePass model tests**: Normalized successful ClinePass `data.choices` response envelopes into standard OpenAI `choices`, fixing false “Provider returned no completion choices” errors in the model test UI.

### Tests
- Added regression coverage for ClinePass provider validation and non-streaming response-envelope normalization.

## v0.4.45 (2026-07-04)

### Features
- **Provider registry**: adopted the unified `open-sse/providers/registry/*` model/capability/pricing/auth registry and moved pricing resolution to `open-sse/providers/pricing.js`.
- **New and expanded providers**: added or updated ClinePass, Kimchi, CodeBuddy CN, MiMo Free, Venice AI, Vercel AI Gateway, Blackbox, and NVIDIA provider support.
- **Media providers**: added image generation, TTS, STT, media-provider dashboard pages, and `/v1/audio/*`, `/v1/images/generations`, `/v1/search`, and `/v1/web/fetch` route support.
- **Headroom and token saver**: added Headroom lifecycle APIs/dashboard support, Docker sidecar support, token-saver dashboard, and safer Responses compression handling.
- **Ponytail**: added the minimalist code-generation RTK feature.
- **Combo routing**: added Fusion strategy, per-combo strategy selection, capacity auto-switching, and improved custom-provider model visibility.
- **Codex**: added bulk account import, reset-credit expiry details, opt-in quota auto-ping, better Responses terminal handling, custom-tool preservation, and reasoning-effort preservation.
- **Kiro**: added headless API-key auth, direct Claude↔Kiro routing, external IdP/Microsoft SSO import, IDC token import, multi-endpoint failover, Claude Sonnet 5 support, and regional IdC routing.
- **Usage and quota**: added cached-token tracking, corrected input/output/cache cost calculation, deduped streaming request-detail logs, and reduced streaming usage double-counting.
- **Security and hardening**: adopted SSRF protections, DB export/import re-auth, remote default-password guard, real client-IP rate limiting, and Kiro region validation.
- **CLI and packaging**: adopted Next.js 16 nested standalone output handling, Docker Compose support, Windows tray DPI improvements, and JSONC-tolerant CLI settings routes.

### Fixes
- Fixed n9router-compatible provider creation after the upstream registry merge by restoring the missing `AI_PROVIDERS` import in `/api/providers`.
- Kept fork Antigravity usage/tier quota behavior, configurable Kiro/Antigravity retry behavior, stream `[DONE]` sentinel behavior, and pricing import compatibility after the upstream pricing move.

## v0.4.44 (2026-07-04)

### Features

- **Selective database import**: Added granular import controls for merging or replacing supported settings and provider data.
- **Upstream v0.4.71 providers and models**: Added Xiaomi MiMo V2.5 Pro routing, Qoder latest-model discovery/import, and MiniMax-M3 model, pricing, and quota support.
- **Caveman and localization**: Added Wenyan classical-Chinese Caveman levels, locale-based visibility, translated endpoint exposure notices, and a Russian README.

### Improvements

- **Release pipeline**: Added native AMD64/ARM64 Docker builds, digest-based manifest publishing, optional npm publishing, and manual release-tag support.
- **Offline builds**: Self-hosted the Inter font to remove the Google Fonts dependency from Docker and CI builds.
- **Dashboard and test coverage**: Reorganized language/menu/profile actions and expanded translator, provider, and real-provider smoke-test coverage.

### Fixes

- **Codex reliability**: Hardened streaming timeouts and terminal events, preventing hanging clients, and improved OAuth token refresh durability.
- **Kiro and Claude compatibility**: Fixed Kiro binary EventStream handling, tool-bearing history, model/TTS filtering, and Claude OAuth `tool_choice` requests.
- **Routing and infrastructure**: Corrected image/STT model tests, MiniMax reasoning follow-ups, Antigravity autocomplete, provider connection guards, tunnel interface detection, and configurable proxy uploads up to 128 MB.

## v0.4.43 (2026-06-05)

### Fixes

- **MITM Antigravity auth refresh**: Token refresh now uses the existing internal CLI token header to call the provider test route, keeping a single refresh path while avoiding `401 Unauthorized` from dashboard auth.
- **Auth refresh retries**: Token-swap auth refresh failures now retry up to 3 times before falling back to cooldown and next-account selection.
- **Refresh diagnostics**: Refresh attempts now log token lifetime in local time and surface the underlying refresh failure details instead of giving a generic failure.

### Improvements

- **Token swap visibility**: Dashboard token pool cards now show cooldown timing next to the active badge for accounts under cooldown.

### Tests

- Added coverage for Antigravity internal refresh calls, auth refresh failure logging, and retry behavior.

## v0.4.42 (2026-06-03)

### Fixes

- **OAuth token refresh reliability**: MITM token-pool refresh now handles connections with a refresh token but no `expiresAt`, and forced auth refreshes bypass still-valid expiry timestamps.
- **Connection test refresh flow**: Provider connection tests can now request a forced refresh and report whether new tokens were applied.
- **Token Rotation account toggles**: Toggling a pool account active/inactive no longer refetches quota data for every account.

### Tests

- Added token-pool coverage for missing-expiry refreshes and forced refresh requests.

## v0.4.41 (2026-06-03)

### Improvements

- **Token-swap toggle behavior**: Token swap now follows the global `tokenSwapEnabled` setting without requiring currently active provider connections.

### Fixes

- **Manual update command**: Corrected the dashboard update instructions to restart with `n9router` instead of `9router`.

### Tests

- Updated token-pool coverage for the global token-swap toggle behavior.

## v0.4.40 (2026-06-02)

### Fixes

- **MITM token swap retries on upstream 500s**: Antigravity token-swap requests now treat HTTP 500 as retryable instead of logging the response as a success, so the pool can move on to the next account after retry exhaustion.

## v0.4.39 (2026-05-30)

### Features

- **Stream Watchdog toggle**: New `streamWatchdogEnabled` setting (default ON) to opt out of SSE stall detection. When OFF, reverts to v0.4.35 legacy streaming (no stall abort, no `[DONE]`-on-abort sentinel, no Kiro keepalive). Addresses reasoning model regressions where Kiro claude-opus-4.8-thinking pauses mid-stream during server-side reasoning and was being killed by the 30s stall watchdog. Toggle available in dashboard Profile settings.

## v0.4.38 (2026-05-30)

### Fixes

- **Streaming requests no longer hang or return truncated results**: Fixed three issues in the SSE path that caused completions (notably Kiro `claude-opus-4.8` with thinking) to never finish.
  - **Kiro stall false-trigger**: The watchdog measured Kiro's transformed output instead of raw upstream activity, so reasoning prefill looked like a stall and aborted healthy streams. Kiro's transform now emits a keepalive on raw-byte activity.
  - **Truncated streams hung clients**: On abort/stall/reset the transform's `flush()` is skipped, so terminal `data: [DONE]` was never sent. `createDisconnectAwareStream` now emits it before closing (guarded against double-emit on graceful EOF).
  - **Kiro connect hang**: `KiroExecutor.execute` skipped `FETCH_CONNECT_TIMEOUT_MS`; a connection that never returned headers hung indefinitely. It now applies the same connect timeout as `base.js`.

### Tests

- Added `tests/unit/streamHandler.test.js` covering the terminal-sentinel safety net (abort/stall/reset injection, no double-emit on EOF, passthrough).

## v0.4.37 (2026-05-30)

### Fixes

- **DATA_DIR permissions**: Entrypoint script now dynamically sets permissions for custom `DATA_DIR` paths so non-default storage locations work in Docker.
- **API key rate-limit UI**: Restored the rate-limit controls in the endpoint settings (`EndpointPageClient.js`) that were orphaned during the upstream 0.4.66 merge.

### Improvements

- **Docker workflow**: Simplified the publish workflow by removing GHCR support and updating the image tagging strategy.

## v0.4.36 (2026-05-29)

### Features

- **Support "Today" period in usage statistics**: Enhanced report query logic in `usageDb.js` to handle local today timezone bucketing and hourly granularity from midnight.
- **OIDC Dashboard Authentication**: Integrated support for OpenID Connect (OIDC) authentication flows (`/api/auth/oidc/*` endpoints) to secure/standardize dashboard access.
- **Cowork MCP Marketplace integration**: Exposes local MCP plugins bridge (`/api/mcp/*` endpoints) and marketplace modal matching upstream Cowork directory.
- **Enhanced tunnel subsystem**: Restructured the cloudflared and tailscale tunnel modules into clean subdirectories (`src/lib/tunnel/cloudflare`, `src/lib/tunnel/tailscale`).
- **Proxy Pool Deployment Tools**: Added proxy deployment support for Cloudflare Workers and Deno Deploy (`/api/proxy-pools/cloudflare-deploy`, `/api/proxy-pools/deno-deploy`).
- **One-by-One Connection Validation**: Enhanced provider key/credential validation with one-by-one verification.
- **Provider OAuth Service**: Added authentication/token refresh services for xAI and Codex.

### Improvements

- **Merge upstream 9router v0.4.66**: Adopted CLI tool card refactoring (`ApiKeySelect`/`BaseUrlSelect`), provider searching, bulk key pasting, and new provider/model metadata, while rejecting the SQLite state database migration (keeping the fork's local lowdb `db.json` structure).
- **Provider Connection sorting**: Default connection listing to sort by provider name, then sub-sort by name/email.
- **Unit test coverage expansion**: Added robust testing for reasoning injectors, minimax TTS/usage, qoder encoding, OIDC auth, and today's usage statistics.

## v0.4.35 (2026-05-28)

### Features

- Display Antigravity account tier badge (Free, Plus, Pro, Ultra) in the Quota Tracker dashboard connection card

### Improvements

- Filter and limit Antigravity model quotas to specifically keep only: `claude-opus-4-6-thinking`, `claude-sonnet-4-6`, `gemini-3.1-pro-*`, and `gemini-3.5-*`
- Add `"restricted"` check to `isTierNormalizeable` helper in the Open-SSE usage service, resolving a pre-existing unit test failure and correctly badge restricted subscription plans

## v0.4.34 (2026-05-25)

### Improvements

- Update Antigravity model IDs and display labels from the latest MITM config response
- Align Antigravity MITM default models, model aliases, and quota ordering with the latest recommended agent models
- Map the Antigravity `gemini-default` MITM synonym to `gemini-3.5-flash-low`

## v0.4.32 (2026-05-23)

### Features

- Add support for Antigravity AGYv2 by introducing path requirement checks and dedicated API routes
- Add separate controls and endpoints to monitor and close Antigravity AGYv2 processes
- Implement path requirement checks in `detectAntigravityInstallation` to accurately distinguish AGYv2 from legacy AGYv1 bundles

### Improvements

- Add comprehensive unit tests for AGYv2 layout detection and path requirements validation

## v0.4.31 (2026-05-23)

### Features

- Add separate controls and endpoints to monitor and close standard Antigravity AGY and Antigravity IDE
- Automatically set and unset the `NODE_EXTRA_CA_CERTS` environment variable on MITM server start/stop (macOS via `launchctl`, Windows via `setx`)

### Improvements

- Comment out verbose token-swap project rewrite logs in the MITM server

## v0.4.30 (2026-05-13)

### Features

- Add **Usage Flex Report** — exportable social-share card for API key usage metrics with configurable presets (1080×1080 canvas, copy-to-clipboard, PNG export)
- Add `UsageFlexCard` and `UsageFlexReport` components with multi-preset support covering tokens, cost, requests, and model breakdown views

### Improvements

- Refactor account toggling and quota refreshing states from booleans to `Set` objects in `TokenSwapPoolCard` to support concurrent per-account operations without race conditions

## v0.4.29 (2026-05-10)

### Features

- Add CommandCode provider support with OpenAI request/response translators, executor registration, provider icon, and unit coverage
- Add Cloudflare Workers AI image generation support with model metadata and provider routing
- Add Cowork MCP registry endpoint and support for custom Cowork host credentials in CLI tool settings
- Add `/v1/audio/voices` and `/v1/models/info` compatibility endpoints
- Add CapRover deployment definition and Chinese README translation

### Improvements

- Refactor connection proxy configuration logic for clearer proxy option handling
- Improve CLI tool endpoint selection with shared `BaseUrlSelect` and cloud endpoint matching helpers
- Update DeepSeek pricing and add DeepSeek V4 Pro model metadata
- Expand combo/model selection UI with model deselection support

### Fixes

- Normalize Ollama Local provider input before validation and provider persistence
- Prevent cached settings API responses so dashboard settings stay current
- Fix localized README links
- Improve compatible provider API key setup validation

## v0.4.28 (2026-05-10)

### Improvements

- Migrate Docker runtime to Node.js for production startup compatibility
- Require the current `HEAD` to be tagged as the matching release version before Docker publishing
- Optimize dashboard usage tab switching and standardize token usage display logic
- Standardize usage tracking stream accounting output

## v0.4.27 (2026-05-09)

### Features

- Add Antigravity Payload Guard to restrict protected provider access and surface safer token-swap errors
- Add multi-arch Docker publishing script with Docker Hub workflow support and `npm run publish:docker` commands
- Add Antigravity MITM token-swap project ID rewrite controls

### Improvements

- Improve Antigravity token-swap pool health indicator behavior
- Make project ID rewriting unconditional for Antigravity token-swap requests
- Add token-swap diagnostics for project ID rewrite handling

### Fixes

- Rewrite Antigravity token-swap project IDs in request bodies to avoid `403 PERMISSION_DENIED`

## v0.4.26 (2026-05-06)

### Features

- Add **Usage Reports tab** with multi-dimensional analytics: period × metric × breakdown × granularity
- Add **All / API Key / Model / Provider** breakdown selector — "All" shows aggregate trend with all three top-contributors charts simultaneously
- Add **Today** period option — uses local midnight-to-now as a custom time range with automatic hourly granularity
- Add **Day / Week / Month** chart granularity control — hidden for Today/24H which always use hourly buckets
- Add monthly chart bucketing in the report aggregator (`interval=month`, labels like "May 2026")
- Add compact usage/quota display in API Keys table with color-coded badges (green/amber/red) showing 5h/24h tokens and cost usage
- Add inline API key name editing with pencil icon on hover (Enter to save, Escape to cancel)
- Add custom time windows for rate limits — configure limits beyond 5h/24h (15min, 1h, 6h, 12h, 24h, 7d, 30d)
- Add CustomWindowsEditor in KeyLimitsEditor for adding/removing custom time windows with token/cost limits
- Show API key names in CLI Tools dropdowns alongside key values (format: `sk-...xxxx (name)`)
- Add API key usage reset feature — admins can reset usage for specific time windows (All time / 5h / 24h / 7d / 30d) with confirmation popup
- Add reset history tracking — logs all usage reset events with tokens/cost cleared and timestamp, viewable in limits editor

### Improvements

- Auto-fetch usage data for keys with limits on dashboard load
- Extended usage data retention to 30 days to support monthly window tracking
- Add `validateWindow()` helper and `PREDEFINED_DURATIONS` export in usageLimiter.js

### Fixes

- Return proper 429 rate limit error with descriptive message when API key exceeds any configured limit (legacy 5h/24h or custom windows)
- Fix "All" breakdown not aggregating series — `_getSeriesLabel` now returns `"total"` for `seriesBy=none`
- Fix Today chart showing no data — chart data now fills all series keys with `0` to avoid recharts skipping undefined stacked areas
- Fix 24H period not using hourly granularity — Today and 24H now automatically force `interval=hour`

## v0.4.25 (2026-05-05)

### Features

- Add STT (Speech-to-Text) support with multiple providers (Edge TTS, ElevenLabs, Google TTS, OpenAI, OpenRouter, Local Device)
- Add Gemini TTS integration and expand usage tracking with additional metrics
- Add Skills feature for reusable AI interaction patterns
- Add browser-local endpoint presets for CLI tools
- Add RTK compression filter in the request path, applied just before provider dispatch
- Add Caveman prompt injection controls for Gemini-compatible requests
- Add OpenCode Go provider support with custom models
- Add Azure OpenAI provider support with built-in model metadata
- Add built-in Volcengine Ark provider support
- Add Grok Web and Perplexity Web providers
- Add Xiaomi MiMo provider support
- Add Hermes tool to CLI tools with updated components
- Add review model quota support for Codex
- Add sticky round-robin support for combo routing

### Improvements

- Refactor global styles and enhance MITM functionality
- Refactor proxyFetch and enhance MediaProviderDetailPage layout
- Refactor token refresh logic and improve MITM server handling
- Enhance mobile layouts and restore Cloudflare provider
- Improve zh-CN translations
- Add API key setup URLs across provider cards and improve responsive dashboard layouts
- Add cached-token usage metrics and richer provider limit/topology displays
- Move RTK compression to the final dispatch body for both translated and native passthrough requests
- Support custom host URL for remote Ollama servers

### Fixes

- Strip stream_options for Qwen non-streaming Claude Code requests
- Preserve reasoning_effort for non-Claude models in GitHub provider
- Update Qwen OAuth URLs from chat.qwen.ai to qwen.ai
- Force Agent mode in Cursor protobuf when User-Agent contains Claude Code
- Prevent SSE listener leak in console-logs stream
- Redirect ~/.9router to DATA_DIR in Docker to persist usage data across updates
- Gate sudo prompts on server platform in MITM
- Fix custom provider prefix conflicts with built-in alias
- Normalize Claude text-only content arrays to OpenAI-safe strings
- Strip unsupported Anthropic output_config for MiniMax Claude-compatible requests
- Merge Antigravity tool declaration groups into a single Gemini-compatible group
- Cap maximum cooldown for rate limit handling in account unavailability

## v0.4.24 (2026-05-02)

### Features

- Add Xiaomi MiMo provider support with built-in model metadata, validation endpoint, and provider icon
- Add Caveman prompt injection controls in the RTK request path, applied just before provider dispatch
- Add sticky round-robin support for combo routing so each combo model can receive multiple requests before rotating

### Improvements

- Move RTK compression to the final dispatch body so it works for both translated and native passthrough requests
- Add API key setup URLs across provider cards and improve responsive dashboard layouts for CLI tools, providers, usage, profile, and endpoint pages
- Add cached-token usage metrics and richer provider limit/topology displays in the usage dashboard

### Fixes

- Normalize Claude text-only content arrays to OpenAI-safe strings and parse raw NDJSON stream lines without requiring an explicit Ollama format
- Strip unsupported Anthropic `output_config` for MiniMax Claude-compatible requests while preserving it for Anthropic
- Merge Antigravity tool declaration groups into a single Gemini-compatible group before token-swap dispatch

## v0.4.23 (2026-05-02)

### Fixes

- Treat Antigravity MITM token-swap `403` IAM permission errors as retryable account fallback events, matching the existing `429`/`503` retry path

## v0.4.21 (2026-04-30)

### Features

- Add Antigravity host rewrite setting to avoid rate limits — toggle in Profile settings rewrites upstream host on each request

### Improvements

- Centralize MITM settings into a dedicated `mitmSettings.js` module for cleaner settings management
- Refactor `MitmToolCard` with a `DnsToggleButton` sub-component, improved DNS toggle UI, and abort signal support in fetch logic
- Refactor Antigravity logging to use consistent terminology and clear forced passthrough model list

### Fixes

- Rewrite Antigravity MITM handler to use direct `fetchRouter`/`pipeSSE` pipeline with proper SSE and non-SSE error responses — prevents SDK from hanging when an error occurs mid-stream

## v0.4.20 (2026-04-29)

### Features

- Add Antigravity MITM token-swap IDE version override with Profile settings toggle and configurable version, defaulting to `1.23.2`

### Improvements

- Rewrite both Antigravity request `metadata.ideVersion` and `user-agent` version when the override is enabled
- Route `/v1internal:loadCodeAssist` through Antigravity MITM token swap so eligibility-check requests can use the override
- Add a Profile settings notice that IDE version spoofing is used at your own risk

## v0.4.16 (2026-04-24)

### Features

- Add hourly `db.json` backups with 3-day retention and a Profile settings toggle enabled by default

### Fixes

- Prevent token-swap DB writes from racing normal local DB writes by using shared locking and atomic JSON updates
- Stop resetting `db.json` to defaults on corrupt JSON; restore from a valid backup or preserve the corrupt file for recovery

## v0.4.15 (2026-04-24)

### Features

- Add Azure OpenAI provider support
- Add built-in Volcengine Ark provider support (#741)
- Add GPT 5.5 model
- Add Hermes CLI tool with settings management and integration
- Add in-app version update mechanism (appUpdater + /api/version/update)

### Improvements

- Strengthen CLI token validation for enhanced security
- Enhance Sidebar layout for CLI tools
- Update executors and runtime config

### Fixes

- Enhance retry logic and configuration for HTTP status codes

## v0.4.14 (2026-04-23)

### Features

- Integrate RTK (Token Killer) compression into the MITM token-swap path — large tool outputs (git-diff, grep, ls, etc.) are now compressed before forwarding to upstream providers, reducing token usage by ~7% on real workloads

## v0.4.12 (2026-04-23)

### Features

- Add RTK — filter context (ls/grep/find/...) before sending to LLM to save tokens
- Add OpenCode Go provider and support for custom models
- Add Text To Image provider
- Support custom host URL for remote Ollama servers

### Fixes

- Fix copy to clipboard issue

## v0.4.11 (2026-04-23)

### Features

- Add per-account request health monitor in MITM Token Swap dashboard — last 100 calls displayed as colored 6×6px squares (green = success, orange gradient = retry success, red = fail) with live summary counts and hover tooltips
- Persist health history to `~/.n9router/account-health.json`; survives server restarts; polled every 10s in the dashboard

### Improvements

- Treat Antigravity 429 and 503 errors identically — both now retry the same account with exponential backoff (shared `_quotaRetryCount` counter, reuses per-account retry count setting)
- Apply cooldown/strike only after **2 consecutive fail** health events; a single 429/503 burst skips the account without penalising it, reducing false-positive cooldowns from Antigravity's random error responses

## v0.4.8 (2026-04-19)

### Features

- Add Kiro AWS Identity Center device flow for provider OAuth (`b1288c5`)
- Add marked package for Markdown rendering and enhance changelog styles (`75c4598`)
- Add TTS (Text-to-Speech) core handler and TTS models config
- Add suggested models API endpoint
- Add proactive token refresh lead times for providers and Codex proxy management (`04cdb75`)
- Add Blackbox AI as a supported provider (#599) (`3badf1c`)
- Add multi-model support for Factory Droid CLI tool (#521) (`1d872ce`)
- Add GLM-5 and MiniMax-M2.5 models to Kiro provider (#580) (`aa67198`)

### Improvements

- Refactor error handling to config-driven approach with centralized error rules (`b669b6f`)
- Refactor localDb and usageDb for cleaner structure (`75ad0be`)
- Update Qwen executor for OAuth handling (`75c4598`)
- Enhance error formatting to include low-level cause details (`3977edc`)
- Refactor HeaderMenu to use MenuItem component for better structure (`3977edc`)
- Improve LanguageSwitcher to support controlled open state (`3977edc`)
- Update backoff configuration and improve CLI detection messages (`6ab9927`)
- Add installation guides for manual configuration in tool cards (Droid, Claude, OpenClaw) (`6ab9927`)
- Enhance Windows Tailscale installation with curl support and well-known Windows path fallback (`6bec1e0`)
- Refactor execSync and spawn calls with windowsHide option for better Windows compatibility (`1fa05eb`)
- Auto-build Docker image on tag push (#547) (`befb2bc`)

### Fixes

- Fix Codex image URL fetches to await before sending upstream (#575) (`d0ace2a`)
- Strip thinking/reasoning_effort for GitHub Copilot chat completions (#623) (`afe09f3`)
- Show quota auth expired message for Kiro social auth accounts (#588) (`2e8784c`)
- Enable Codex Apply/Reset buttons when CLI is installed (#591) (`877b744`)
- Show manual config option when Claude CLI detection fails (#589) (`f27db54`)
- Show manual config option when OpenClaw detection fails (#579) (`63dbf89`)
- Ensure LocalMutex acquire returns release callback correctly (#569) (`dac6c39`)
- Strip enumDescriptions from tool schema in antigravity-to-openai (#566) (`6e8aaab`)
- Strip temperature parameter for gpt-5.4 model (#536) (`554bbfc`)
- Fix noAuth support for providers and adjusted MITM restart settings (`6a6e2fc`)
- Fix usage tracking bug (`75ad0be`)

## v0.4.7 (2026-04-14)

### Features

- Enhance provider models and chat handling with new thinking configurations (`4c28a16`)
- Enhance proxy functionality with Vercel relay support (`89eb26d`)
- Enhance TTS functionality and security settings (`b3feb96`)

### Improvements

- Update GitHub Actions workflow for Docker image (`ee1271b`)
- Parameterize Bun image and improve package management in Dockerfile (`7887f4f`)
- Update Docker build process and documentation (`5d3780c`)
- Add Docker support and improve Dockerfile configuration (`d99f63c`)

### Docs

- Update README with new Antigravity Token Swap tutorial video (`177e8c9`)
- Update star chart link to reflect repository migration (`8996eff`)

## v0.4.5 (2026-04-11)

### Fixes

- Fix: update Tailscale directory paths from `.9router` to `.n9router` (`3d68aeb`)

## v0.4.3 (2026-04-11)

### Features

- Add Tailscale remote access support (`ed17a8f`)
- Add TTS (text-to-speech) endpoint support (`3c96e8d`)
- Multi-model support for OpenCode CLI config with subagent integration (`1a25c6e`)
- CLI: add `--update` and `--version` flags, and startup version announcement (`6fbeef4`)

### Improvements

- Replace sticky round-robin with least-recently-used (LRU) connection selection strategy (`6d11114`)
- Improve Windows Antigravity DNS error handling (`e289908`)

### Fixes

- Add 5s timeout to `fetchCompatibleModelIds` and skip upstream connections (#541) (`838d9a7`)
- Only strip `reasoning_content` when content is non-empty (#542) (`878cdf3`)
- Enable Apply button when models are selected (`f8a2677`)
- Fix OpenRouter custom models not showing after being added (`507a5db`)
- Fix combo modal (`39545cf`)

## v0.3.99 (2026-04-09)

### Features

- Persist model quota status and hard-filter exhausted accounts in token pool (`ce713e4`)
- Implement antigravity account type inference, local quota fallback, and UI badges (`3b5a5b7`)
- Implement immediate cooldown logic for capacity exhaustion and human-readable reset time formatting (`ecc4a4d`)
- Token Swap Pool feature with rotating token support (`737012f`)

### Improvements

- Centralize `formatResetTimeDisplay` utility and update quota reset logic in TokenSwapPoolCard (`df73cd7`)
- NPM release packaging (`81e5101`)

### Fixes

- Simplify sudo password validation in AntigravityToolCard, MitmServerCard, and MitmToolCard (`db85dd2`)

### Docs

- Add Token Swap Pool feature to README (`199940a`)

## v0.3.96 (2026-04-17)

### Features

- Add marked package for Markdown rendering
- Enhance changelog styles

### Improvements

- Refactor error handling to config-driven approach with centralized error rules
- Refactor localDb structure
- Update Qwen executor for OAuth handling
- Enhance error formatting to include low-level cause details
- Refactor HeaderMenu to use MenuItem component
- Improve LanguageSwitcher to support controlled open state
- Update backoff configuration and improve CLI detection messages
- Add installation guides for manual configuration in tool cards (Droid, Claude, OpenClaw)

### Fixes

- Fix Codex image URL fetches to await before sending upstream (#575)
- Strip thinking/reasoning_effort for GitHub Copilot chat completions (#623)
- Enable Codex Apply/Reset buttons when CLI is installed (#591)
- Show manual config option when Claude CLI detection fails (#589)
- Show manual config option when OpenClaw detection fails (#579)
- Ensure LocalMutex acquire returns release callback correctly (#569)
- Strip enumDescriptions from tool schema in antigravity-to-openai (#566)
- Strip temperature parameter for gpt-5.4 model (#536)
- Add Blackbox AI as a supported provider (#599)
- Add multi-model support for Factory Droid CLI tool (#521)
- Add GLM-5 and MiniMax-M2.5 models to Kiro provider (#580)
- Fix usage tracking bug

## v0.3.91 (2026-04-15)

### Features

- Add Kiro AWS Identity Center device flow for provider OAuth
- Add TTS (Text-to-Speech) core handler and TTS models config
- Add media providers dashboard page
- Add suggested models API endpoint

### Improvements

- Refactor error handling to config-driven approach with centralized error rules
- Refactor localDb and usageDb for cleaner structure

### Fixes

- Fix usage tracking bug

## v0.3.90 (2026-04-14)

### Features

- Add proactive token refresh lead times for providers and Codex proxy management
- Enhance CodexExecutor with compact URL support

### Improvements

- Enhance Windows Tailscale installation with curl support and fallback to well-known Windows path
- Refactor execSync and spawn calls with windowsHide option for better Windows compatibility

### Fixes

- Fix noAuth support for providers and adjusted MITM restart settings
- Bug fixes

## v0.3.89 (2026-04-13)

## v0.3.83 (2026-04-08)

### Fixes

- Fix unauthenticated server shutdown endpoint security vulnerability (#519) (`1f3d3a8`)
- Merge consecutive `userInputMessages` in openai-to-kiro translator (#524) (`23abe1a`)
- Update Cursor client version to 3.1.0 for Composer 2 compatibility (#525) (`32a7461`)
- Strip `reasoning_content` from non-streaming responses (#517) (`a53ccf1`)
- Make API key optional for ollama-local provider validation (#493) (`7db4b98`)
- Update `/v1/models` to support OpenAI/Anthropic Compatible providers (#497) (`ebb8d4e`)
- Sync top-level copilotToken after proactive refresh (#507) (`6ec5890`)
- Fix ModelSelectModal (`57cfacc`)
- Updated Anthropic-Beta header (`67e0db7`)
- Strip image bug fixes (`401772c`)

## v0.3.75 (2026-04-05)

### Features

- Translator: lossless passthrough via CLI tool + provider pairing (`666aecf`)
- Embedding support (`5448eed`)
- Add GitLab Duo and CodeBuddy support, update observability settings (`abbf8ec`)
- Add OpenCode provider support (#387) (`fcc8320`)
- Expand OpenAI and Gemini static model lists (#398) (`56be393`)
- Add Google Cloud Vertex AI provider support (`39f651f`)
- Add Kiro MITM support (`03ff351`)
- Add MiniMax M2.7 model support (#357) (`a0500df`)
- Add Basic Chat interface for testing models (`6b0cced`)
- Add per-combo round-robin strategy (`3e694a3`, `96f5e5c`)
- Add multi-language support for UI (`11c6b0c`)
- Fetch free models from Kilo API + Windows build fixes (#455) (`8640503`)
- Claude Code: spoof TLS fingerprint and stabilize headers for Anthropic (`1c160cc`)
- Auto restart after crash (`adae260`)
- Add optional modelID input for custom API Key Providers testing (#315) (`65af432`)

### Improvements

- Enhance passthrough function to support response inspection (`fd4ec9e`)
- Enhance image support in Kiro for Claude models (`8df8b94`, `4496bf9`)
- Refactor error logging to provide clearer context on provider failures (`f264bb9`)
- Update MITM bypass logic and enhance combo name validation (`f1c53a3`)

### Fixes

- Correct thought signatures for AG, Gemini CLI, Vertex; fix missing Vertex response translator (`1973fe5`)
- Fix Qwen provider (`2b1faeb`)
- Pass `isFree` prop to ModelRow for custom models (#480) (`2e740ad`)
- Pass HOME explicitly in sudo inlineCmd so MITM server resolves correct data dir (#482) (`7f4f75a`)
- Skip `function_call` items with empty/missing name to prevent Codex 400 error (#487) (`5fe2c81`)
- Retry `/responses` endpoint when GitHub returns model not supported (#488) (`38eabae`)
- Use `which` instead of `command -v` for openclaw CLI detection (#489) (`006c337`)
- Emit closing `</think>` tag instead of empty `reasoning_content` (#454) (`ffa172c`)
- Preserve `thoughtSignature` via `tool_call` ID smuggling + fix ELOCKED mutex (`054facb`)
- Handle anthropic-compatible providers in BaseExecutor (#428) (`8335488`)
- Add missing `clientId` to GitHub provider config for OAuth token refresh (#442) (`cd1e06b`)
- Correct `finish_reason` for tool calls in OpenAI Responses translator (`11e6004`)
- Use project-scoped Vertex URL for SA JSON auth and add `?alt=sse` for streaming (#388) (`f05d64e`)
- Inject placeholder message when Responses API `input[]` is empty (#419) (`5abf710`)
- Map OpenAI `image_url` data URLs to Ollama `images[]` (#432) (`4e631c4`)
- Strip `functionCall`/`functionResponse` id and synthetic `thoughtSignature` for Vertex AI (#414) (`e3a7733`)
- Use better-sqlite3 for Cursor auto-import, drop sqlite3 CLI requirement (#411) (`a6c764d`)
- Add deprecation warning for Gemini CLI provider (#406) (`2f0fd34`)
- Sanitize Gemini function names to meet API requirements (#403) (`ade3f57`)
- Detect Claude format for `/v1/messages` + sanitize tool descriptions (#397) (`3b4184b`)
- Clamp Responses API `call_id` to 64 chars (#396) (`868eabf`)
- Support HTTP/HTTPS image URLs in Claude and Gemini translators (#344) (`99cb9ed`)
- Inject `stream_options` for usage data in iFlow streaming (`e9ccae4`)
- Verify Cursor installation on Linux before auto-import (`8312af7`)
- Test Codex connection against actual endpoint (#347) (`97f2a00`)
- Prevent duplicate model aliases on import (#340) (`1ed6c4c`)
- Skip disabled providers in combo fallback instead of returning 406 (#336) (`037d013`)
- Normalize `finish_reason` to `tool_calls` when tool calls are present (#379) (`01e4a28`)
- Treat Kiro 400 'improperly formed request' as model-unavailable (#386) (`b8918c0`)
- Pick last non-empty message for Codex Responses SSE (`3d4dbdc`)
- Combo 503 cooldown wait before fallthrough + 406 on disabled creds (#382) (`4774150`)
- Fix MITM for Docker and enhance Dockerfile (#381) (`8c0b4a3`)
- Add missing `type:string` to enum properties in Gemini tool schema translation (#380) (`4d7ddbf`)
- Clean JSON schemas for Gemini function declarations (#371) (`1154244`)
- Remove sql.js dependency from Cursor auto-import route (#368) (`3f85277`)
- Restore provider assets and model availability endpoint (#367) (`9fe4726`)
- Track lifetime request total beyond history cap (#366) (`5fedcad`)
- Fix tunnel issues (`6af8043`, `80583e2`)
- Externalize better-sqlite3 for Next.js standalone builds (`34013b5`)
- Docker: use entrypoint to fix `/app/data` permissions on mounted volumes (`8c51eda`)
- Docker: move data dir chown after COPY to fix EACCES permission error (`9c757ff`)
- Fix abort method in `pipeWithDisconnect` to return a promise (`6b624af`)
- Add proper-lockfile for safe database read/write operations (`8759545`)
