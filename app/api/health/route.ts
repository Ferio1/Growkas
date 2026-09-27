import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import pkg from "@/package.json";

export const dynamic = "force-dynamic";

const APP_VERSION = process.env.npm_package_version || pkg.version || "0.1.0";

export async function GET(_request?: Request) {
  let database: "connected" | "degraded" = "degraded";

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("categories").select("id").limit(1);

    if (!error) {
      database = "connected";
    } else {
      console.warn("[Health Probe] Supabase query returned error:", error.message);
      database = "degraded";
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn("[Health Probe] Database connectivity check failed:", errorMessage);
    database = "degraded";
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      database,
      version: APP_VERSION,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
