-- ==============================================================================
-- DATABASE SCHEMA: GARASI ANAK MAMA ("Ada doa mama di setiap mobil")
-- Target: Supabase (PostgreSQL 15+)
-- Fitur: Unit Accounting (HPP), Multi-Wallet Cashflow, Investor Split, RLS
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE unit_status AS ENUM (
    'workshop',  -- Bahan / Masuk Bengkel
    'ready',     -- Siap Jual / Display
    'booked',    -- Sudah Terima DP / Booking Fee
    'sold'       -- Terjual
);

CREATE TYPE transmission_type AS ENUM (
    'AT',        -- Automatic
    'MT'         -- Manual
);

CREATE TYPE recondition_category AS ENUM (
    'mesin',           -- Mesin / Servis / Tune-up
    'kaki_kaki',       -- Kaki-kaki / Suspensi / Ban
    'body_cat',        -- Body / Cat / Spet / Bumper
    'salon_detailing', -- Salon / Detailing / Poles
    'pajak_surat',     -- Pajak / Mutasi / Balik Nama
    'towing_bensin',   -- Towing / Bensin / Tol
    'mediator',        -- Komisi / Mediator Pembelian
    'lainnya'          -- Lain-lain
);

CREATE TYPE transaction_type AS ENUM (
    'inflow',   -- Kas Masuk
    'outflow',  -- Kas Keluar
    'transfer'  -- Pindah Buku Antar Dompet
);

CREATE TYPE cash_category AS ENUM (
    'buy_unit',                 -- Beli Unit Mobil
    'recondition',              -- Biaya Rekondisi Unit
    'dp_in',                    -- DP / Booking Fee Masuk
    'car_sale',                 -- Pelunasan Jual Unit
    'selling_expense',          -- Biaya Komisi Jual / Iklan Mobil
    'capital_deposit',          -- Setor Modal (Garasi / Investor)
    'prive_withdrawal',         -- Tarik Prive / Profit Owner
    'operational',              -- Biaya Operasional Garasi (Sewa, Listrik, ATK)
    'marketing',                -- Iklan / Konten Sosial Media
    'transfer_between_wallets', -- Pindah Dana Antar Rekening & Cash
    'partner_profit_payout',    -- Pembayaran Bagi Hasil Investor
    'other'                     -- Lainnya
);

CREATE TYPE partner_transfer_status AS ENUM (
    'pending',      -- Belum Dibagi / Belum Ditransfer
    'transferred'   -- Sudah Ditransfer
);

-- 3. DOMPET & KAS (WALLETS)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- e.g. 'Rekening Bisnis (BCA)', 'Kas Tunai'
    type VARCHAR(50) NOT NULL DEFAULT 'bank', -- 'bank' atau 'cash'
    account_number VARCHAR(50),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. UNIT MOBIL BEKAS (UNITS)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand VARCHAR(100) NOT NULL,              -- e.g. 'Honda', 'Toyota'
    model VARCHAR(150) NOT NULL,              -- e.g. 'Jazz 1.5 RS', 'Lancer EX 2.0 GT'
    year INT NOT NULL,                         -- e.g. 2012
    license_plate VARCHAR(20) NOT NULL UNIQUE,-- e.g. 'B 1829 MAM'
    color VARCHAR(50) NOT NULL,               -- e.g. 'Putih Mutiara'
    transmission transmission_type NOT NULL DEFAULT 'AT',
    odometer INT NOT NULL DEFAULT 0,          -- KM odometer
    
    -- Pembelian
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    wallet_id_purchase UUID REFERENCES public.wallets(id),
    
    -- Status & Penjualan
    status unit_status NOT NULL DEFAULT 'workshop',
    target_selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    dp_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    dp_date DATE,
    wallet_id_dp UUID REFERENCES public.wallets(id),
    
    final_selling_price NUMERIC(15, 2) DEFAULT 0,
    selling_expenses NUMERIC(15, 2) DEFAULT 0, -- komisi makelar, diskon, dll
    sold_date DATE,
    wallet_id_sale UUID REFERENCES public.wallets(id),
    
    photo_url TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RINCIAN BIAYA REKONDISI PER UNIT (RECONDITION EXPENSES)
CREATE TABLE IF NOT EXISTS public.recondition_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id),
    category recondition_category NOT NULL DEFAULT 'mesin',
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    receipt_url TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PARTNER & INVESTOR (PARTNERS)
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SUMBER MODAL & BAGI HASIL PARTNER PER UNIT (UNIT_PARTNERS)
CREATE TABLE IF NOT EXISTS public.unit_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL, -- NULL jika internal Kas Garasi
    partner_name VARCHAR(150) NOT NULL, -- Cache name: 'Kas Garasi', 'Partner A', dll.
    capital_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    capital_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00,  -- e.g. 50.00%
    profit_share_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    profit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    transfer_status partner_transfer_status NOT NULL DEFAULT 'pending',
    transfer_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. BUKU KAS UMUM / MUTASI ARUS KAS (CASH TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    transaction_type transaction_type NOT NULL,
    category cash_category NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. VIEWS: REKAP HPP & PERFORMA FINANSIAL UNIT
-- ==============================================================================
CREATE OR REPLACE VIEW public.v_unit_financials AS
SELECT 
    u.id AS unit_id,
    u.brand,
    u.model,
    u.year,
    u.license_plate,
    u.status,
    u.purchase_date,
    u.purchase_price,
    COALESCE(SUM(re.amount), 0) AS total_recondition,
    (u.purchase_price + COALESCE(SUM(re.amount), 0)) AS total_hpp,
    u.target_selling_price,
    u.final_selling_price,
    u.selling_expenses,
    u.sold_date,
    CASE 
        WHEN u.status = 'sold' THEN 
            (COALESCE(u.final_selling_price, 0) - (u.purchase_price + COALESCE(SUM(re.amount), 0)) - COALESCE(u.selling_expenses, 0))
        ELSE 0
    END AS net_profit,
    CASE 
        WHEN u.status = 'sold' AND COALESCE(u.final_selling_price, 0) > 0 THEN 
            ROUND(
                ((COALESCE(u.final_selling_price, 0) - (u.purchase_price + COALESCE(SUM(re.amount), 0)) - COALESCE(u.selling_expenses, 0)) / u.final_selling_price * 100), 
                2
            )
        ELSE 0
    END AS profit_margin_pct,
    CASE 
        WHEN u.status = 'sold' AND u.sold_date IS NOT NULL THEN
            (u.sold_date - u.purchase_date)
        ELSE 
            (CURRENT_DATE - u.purchase_date)
    END AS holding_days
FROM public.units u
LEFT JOIN public.recondition_expenses re ON u.id = re.unit_id
GROUP BY u.id;

-- ==============================================================================
-- 10. INDEXES UNTUK PERFORMA QUERY CEPAT
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_units_plate ON public.units(license_plate);
CREATE INDEX IF NOT EXISTS idx_recondition_unit_id ON public.recondition_expenses(unit_id);
CREATE INDEX IF NOT EXISTS idx_recondition_category ON public.recondition_expenses(category);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_wallet ON public.cash_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON public.cash_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_unit ON public.cash_transactions(unit_id);

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recondition_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all actions
CREATE POLICY "Allow authenticated users full access to wallets" ON public.wallets FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to units" ON public.units FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to recondition" ON public.recondition_expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to partners" ON public.partners FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to unit_partners" ON public.unit_partners FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to cash_transactions" ON public.cash_transactions FOR ALL TO authenticated USING (true);
