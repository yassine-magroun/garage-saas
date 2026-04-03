const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('missing env');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  try {
    console.log('--- probe devis subject ---');
    const r1 = await supabase.from('devis').select('subject').limit(1);
    console.log('devis subject', r1.error ? r1.error.message : r1.data);

    console.log('--- probe factures paid_at ---');
    const r2 = await supabase.from('factures').select('paid_at').limit(1);
    console.log('factures paid_at', r2.error ? r2.error.message : r2.data);

    const testDev = {
      garage_id:'00000000-0000-0000-0000-000000000001',
      client_id:'00000000-0000-0000-0000-000000000002',
      vehicle_id:null,
      reference:'DEV-TEST-'+Date.now(),
      status:'Envoyé',
      subject:'subject test',
      total_ht:10,
      total_ttc:12,
      tva_rate:20,
      valid_until:null,
      notes:'x'
    };

    const rd = await supabase.from('devis').insert(testDev).select('*').single();
    console.log('insert devis result', rd.error ? rd.error.message : rd.data);

    const testFact = {
      garage_id:'00000000-0000-0000-0000-000000000001',
      client_id:'00000000-0000-0000-0000-000000000002',
      intervention_id:null,
      amount:100,
      status:'En attente',
      date:(new Date()).toISOString().slice(0,10),
      due_date:null,
      notes:'x'
    };

    const rf = await supabase.from('factures').insert(testFact).select('*').single();
    console.log('insert factures result', rf.error ? rf.error.message : rf.data);

    if (rf.data) {
      const ri = await supabase.from('facture_items').insert({ facture_id: rf.data.id, description:'line', quantity:1, unit_price:15}).select('*').single();
      console.log('insert facture_items result', ri.error ? ri.error.message : ri.data);
    }
  } catch (err) {
    console.error(err);
  }
})();
