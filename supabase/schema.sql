-- ============================================================
-- SCHEMA DATABASE GROWKAS (Supabase PostgreSQL)
-- Copy dan jalankan skrip ini di SQL Editor di Dashboard Supabase:
-- https://supabase.com/dashboard/project/pijpptetccvgmwyjvsse/sql
-- ============================================================

-- 1. KATEGORI PRODUK
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PRODUK
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

-- 3. TRANSAKSI (PENJUALAN)
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

-- 4. ITEM TRANSAKSI
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik (Bisa disesuaikan nanti dengan auth)
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert transaction_items" ON public.transaction_items FOR INSERT WITH CHECK (true);

-- DATA SAMPEL UNTUK COBA
INSERT INTO public.categories (name) VALUES 
('Makanan'), ('Minuman'), ('Sembako')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.products (name, price, stock, barcode) VALUES
('Kopi Kenangan Mantan', 18000, 50, '8991001001'),
('Roti Tawar Bandung', 15000, 30, '8991001002'),
('Minyak Goreng 1L', 14500, 100, '8991001003')
ON CONFLICT (barcode) DO NOTHING;
