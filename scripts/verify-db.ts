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

  const checks = [
    { t: 'interventions',    c: 'vehicule' },
    { t: 'devis',            c: 'display_ref' },
    { t: 'factures',         c: 'display_ref' },
    { t: 'garages',          c: 'comptable_email' },
    { t: 'garages',          c: 'gsheet_id' },
    { t: 'email_dispatches', c: 'id' },
    { t: 'factures_achats',  c: 'id' },
  ];

  let allOk = true;
  for (const { t, c } of checks) {
    const { error } = await s.from(t).select(c).limit(1);
    const ok = !error || !error.message.includes('does not exist');
    console.log(`${ok ? '✅' : '❌'} ${t}.${c}${ok ? '' : ` — ${error!.message}`}`);
    if (!ok) allOk = false;
  }

  if (allOk) {
    console.log('\n✅ All DB checks passed — migration 008 applied correctly');
  } else {
    console.error('\n❌ Checks failed — ask Yassine to re-run migration 008 in Supabase SQL Editor');
  }

  process.exit(allOk ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
