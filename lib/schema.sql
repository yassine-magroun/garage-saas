/**
 * Complete Supabase schema for multi-tenant garage SaaS
 * Run these SQL statements in Supabase SQL editor
 */

-- 1. Garages table (the root of multi-tenancy)
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

-- 2. Clients (linked to garages)
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

-- 3. Vehicles (linked to clients & garages)
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

-- 4. Interventions (linked to clients, vehicles & garages)
create table if not exists interventions (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  vehicle_id text,
  type text not null,
  status text not null check (status in ('Planifié','En cours','Terminé')) default 'En cours',
  date date not null,
  price numeric(12,2) not null default 0,
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Invoices (linked to clients, interventions & garages)
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

-- 6. Indexes for performance
create index if not exists idx_clients_garage_id on clients(garage_id);
create index if not exists idx_clients_created_at on clients(created_at desc);
create index if not exists idx_vehicles_garage_id on vehicles(garage_id);
create index if not exists idx_vehicles_client_id on vehicles(client_id);
create index if not exists idx_interventions_garage_id on interventions(garage_id);
create index if not exists idx_interventions_client_id on interventions(client_id);
create index if not exists idx_interventions_status on interventions(status);
create index if not exists idx_factures_garage_id on factures(garage_id);
create index if not exists idx_factures_client_id on factures(client_id);
create index if not exists idx_factures_status on factures(status);

-- 7. Users table (links auth users to garages)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  garage_id uuid not null references garages(id) on delete cascade,
  role text not null default 'mechanic' check (role in ('owner', 'manager', 'mechanic')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Devis (quotes) with optional vehicle
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

create index if not exists idx_devis_garage_id on devis(garage_id);
create index if not exists idx_devis_client_id on devis(client_id);
create index if not exists idx_devis_status on devis(status);

-- 9. Devis items (line items)
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

create index if not exists idx_devis_items_devis_id on devis_items(devis_id);
create index if not exists idx_devis_items_garage_id on devis_items(garage_id);

-- 10. Facture items (line items)
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

create index if not exists idx_facture_items_facture_id on facture_items(facture_id);
create index if not exists idx_facture_items_garage_id on facture_items(garage_id);

-- 11. Facture payments
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

create index if not exists idx_facture_payments_facture_id on facture_payments(facture_id);
create index if not exists idx_facture_payments_garage_id on facture_payments(garage_id);

-- 12. Status history for devis/interventions/factures
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

create index if not exists idx_status_history_resource on status_history(resource_type, resource_id);
create index if not exists idx_status_history_garage_id on status_history(garage_id);
create index if not exists idx_status_history_changed_at on status_history(changed_at desc);

-- 13. Continue existing schema below

create index if not exists idx_users_garage_id on users(garage_id);

-- 14. Optional compatibility view for old "invoices" calls
-- NOTE: RLS is intentionally disabled. Enable policies only after auth is wired up.
create or replace view invoices as
  select * from factures;
