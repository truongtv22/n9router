import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import { applyOutboundProxyEnv } from "@/lib/network/outboundProxy";
import { DATA_DIR } from "@/lib/dataDir";
import { createRequire } from "node:module";
import { setRtkEnabled } from "open-sse/rtk/index.js";
import { resetComboRotation } from "open-sse/services/combo.js";
import { normalizeCustomHeaders } from "open-sse/utils/customHeaders.js";
import bcrypt from "bcryptjs";
import path from "path";

const require = createRequire(import.meta.url);
const { configureDbPeriodicBackups } = require("../../../lib/dbPeriodicBackup.js");
const MITM_ANTIGRAVITY_DEBUG_LOG_DIR = path.join(DATA_DIR, "mitm", "logs", "antigravity");
const DB_FILE = path.join(DATA_DIR, "db.json");

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SETTINGS_RESPONSE_HEADERS = {
  "Cache-Control": "no-store"
};

// Secrets must never be mass-assigned from request body (CWE-915)
const PROTECTED_SETTING_KEYS = ["password", "mitmSudoEncrypted"];

export async function GET() {
  try {
    const settings = await getSettings();
    const { password, oidcClientSecret, ...safeSettings } = settings;
    safeSettings.oidcConfigured = !!(safeSettings.oidcIssuerUrl && safeSettings.oidcClientId && oidcClientSecret);
    
    const enableRequestLogs = process.env.ENABLE_REQUEST_LOGS === "true";
    const enableTranslator = process.env.ENABLE_TRANSLATOR === "true";
    
    return NextResponse.json({
      ...safeSettings,
      enableRequestLogs,
      enableTranslator,
      mitmAntigravityDebugLogDir: MITM_ANTIGRAVITY_DEBUG_LOG_DIR,
      hasPassword: !!password
    }, { headers: SETTINGS_RESPONSE_HEADERS });
  } catch (error) {
    console.log("Error getting settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();

    // Strip protected secrets before any internal handling sets them
    for (const key of PROTECTED_SETTING_KEYS) delete body[key];

    // If updating password, hash it
    if (body.newPassword) {
      const settings = await getSettings();
      const currentHash = settings.password;

      // Verify current password if it exists
      if (currentHash) {
        if (!body.currentPassword) {
          return NextResponse.json({ error: "Current password required" }, { status: 400 });
        }
        const isValid = await bcrypt.compare(body.currentPassword, currentHash);
        if (!isValid) {
          return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
        }
      } else {
        // First time setting password, no current password needed
        // Allow empty currentPassword or default "123456"
        if (body.currentPassword && body.currentPassword !== "123456") {
           return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
        }
      }

      const salt = await bcrypt.genSalt(10);
      body.password = await bcrypt.hash(body.newPassword, salt);
      delete body.newPassword;
      delete body.currentPassword;
    }

    if (Object.prototype.hasOwnProperty.call(body, "oidcClientSecret")) {
      if (!body.oidcClientSecret || !String(body.oidcClientSecret).trim()) {
        delete body.oidcClientSecret;
      }
    }

    // Provider-level custom headers: merged per provider so updating one provider
    // never wipes another's headers. Each entry is a { name: value } map, validated
    // with the same rules as connection-level headers.
    if (Object.prototype.hasOwnProperty.call(body, "providerCustomHeaders")) {
      const existingOverrides = (await getSettings()).providerCustomHeaders || {};
      const incoming = body.providerCustomHeaders;
      if (incoming == null || typeof incoming !== "object" || Array.isArray(incoming)) {
        return NextResponse.json(
          { error: "providerCustomHeaders must be an object keyed by provider" },
          { status: 400 }
        );
      }
      const merged = { ...existingOverrides };
      for (const [providerId, headers] of Object.entries(incoming)) {
        const norm = normalizeCustomHeaders(headers);
        if (norm.error) {
          return NextResponse.json({ error: norm.error }, { status: 400 });
        }
        if (Object.keys(norm.value).length === 0) delete merged[providerId];
        else merged[providerId] = norm.value;
      }
      body.providerCustomHeaders = merged;
    }

    const settings = await updateSettings(body);

    // Apply outbound proxy settings immediately (no restart required)
    if (
      Object.prototype.hasOwnProperty.call(body, "outboundProxyEnabled") ||
      Object.prototype.hasOwnProperty.call(body, "outboundProxyUrl") ||
      Object.prototype.hasOwnProperty.call(body, "outboundNoProxy")
    ) {
      applyOutboundProxyEnv(settings);
    }

    // Invalidate combo rotation state when strategy settings change
    if (
      Object.prototype.hasOwnProperty.call(body, "comboStrategy") ||
      Object.prototype.hasOwnProperty.call(body, "comboStickyRoundRobinLimit") ||
      Object.prototype.hasOwnProperty.call(body, "comboStrategies")
    ) {
      resetComboRotation();
    }

    // Sync RTK toggle immediately (sync cache for MITM request hot path)
    if (Object.prototype.hasOwnProperty.call(body, "rtkEnabled")) {
      setRtkEnabled(settings.rtkEnabled);
    }

    if (Object.prototype.hasOwnProperty.call(body, "periodicDbBackupsEnabled")) {
      configureDbPeriodicBackups(DB_FILE, settings.periodicDbBackupsEnabled !== false);
    }

    if (
      Object.prototype.hasOwnProperty.call(body, "claudeAutoPing") ||
      Object.prototype.hasOwnProperty.call(body, "codexAutoPing")
    ) {
      // Keep the scheduler absent when no account opted in; load its provider graph only on demand.
      import("@/shared/services/quotaAutoPing")
        .then(({ configureQuotaAutoPing }) => {
          configureQuotaAutoPing(settings);
        })
        .catch((error) => console.warn("[AutoPing] settings update failed:", error.message));
    }

    const { password, oidcClientSecret, ...safeSettings } = settings;
    safeSettings.oidcConfigured = !!(safeSettings.oidcIssuerUrl && safeSettings.oidcClientId && oidcClientSecret);
    return NextResponse.json({
      ...safeSettings,
      mitmAntigravityDebugLogDir: MITM_ANTIGRAVITY_DEBUG_LOG_DIR,
    }, { headers: SETTINGS_RESPONSE_HEADERS });
  } catch (error) {
    console.log("Error updating settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
