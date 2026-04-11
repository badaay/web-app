-- SiFatih Project A: Restore secret_token for psb_registrations
-- Description: Adds back the secret_token column required for the tracking URL functionality.
-- Date: 2026-04-12

ALTER TABLE public.psb_registrations
ADD COLUMN IF NOT EXISTS secret_token TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 10);
