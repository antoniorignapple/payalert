-- =============================================
-- PayAlert - Supabase Database Schema
-- =============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: payments
-- Stores all payment reminders
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    amount_cents INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster device_id lookups
CREATE INDEX IF NOT EXISTS idx_payments_device_id ON payments(device_id);

-- Index for due_date queries (used by cron)
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- Composite index for device + date
CREATE INDEX IF NOT EXISTS idx_payments_device_date ON payments(device_id, due_date);

-- =============================================
-- TABLE: push_subscriptions
-- Stores Web Push subscriptions per device
-- =============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL UNIQUE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for device_id lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device_id ON push_subscriptions(device_id);

-- =============================================
-- TABLE: notification_log
-- Tracks sent notifications to prevent duplicates
-- =============================================
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('d7', 'd3', 'd1', 'd0')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint to prevent duplicate notifications
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_log_unique 
ON notification_log(device_id, payment_id, kind);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_log_payment ON notification_log(payment_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Since we're using service_role key from serverless functions,
-- RLS policies are bypassed. But for extra security, we can add
-- policies that would apply if someone tried to access directly.

-- Policy: Only service role can access payments
CREATE POLICY "Service role full access to payments"
ON payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Only service role can access push_subscriptions
CREATE POLICY "Service role full access to push_subscriptions"
ON push_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Only service role can access notification_log
CREATE POLICY "Service role full access to notification_log"
ON notification_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- FUNCTION: cleanup_old_notifications
-- Optional: Cleanup old notification logs
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notification_log
    WHERE sent_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: cleanup_old_payments  
-- Optional: Cleanup payments older than 1 year
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_old_payments()
RETURNS void AS $$
BEGIN
    DELETE FROM payments
    WHERE due_date < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;
