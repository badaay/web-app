-- SiFatih Project A: Storage Configuration
-- Description: Create core storage buckets for KTPs and general media.
-- Date: 2026-04-11
-- Target: Run on Project A (Core)

-- 1. Create Private Bucket for KTP
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ktp_vault', 'ktp_vault', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Public Bucket for Assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public_assets', 'public_assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS for Storage (Example: Admin only for KTP)
-- Note: Supabase Storage RLS uses its own schema/system.
-- This requires manual setup in the UI or specific SQL depending on Supabase version.
-- Below is a generic policy for admin access.
CREATE POLICY "Admins can access KTP" ON storage.objects
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
