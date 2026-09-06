-- ==========================================================================
-- SABÍ CRÉDITO - TABLAS EN SUPABASE
-- ==========================================================================

-- 1. FONDO GLOBAL DE PRÉSTAMOS (datos agregados del sistema)
CREATE TABLE IF NOT EXISTS credit_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_name TEXT NOT NULL DEFAULT 'main',
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    profit_accumulated DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cupos_activos INTEGER NOT NULL DEFAULT 50,
    target_amount DECIMAL(12,2) NOT NULL DEFAULT 30000.00,
    social_fund DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_loans_issued INTEGER NOT NULL DEFAULT 0,
    total_loans_repaid INTEGER NOT NULL DEFAULT 0,
    total_interest_earned DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PRÉSTAMOS POR USUARIO
CREATE TABLE IF NOT EXISTS credit_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loan_reference TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    term_months INTEGER NOT NULL,
    apr DECIMAL(5,4) NOT NULL,
    monthly_payment DECIMAL(10,2) NOT NULL,
    total_interest DECIMAL(10,2) NOT NULL,
    total_to_repay DECIMAL(10,2) NOT NULL,
    stage INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    remaining_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining_term INTEGER NOT NULL DEFAULT 0,
    payments_made INTEGER NOT NULL DEFAULT 0,
    payments_on_time INTEGER NOT NULL DEFAULT 0,
    had_strike BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STRIKES POR USUARIO
CREATE TABLE IF NOT EXISTS credit_strikes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES credit_loans(id) ON DELETE SET NULL,
    strike_number INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT 'pago_atrasado',
    amount_at_strike DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. HISTORIAL DE TRANSACCIONES DEL FONDO
CREATE TABLE IF NOT EXISTS credit_pool_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_name TEXT NOT NULL DEFAULT 'main',
    transaction_type TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    loan_id UUID REFERENCES credit_loans(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. COLUMNAS ADICIONALES EN PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_tier INTEGER NOT NULL DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_score INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS on_time_payments INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_loans_taken INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_loans_repaid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_blocked_until TIMESTAMPTZ;

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_credit_loans_user ON credit_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_loans_status ON credit_loans(status);
CREATE INDEX IF NOT EXISTS idx_credit_strikes_user ON credit_strikes(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_pool_transactions_pool ON credit_pool_transactions(pool_name, created_at DESC);

-- POLÍTICAS RLS
ALTER TABLE credit_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_pool_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read credit pools" ON credit_pools FOR SELECT USING (true);
CREATE POLICY "Service role can manage pools" ON credit_pools FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own loans" ON credit_loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own loans" ON credit_loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage loans" ON credit_loans FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own strikes" ON credit_strikes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage strikes" ON credit_strikes FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read pool transactions" ON credit_pool_transactions FOR SELECT USING (true);
CREATE POLICY "Service role can insert transactions" ON credit_pool_transactions FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- DATOS INICIALES
INSERT INTO credit_pools (pool_name, total_amount, cupos_activos, target_amount)
VALUES ('main', 10000.00, 50, 30000.00)
ON CONFLICT DO NOTHING;
