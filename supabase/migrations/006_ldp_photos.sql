-- 006_ldp_photos.sql
-- Replace generic photos[] array with structured per-angle columns

ALTER TABLE livre_de_police
DROP COLUMN IF EXISTS photos;

ALTER TABLE livre_de_police
ADD COLUMN IF NOT EXISTS photo_face         text,
ADD COLUMN IF NOT EXISTS photo_dos          text,
ADD COLUMN IF NOT EXISTS photo_cote_gauche  text,
ADD COLUMN IF NOT EXISTS photo_cote_droit   text;

-- Storage bucket note:
-- Create bucket "vehicle-photos" in Supabase dashboard → Storage
-- Settings: Public = true (direct URL access for <img> tags)
-- Policy: allow authenticated uploads to own garage_id prefix
