-- Migration: admin_activity_log
-- Jalankan manual di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('payment', 'review')),
  title TEXT NOT NULL,
  detail TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_activity_log: admin bisa baca"
  ON admin_activity_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );

-- Trigger otomatis catat log setiap ada invoice status jadi 'paid'
CREATE OR REPLACE FUNCTION log_payment_activity() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO admin_activity_log (type, title, detail, related_id)
    VALUES ('payment', 'Pembayaran baru diterima', 'Total: Rp ' || NEW.total_amount, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_payment_activity ON invoices;
CREATE TRIGGER trg_log_payment_activity
  AFTER UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION log_payment_activity();

-- Trigger otomatis catat log setiap ada review baru
CREATE OR REPLACE FUNCTION log_review_activity() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_activity_log (type, title, detail, related_id)
  VALUES ('review', 'Review baru masuk', 'Rating: ' || NEW.rating || ' bintang', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_review_activity ON class_reviews;
CREATE TRIGGER trg_log_review_activity
  AFTER INSERT ON class_reviews
  FOR EACH ROW EXECUTE FUNCTION log_review_activity();
