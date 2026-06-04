-- =============================================
-- PayAlert v2 — Supabase Database Schema
-- Idempotente: eseguibile anche su un DB già esistente.
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: payments
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    amount_cents INTEGER,
    notes TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Se la tabella esisteva già senza is_paid, aggiungilo:
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_payments_device_id ON payments(device_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_device_date ON payments(device_id, due_date);
CREATE INDEX IF NOT EXISTS idx_payments_unpaid ON payments(due_date) WHERE is_paid = FALSE;

-- =============================================
-- TABLE: push_subscriptions
-- =============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL UNIQUE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device_id ON push_subscriptions(device_id);

-- =============================================
-- TABLE: notification_log
-- kinds: d7, d3, d1, d0  (7/3/1 giorni prima + giorno stesso)
-- =============================================
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allinea il vincolo sui tipi (rimuove eventuali vecchi CHECK):
ALTER TABLE notification_log DROP CONSTRAINT IF EXISTS notification_log_kind_check;
ALTER TABLE notification_log
  ADD CONSTRAINT notification_log_kind_check
  CHECK (kind IN ('d7', 'd3', 'd1', 'd0',
                  'd1_afternoon', 'd1_evening', 'd0_morning')); -- compat retro

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_log_unique
  ON notification_log(device_id, payment_id, kind);
CREATE INDEX IF NOT EXISTS idx_notification_log_payment ON notification_log(payment_id);

-- =============================================
-- ROW LEVEL SECURITY
-- (le serverless usano la service_role key e bypassano RLS)
-- =============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to payments" ON payments;
CREATE POLICY "Service role full access to payments"
  ON payments FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to push_subscriptions" ON push_subscriptions;
CREATE POLICY "Service role full access to push_subscriptions"
  ON push_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to notification_log" ON notification_log;
CREATE POLICY "Service role full access to notification_log"
  ON notification_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- Pulizia opzionale
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_log WHERE sent_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
