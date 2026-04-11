-- ============================================================
-- GARAGE SAAS — Bootstrap SQL
-- Paste this entire file in Supabase SQL Editor and run it.
-- Safe to run multiple times (idempotent).
-- ============================================================

-- 1. GARAGES
create table if not exists garages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  siret text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table garages disable row level security;

-- 2. CLIENTS
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  name text not null,
  email text,
  phone text not null,
  address text,
  vip boolean default false,
  vehicle text,
  license_plate text,
  last_visit_days int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table clients disable row level security;

-- 3. VEHICLES
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  make text,
  model text,
  license_plate text,
  year int,
  vin text,
  mileage int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table vehicles disable row level security;

-- 4. INTERVENTIONS
create table if not exists interventions (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  vehicle_id text,
  type text not null,
  status text not null check (status in ('Planifié','En cours','Terminé','En attente','Prêt','Livré')) default 'En attente',
  date date not null,
  price numeric(12,2) not null default 0,
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table interventions disable row level security;

-- 5. FACTURES
create table if not exists factures (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  intervention_id uuid references interventions(id) on delete set null,
  amount numeric(12,2) not null default 0,
  status text not null check (status in ('En attente','Partiellement payée','Payée','En retard','Annulée')) default 'En attente',
  date date not null,
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table factures disable row level security;

-- 6. DEVIS
create table if not exists devis (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  reference text not null unique,
  status text not null check (status in ('Brouillon','Envoyé','Accepté','Refusé','Annulé')) default 'Brouillon',
  subject text,
  vehicle text,
  total_ht numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  tva_rate numeric(5,2) not null default 20,
  valid_until date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table devis disable row level security;

-- 7. DEVIS ITEMS
create table if not exists devis_items (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  devis_id uuid not null references devis(id) on delete cascade,
  description text not null,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) generated always as (quantity * unit_price) stored,
  item_type text not null check (item_type in ('Prestation','Pièce','Frais')) default 'Prestation',
  line_status text not null check (line_status in ('Normal','Optionnel','Accepté','Refusé')) default 'Normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table devis_items disable row level security;

-- 8. FACTURE ITEMS
create table if not exists facture_items (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  facture_id uuid not null references factures(id) on delete cascade,
  description text not null,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) generated always as (quantity * unit_price) stored,
  item_type text not null check (item_type in ('Prestation','Pièce','Frais')) default 'Prestation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table facture_items disable row level security;

-- 9. FACTURE PAYMENTS
create table if not exists facture_payments (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid not null references factures(id) on delete cascade,
  garage_id uuid not null references garages(id) on delete cascade,
  amount numeric(12,2) not null,
  method text not null check (method in ('cash','card','transfer','cheque')),
  transaction_reference text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table facture_payments disable row level security;

-- 10. USERS (links Supabase Auth users to garages)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  garage_id uuid not null references garages(id) on delete cascade,
  role text not null default 'mechanic' check (role in ('owner', 'manager', 'mechanic')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table users disable row level security;

-- 11. STATUS HISTORY
create table if not exists status_history (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  resource_type text not null check (resource_type in ('devis','intervention','facture')),
  resource_id uuid not null,
  previous_status text,
  new_status text not null,
  changed_by uuid references users(id) on delete set null,
  changed_at timestamptz not null default now(),
  metadata jsonb
);
alter table status_history disable row level security;

-- 12. PRESTATIONS CATALOGUE
create table if not exists prestations (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  name text not null,
  price_ht numeric(12,2) not null default 0,
  tva_rate numeric(5,2) not null default 20,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table prestations disable row level security;

-- display_ref: human-readable sequential IDs per garage
alter table devis    add column if not exists display_ref text;
alter table factures add column if not exists display_ref text;
alter table garages  add column if not exists clerk_user_id text unique;
alter table garages  add column if not exists logo_url text;

-- Sprint 4: client retention tracking
alter table clients add column if not exists last_contact_date timestamptz;

-- 16b. TRIGGER LOGS — tracks all automated trigger actions
create table if not exists trigger_logs (
  id          uuid primary key default gen_random_uuid(),
  garage_id   uuid not null references garages(id) on delete cascade,
  trigger_type text not null,
  resource_type text,
  resource_id  text,
  client_id    text,
  status       text not null default 'success' check (status in ('success','error','skipped')),
  message      text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);
alter table trigger_logs disable row level security;
create index if not exists idx_trigger_logs_garage_id  on trigger_logs(garage_id);
create index if not exists idx_trigger_logs_created_at on trigger_logs(created_at desc);

-- Supabase Storage bucket for garage logos (run once)
-- insert into storage.buckets (id, name, public) values ('garage-logos', 'garage-logos', true) on conflict do nothing;

-- 13. INDEXES
create index if not exists idx_clients_garage_id        on clients(garage_id);
create index if not exists idx_clients_created_at       on clients(created_at desc);
create index if not exists idx_vehicles_garage_id       on vehicles(garage_id);
create index if not exists idx_vehicles_client_id       on vehicles(client_id);
create index if not exists idx_interventions_garage_id  on interventions(garage_id);
create index if not exists idx_interventions_client_id  on interventions(client_id);
create index if not exists idx_interventions_status     on interventions(status);
create index if not exists idx_factures_garage_id       on factures(garage_id);
create index if not exists idx_factures_client_id       on factures(client_id);
create index if not exists idx_factures_status          on factures(status);
create index if not exists idx_devis_garage_id          on devis(garage_id);
create index if not exists idx_devis_client_id          on devis(client_id);
create index if not exists idx_devis_status             on devis(status);
create index if not exists idx_devis_items_devis_id     on devis_items(devis_id);
create index if not exists idx_devis_items_garage_id    on devis_items(garage_id);
create index if not exists idx_facture_items_facture_id on facture_items(facture_id);
create index if not exists idx_facture_items_garage_id  on facture_items(garage_id);
create index if not exists idx_facture_payments_facture_id on facture_payments(facture_id);
create index if not exists idx_facture_payments_garage_id  on facture_payments(garage_id);
create index if not exists idx_status_history_resource  on status_history(resource_type, resource_id);
create index if not exists idx_status_history_garage_id on status_history(garage_id);
create index if not exists idx_status_history_changed_at on status_history(changed_at desc);
create index if not exists idx_users_garage_id          on users(garage_id);

create index if not exists idx_prestations_garage_id on prestations(garage_id);

-- 14. COMPATIBILITY VIEW
create or replace view invoices as select * from factures;

-- 15. SEED — create your demo garage (skip if it already exists)
insert into garages (name, phone, email, address)
values ('2roues Pasteur', '+33 1 23 45 67 89', 'contact@2roues-pasteur.fr', '123 rue de la Paix, 75000 Paris')
on conflict do nothing;

-- 16. SHOW YOUR GARAGE ID — copy this value into .env.local as NEXT_PUBLIC_GARAGE_ID
select id as "YOUR_GARAGE_ID — copy into .env.local" from garages where name = '2roues Pasteur' limit 1;
