import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { generateFacturX, generateStandardPdf } from '../../../../lib/facture-x/generate';
import { appendToGSheet } from '../../../../lib/gsheet/append';
import { FLAGS } from '../../../../lib/feature-flags';
import { mapFactureRow, mapClientRow, mapGarageRow } from './mappers';

const resend = new Resend(process.env.RESEND_API_KEY!);

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Simple bearer token check for internal calls
  const auth = req.headers.get('authorization');
  const internalToken = process.env.INTERNAL_AUTOMATION_TOKEN;
  if (internalToken && auth !== `Bearer ${internalToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let facture_id: string;
  try {
    const body = await req.json() as { facture_id?: string };
    if (!body.facture_id) throw new Error('missing facture_id');
    facture_id = body.facture_id;
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Load facture + client + garage
  const { data: factureRaw, error: factureErr } = await supabase
    .from('factures')
    .select('*, clients(*), garages(*)')
    .eq('id', facture_id)
    .single();

  if (factureErr || !factureRaw) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  const facture = mapFactureRow(factureRaw as Record<string, unknown>);
  const garage = mapGarageRow((factureRaw as Record<string, unknown>).garages as Record<string, unknown>);
  const client = mapClientRow((factureRaw as Record<string, unknown>).clients as Record<string, unknown>);

  if (facture.status !== 'paid') {
    return NextResponse.json({ skipped: true, reason: 'not paid' });
  }

  // Idempotence check
  const { data: existing } = await supabase
    .from('email_dispatches')
    .select('id, status')
    .eq('facture_id', facture_id)
    .eq('kind', 'comptable_facture_payee')
    .maybeSingle();

  if ((existing as { status?: string } | null)?.status === 'sent') {
    return NextResponse.json({ already_sent: true });
  }

  // Create / upsert pending dispatch
  const { data: dispatch } = await supabase
    .from('email_dispatches')
    .upsert(
      { garage_id: garage.id, facture_id, kind: 'comptable_facture_payee', status: 'pending' },
      { onConflict: 'facture_id,kind' },
    )
    .select()
    .single();

  try {
    if (!garage.comptableEmail) throw new Error('comptable_email non configuré dans les paramètres');

    const pdfBuffer = FLAGS.FACTUR_X_ENABLED
      ? await generateFacturX({ facture, garage, client })
      : await generateStandardPdf({ facture, garage, client });

    const { data: email, error: emailErr } = await resend.emails.send({
      from: garage.emailFrom ?? 'facturation@mecanigo.fr',
      to: garage.comptableEmail,
      replyTo: garage.emailFrom ?? undefined,
      subject: `[${garage.name}] Facture payée ${facture.displayRef ?? facture.id.slice(0, 8)} — ${client.name}`,
      html: `
        <p>Bonjour,</p>
        <p>Facture <strong>${facture.displayRef ?? facture.id.slice(0, 8)}</strong> réglée le ${new Date().toLocaleDateString('fr-FR')}.</p>
        <ul>
          <li>Client : ${client.name}</li>
          <li>Montant TTC : ${facture.totalTtc.toFixed(2)} €</li>
          <li>Format : ${FLAGS.FACTUR_X_ENABLED ? 'Factur-X (PDF/A-3 + XML CII)' : 'PDF standard'}</li>
        </ul>
        <p>Cordialement,<br/>${garage.name}</p>
      `,
      attachments: [{
        filename: `${facture.displayRef ?? facture.id.slice(0, 8)}-factur-x.pdf`,
        content: pdfBuffer,
      }],
      tags: [
        { name: 'kind', value: 'comptable_facture_payee' },
        { name: 'garage_id', value: garage.id },
      ],
    });

    if (emailErr) throw new Error(emailErr.message);

    // Append to Google Sheet (best-effort)
    let gsheetRow: string | null = null;
    if (FLAGS.GSHEET_TRACKING && garage.gsheetId) {
      try {
        gsheetRow = await appendToGSheet(garage.gsheetId, [
          new Date().toISOString(),
          facture.displayRef ?? facture.id.slice(0, 8),
          client.name,
          facture.totalTtc,
          'Payée',
          email.id,
          garage.comptableEmail,
        ]);
      } catch (e) {
        console.warn('gsheet append failed', e);
      }
    }

    await supabase
      .from('email_dispatches')
      .update({
        status: 'sent',
        resend_message_id: email.id,
        gsheet_row_id: gsheetRow,
        sent_at: new Date().toISOString(),
      })
      .eq('id', (dispatch as { id: string }).id);

    return NextResponse.json({ ok: true, email_id: email.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from('email_dispatches')
      .update({ status: 'failed', error: msg })
      .eq('id', (dispatch as { id: string }).id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
