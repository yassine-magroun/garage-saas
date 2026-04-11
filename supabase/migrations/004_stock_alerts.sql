-- ============================================================
-- Migration 004 — Stock Alerts + Stripe subscription columns
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- ── Stripe columns on garages ─────────────────────────────────────────────────
alter table garages add column if not exists stripe_customer_id      text unique;
alter table garages add column if not exists subscription_status     text default 'inactive'
  check (subscription_status in ('active','trialing','past_due','canceled','inactive'));
alter table garages add column if not exists subscription_plan       text
  check (subscription_plan in ('starter','pro','enterprise'));
alter table garages add column if not exists subscription_end        timestamptz;

create index if not exists idx_garages_stripe_customer on garages(stripe_customer_id);

-- ── stock_alert_config ────────────────────────────────────────────────────────
create table if not exists stock_alert_config (
  id             uuid primary key default gen_random_uuid(),
  garage_id      uuid not null references garages(id) on delete cascade,
  alert_email    text not null,
  alert_enabled  boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint uq_stock_alert_config_garage unique (garage_id)
);
alter table stock_alert_config disable row level security;
create index if not exists idx_stock_alert_config_garage on stock_alert_config(garage_id);

-- ── stock_alerts_log ──────────────────────────────────────────────────────────
create table if not exists stock_alerts_log (
  id             uuid primary key default gen_random_uuid(),
  garage_id      uuid not null references garages(id) on delete cascade,
  piece_id       uuid not null references pieces(id) on delete cascade,
  piece_name     text not null,
  stock_current  numeric(10,2) not null,
  stock_min      numeric(10,2) not null,
  fournisseur    text,
  sent_at        timestamptz not null default now(),
  resolved_at    timestamptz
);
alter table stock_alerts_log disable row level security;
create index if not exists idx_stock_alerts_log_garage  on stock_alerts_log(garage_id);
create index if not exists idx_stock_alerts_log_piece   on stock_alerts_log(piece_id);
create index if not exists idx_stock_alerts_log_sent_at on stock_alerts_log(sent_at desc);

-- ── Trigger function: check_stock_alert ───────────────────────────────────────
create or replace function check_stock_alert()
returns trigger
language plpgsql
as $$
begin
  -- Only fire when stock_quantity drops below stock_min and was above before
  if (NEW.stock_quantity < NEW.stock_min)
     and (OLD.stock_quantity >= OLD.stock_min or OLD.stock_quantity is null)
  then
    insert into stock_alerts_log (
      garage_id,
      piece_id,
      piece_name,
      stock_current,
      stock_min,
      fournisseur
    ) values (
      NEW.garage_id,
      NEW.id,
      NEW.name,
      NEW.stock_quantity,
      NEW.stock_min,
      NEW.fournisseur
    );
  end if;
  return NEW;
end;
$$;

-- ── Attach trigger to pieces ──────────────────────────────────────────────────
drop trigger if exists trg_check_stock_alert on pieces;
create trigger trg_check_stock_alert
  after update of stock_quantity on pieces
  for each row
  execute function check_stock_alert();
