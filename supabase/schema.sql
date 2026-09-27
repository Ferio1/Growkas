-- ============================================================
-- SCHEMA DATABASE UTAMA GROWKAS (Supabase PostgreSQL)
-- Copy dan jalankan skrip ini di SQL Editor di Dashboard Supabase:
-- https://supabase.com/dashboard/project/pijpptetccvgmwyjvsse/sql
-- ============================================================

-- ------------------------------------------------------------
-- 0. EKSTENSI & HELPER FUNCTIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Helper function to check if table order is pending & unpaid (bypasses RLS SELECT denial for anon)
CREATE OR REPLACE FUNCTION public.is_order_pending_unpaid(p_order_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.table_orders
        WHERE id = p_order_id
          AND status = 'pending'
          AND payment_status = 'unpaid'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_order_pending_unpaid(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------
-- 1. PROFIL PENGGUNA (PROFILES)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'kasir',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 2. KATEGORI PRODUK (CATEGORIES)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 3. CABANG OUTLET (BRANCHES)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    address TEXT,
    target_revenue NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 4. PRODUK (PRODUCTS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost NUMERIC(12, 2) DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    barcode TEXT UNIQUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 5. BAHAN BAKU (INGREDIENTS)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 6. RESEP PRODUK (RECIPES)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipes (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    selling_price NUMERIC(12, 2) DEFAULT 0,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    modifier_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 7. KOMPOSISI RESEP (RECIPE INGREDIENTS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id TEXT NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 8. SESI KASIR / SHIFT (CASHIER SHIFTS)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 9. TRANSAKSI PENJUALAN KASIR (TRANSACTIONS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'qris', 'debit', 'credit'
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    change_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cashier_name TEXT,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 10. ITEM TRANSAKSI PENJUALAN (TRANSACTION ITEMS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 11. PESANAN MEJA / QR SELF ORDER (TABLE ORDERS)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 12. ITEM PESANAN MEJA (TABLE ORDER ITEMS)
-- ------------------------------------------------------------
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
-- 13. STORED PROCEDURE: PENGURANGAN STOK ATOMIK (RPC)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_product_stock_atomic(
    p_id UUID,
    qty INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    -- Row-level lock (FOR UPDATE) mencegah race condition
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
-- 14. PERFORMANCE INDEXES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON public.transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_branch_id ON public.ingredients(branch_id);
CREATE INDEX IF NOT EXISTS idx_recipes_branch_id ON public.recipes(branch_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON public.recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_table_order_items_order_id ON public.table_order_items(order_id);

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
-- 15. ROW LEVEL SECURITY (RLS) HARDENING
-- ------------------------------------------------------------
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

-- 15.1 PROFILES POLICIES
-- Pengguna hanya dapat membaca profil milik sendiri, admin membaca semua
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_admin" ON public.profiles
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 15.2 CATEGORIES POLICIES
-- Publik dapat melihat daftar kategori
CREATE POLICY "categories_select_public" ON public.categories
    FOR SELECT
    USING (true);

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

-- 15.3 PRODUCTS POLICIES
-- Publik dapat melihat katalog produk
CREATE POLICY "products_select_public" ON public.products
    FOR SELECT
    USING (true);

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

-- 15.4 BRANCHES POLICIES
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

-- 15.5 INGREDIENTS POLICIES
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

-- 15.6 RECIPES POLICIES
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

-- 15.7 RECIPE INGREDIENTS POLICIES
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

-- 15.8 CASHIER SHIFTS POLICIES
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

-- 15.9 TRANSACTIONS & ITEMS POLICIES
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

-- 15.10 TABLE ORDERS POLICIES
-- Anon publik hanya boleh memasukkan pesanan meja berstatus pending & unpaid
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

-- 15.11 TABLE ORDER ITEMS POLICIES
-- Anon publik hanya boleh memasukkan item untuk order yang pending & unpaid
CREATE POLICY "table_order_items_insert_anon_pending" ON public.table_order_items
    FOR INSERT TO anon
    WITH CHECK (public.is_order_pending_unpaid(order_id));

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

-- ------------------------------------------------------------
-- 16. DATA AWAL (SEED SAMPLE DATA)
-- ------------------------------------------------------------
INSERT INTO public.categories (name) VALUES 
('Makanan'), ('Minuman'), ('Sembako')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.products (name, price, stock, barcode) VALUES
('Kopi Kenangan Mantan', 18000, 50, '8991001001'),
('Roti Tawar Bandung', 15000, 30, '8991001002'),
('Minyak Goreng 1L', 14500, 100, '8991001003')
ON CONFLICT (barcode) DO NOTHING;
