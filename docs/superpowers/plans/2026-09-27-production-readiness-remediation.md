# Growkas Production Readiness & Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all critical and high-priority vulnerabilities, bugs, and architectural flaws identified in the full software engineering audit (Items 1–25) to transform Growkas from an ephemeral prototype into a secure, robust, and production-ready enterprise POS platform.

**Architecture:** 
1. **Security & Auth Layer**: Enforce server-side route protection via Next.js middleware and session-validated Server Actions; eliminate hardcoded secrets and prevent privilege escalation during registration.
2. **Persistence & Data Layer**: Replace ephemeral `/tmp` serverless storage (`storeManager.ts`) with a full relational schema in Supabase PostgreSQL (`ingredients`, `recipes`, `shifts`, `branches`, `table_orders`), protected by strict Row Level Security (RLS) and atomic stock decrement procedures (RPC).
3. **Quality & Reliability Layer**: Build a comprehensive Vitest unit and integration test suite, create a GitHub Actions CI pipeline, and add `/api/health` observability probes.

**Tech Stack:** Next.js 16.3.4 (App Router, Server Actions), React 19, Supabase (PostgreSQL, SSR, RLS), NextAuth.js v5-beta, Vitest 1.6.1, TypeScript 5.

**Spec Reference:** Audit Report (Sections 1–25)

## Global Constraints
- Strictly zero hardcoded API keys or service role secrets in Git-tracked files.
- All Server Actions must validate caller session and role permissions before mutating data.
- Inventory decrements must be atomic and protected against concurrency race conditions.
- Vitest test suite must pass with 100% green status (`npm test`).
- Production build must succeed with 0 type errors (`npm run build`).

---

### Task 1: Security Hardening — Purge Hardcoded Secrets & Lock Registration Role

**Files:**
- Modify: `growkas/app/actions/geminiMenuActions.ts:14-26`
- Modify: `growkas/lib/supabase/admin.ts:3-16`
- Modify: `growkas/app/actions/authActions.ts:5-40`
- Test: `growkas/tests/unit/security-auth.test.ts`

**Interfaces:**
- `registerWithSupabase(formData: { email: string; password: string; fullName: string })`: Role must be strictly forced to `"kasir"` server-side.
- `createAdminClient()`: Must require environment variables; never fall back to hardcoded production keys.
- `extractMenuWithGeminiVision()`: Must require `process.env.GEMINI_API_KEY` without embedded Base64 fallback.

- [ ] **Step 1: Write failing security unit test**
Create `growkas/tests/unit/security-auth.test.ts` to assert that:
1. `geminiMenuActions.ts` does not contain the Base64 key string `QVEuQWI4Uk42SUJLSHJ2SU5qT3FMX0ExcTRBbHdGd0lQS0lsNDFqaE5VWGlrUWl0UnBtV0E=`.
2. `lib/supabase/admin.ts` does not contain hardcoded fallback keys.
3. `registerWithSupabase` overrides any client-supplied role with `"kasir"`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/security-auth.test.ts`

- [ ] **Step 3: Remove hardcoded secrets from `geminiMenuActions.ts` and `lib/supabase/admin.ts`**
Remove `DEFAULT_KEY_B64` and `DEFAULT_GEMINI_API_KEY` from `geminiMenuActions.ts`. Check `process.env.GEMINI_API_KEY` directly; if missing, return a clean error.
Remove fallback strings `"https://pijpptetccvgmwyjvsse.supabase.co"` and `"sb_publishable_..."` from `lib/supabase/admin.ts`. Throw a descriptive error if environment variables are not set.

- [ ] **Step 4: Lock registration role to "kasir" in `authActions.ts`**
Remove `role` from the input parameter of `registerWithSupabase` and hardcode `role: "kasir"` in both `supabase.auth.signUp` metadata and `public.profiles` upsert.

- [ ] **Step 5: Run tests and verify they pass**
Run: `npx vitest run tests/unit/security-auth.test.ts`

- [ ] **Step 6: Commit changes**
`git commit -m "fix(security): purge hardcoded secrets and lock registration role to kasir"`

---

### Task 2: Authentication & Route Protection — Enforce Middleware & Action Guards

**Files:**
- Modify: `growkas/proxy.ts`
- Modify: `growkas/auth.ts:70-75`
- Create: `growkas/lib/authGuard.ts`
- Modify: `growkas/app/actions/branchActions.ts`
- Modify: `growkas/app/actions/posActions.ts`
- Modify: `growkas/app/actions/orderActions.ts`
- Modify: `growkas/app/actions/ingredientActions.ts`
- Test: `growkas/tests/unit/auth-guard.test.ts`

**Interfaces:**
- `assertAuthenticated(): Promise<{ userId: string; role: string; email: string }>`
- `assertRole(allowedRoles: string[]): Promise<{ userId: string; role: string; email: string }>`

- [ ] **Step 1: Write failing unit test for `authGuard.ts`**
Test that `assertRole(["admin"])` throws an `Unauthorized` error when user has `"kasir"` role, and succeeds when user has `"admin"` role.

- [ ] **Step 2: Implement `growkas/lib/authGuard.ts`**
Create helper functions that read the server session from NextAuth or Supabase SSR cookies, extracting `user.id`, `user.email`, and `user.role`.

- [ ] **Step 3: Update `growkas/proxy.ts` and `growkas/auth.ts`**
In `proxy.ts`, remove `dashboard` from the matcher exemption list so that `/dashboard`, `/kitchen`, etc. are protected. In `auth.ts`, update `authorized` callback to verify `!!auth?.user` for dashboard and kitchen routes.

- [ ] **Step 4: Protect Server Actions with `assertRole` and `assertAuthenticated`**
- `deleteBranch`: Require `assertRole(["admin"])`.
- `addBranch`: Require `assertRole(["admin"])`.
- `clearAllTableOrders`: Require `assertRole(["admin"])`.
- `updateIngredientStockManual`: Require `assertRole(["admin"])`.
- `saveTransaction`: Require `assertAuthenticated()`.

- [ ] **Step 5: Run test and verify it passes**
Run: `npx vitest run tests/unit/auth-guard.test.ts`

- [ ] **Step 6: Commit changes**
`git commit -m "fix(auth): protect routes in middleware and enforce RBAC guards on server actions"`

---

### Task 3: Database Schema & RLS Hardening — Full Relational Migration

**Files:**
- Modify: `growkas/supabase/schema.sql`
- Create: `growkas/supabase/migrations/20260927_production_hardening.sql`
- Test: `growkas/tests/unit/database-schema.test.ts`

**Interfaces:**
- Tables to formalize:
  - `public.branches` (`id UUID PRIMARY KEY`, `name TEXT`, `city TEXT`, `address TEXT`, `target_revenue NUMERIC`)
  - `public.ingredients` (`id TEXT PRIMARY KEY`, `name TEXT`, `unit TEXT`, `stock NUMERIC`, `min_stock NUMERIC`, `cost_per_unit NUMERIC`, `category TEXT`, `branch_id UUID REFERENCES branches(id)`)
  - `public.recipes` (`id TEXT PRIMARY KEY`, `product_name TEXT`, `selling_price NUMERIC`, `branch_id UUID REFERENCES branches(id)`, `modifier_config JSONB`)
  - `public.recipe_ingredients` (`id UUID PRIMARY KEY`, `recipe_id TEXT REFERENCES recipes(id)`, `ingredient_id TEXT REFERENCES ingredients(id)`, `quantity NUMERIC`, `unit TEXT`)
  - `public.cashier_shifts` (`id TEXT PRIMARY KEY`, `cashier_name TEXT`, `branch_name TEXT`, `start_time TIMESTAMPTZ`, `end_time TIMESTAMPTZ`, `initial_cash NUMERIC`, `expected_cash NUMERIC`, `actual_cash NUMERIC`, `discrepancy NUMERIC`, `status TEXT`)
  - `public.table_orders` (`id TEXT PRIMARY KEY`, `invoice_number TEXT`, `table_number TEXT`, `branch_name TEXT`, `payment_method TEXT`, `payment_status TEXT`, `status TEXT`, `total_amount NUMERIC`, `created_at TIMESTAMPTZ`)
  - `public.table_order_items` (`id UUID PRIMARY KEY`, `order_id TEXT REFERENCES table_orders(id)`, `product_name TEXT`, `price NUMERIC`, `quantity INTEGER`, `subtotal NUMERIC`, `modifiers_summary TEXT`)
- PostgreSQL Stored Procedure:
  - `deduct_product_stock_atomic(p_id UUID, qty INTEGER)`: Row-level lock (`SELECT ... FOR UPDATE`) and atomic decrement.

- [ ] **Step 1: Write migration SQL file**
Create `growkas/supabase/migrations/20260927_production_hardening.sql` containing all new table definitions, indexes, foreign keys, atomic RPC function, and restricted RLS policies:
- Authenticated staff can read/write orders, shifts, and inventory.
- Public anon users can only read products/categories and insert table orders with status `"pending"`.
- User profiles can only be read/updated by their respective owners (`auth.uid() = id`).

- [ ] **Step 2: Update `growkas/supabase/schema.sql` to match production standard**
Ensure `schema.sql` is fully up-to-date and complete for fresh environments.

- [ ] **Step 3: Execute migration in Supabase via Node.js script or SQL client**
Run database setup script using the service role client.

- [ ] **Step 4: Verify tables and indexes exist in Supabase**
Run automated check script asserting 200 OK across all newly created tables.

- [ ] **Step 5: Commit changes**
`git commit -m "feat(database): migrate relational tables, atomic decrement RPC, and strict RLS policies"`

---

### Task 4: Storage Architecture Refactoring — Eliminate `/tmp` Ephemeral Store

**Files:**
- Modify: `growkas/app/actions/storeManager.ts`
- Modify: `growkas/app/actions/posActions.ts`
- Modify: `growkas/app/actions/ingredientActions.ts`
- Modify: `growkas/app/actions/shiftActions.ts`
- Modify: `growkas/app/actions/orderActions.ts`
- Test: `growkas/tests/integration/supabase-store.test.ts`

**Interfaces:**
- Replace synchronous `loadMasterStore()` / `saveMasterStore()` file operations with direct Supabase database queries.
- Maintain seamless in-memory fallback for offline test environments, but synchronize directly with Supabase in production/Vercel.

- [ ] **Step 1: Write failing integration test for inventory & shift persistence**
Test that adding an ingredient and opening a shift persists to Supabase and is retrieved cleanly.

- [ ] **Step 2: Refactor `ingredientActions.ts` to use Supabase repository**
Update `getIngredientsAndCOGS`, `restockIngredient`, `addNewIngredient`, and `updateIngredientStockManual` to query and update `public.ingredients`.

- [ ] **Step 3: Refactor `shiftActions.ts` to use `public.cashier_shifts`**
Update `getActiveShift`, `openShift`, `recordSaleToActiveShift`, and `closeShift` to read and write directly from `public.cashier_shifts`.

- [ ] **Step 4: Refactor `orderActions.ts` to use `public.table_orders`**
Update `getTableOrders`, `createTableOrder`, `updateTableOrderStatus`, and `deleteTableOrder` to operate on `public.table_orders` and `public.table_order_items`.

- [ ] **Step 5: Run integration tests to verify persistence**
Run: `npx vitest run tests/integration/supabase-store.test.ts`

- [ ] **Step 6: Commit changes**
`git commit -m "refactor(storage): replace ephemeral /tmp store with Supabase PostgreSQL tables"`

---

### Task 5: Bug & Concurrency Fixes — Atomic Inventory & Verified QRIS Orders

**Files:**
- Modify: `growkas/app/actions/posActions.ts`
- Modify: `growkas/app/order/page.tsx`
- Modify: `growkas/app/actions/orderActions.ts`
- Modify: `growkas/app/actions/aiMenuActions.ts`
- Test: `growkas/tests/unit/order-concurrency.test.ts`

**Interfaces:**
- `posActions.ts:saveTransaction`: Uses PostgreSQL atomic decrement RPC or atomic update SQL.
- `order/page.tsx`: Self-orders default to `payment_status: "unpaid"` (or `"pending_verification"`) instead of granting instant `"paid"` without a gateway.
- `aiMenuActions.ts:batchAddProducts`: Fix schema alignment (`category_id` instead of invalid `category` column) and propagate real errors instead of fake success.

- [ ] **Step 1: Write failing unit test for atomic decrement and error propagation**
Test that `aiMenuActions.ts` reports real errors when insertion fails, and `saveTransaction` decrements stock atomically.

- [ ] **Step 2: Implement atomic stock decrement in `posActions.ts`**
Replace sequential `select`-then-`update` loop with atomic SQL update:
`UPDATE products SET stock = GREATEST(0, stock - :qty) WHERE id = :id`

- [ ] **Step 3: Fix `aiMenuActions.ts` schema bug and error swallowing**
Map `item.category` to appropriate `category_id` UUID, and return `{ success: false, error: error.message }` when Supabase insertion errors out.

- [ ] **Step 4: Fix QR Self-Ordering payment status**
In `order/page.tsx` and `createTableOrder`, mark QR orders as `payment_status: "pending_cashier"` or `"unpaid"` until verified by cashier or payment provider.

- [ ] **Step 5: Run tests and verify they pass**
Run: `npx vitest run tests/unit/order-concurrency.test.ts`

- [ ] **Step 6: Commit changes**
`git commit -m "fix(order): implement atomic inventory decrement, fix AI scan schema, and secure QR payment state"`

---

### Task 6: Observability, Health Probes & CI/CD Pipeline

**Files:**
- Create: `growkas/app/api/health/route.ts`
- Create: `growkas/.github/workflows/ci.yml`
- Test: `growkas/tests/integration/health-api.test.ts`

**Interfaces:**
- `GET /api/health`: Returns `{ status: "ok", timestamp: string, database: "connected" | "degraded", version: string }`.
- GitHub Actions CI: Runs on push to `main` and all Pull Requests: `npm run lint`, `npm test`, `npm run build`.

- [ ] **Step 1: Write test for `/api/health`**
Assert `GET /api/health` returns status 200 with JSON payload containing `status: "ok"`.

- [ ] **Step 2: Create `growkas/app/api/health/route.ts`**
Implement health probe that tests Supabase database connectivity with a lightweight `SELECT 1` query.

- [ ] **Step 3: Create GitHub Actions workflow `.github/workflows/ci.yml`**
Configure automated CI pipeline:
```yaml
name: CI Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

- [ ] **Step 4: Run full verification suite**
Run: `npm test` and `npm run build` locally.

- [ ] **Step 5: Commit changes**
`git commit -m "ci: add GitHub Actions workflow and /api/health observability probe"`

---

## Plan Review & Verification Checklist
1. All 5 critical production blockers from the audit are addressed.
2. Every task contains exact file targets, step-by-step instructions, and test commands.
3. Zero placeholders or vague "TODO" instructions.
4. Preserves 100% Turbopack build compatibility.
