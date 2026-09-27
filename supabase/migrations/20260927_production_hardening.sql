-- ============================================================
-- GROWKAS PRODUCTION HARDENING MIGRATION
-- Migration Date: 2026-09-27
-- Description:
--   1. Create relational tables: branches, ingredients, recipes,
--      recipe_ingredients, cashier_shifts, table_orders, table_order_items
--   2. Implement atomic stock decrement RPC procedure (row-locking)
--   3. Drop permissive RLS policies and apply hardened, strict RLS
--   4. Create performance indexes for foreign keys, statuses, and dates
-- ============================================================

-- ------------------------------------------------------------
-- 1. HELPER FUNCTIONS FOR ROLE-BASED ACCESS CONTROL (RLS)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- ------------------------------------------------------------
-- 2. RELATIONAL TABLES CREATION
-- ------------------------------------------------------------

-- Cabang (Branches)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    address TEXT,
    target_revenue NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bahan Baku (Ingredients)
CREATE TABLE IF NOT EXISTS public.ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    stock NUMERIC(12, 2) DEFAULT 0,
    min_stock NUMERIC(12, 2) DEFAULT 0,
    cost_per_unit NUMERIC(12, 2) DEFAULT 0,
    category TEXT,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Resep Produk (Recipes)
CREATE TABLE IF NOT EXISTS public.recipes (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    selling_price NUMERIC(12, 2) DEFAULT 0,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    modifier_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Komposisi Resep (Recipe Ingredients)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id TEXT NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sesi Kasir / Shift (Cashier Shifts)
CREATE TABLE IF NOT EXISTS public.cashier_shifts (
    id TEXT PRIMARY KEY,
    cashier_name TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_time TIMESTAMPTZ,
    initial_cash NUMERIC(12, 2) DEFAULT 0,
    expected_cash NUMERIC(12, 2) DEFAULT 0,
    actual_cash NUMERIC(12, 2) DEFAULT 0,
    discrepancy NUMERIC(12, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pesanan Meja / QR Self Order (Table Orders)
CREATE TABLE IF NOT EXISTS public.table_orders (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    table_number TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Detail Item Pesanan Meja (Table Order Items)
CREATE TABLE IF NOT EXISTS public.table_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.table_orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal NUMERIC(12, 2) NOT NULL,
    modifiers_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 3. STORED PROCEDURE: ATOMIC PRODUCT STOCK DECREMENT
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_product_stock_atomic(
    p_id UUID,
    qty INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    IF qty <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_quantity'
        );
    END IF;

    -- Row-level lock (FOR UPDATE) ensures atomic concurrency control
    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = p_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'product_not_found'
        );
    END IF;

    IF v_current_stock < qty THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'insufficient_stock',
            'current_stock', v_current_stock,
            'requested_qty', qty
        );
    END IF;

    UPDATE public.products
    SET stock = stock - qty,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_id
    RETURNING stock INTO v_new_stock;

    RETURN jsonb_build_object(
        'success', true,
        'remaining_stock', v_new_stock
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_product_stock_atomic(UUID, INTEGER) TO authenticated, service_role;

-- ------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ------------------------------------------------------------
-- Foreign keys
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON public.transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_branch_id ON public.ingredients(branch_id);
CREATE INDEX IF NOT EXISTS idx_recipes_branch_id ON public.recipes(branch_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON public.recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_table_order_items_order_id ON public.table_order_items(order_id);

-- Lookup, Status & Sorting
CREATE INDEX IF NOT EXISTS idx_branches_name ON public.branches(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON public.ingredients(category);
CREATE INDEX IF NOT EXISTS idx_recipes_product_name ON public.recipes(product_name);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_status ON public.cashier_shifts(status);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_branch_name ON public.cashier_shifts(branch_name);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_start_time ON public.cashier_shifts(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_created_at ON public.cashier_shifts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_orders_invoice_number ON public.table_orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_table_orders_status ON public.table_orders(status);
CREATE INDEX IF NOT EXISTS idx_table_orders_payment_status ON public.table_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_table_orders_branch_name ON public.table_orders(branch_name);
CREATE INDEX IF NOT EXISTS idx_table_orders_created_at ON public.table_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_number ON public.transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) HARDENING
-- ------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_order_items ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert transaction_items" ON public.transaction_items;

-- Drop previous hardened policies if re-running
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;

DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;

DROP POLICY IF EXISTS "branches_select_staff" ON public.branches;
DROP POLICY IF EXISTS "branches_insert_staff" ON public.branches;
DROP POLICY IF EXISTS "branches_update_staff" ON public.branches;
DROP POLICY IF EXISTS "branches_delete_staff" ON public.branches;

DROP POLICY IF EXISTS "ingredients_select_staff" ON public.ingredients;
DROP POLICY IF EXISTS "ingredients_insert_staff" ON public.ingredients;
DROP POLICY IF EXISTS "ingredients_update_staff" ON public.ingredients;
DROP POLICY IF EXISTS "ingredients_delete_staff" ON public.ingredients;

DROP POLICY IF EXISTS "recipes_select_staff" ON public.recipes;
DROP POLICY IF EXISTS "recipes_insert_staff" ON public.recipes;
DROP POLICY IF EXISTS "recipes_update_staff" ON public.recipes;
DROP POLICY IF EXISTS "recipes_delete_staff" ON public.recipes;

DROP POLICY IF EXISTS "recipe_ingredients_select_staff" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_insert_staff" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_update_staff" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_delete_staff" ON public.recipe_ingredients;

DROP POLICY IF EXISTS "cashier_shifts_select_staff" ON public.cashier_shifts;
DROP POLICY IF EXISTS "cashier_shifts_insert_staff" ON public.cashier_shifts;
DROP POLICY IF EXISTS "cashier_shifts_update_staff" ON public.cashier_shifts;
DROP POLICY IF EXISTS "cashier_shifts_delete_staff" ON public.cashier_shifts;

DROP POLICY IF EXISTS "transactions_select_staff" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_staff" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_staff" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_admin" ON public.transactions;

DROP POLICY IF EXISTS "transaction_items_select_staff" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_insert_staff" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_update_staff" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_delete_admin" ON public.transaction_items;

DROP POLICY IF EXISTS "table_orders_insert_anon_pending" ON public.table_orders;
DROP POLICY IF EXISTS "table_orders_insert_staff" ON public.table_orders;
DROP POLICY IF EXISTS "table_orders_select_staff" ON public.table_orders;
DROP POLICY IF EXISTS "table_orders_update_staff" ON public.table_orders;
DROP POLICY IF EXISTS "table_orders_delete_staff" ON public.table_orders;

DROP POLICY IF EXISTS "table_order_items_insert_anon_pending" ON public.table_order_items;
DROP POLICY IF EXISTS "table_order_items_insert_staff" ON public.table_order_items;
DROP POLICY IF EXISTS "table_order_items_select_staff" ON public.table_order_items;
DROP POLICY IF EXISTS "table_order_items_update_staff" ON public.table_order_items;
DROP POLICY IF EXISTS "table_order_items_delete_staff" ON public.table_order_items;

-- 5.1 PROFILES POLICIES
-- Users can only read their own profile, admins can read all
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_admin());

-- Users can only insert their own profile matching auth.uid()
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can only update their own profile, admins can update any
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- Only admins can delete profiles
CREATE POLICY "profiles_delete_admin" ON public.profiles
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 5.2 CATEGORIES POLICIES
-- Public can view categories
CREATE POLICY "categories_select_public" ON public.categories
    FOR SELECT
    USING (true);

-- Only admins can create/update/delete categories
CREATE POLICY "categories_insert_admin" ON public.categories
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "categories_update_admin" ON public.categories
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "categories_delete_admin" ON public.categories
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 5.3 PRODUCTS POLICIES
-- Public can view products
CREATE POLICY "products_select_public" ON public.products
    FOR SELECT
    USING (true);

-- Only admins can create/update/delete products
CREATE POLICY "products_insert_admin" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "products_update_admin" ON public.products
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "products_delete_admin" ON public.products
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 5.4 BRANCHES POLICIES
-- Authenticated staff can view, insert, update, and delete branches
CREATE POLICY "branches_select_staff" ON public.branches
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "branches_insert_staff" ON public.branches
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "branches_update_staff" ON public.branches
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "branches_delete_staff" ON public.branches
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 5.5 INGREDIENTS POLICIES
-- Authenticated staff can view, insert, update, and delete ingredients
CREATE POLICY "ingredients_select_staff" ON public.ingredients
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "ingredients_insert_staff" ON public.ingredients
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "ingredients_update_staff" ON public.ingredients
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "ingredients_delete_staff" ON public.ingredients
    FOR DELETE TO authenticated
    USING (true);

-- 5.6 RECIPES POLICIES
-- Authenticated staff can view, insert, update, and delete recipes
CREATE POLICY "recipes_select_staff" ON public.recipes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "recipes_insert_staff" ON public.recipes
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "recipes_update_staff" ON public.recipes
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "recipes_delete_staff" ON public.recipes
    FOR DELETE TO authenticated
    USING (true);

-- 5.7 RECIPE INGREDIENTS POLICIES
-- Authenticated staff can view, insert, update, and delete recipe ingredients
CREATE POLICY "recipe_ingredients_select_staff" ON public.recipe_ingredients
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "recipe_ingredients_insert_staff" ON public.recipe_ingredients
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "recipe_ingredients_update_staff" ON public.recipe_ingredients
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "recipe_ingredients_delete_staff" ON public.recipe_ingredients
    FOR DELETE TO authenticated
    USING (true);

-- 5.8 CASHIER SHIFTS POLICIES
-- Restricted to authenticated staff
CREATE POLICY "cashier_shifts_select_staff" ON public.cashier_shifts
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "cashier_shifts_insert_staff" ON public.cashier_shifts
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "cashier_shifts_update_staff" ON public.cashier_shifts
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "cashier_shifts_delete_staff" ON public.cashier_shifts
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 5.9 TRANSACTIONS & ITEMS POLICIES
-- Restricted to authenticated staff
CREATE POLICY "transactions_select_staff" ON public.transactions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "transactions_insert_staff" ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "transactions_update_staff" ON public.transactions
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "transactions_delete_admin" ON public.transactions
    FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "transaction_items_select_staff" ON public.transaction_items
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "transaction_items_insert_staff" ON public.transaction_items
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "transaction_items_update_staff" ON public.transaction_items
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "transaction_items_delete_admin" ON public.transaction_items
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 5.10 TABLE ORDERS POLICIES
-- Public anon can ONLY insert new orders with status = 'pending' and payment_status = 'unpaid'
CREATE POLICY "table_orders_insert_anon_pending" ON public.table_orders
    FOR INSERT TO anon
    WITH CHECK (status = 'pending' AND payment_status = 'unpaid');

CREATE POLICY "table_orders_insert_staff" ON public.table_orders
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "table_orders_select_staff" ON public.table_orders
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "table_orders_update_staff" ON public.table_orders
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "table_orders_delete_staff" ON public.table_orders
    FOR DELETE TO authenticated
    USING (true);

-- 5.11 TABLE ORDER ITEMS POLICIES
-- Public anon can ONLY insert items linked to an existing pending and unpaid order
CREATE POLICY "table_order_items_insert_anon_pending" ON public.table_order_items
    FOR INSERT TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.table_orders
            WHERE public.table_orders.id = table_order_items.order_id
              AND public.table_orders.status = 'pending'
              AND public.table_orders.payment_status = 'unpaid'
        )
    );

CREATE POLICY "table_order_items_insert_staff" ON public.table_order_items
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "table_order_items_select_staff" ON public.table_order_items
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "table_order_items_update_staff" ON public.table_order_items
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "table_order_items_delete_staff" ON public.table_order_items
    FOR DELETE TO authenticated
    USING (true);
