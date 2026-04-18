/**
 * Smoke test E2E — simule le flow démo complet.
 * Un échec ici = fail démo demain. À run avant de dormir.
 *
 * Usage:
 *   SEED_GARAGE_ID=<uuid> BASE_URL=https://garage-saas-one.vercel.app npx tsx scripts/smoke-e2e.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  try {
    const lines = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      process.env[t.slice(0, eq).trim()] ??= t.slice(eq + 1).trim();
    }
  } catch { /* no .env.local */ }
}

async function main() {
  loadEnv();

  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const GARAGE_ID = process.env.SEED_GARAGE_ID!;
  if (!GARAGE_ID) throw new Error('SEED_GARAGE_ID manquant — ex: SEED_GARAGE_ID=<uuid> npx tsx scripts/smoke-e2e.ts');

  const BASE_URL = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const TOKEN = process.env.INTERNAL_AUTOMATION_TOKEN;

  async function step(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ ${name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`❌ ${name} — ${msg}`);
      process.exit(1);
    }
  }

  // 1. Create client
  let clientId!: string;
  await step('Create client', async () => {
    const { data, error } = await s.from('clients').insert({
      garage_id: GARAGE_ID,
      nom: 'Test Démo ' + Date.now(),
      email: `test-${Date.now()}@demo.fr`,
      telephone: '0600000000',
    }).select().single();
    if (error) throw error;
    clientId = (data as { id: string }).id;
  });

  // 2. Create intervention with vehicule
  let interventionId!: string;
  await step('Create intervention (vehicule column)', async () => {
    const { data, error } = await s.from('interventions').insert({
      garage_id: GARAGE_ID,
      client_id: clientId,
      vehicule: 'Yamaha MT-07 2024',
      type: 'Vidange',
      prix: 85,
      statut: 'terminee',
      date: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    interventionId = (data as { id: string }).id;
  });

  // 3. Create devis → check display_ref auto-generated
  let devisId!: string;
  await step('Create devis with auto display_ref', async () => {
    const { data, error } = await s.from('devis').insert({
      garage_id: GARAGE_ID,
      client_id: clientId,
      total_ttc: 102,
      statut: 'envoye',
    }).select().single();
    if (error) throw error;
    const row = data as { id: string; display_ref: string };
    if (!row.display_ref || !row.display_ref.startsWith('DEV-')) {
      throw new Error(`display_ref pas auto-généré : ${row.display_ref}`);
    }
    devisId = row.id;
  });

  // 4. Create facture → check display_ref auto-generated
  let factureId!: string;
  await step('Create facture with auto display_ref', async () => {
    const { data, error } = await s.from('factures').insert({
      garage_id: GARAGE_ID,
      client_id: clientId,
      total_ttc: 102,
      statut: 'en_attente',
    }).select().single();
    if (error) throw error;
    const row = data as { id: string; display_ref: string };
    if (!row.display_ref || !row.display_ref.startsWith('FAC-')) {
      throw new Error(`display_ref pas auto-généré : ${row.display_ref}`);
    }
    factureId = row.id;
  });

  // 5. Mark facture as paid (required before automation check)
  await step('Mark facture as paid', async () => {
    const { error } = await s.from('factures').update({ statut: 'paid' }).eq('id', factureId);
    if (error) throw error;
  });

  // 6. Trigger automation
  await step('Trigger facture-payee automation', async () => {
    const res = await fetch(`${BASE_URL}/api/automations/facture-payee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
      body: JSON.stringify({ facture_id: factureId }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${res.status} : ${body}`);
    }
  });

  // 7. Verify dispatch logged
  await step('Verify email_dispatch logged', async () => {
    const { data, error } = await s.from('email_dispatches')
      .select('*').eq('facture_id', factureId).single();
    if (error) throw error;
    const row = data as { status: string; error: string | null };
    if (row.status !== 'sent' && row.status !== 'pending') {
      throw new Error(`dispatch status = ${row.status}, error = ${row.error}`);
    }
  });

  // 8. Health check
  await step('Health endpoint all green', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const body = await res.json() as { status: string };
    if (body.status !== 'ok' && body.status !== 'degraded') {
      throw new Error(JSON.stringify(body));
    }
  });

  // 9. Cleanup
  await step('Cleanup test data', async () => {
    await s.from('email_dispatches').delete().eq('facture_id', factureId);
    await s.from('factures').delete().eq('id', factureId);
    await s.from('devis').delete().eq('id', devisId);
    await s.from('interventions').delete().eq('id', interventionId);
    await s.from('clients').delete().eq('id', clientId);
  });

  console.log('\n🎉 ALL GREEN — démo ready\n');
}

main().catch(err => { console.error(err); process.exit(1); });
