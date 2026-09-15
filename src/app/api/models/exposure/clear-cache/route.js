import { NextResponse } from "next/server";
import { DATA_DIR } from "@/lib/dataDir";
import path from "node:path";
import fs from "node:fs";

export const dynamic = "force-dynamic";

// POST /api/models/exposure/clear-cache — delete Claude Code's local gateway discovery
// cache so its /model picker refreshes immediately instead of waiting for next startup.
const HOME = process.env.HOME || process.env.USERPROFILE || "";
const CC_CACHE = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(HOME, ".claude"), "cache", "gateway-models.json");

export async function POST() {
  try {
    if (!CC_CACHE || !HOME) {
      return NextResponse.json({ error: "Cannot resolve Claude Code cache path" }, { status: 400 });
    }
    if (fs.existsSync(CC_CACHE)) {
      fs.unlinkSync(CC_CACHE);
      return NextResponse.json({ success: true, cleared: true });
    }
    return NextResponse.json({ success: true, cleared: false });
  } catch (error) {
    console.log("Error clearing Claude Code cache:", error);
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "*" },
  });
}
