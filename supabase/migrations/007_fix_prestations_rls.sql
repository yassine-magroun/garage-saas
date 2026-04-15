-- Migration 007: Disable RLS on prestations
-- Reason: project does not use Supabase Auth (uses Clerk).
-- All other tables already have RLS disabled or bypassed.
-- The "Initialiser avec le catalogue standard" button was failing with
-- "new row violates row-level security policy for table prestations".

ALTER TABLE prestations DISABLE ROW LEVEL SECURITY;

-- Drop any lingering policies that would block inserts
DROP POLICY IF EXISTS "allow_insert_prestations" ON prestations;
DROP POLICY IF EXISTS "allow_select_prestations" ON prestations;
DROP POLICY IF EXISTS "allow_update_prestations" ON prestations;
DROP POLICY IF EXISTS "allow_delete_prestations" ON prestations;
