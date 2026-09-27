import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tablesToCheck = [
  "profiles",
  "categories",
  "products",
  "transactions",
  "transaction_items",
  "branches",
  "ingredients",
  "recipes",
  "recipe_ingredients",
  "cashier_shifts",
  "table_orders",
  "table_order_items",
];

async function checkTables() {
  console.log("🔍 Checking tables in Supabase instance:", supabaseUrl);
  const results = {};
  let allExist = true;

  for (const table of tablesToCheck) {
    const { count, error, status } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      results[table] = { status: error.code || status, exists: false, message: error.message };
      allExist = false;
      console.log(`❌ Table [${table}]: Not Found or Inaccessible (${error.message})`);
    } else {
      results[table] = { status: 200, exists: true, count: count ?? 0 };
      console.log(`✅ Table [${table}]: OK (count: ${count ?? 0})`);
    }
  }

  // Check RPC
  console.log("🔍 Checking RPC deduct_product_stock_atomic...");
  const { data: rpcData, error: rpcError } = await supabase.rpc("deduct_product_stock_atomic", {
    p_id: "00000000-0000-0000-0000-000000000000",
    qty: 1,
  });

  if (rpcError && rpcError.code === "PGRST202") {
    console.log("❌ RPC [deduct_product_stock_atomic]: Not Found in schema cache");
    allExist = false;
  } else {
    console.log("✅ RPC [deduct_product_stock_atomic]: Exists & responded:", rpcData || rpcError?.message);
  }

  return { allExist, results };
}

checkTables()
  .then(({ allExist }) => {
    if (!allExist) {
      console.log("\n⚠️ Some tables or functions are not yet applied in the remote Supabase project.");
      console.log("💡 To apply them to Supabase, run the SQL script in the Supabase SQL editor:");
      console.log("   https://supabase.com/dashboard/project/pijpptetccvgmwyjvsse/sql");
      console.log("   Script file: supabase/migrations/20260927_production_hardening.sql\n");
    } else {
      console.log("\n🎉 All 12 tables and RPC functions verified successfully in remote Supabase!");
    }
  })
  .catch((err) => {
    console.error("Verification script error:", err);
  });
