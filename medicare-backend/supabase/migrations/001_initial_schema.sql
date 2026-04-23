-- ─────────────────────────────────────────────────────────────────────────────
-- MediCare – Supabase Initial Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. PROFILES ─────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with extra fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  phone     TEXT,
  role      TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'pharmacist')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users read/update only their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin & service role can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'pharmacist'))
  );

-- Allow insert during registration (service-role does this)
CREATE POLICY "profiles_insert_service" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- ─── 2. MEDICINES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medicines (
  id                    BIGSERIAL PRIMARY KEY,
  name                  TEXT NOT NULL,
  brand                 TEXT,
  category              TEXT NOT NULL,
  price                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock                 INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  description           TEXT,
  dosage                TEXT,
  prescription_required BOOLEAN NOT NULL DEFAULT false,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read active medicines
CREATE POLICY "medicines_select_all" ON public.medicines
  FOR SELECT USING (is_active = true);

-- Only admin/pharmacist can insert/update/delete
CREATE POLICY "medicines_write_admin" ON public.medicines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'pharmacist'))
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 3. CART ITEMS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medicine_id BIGINT NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, medicine_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own cart
CREATE POLICY "cart_own_user" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- ─── 4. ORDERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'Placed' CHECK (status IN ('Placed', 'Processing', 'Delivered', 'Cancelled')),
  address     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users see only their own orders
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin/pharmacist can read and update all orders
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'pharmacist'))
  );

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 5. ORDER ITEMS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  medicine_id     BIGINT REFERENCES public.medicines(id) ON DELETE SET NULL,
  medicine_name   TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can read order_items for their own orders
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- Admin/pharmacist can read all order items
CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'pharmacist'))
  );

-- ─── 6. SEED DATA — MEDICINES ─────────────────────────────────────────────────
INSERT INTO public.medicines (name, brand, category, price, stock, description, dosage, prescription_required) VALUES
  ('Amoxicillin 500mg',   'Amoxil',     'Antibiotics',     85,  120, 'Broad-spectrum penicillin antibiotic used to treat bacterial infections including ear infections, strep throat, pneumonia, and UTIs.', '500mg capsule',    true),
  ('Paracetamol 650mg',   'Calpol',     'Analgesics',      22,  300, 'Common pain reliever and fever reducer. Used for mild to moderate pain, headache, toothache, and cold/flu symptoms.', '650mg tablet',     false),
  ('Vitamin D3 1000 IU',  'Sunvit',     'Vitamins',       150,   85, 'Dietary supplement for bone health, immune function, and calcium absorption. Recommended for deficiency prevention.', '1000 IU softgel',  false),
  ('Pantoprazole 40mg',   'Pantocid',   'Antacids',        65,  200, 'Proton pump inhibitor that reduces stomach acid production. Used for GERD, peptic ulcers, and Zollinger-Ellison syndrome.', '40mg tablet',      true),
  ('Cetirizine 10mg',     'Zyrtec',     'Antihistamines',  45,   15, 'Second-generation antihistamine for allergic rhinitis, urticaria, and seasonal allergies with minimal drowsiness.', '10mg tablet',      false),
  ('Metformin 500mg',     'Glucophage', 'Diabetes',        38,  180, 'First-line medication for type 2 diabetes mellitus. Reduces hepatic glucose production and improves insulin sensitivity.', '500mg tablet',     true),
  ('Atorvastatin 10mg',   'Lipitor',    'Cardiology',     120,   95, 'Statin medication for hypercholesterolemia and cardiovascular disease prevention by lowering LDL cholesterol.', '10mg tablet',      true),
  ('Azithromycin 250mg',  'Zithromax',  'Antibiotics',     92,    0, 'Macrolide antibiotic effective against respiratory tract infections, skin infections, and sexually transmitted infections.', '250mg tablet',     true),
  ('Ibuprofen 400mg',     'Brufen',     'Analgesics',      30,  250, 'NSAID for pain, fever, and inflammation. Effective for headaches, muscle pain, arthritis, and menstrual cramps.', '400mg tablet',     false),
  ('Clotrimazole 1%',     'Canesten',   'Dermatology',    110,   60, 'Antifungal cream for athlete''s foot, ringworm, jock itch, and candidal skin infections.', '1% topical cream', false),
  ('Vitamin B12 1500mcg', 'Cobadex',    'Vitamins',        95,  140, 'Essential vitamin for nerve function, red blood cell formation, and DNA synthesis. Used for B12 deficiency treatment.', '1500mcg tablet',   false),
  ('Amlodipine 5mg',      'Norvasc',    'Cardiology',      55,    8, 'Calcium channel blocker for hypertension and angina. Relaxes blood vessels to improve blood flow.', '5mg tablet',       true)
ON CONFLICT DO NOTHING;
