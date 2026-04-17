-- ============================================================
-- Migration 008 — display_refs, vehicule col, garage fields,
--                 email_dispatches, factures_achats
-- Idempotent — safe to run multiple times
-- ============================================================

-- ── BUG 1: vehicule free-text column on interventions ────────────────────────

ALTER TABLE interventions ADD COLUMN IF NOT EXISTS vehicule text;

-- Backfill from vehicle_id where vehicle_id is not a valid UUID (i.e. it was text)
UPDATE interventions
SET vehicule = vehicle_id
WHERE vehicule IS NULL
  AND vehicle_id IS NOT NULL
  AND vehicle_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ── BUG 2: display_ref on devis + factures ────────────────────────────────────

ALTER TABLE devis ADD COLUMN IF NOT EXISTS display_ref text;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS display_ref text;

-- Backfill existing devis rows
UPDATE devis d
SET display_ref = sub.ref
FROM (
  SELECT id,
    'DEV-' || EXTRACT(YEAR FROM created_at)::text || '-' ||
    LPAD(ROW_NUMBER() OVER (PARTITION BY garage_id ORDER BY created_at)::text, 4, '0') AS ref
  FROM devis
) sub
WHERE d.id = sub.id AND d.display_ref IS NULL;

-- Backfill existing factures rows
UPDATE factures f
SET display_ref = sub.ref
FROM (
  SELECT id,
    'FAC-' || EXTRACT(YEAR FROM created_at)::text || '-' ||
    LPAD(ROW_NUMBER() OVER (PARTITION BY garage_id ORDER BY created_at)::text, 4, '0') AS ref
  FROM factures
) sub
WHERE f.id = sub.id AND f.display_ref IS NULL;

-- Trigger function: auto-set display_ref on INSERT
CREATE OR REPLACE FUNCTION set_display_ref() RETURNS TRIGGER AS $$
DECLARE
  prefix text;
  yr text;
  cnt int;
BEGIN
  yr := EXTRACT(YEAR FROM NEW.created_at)::text;
  IF TG_TABLE_NAME = 'devis' THEN prefix := 'DEV';
  ELSIF TG_TABLE_NAME = 'factures' THEN prefix := 'FAC';
  ELSE prefix := 'REF';
  END IF;

  EXECUTE format(
    'SELECT COUNT(*)+1 FROM %I WHERE garage_id = $1 AND EXTRACT(YEAR FROM created_at) = $2',
    TG_TABLE_NAME
  ) INTO cnt USING NEW.garage_id, EXTRACT(YEAR FROM NEW.created_at);

  NEW.display_ref := prefix || '-' || yr || '-' || LPAD(cnt::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS devis_display_ref_trigger ON devis;
CREATE TRIGGER devis_display_ref_trigger BEFORE INSERT ON devis
  FOR EACH ROW WHEN (NEW.display_ref IS NULL)
  EXECUTE FUNCTION set_display_ref();

DROP TRIGGER IF EXISTS factures_display_ref_trigger ON factures;
CREATE TRIGGER factures_display_ref_trigger BEFORE INSERT ON factures
  FOR EACH ROW WHEN (NEW.display_ref IS NULL)
  EXECUTE FUNCTION set_display_ref();

-- ── BUG 3: extra garage fields ────────────────────────────────────────────────

ALTER TABLE garages ADD COLUMN IF NOT EXISTS logo_url          text;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS email_from        text;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS siret             text;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS tva_intracom      text;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS adresse           text;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS code_postal       text;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS ville             text;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS telephone         text;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS gsheet_id         text;
ALTER TABLE garages ADD COLUMN IF NOT EXISTS inbound_email_alias text;
-- comptable_email added in migration 005, skip

-- ── Phase 2: email_dispatches (idempotence table) ─────────────────────────────

CREATE TABLE IF NOT EXISTS email_dispatches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id           uuid NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  facture_id          uuid NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  kind                text NOT NULL CHECK (kind IN ('comptable_facture_payee','client_facture','relance')),
  status              text NOT NULL CHECK (status IN ('pending','sent','failed','skipped')),
  resend_message_id   text,
  gsheet_row_id       text,
  error               text,
  sent_at             timestamptz,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(facture_id, kind)
);
ALTER TABLE email_dispatches DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON email_dispatches(status, created_at);

-- ── Phase 3: factures_achats (inbound supplier invoices) ─────────────────────

CREATE TABLE IF NOT EXISTS factures_achats (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id         uuid NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  fournisseur       text NOT NULL,
  fournisseur_email text,
  numero_facture    text,
  date_facture      date,
  total_ht          numeric(10,2),
  total_tva         numeric(10,2),
  total_ttc         numeric(10,2),
  pdf_url           text,
  raw_email_id      text UNIQUE,
  parsed_data       jsonb,
  statut            text DEFAULT 'en_attente' CHECK (statut IN ('en_attente','validee','rejetee')),
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE factures_achats DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_factures_achats_garage ON factures_achats(garage_id, created_at DESC);

-- ── Phase 2: trigger notify_facture_payee (requires pg_net extension) ────────
-- Falls back gracefully if pg_net not enabled — app-side call handles it too.

CREATE OR REPLACE FUNCTION notify_facture_payee() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    BEGIN
      PERFORM net.http_post(
        url     := current_setting('app.settings.base_url', true) || '/api/automations/facture-payee',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.internal_token', true), '')
        ),
        body    := jsonb_build_object('facture_id', NEW.id)::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- pg_net not enabled or base_url not set — no-op, app handles it
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS facture_payee_trigger ON factures;
CREATE TRIGGER facture_payee_trigger AFTER UPDATE OF status ON factures
  FOR EACH ROW EXECUTE FUNCTION notify_facture_payee();
