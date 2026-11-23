-- ==============================================================================
-- DATABASE SCHEMA: GARASI ANAK MAMA ("Ada doa mama di setiap mobil")
-- Target: Supabase (PostgreSQL 15+)
-- Fitur: Unit Accounting (HPP), Multi-Wallet Cashflow, Investor Split, RLS
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP EXISTING OBJECTS IF RERUNNING
DROP VIEW IF EXISTS public.v_unit_financials CASCADE;
DROP TABLE IF EXISTS public.cash_transactions CASCADE;
DROP TABLE IF EXISTS public.unit_partners CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.recondition_expenses CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;

DROP TYPE IF EXISTS partner_transfer_status CASCADE;
DROP TYPE IF EXISTS cash_category CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS recondition_category CASCADE;
DROP TYPE IF EXISTS transmission_type CASCADE;
DROP TYPE IF EXISTS unit_status CASCADE;

-- 3. ENUMS
CREATE TYPE unit_status AS ENUM ('workshop', 'ready', 'booked', 'sold');
CREATE TYPE transmission_type AS ENUM ('AT', 'MT');
CREATE TYPE recondition_category AS ENUM (
    'mesin', 'kaki_kaki', 'body_cat', 'salon_detailing', 
    'pajak_surat', 'towing_bensin', 'mediator', 'lainnya'
);
CREATE TYPE transaction_type AS ENUM ('inflow', 'outflow', 'transfer');
CREATE TYPE cash_category AS ENUM (
    'buy_unit', 'recondition', 'dp_in', 'car_sale', 'selling_expense',
    'capital_deposit', 'prive_withdrawal', 'operational', 'marketing',
    'transfer_between_wallets', 'partner_profit_payout', 'other'
);
CREATE TYPE partner_transfer_status AS ENUM ('pending', 'transferred');

-- 4. DOMPET & KAS (WALLETS)
CREATE TABLE public.wallets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'bank',
    account_number VARCHAR(50),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. UNIT MOBIL BEKAS (UNITS)
CREATE TABLE public.units (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(150) NOT NULL,
    year INT NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    color VARCHAR(50) NOT NULL,
    transmission transmission_type NOT NULL DEFAULT 'AT',
    odometer INT NOT NULL DEFAULT 0,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    wallet_id_purchase TEXT REFERENCES public.wallets(id),
    status unit_status NOT NULL DEFAULT 'workshop',
    target_selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    dp_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    dp_date DATE,
    wallet_id_dp TEXT REFERENCES public.wallets(id),
    final_selling_price NUMERIC(15, 2) DEFAULT 0,
    selling_expenses NUMERIC(15, 2) DEFAULT 0,
    sold_date DATE,
    wallet_id_sale TEXT REFERENCES public.wallets(id),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RINCIAN BIAYA REKONDISI PER UNIT (RECONDITION EXPENSES)
CREATE TABLE public.recondition_expenses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    wallet_id TEXT REFERENCES public.wallets(id),
    category recondition_category NOT NULL DEFAULT 'mesin',
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    receipt_url TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PARTNER & INVESTOR PER UNIT (UNIT PARTNERS)
CREATE TABLE public.unit_partners (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    partner_name VARCHAR(100) NOT NULL,
    capital_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    capital_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    profit_share_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    profit_amount NUMERIC(15, 2) DEFAULT 0,
    transfer_status partner_transfer_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ARUS KAS SHOWROOM (CASH TRANSACTIONS)
CREATE TABLE public.cash_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    wallet_id TEXT NOT NULL REFERENCES public.wallets(id),
    target_wallet_id TEXT REFERENCES public.wallets(id),
    transaction_type transaction_type NOT NULL,
    category cash_category NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
    recondition_id TEXT REFERENCES public.recondition_expenses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. VIEW KALKULASI HPP & LABA PER UNIT
CREATE OR REPLACE VIEW public.v_unit_financials AS
SELECT 
    u.id AS unit_id,
    u.brand,
    u.model,
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

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recondition_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to wallets" ON public.wallets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to units" ON public.units FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to recondition" ON public.recondition_expenses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to unit_partners" ON public.unit_partners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to cash_transactions" ON public.cash_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 11. INITIAL SEED DATA (DATA AWAL REALISTIS)
INSERT INTO public.wallets (id, name, type, account_number, balance) VALUES
('w1', 'Rekening Bisnis (BCA)', 'bank', '8220-9988-12', 185000000),
('w2', 'Kas Tunai Showroom', 'cash', 'Cash Box', 24500000);

-- Units
INSERT INTO public.units (id, brand, model, year, license_plate, color, transmission, odometer, purchase_date, purchase_price, wallet_id_purchase, status, target_selling_price, dp_amount, photo_url, notes) VALUES
('car-1', 'Honda', 'Jazz 1.5 RS AT (GE8 Facelift)', 2012, 'B 1829 MAM', 'Putih Mutiara', 'AT', 98400, '2024-10-10', 115000000, 'w1', 'ready', 138000000, 0, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80', 'Kondisi istimewa, matic responsif, interior wangi bebas rokok, buku servis lengkap.'),
('car-2', 'Mitsubishi', 'Lancer EX 2.0 GT AT', 2010, 'B 2010 EX', 'Hitam Metalik', 'AT', 112000, '2024-10-18', 125000000, 'w1', 'workshop', 155000000, 0, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80', 'Bahan ganteng, siap tampil. Sedang proses peremajaan kaki-kaki & repaint bumper.'),
('car-3', 'Toyota', 'Yaris 1.5 TRD Sportivo AT', 2016, 'B 1984 TRD', 'Merah Metalik', 'AT', 74200, '2024-10-25', 145000000, 'w1', 'booked', 168000000, 10000000, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80', 'KM low, record servis Auto2000, cat 90% original, sudah di-booking DP Rp 10 Juta.'),
('car-4', 'Honda', 'Brio RS 1.2 CVT', 2019, 'B 2341 BR', 'Kuning Carnival', 'AT', 52000, '2024-09-15', 130000000, 'w1', 'sold', 150000000, 0, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80', 'Unit sangat terawat, laku cepat dalam 23 hari. Pembeli cash dari Tangerang.');

UPDATE public.units 
SET final_selling_price = 148000000, selling_expenses = 1500000, sold_date = '2024-10-08', wallet_id_sale = 'w1' 
WHERE id = 'car-4';

-- Partners
INSERT INTO public.unit_partners (id, unit_id, partner_name, capital_amount, capital_percentage, profit_share_percentage, profit_amount, transfer_status) VALUES
('p-1', 'car-1', 'Kas Garasi', 115000000, 100, 100, 0, 'pending'),
('p-2a', 'car-2', 'Kas Garasi', 62500000, 50, 50, 0, 'pending'),
('p-2b', 'car-2', 'Partner Investor (Om Dian)', 62500000, 50, 50, 0, 'pending'),
('p-3', 'car-3', 'Kas Garasi', 145000000, 100, 100, 0, 'pending'),
('p-4a', 'car-4', 'Kas Garasi', 65000000, 50, 50, 5650000, 'transferred'),
('p-4b', 'car-4', 'Partner Investor (Mas Budi)', 65000000, 50, 50, 5650000, 'transferred');

-- Reconditions
INSERT INTO public.recondition_expenses (id, unit_id, wallet_id, category, description, amount, expense_date) VALUES
('rec-1', 'car-1', 'w2', 'mesin', 'Ganti oli mesin Shell Helix, oli transmisi matic CVT & tune-up', 1800000, '2024-10-11'),
('rec-2', 'car-1', 'w2', 'kaki_kaki', 'Ganti bushing arm depan & link stabilizer 1 set', 1250000, '2024-10-13'),
('rec-3', 'car-1', 'w2', 'salon_detailing', 'Full interior detailing, salon ruang mesin & poles 3 step Meguiars', 1400000, '2024-10-15'),
('rec-4', 'car-2', 'w1', 'kaki_kaki', 'Ganti shockbreaker depan KYB Excel-G sepasang', 2600000, '2024-10-20'),
('rec-5', 'car-2', 'w1', 'body_cat', 'Spet bumper depan & poles baret halus bodi samping', 1800000, '2024-10-22'),
('rec-6', 'car-2', 'w2', 'mesin', 'Tune-up, kuras minyak rem & ganti filter udara', 850000, '2024-10-24'),
('rec-7', 'car-3', 'w2', 'salon_detailing', 'Poles bodi kaca & coating protection nano ceramic 1 layer', 1600000, '2024-10-26'),
('rec-8', 'car-3', 'w2', 'mesin', 'Ganti oli mesin TMO 5W-30 + filter oli original Toyota', 650000, '2024-10-27'),
('rec-9', 'car-4', 'w2', 'mesin', 'Servis rutin berkala + ganti busi iridium 4 pcs', 1100000, '2024-09-17'),
('rec-10', 'car-4', 'w2', 'salon_detailing', 'Cuci kolong detailing & poles jamur kaca depan', 700000, '2024-09-18'),
('rec-11', 'car-4', 'w1', 'body_cat', 'Perbaikan baret spion & spet lips bumper bawah', 900000, '2024-09-20');

-- Cash Transactions
INSERT INTO public.cash_transactions (id, wallet_id, transaction_type, category, amount, description, transaction_date, unit_id) VALUES
('tx-1', 'w1', 'outflow', 'buy_unit', 115000000, 'Beli Honda Jazz GE8 2012 (B 1829 MAM) - Transfer owner', '2024-10-10', 'car-1'),
('tx-2', 'w2', 'outflow', 'recondition', 1800000, 'Ganti oli & servis mesin Honda Jazz (B 1829 MAM)', '2024-10-11', 'car-1'),
('tx-3', 'w1', 'outflow', 'buy_unit', 125000000, 'Beli Mitsubishi Lancer EX 2010 (B 2010 EX) - Kas Garasi + Partner', '2024-10-18', 'car-2'),
('tx-4', 'w1', 'inflow', 'dp_in', 10000000, 'Terima DP Booking Fee Toyota Yaris (B 1984 TRD) dari Pak Hendra', '2024-11-02', 'car-3'),
('tx-5', 'w1', 'inflow', 'car_sale', 148000000, 'Pelunasan jual Honda Brio RS (B 2341 BR) cash transfer', '2024-10-08', 'car-4'),
('tx-6', 'w1', 'outflow', 'partner_profit_payout', 5650000, 'Transfer bagi hasil 50% penjualan Brio ke Mas Budi', '2024-10-09', 'car-4'),
('tx-7', 'w1', 'outflow', 'operational', 4500000, 'Bayar sewa lahan garasi & listrik bulan berjalan', '2024-11-01', NULL),
('tx-8', 'w2', 'outflow', 'marketing', 1200000, 'Biaya konten TikTok & pasang iklan Olx prioritas 1 bulan', '2024-11-05', NULL);
