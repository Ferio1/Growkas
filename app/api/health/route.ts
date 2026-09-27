import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
      version: "0.1.0",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
