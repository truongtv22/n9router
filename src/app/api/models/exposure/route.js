import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import { invalidateModelsCache } from "@/app/api/v1/models/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/models/exposure — read current model exposure config
export async function GET() {
  try {
    const settings = await getSettings();
    const exposure = settings.modelExposure || { enabled: true, mode: "all", whitelist: [], favorites: [] };
    return NextResponse.json(exposure);
  } catch (error) {
    console.log("Error fetching model exposure:", error);
    return NextResponse.json({ error: "Failed to fetch model exposure" }, { status: 500 });
  }
}

// PUT /api/models/exposure — update exposure config and invalidate /v1/models cache
export async function PUT(request) {
  try {
    const body = await request.json();

    if (body.enabled === undefined && body.mode === undefined && body.whitelist === undefined && body.favorites === undefined) {
      return NextResponse.json({ error: "No exposure fields provided" }, { status: 400 });
    }

    // Read current exposure first so partial updates (e.g. only whitelist)
    // don't nuke the other fields on save.
    const settings = await getSettings();
    const current = settings.modelExposure || { enabled: true, mode: "all", whitelist: [], favorites: [] };

    const strArr = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim() !== "") : undefined;

    const next = { ...current };
    if (typeof body.enabled === "boolean") next.enabled = body.enabled;
    if (body.mode === "all" || body.mode === "whitelist") next.mode = body.mode;
    if (body.whitelist !== undefined) {
      const wl = strArr(body.whitelist);
      if (wl === undefined) return NextResponse.json({ error: "whitelist must be an array of strings" }, { status: 400 });
      next.whitelist = wl;
    }
    if (body.favorites !== undefined) {
      const fav = strArr(body.favorites);
      if (fav === undefined) return NextResponse.json({ error: "favorites must be an array of strings" }, { status: 400 });
      next.favorites = fav;
    }

    await updateSettings({ modelExposure: next });

    // Whitelist/favorites/mode changed → drop stale /v1/models cache
    invalidateModelsCache();

    return NextResponse.json(next);
  } catch (error) {
    console.log("Error updating model exposure:", error);
    return NextResponse.json({ error: "Failed to update model exposure" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
