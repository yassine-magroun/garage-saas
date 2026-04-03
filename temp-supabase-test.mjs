import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing env');
  process.exit(1);
}
const supabase = createClient(url, key);

async function main(){
  try {
    console.log('--- devis columns ---');
    let r = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name','devis');
    console.log(r.error ? r.error.message : r.data.map(x => x.column_name).join(', '));

    console.log('--- factures columns ---');
    r = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name','factures');
    console.log(r.error ? r.error.message : r.data.map(x => x.column_name).join(', '));

    const garageId = '00000000-0000-0000-0000-000000000001';
    const testDev = {
      clientId: '00000000-0000-0000-0000-000000000002',
      vehicleId: null,
      reference: 'DEV-TEST-'+Date.now(),
      status: 'Envoyé',
      subject: 'Test subject',
      totalHt: 10,
      totalTtc: 12,
      tvaRate: 20,
      validUntil: null,
      notes: 'x'
    };

    const rd = await supabase.from('devis').insert({
      garage_id: garageId,
      client_id: testDev.clientId,
      vehicle_id: testDev.vehicleId,
      reference: testDev.reference,
      status: testDev.status,
      subject: testDev.subject,
      total_ht: testDev.totalHt,
      total_ttc: testDev.totalTtc,
      tva_rate: testDev.tvaRate,
      valid_until: testDev.validUntil,
      notes: testDev.notes
    }).select('*').single();

    console.log('insert devis result:', rd.error ? rd.error.message : rd.data);

    const testFact = {
      clientId:'00000000-0000-0000-0000-000000000002',
      interventionId: null,
      amount: 100,
      status: 'En attente',
      date: (new Date()).toISOString().slice(0,10),
      dueDate: null,
      notes: 'x'
    };

    const rf = await supabase.from('factures').insert({
      garage_id:garageId,
      client_id:testFact.clientId,
      intervention_id:testFact.interventionId,
      amount:testFact.amount,
      status:testFact.status,
      date:testFact.date,
      due_date:testFact.dueDate,
      notes:testFact.notes
    }).select('*').single();

    console.log('insert factures result:', rf.error ? rf.error.message : rf.data);

    if (rf.data) {
      const ri = await supabase.from('facture_items').insert({
        facture_id: rf.data.id,
        description: 'line item',
        quantity: 2,
        unit_price: 37.5,
      }).select('*').single();
      console.log('insert facture_items result:', ri.error ? ri.error.message : ri.data);
    }

  } catch (err) {
    console.error('error', err);
  }
}

main();
