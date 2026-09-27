import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Database Schema & RLS Hardening — Relational Migration", () => {
  const rootDir = path.resolve(__dirname, "../..");
  const migrationPath = path.join(rootDir, "supabase/migrations/20260927_production_hardening.sql");
  const schemaPath = path.join(rootDir, "supabase/schema.sql");

  const migrationSql = fs.readFileSync(migrationPath, "utf-8");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  describe("File Integrity & SQL Block Balance", () => {
    it("should ensure migration file exists and is populated", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      expect(migrationSql.length).toBeGreaterThan(1000);
    });

    it("should ensure master schema.sql exists and is populated", () => {
      expect(fs.existsSync(schemaPath)).toBe(true);
      expect(schemaSql.length).toBeGreaterThan(2000);
    });

    it("should have matching dollar-quote blocks ($$) for PL/pgSQL routines", () => {
      for (const [name, sql] of [["migration", migrationSql], ["schema", schemaSql]] as const) {
        const dollarMatches = sql.match(/\$\$/g);
        expect(dollarMatches, `${name} has unmatched $$ dollar quotes`).not.toBeNull();
        expect((dollarMatches?.length || 0) % 2).toBe(0);
      }
    });

    it("should have matching BEGIN and END blocks in stored procedures", () => {
      for (const [name, sql] of [["migration", migrationSql], ["schema", schemaSql]] as const) {
        const beginMatches = sql.match(/\bBEGIN\b/gi);
        const endMatches = sql.match(/\bEND;\s*\$\$/gi);
        expect(beginMatches?.length).toBeGreaterThanOrEqual(1);
        expect(endMatches?.length).toBe(beginMatches?.length);
      }
    });
  });

  describe("Relational Tables & Columns DDL Verification", () => {
    const requiredTables = [
      "branches",
      "ingredients",
      "recipes",
      "recipe_ingredients",
      "cashier_shifts",
      "table_orders",
      "table_order_items",
    ];

    it.each(requiredTables)("should define public.%s table in both migration and schema.sql", (table) => {
      const tablePattern = new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?public\\.${table}\\s*\\(`, "i");
      expect(migrationSql).toMatch(tablePattern);
      expect(schemaSql).toMatch(tablePattern);
    });

    it("should verify public.branches column definitions", () => {
      const branchesBlock = schemaSql.match(/CREATE TABLE IF NOT EXISTS public\.branches \(([\s\S]*?)\);/i)?.[1];
      expect(branchesBlock).toBeDefined();
      expect(branchesBlock).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
      expect(branchesBlock).toMatch(/name\s+TEXT\s+NOT\s+NULL/i);
      expect(branchesBlock).toMatch(/city\s+TEXT/i);
      expect(branchesBlock).toMatch(/address\s+TEXT/i);
      expect(branchesBlock).toMatch(/target_revenue\s+NUMERIC\(15,\s*2\)\s+DEFAULT\s+0/i);
      expect(branchesBlock).toMatch(/created_at\s+TIMESTAMPTZ/i);
    });

    it("should verify public.ingredients column definitions & foreign key to branches", () => {
      const block = schemaSql.match(/CREATE TABLE IF NOT EXISTS public\.ingredients \(([\s\S]*?)\);/i)?.[1];
      expect(block).toBeDefined();
      expect(block).toMatch(/id\s+TEXT\s+PRIMARY\s+KEY/i);
      expect(block).toMatch(/name\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/unit\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/stock\s+NUMERIC\(12,\s*2\)\s+DEFAULT\s+0/i);
      expect(block).toMatch(/min_stock\s+NUMERIC\(12,\s*2\)\s+DEFAULT\s+0/i);
      expect(block).toMatch(/cost_per_unit\s+NUMERIC\(12,\s*2\)\s+DEFAULT\s+0/i);
      expect(block).toMatch(/category\s+TEXT/i);
      expect(block).toMatch(/branch_id\s+UUID\s+REFERENCES\s+public\.branches\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i);
      expect(block).toMatch(/created_at\s+TIMESTAMPTZ/i);
    });

    it("should verify public.recipes column definitions & foreign key to branches", () => {
      const block = schemaSql.match(/CREATE TABLE IF NOT EXISTS public\.recipes \(([\s\S]*?)\);/i)?.[1];
      expect(block).toBeDefined();
      expect(block).toMatch(/id\s+TEXT\s+PRIMARY\s+KEY/i);
      expect(block).toMatch(/product_name\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/selling_price\s+NUMERIC\(12,\s*2\)\s+DEFAULT\s+0/i);
      expect(block).toMatch(/branch_id\s+UUID\s+REFERENCES\s+public\.branches\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i);
      expect(block).toMatch(/modifier_config\s+JSONB\s+DEFAULT\s+'\{\}'::jsonb/i);
      expect(block).toMatch(/created_at\s+TIMESTAMPTZ/i);
    });

    it("should verify public.recipe_ingredients column definitions & cascade foreign keys", () => {
      const block = schemaSql.match(/CREATE TABLE IF NOT EXISTS public\.recipe_ingredients \(([\s\S]*?)\);/i)?.[1];
      expect(block).toBeDefined();
      expect(block).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
      expect(block).toMatch(/recipe_id\s+TEXT\s+(?:NOT\s+NULL\s+)?REFERENCES\s+public\.recipes\(id\)\s+ON\s+DELETE\s+CASCADE/i);
      expect(block).toMatch(/ingredient_id\s+TEXT\s+(?:NOT\s+NULL\s+)?REFERENCES\s+public\.ingredients\(id\)\s+ON\s+DELETE\s+CASCADE/i);
      expect(block).toMatch(/quantity\s+NUMERIC\(12,\s*2\)\s+NOT\s+NULL/i);
      expect(block).toMatch(/unit\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/created_at\s+TIMESTAMPTZ/i);
    });

    it("should verify public.cashier_shifts column definitions", () => {
      const block = schemaSql.match(/CREATE TABLE IF NOT EXISTS public\.cashier_shifts \(([\s\S]*?)\);/i)?.[1];
      expect(block).toBeDefined();
      expect(block).toMatch(/id\s+TEXT\s+PRIMARY\s+KEY/i);
      expect(block).toMatch(/cashier_name\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/branch_name\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/start_time\s+TIMESTAMPTZ\s+NOT\s+NULL/i);
      expect(block).toMatch(/end_time\s+TIMESTAMPTZ/i);
      expect(block).toMatch(/initial_cash\s+NUMERIC\(12,\s*2\)\s+DEFAULT\s+0/i);
      expect(block).toMatch(/expected_cash\s+NUMERIC\(12,\s*2\)\s+DEFAULT\s+0/i);
      expect(block).toMatch(/actual_cash\s+NUMERIC\(12,\s*2\)\s+DEFAULT\s+0/i);
      expect(block).toMatch(/discrepancy\s+NUMERIC\(12,\s*2\)\s+DEFAULT\s+0/i);
      expect(block).toMatch(/status\s+TEXT\s+NOT\s+NULL\s+DEFAULT\s+'open'/i);
      expect(block).toMatch(/created_at\s+TIMESTAMPTZ/i);
    });

    it("should verify public.table_orders column definitions", () => {
      const block = schemaSql.match(/CREATE TABLE IF NOT EXISTS public\.table_orders \(([\s\S]*?)\);/i)?.[1];
      expect(block).toBeDefined();
      expect(block).toMatch(/id\s+TEXT\s+PRIMARY\s+KEY/i);
      expect(block).toMatch(/invoice_number\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/table_number\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/branch_name\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/payment_method\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/payment_status\s+TEXT\s+NOT\s+NULL\s+DEFAULT\s+'unpaid'/i);
      expect(block).toMatch(/status\s+TEXT\s+NOT\s+NULL\s+DEFAULT\s+'pending'/i);
      expect(block).toMatch(/total_amount\s+NUMERIC\(12,\s*2\)\s+NOT\s+NULL\s+DEFAULT\s+0/i);
      expect(block).toMatch(/created_at\s+TIMESTAMPTZ\s+NOT\s+NULL/i);
    });

    it("should verify public.table_order_items column definitions & cascade foreign key", () => {
      const block = schemaSql.match(/CREATE TABLE IF NOT EXISTS public\.table_order_items \(([\s\S]*?)\);/i)?.[1];
      expect(block).toBeDefined();
      expect(block).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
      expect(block).toMatch(/order_id\s+TEXT\s+(?:NOT\s+NULL\s+)?REFERENCES\s+public\.table_orders\(id\)\s+ON\s+DELETE\s+CASCADE/i);
      expect(block).toMatch(/product_name\s+TEXT\s+NOT\s+NULL/i);
      expect(block).toMatch(/price\s+NUMERIC\(12,\s*2\)\s+NOT\s+NULL/i);
      expect(block).toMatch(/quantity\s+INTEGER\s+NOT\s+NULL\s+DEFAULT\s+1/i);
      expect(block).toMatch(/subtotal\s+NUMERIC\(12,\s*2\)\s+NOT\s+NULL/i);
      expect(block).toMatch(/modifiers_summary\s+TEXT/i);
      expect(block).toMatch(/created_at\s+TIMESTAMPTZ/i);
    });
  });

  describe("Stored Procedure: deduct_product_stock_atomic", () => {
    it("should define deduct_product_stock_atomic with correct signature and security", () => {
      const procRegex = /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.deduct_product_stock_atomic\s*\(\s*p_id\s+UUID,\s*qty\s+INTEGER\s*\)\s*RETURNS\s+JSONB\s+LANGUAGE\s+plpgsql\s+SECURITY\s+DEFINER/i;
      expect(migrationSql).toMatch(procRegex);
      expect(schemaSql).toMatch(procRegex);
    });

    it("should employ row-level locking (FOR UPDATE) on products table", () => {
      expect(migrationSql).toMatch(/SELECT\s+stock\s+INTO\s+v_current_stock\s+FROM\s+public\.products\s+WHERE\s+id\s*=\s*p_id\s+FOR\s+UPDATE;/i);
      expect(schemaSql).toMatch(/SELECT\s+stock\s+INTO\s+v_current_stock\s+FROM\s+public\.products\s+WHERE\s+id\s*=\s*p_id\s+FOR\s+UPDATE;/i);
    });

    it("should handle insufficient stock and negative quantities safely", () => {
      expect(migrationSql).toContain("'insufficient_stock'");
      expect(migrationSql).toContain("'invalid_quantity'");
      expect(migrationSql).toContain("'product_not_found'");
      expect(schemaSql).toContain("'insufficient_stock'");
      expect(schemaSql).toContain("'invalid_quantity'");
      expect(schemaSql).toContain("'product_not_found'");
    });

    it("should perform atomic decrement and return JSON object with remaining stock", () => {
      expect(migrationSql).toMatch(/UPDATE\s+public\.products\s+SET\s+stock\s*=\s*stock\s*-\s*qty/i);
      expect(migrationSql).toContain("jsonb_build_object(\n        'success', true,\n        'remaining_stock', v_new_stock\n    );");
      expect(schemaSql).toMatch(/UPDATE\s+public\.products\s+SET\s+stock\s*=\s*stock\s*-\s*qty/i);
      expect(schemaSql).toContain("jsonb_build_object(\n        'success', true,\n        'remaining_stock', v_new_stock\n    );");
    });
  });

  describe("Strict Row Level Security (RLS) Hardening", () => {
    const allTables = [
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

    it.each(allTables)("should enable ROW LEVEL SECURITY on public.%s", (table) => {
      const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY;`, "i");
      expect(migrationSql).toMatch(rlsRegex);
      expect(schemaSql).toMatch(rlsRegex);
    });

    it("should eliminate any open 'CHECK (true)' or 'Allow public' policies on profiles", () => {
      // Must NOT contain permissive insert policy on profiles
      expect(schemaSql).not.toMatch(/CREATE\s+POLICY\s+.*ON\s+public\.profiles\s+FOR\s+INSERT\s+WITH\s+CHECK\s*\(\s*true\s*\)/i);
      expect(schemaSql).not.toMatch(/Allow\s+public\s+insert\s+profiles/i);
      expect(schemaSql).not.toMatch(/Allow\s+public\s+read\s+profiles/i);

      // Must explicitly drop legacy permissive policies in migration
      expect(migrationSql).toContain('DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;');
      expect(migrationSql).toContain('DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;');

      // Must enforce auth.uid() = id for own profile operations
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"profiles_insert_own"\s+ON\s+public\.profiles\s+FOR\s+INSERT\s+TO\s+authenticated\s+WITH\s+CHECK\s*\(auth\.uid\(\)\s*=\s*id\)/i);
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"profiles_update_own"\s+ON\s+public\.profiles\s+FOR\s+UPDATE\s+TO\s+authenticated\s+USING\s*\(auth\.uid\(\)\s*=\s*id\s+OR\s+public\.is_admin\(\)\)/i);
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"profiles_select_own_or_admin"\s+ON\s+public\.profiles\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\(auth\.uid\(\)\s*=\s*id\s+OR\s+public\.is_admin\(\)\)/i);
    });

    it("should restrict categories & products mutation to authenticated admin while allowing public read", () => {
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"categories_select_public"\s+ON\s+public\.categories\s+FOR\s+SELECT\s+USING\s*\(true\)/i);
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"categories_insert_admin"\s+ON\s+public\.categories\s+FOR\s+INSERT\s+TO\s+authenticated\s+WITH\s+CHECK\s*\(public\.is_admin\(\)\)/i);

      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"products_select_public"\s+ON\s+public\.products\s+FOR\s+SELECT\s+USING\s*\(true\)/i);
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"products_insert_admin"\s+ON\s+public\.products\s+FOR\s+INSERT\s+TO\s+authenticated\s+WITH\s+CHECK\s*\(public\.is_admin\(\)\)/i);
    });

    it("should restrict table_orders anon insert to pending & unpaid status only", () => {
      // Anon must NOT have open CHECK (true)
      expect(schemaSql).not.toMatch(/CREATE\s+POLICY\s+.*ON\s+public\.table_orders\s+FOR\s+INSERT\s+TO\s+anon\s+WITH\s+CHECK\s*\(\s*true\s*\)/i);

      // Anon policy must restrict to pending & unpaid
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"table_orders_insert_anon_pending"\s+ON\s+public\.table_orders\s+FOR\s+INSERT\s+TO\s+anon\s+WITH\s+CHECK\s*\(status\s*=\s*'pending'\s+AND\s+payment_status\s*=\s*'unpaid'\)/i);

      // Order items insertion for anon must check parent table_orders status
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"table_order_items_insert_anon_pending"\s+ON\s+public\.table_order_items\s+FOR\s+INSERT\s+TO\s+anon\s+WITH\s+CHECK\s*\([\s\S]*?EXISTS\s*\([\s\S]*?status\s*=\s*'pending'[\s\S]*?payment_status\s*=\s*'unpaid'[\s\S]*?\)\s*\)/i);
    });

    it("should restrict cashier_shifts and transactions to authenticated staff with NO public access", () => {
      // Must drop old permissive transaction policies
      expect(migrationSql).toContain('DROP POLICY IF EXISTS "Allow public read transactions" ON public.transactions;');
      expect(migrationSql).toContain('DROP POLICY IF EXISTS "Allow public insert transactions" ON public.transactions;');
      expect(migrationSql).toContain('DROP POLICY IF EXISTS "Allow public insert transaction_items" ON public.transaction_items;');

      // Transactions must be TO authenticated
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"transactions_select_staff"\s+ON\s+public\.transactions\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\(true\)/i);
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"transactions_insert_staff"\s+ON\s+public\.transactions\s+FOR\s+INSERT\s+TO\s+authenticated\s+WITH\s+CHECK\s*\(true\)/i);

      // Cashier shifts must be TO authenticated
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"cashier_shifts_select_staff"\s+ON\s+public\.cashier_shifts\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\(true\)/i);
      expect(schemaSql).toMatch(/CREATE\s+POLICY\s+"cashier_shifts_insert_staff"\s+ON\s+public\.cashier_shifts\s+FOR\s+INSERT\s+TO\s+authenticated\s+WITH\s+CHECK\s*\(true\)/i);

      // Public anon cannot insert into cashier shifts or transactions
      expect(schemaSql).not.toMatch(/ON\s+public\.cashier_shifts\s+FOR\s+INSERT\s+TO\s+anon/i);
      expect(schemaSql).not.toMatch(/ON\s+public\.transactions\s+FOR\s+INSERT\s+TO\s+anon/i);
    });

    it("should restrict branches, ingredients, recipes, and recipe_ingredients to authenticated staff", () => {
      const operationalTables = ["branches", "ingredients", "recipes", "recipe_ingredients"];
      for (const tbl of operationalTables) {
        expect(schemaSql).toMatch(new RegExp(`CREATE\\s+POLICY\\s+"${tbl}_select_staff"\\s+ON\\s+public\\.${tbl}\\s+FOR\\s+SELECT\\s+TO\\s+authenticated`, "i"));
        expect(schemaSql).toMatch(new RegExp(`CREATE\\s+POLICY\\s+"${tbl}_insert_staff"\\s+ON\\s+public\\.${tbl}\\s+FOR\\s+INSERT\\s+TO\\s+authenticated`, "i"));
        expect(schemaSql).toMatch(new RegExp(`CREATE\\s+POLICY\\s+"${tbl}_update_staff"\\s+ON\\s+public\\.${tbl}\\s+FOR\\s+UPDATE\\s+TO\\s+authenticated`, "i"));
      }
    });
  });

  describe("Performance Indexes", () => {
    const expectedIndexes = [
      "idx_products_category_id",
      "idx_transaction_items_transaction_id",
      "idx_transaction_items_product_id",
      "idx_ingredients_branch_id",
      "idx_recipes_branch_id",
      "idx_recipe_ingredients_recipe_id",
      "idx_recipe_ingredients_ingredient_id",
      "idx_table_order_items_order_id",
      "idx_branches_name",
      "idx_ingredients_category",
      "idx_recipes_product_name",
      "idx_cashier_shifts_status",
      "idx_cashier_shifts_branch_name",
      "idx_cashier_shifts_start_time",
      "idx_table_orders_invoice_number",
      "idx_table_orders_status",
      "idx_table_orders_payment_status",
      "idx_table_orders_branch_name",
      "idx_transactions_invoice_number",
      "idx_transactions_status",
    ];

    it.each(expectedIndexes)("should create index %s in both migration and schema.sql", (idx) => {
      const indexRegex = new RegExp(`CREATE\\s+INDEX\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${idx}\\s+ON\\s+public\\.`, "i");
      expect(migrationSql).toMatch(indexRegex);
      expect(schemaSql).toMatch(indexRegex);
    });
  });
});
