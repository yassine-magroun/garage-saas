/**
 * Demo seed script — run with: npx tsx scripts/seed-demo.ts
 *
 * Creates a full set of demo data in the first garage found in the DB.
 * Idempotent: skips if demo data already exists (checks for client named "Martin Dupont").
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Load env ──────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    process.env[key] ??= val;
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function isoTs(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function ref(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Find garage
  const { data: garages, error: gErr } = await db.from('garages').select('id, name').limit(1);
  if (gErr || !garages?.length) {
    console.error('No garage found. Create a garage first via the app.');
    process.exit(1);
  }
  const garageId = garages[0].id as string;
  console.log(`\n🏁 Seeding garage: ${garages[0].name} (${garageId})\n`);

  // 2. Idempotence check
  const { data: existing } = await db.from('clients')
    .select('id').eq('garage_id', garageId).eq('name', 'Martin Dupont').limit(1);
  if (existing?.length) {
    console.log('✅ Demo data already exists — skipping (delete clients named "Martin Dupont" to re-seed)');
    process.exit(0);
  }

  // ── 3. Clients (15) ───────────────────────────────────────────────────────

  const clientsData = [
    { name: 'Martin Dupont',    phone: '06 12 34 56 78', vehicle: 'Yamaha XMAX 300',   email: 'martin@demo.fr',   immatriculation: 'AB-123-CD' },
    { name: 'Sophie Laurent',   phone: '06 23 45 67 89', vehicle: 'Honda Forza 750',    email: 'sophie@demo.fr',   immatriculation: 'BC-234-DE' },
    { name: 'Pierre Moreau',    phone: '06 34 56 78 90', vehicle: 'Kawasaki Z900',      email: 'pierre@demo.fr',   immatriculation: 'CD-345-EF' },
    { name: 'Claire Petit',     phone: '06 45 67 89 01', vehicle: 'Vespa GTS 300',      email: 'claire@demo.fr',   immatriculation: 'DE-456-FG' },
    { name: 'Antoine Bernard',  phone: '06 56 78 90 12', vehicle: 'BMW R1250GS',        email: 'antoine@demo.fr',  immatriculation: 'EF-567-GH' },
    { name: 'Julie Roux',       phone: '06 67 89 01 23', vehicle: 'Ducati Scrambler',   email: 'julie@demo.fr',    immatriculation: 'FG-678-HI' },
    { name: 'Thomas Simon',     phone: '06 78 90 12 34', vehicle: 'Honda CBR 600',      email: 'thomas@demo.fr',   immatriculation: 'GH-789-IJ' },
    { name: 'Emma Michel',      phone: '06 89 01 23 45', vehicle: 'Suzuki GSX-S750',    email: 'emma@demo.fr',     immatriculation: 'HI-890-JK' },
    { name: 'Lucas Garcia',     phone: '06 90 12 34 56', vehicle: 'Triumph Bonneville', email: 'lucas@demo.fr',    immatriculation: 'IJ-901-KL' },
    { name: 'Chloé Lefebvre',   phone: '07 01 23 45 67', vehicle: 'Royal Enfield 350',  email: 'chloe@demo.fr',    immatriculation: 'JK-012-LM' },
    { name: 'Nathan Robert',    phone: '07 12 34 56 78', vehicle: 'KTM Duke 390',       email: 'nathan@demo.fr',   immatriculation: 'KL-123-MN' },
    { name: 'Léa Richard',      phone: '07 23 45 67 89', vehicle: 'Yamaha MT-07',       email: 'lea@demo.fr',      immatriculation: 'LM-234-NO' },
    { name: 'Hugo Durand',      phone: '07 34 56 78 90', vehicle: 'Honda CB500F',       email: 'hugo@demo.fr',     immatriculation: 'MN-345-OP' },
    { name: 'Manon Leroy',      phone: '07 45 67 89 01', vehicle: 'Piaggio Beverly 350',email: 'manon@demo.fr',    immatriculation: 'NO-456-PQ' },
    { name: 'Alexis Fournier',  phone: '07 56 78 90 12', vehicle: 'BMW S1000R',         email: 'alexis@demo.fr',   immatriculation: 'OP-567-QR' },
  ];

  const { data: insertedClients, error: cErr } = await db
    .from('clients')
    .insert(clientsData.map(c => ({ ...c, garage_id: garageId })))
    .select('id, name');

  if (cErr) { console.error('❌ Clients insert failed:', cErr.message); process.exit(1); }
  console.log(`✅ ${insertedClients?.length} clients created`);
  const clients = insertedClients!;

  // ── 4. Interventions (5) ──────────────────────────────────────────────────

  const interventionsData = [
    { client_id: clients[0].id, vehicule: 'Yamaha XMAX 300', type: 'Révision complète', price: 120, date: isoDate(10), status: 'Livré',     notes: 'Vidange + filtres + bougies' },
    { client_id: clients[1].id, vehicule: 'Honda Forza 750', type: 'Remplacement pneus', price: 180, date: isoDate(5),  status: 'En cours',  notes: '2 pneus Michelin Power 5' },
    { client_id: clients[2].id, vehicule: 'Kawasaki Z900',   type: 'Réparation frein avant', price: 95, date: isoDate(2), status: 'En attente', notes: 'Plaquettes + disque HS' },
    { client_id: clients[3].id, vehicule: 'Vespa GTS 300',   type: 'Variateur + galets', price: 150, date: isoDate(1),  status: 'Prêt',      notes: 'Client notifié par SMS' },
    { client_id: clients[4].id, vehicule: 'BMW R1250GS',     type: 'Révision 10 000 km', price: 280, date: isoDate(0),  status: 'En attente', notes: 'Prise en charge demain matin' },
  ];

  const { data: insertedInts, error: iErr } = await db
    .from('interventions')
    .insert(interventionsData.map(i => ({ ...i, garage_id: garageId })))
    .select('id');

  if (iErr) { console.error('❌ Interventions insert failed:', iErr.message); process.exit(1); }
  console.log(`✅ ${insertedInts?.length} interventions created`);

  // ── 5. Factures (3) ───────────────────────────────────────────────────────

  const facturesData = [
    {
      client_id: clients[0].id,
      display_ref: ref('FAC', 1),
      status: 'paid',
      total_ht: 100,
      tva_rate: 20,
      total_ttc: 120,
      amount_paid: 120,
      due_date: isoDate(20),
      notes: 'Facture révisée payée comptant',
    },
    {
      client_id: clients[1].id,
      display_ref: ref('FAC', 2),
      status: 'partial',
      total_ht: 150,
      tva_rate: 20,
      total_ttc: 180,
      amount_paid: 80,
      due_date: isoDate(-7),
      notes: 'Acompte versé 80€',
    },
    {
      client_id: clients[2].id,
      display_ref: ref('FAC', 3),
      status: 'unpaid',
      total_ht: 79.17,
      tva_rate: 20,
      total_ttc: 95,
      amount_paid: 0,
      due_date: isoDate(-14),
      notes: 'En attente règlement',
    },
  ];

  const { data: insertedFacs, error: fErr } = await db
    .from('factures')
    .insert(facturesData.map(f => ({ ...f, garage_id: garageId })))
    .select('id, display_ref');

  if (fErr) { console.error('❌ Factures insert failed:', fErr.message); process.exit(1); }
  console.log(`✅ ${insertedFacs?.length} factures created`);

  // Facture items
  if (insertedFacs) {
    const items = [
      { facture_id: insertedFacs[0].id, description: 'Révision complète', quantity: 1, unit_price_ht: 100, total_ht: 100 },
      { facture_id: insertedFacs[1].id, description: 'Pneu avant Michelin', quantity: 1, unit_price_ht: 90, total_ht: 90 },
      { facture_id: insertedFacs[1].id, description: 'Pneu arrière Michelin', quantity: 1, unit_price_ht: 60, total_ht: 60 },
      { facture_id: insertedFacs[2].id, description: 'Plaquettes frein AV', quantity: 1, unit_price_ht: 40, total_ht: 40 },
      { facture_id: insertedFacs[2].id, description: 'Main d\'œuvre freinage', quantity: 1, unit_price_ht: 39.17, total_ht: 39.17 },
    ];
    await db.from('facture_items').insert(items.map(i => ({ ...i, garage_id: garageId })));
    console.log(`✅ ${items.length} facture items created`);

    // Payment for paid facture
    await db.from('payments').insert({
      facture_id: insertedFacs[0].id,
      garage_id: garageId,
      amount: 120,
      method: 'cash',
      paid_at: isoTs(10),
      notes: 'Paiement comptant',
    });
    // Partial payment
    await db.from('payments').insert({
      facture_id: insertedFacs[1].id,
      garage_id: garageId,
      amount: 80,
      method: 'card',
      paid_at: isoTs(3),
      notes: 'Acompte CB',
    });
    console.log('✅ 2 payments created');
  }

  // ── 6. Stock (4 pieces) ───────────────────────────────────────────────────

  const stockData = [
    { reference: 'FLT-HUI-001', name: 'Filtre à huile Honda', category: 'Filtres',      stock_quantity: 8,  min_quantity: 3, unit_price: 12.50 },
    { reference: 'PLQ-AV-002',  name: 'Plaquettes frein AV Brembo', category: 'Freinage', stock_quantity: 0,  min_quantity: 2, unit_price: 38.00 },
    { reference: 'PNE-MT-003',  name: 'Pneu Michelin Power 5 (120/70)', category: 'Pneumatiques', stock_quantity: 3, min_quantity: 2, unit_price: 95.00 },
    { reference: 'BAT-YTX-004', name: 'Batterie YTX12-BS', category: 'Électricité',     stock_quantity: 0,  min_quantity: 1, unit_price: 55.00 },
  ];

  const { data: insertedStock, error: sErr } = await db
    .from('pieces')
    .insert(stockData.map(p => ({ ...p, garage_id: garageId })))
    .select('id');

  if (sErr) { console.error('❌ Stock insert failed:', sErr.message); }
  else console.log(`✅ ${insertedStock?.length} stock pieces created (2 en rupture for badge demo)`);

  // ── 7. Factures achats (2) ────────────────────────────────────────────────

  const achatsData = [
    {
      fournisseur: 'Yamaha Motor France',
      montant: 450.00,
      statut: 'en_attente',
      date_reception: isoDate(2),
      ref_fournisseur: 'YMF-2024-8821',
      description: 'Commande pièces XMAX 300',
    },
    {
      fournisseur: 'Bihr France',
      montant: 234.50,
      statut: 'validee',
      date_reception: isoDate(7),
      ref_fournisseur: 'BIHR-77441',
      description: 'Consommables atelier Q4',
    },
  ];

  const { error: aErr } = await db
    .from('factures_achats')
    .insert(achatsData.map(a => ({ ...a, garage_id: garageId })));

  if (aErr) { console.error('❌ Factures achats insert failed:', aErr.message); }
  else console.log('✅ 2 factures achats created');

  // ── 7b. WOW facture for live demo moment ─────────────────────────────────

  const { data: wowFac, error: wowErr } = await db.from('factures').insert({
    garage_id: garageId,
    client_id: clients[0].id,  // Martin Dupont
    display_ref: 'FAC-2026-9999',
    total_ht: 204.17,
    tva_rate: 20,
    total_ttc: 245.00,
    amount_paid: 0,
    status: 'unpaid',
    notes: 'DÉMO — clique ici pendant la présentation',
  }).select('id, display_ref').single();

  if (wowErr) { console.error('❌ WOW facture insert failed:', wowErr.message); }
  else console.log(`✅ WOW demo facture created: ${wowFac?.display_ref} (id: ${wowFac?.id})`);

  // ── 8. Livre de police (1 entry) ─────────────────────────────────────────

  const ldpEntry = {
    garage_id: garageId,
    date_entree: isoDate(3),
    client_nom: 'Martin Dupont',
    client_adresse: '12 rue des Acacias, 75011 Paris',
    client_piece_identite: 'CNI 123456789',
    marque: 'Yamaha',
    modele: 'XMAX 300',
    immatriculation: 'AB-123-CD',
    numero_serie: 'VJWSG14B0LA012345',
    date_sortie: null,
    motif: 'Révision complète',
  };

  const { error: ldpErr } = await db.from('livre_de_police').insert(ldpEntry);
  if (ldpErr) { console.error('❌ Livre de police insert failed:', ldpErr.message); }
  else console.log('✅ 1 livre de police entry created');

  console.log('\n🎉 Demo seed complete!\n');
  console.log('   15 clients | 5 interventions | 3 factures + 1 WOW demo (FAC-2026-9999) | 4 stock | 2 achats | 1 LDP');
  console.log('   Credentials: use any Clerk-authenticated user in the garage\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
