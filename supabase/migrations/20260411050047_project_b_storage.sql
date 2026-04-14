-- SiFatih Project B: Storage Configuration
-- Description: Create vault storage buckets for heavy media like house photos and proof of work.
-- Date: 2026-04-11
-- Target: Run on Project B (Vault)

-- 1. Create Bucket for House Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('house_photos', 'house_photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Bucket for Proof of Work (Installation Photos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proof_of_work', 'proof_of_work', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS for Storage
-- Allow public read, authenticated write (technicians)
CREATE POLICY "Public Read for House Photos" ON storage.objects
FOR SELECT USING (bucket_id = 'house_photos');

CREATE POLICY "Technicians can upload proof" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'proof_of_work');
