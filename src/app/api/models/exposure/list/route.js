import { NextResponse } from "next/server";
import { getSettings } from "@/lib/localDb";
import { buildModelsList } from "@/app/api/v1/models/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/models/exposure/list — models grouped by provider for the /dashboard/models UI.
// skipDynamicFetch avoids per-view live upstream fetches; cache (60s) from /v1/models applies.
export async function GET() {
  try {
    const settings = await getSettings();
    const exposure = settings.modelExposure || { enabled: true, mode: "all", whitelist: [], favorites: [] };
    const whitelistSet = new Set(exposure.whitelist || []);
    const favoritesSet = new Set(exposure.favorites || []);

    const entries = await buildModelsList(["llm"], { skipDynamicFetch: true });

    // Group by provider (alias from entry.owned_by / leading id segment)
    const byProvider = new Map();
    for (const e of entries) {
      if (e.owned_by === "combo") continue; // combos managed in their own UI
      const slash = e.id.indexOf("/");
      const alias = slash > 0 ? e.id.slice(0, slash) : e.owned_by;
      if (!byProvider.has(alias)) byProvider.set(alias, []);
      byProvider.get(alias).push({
        id: e.id,
        name: e.display_name || null,
        selected: whitelistSet.has(e.id),
        favorite: favoritesSet.has(e.id),
      });
    }

    const providers = Array.from(byProvider.entries()).map(([alias, models]) => ({
      alias,
      models,
    }));

    return NextResponse.json({
      exposure: { enabled: exposure.enabled, mode: exposure.mode, whitelist: exposure.whitelist || [], favorites: exposure.favorites || [] },
      providers,
    });
  } catch (error) {
    console.log("Error listing models:", error);
    return NextResponse.json({ error: "Failed to list models" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
