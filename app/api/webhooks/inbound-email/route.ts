import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { parseSupplierInvoice } from '../../../../lib/inbound/parser';
import { FLAGS } from '../../../../lib/feature-flags';

interface ResendInboundAttachment {
  contentType: string;
  filename?: string;
  content: string;
}

interface ResendInboundEvent {
  type: string;
  data: {
    id: string;
    to: string[];
    from: string;
    subject?: string;
    text?: string;
    html?: string;
    attachments?: ResendInboundAttachment[];
  };
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!FLAGS.INBOUND_EMAIL_PARSING) {
    return NextResponse.json({ skipped: 'feature disabled' });
  }

  const body = await req.text();

  // Verify Resend signature
  const signature = req.headers.get('resend-signature');
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret && signature) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    if (signature !== expected) {
      return NextResponse.json({ error: 'bad signature' }, { status: 401 });
    }
  }

  let event: ResendInboundEvent;
  try {
    event = JSON.parse(body) as ResendInboundEvent;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (event.type !== 'email.inbound') {
    return NextResponse.json({ skipped: true });
  }

  // Extract garage_id from address: achats-{uuid}@parse.mecanigo.fr
  const toAddr = event.data.to[0] ?? '';
  const match = toAddr.match(/achats-([0-9a-f-]{36})@/i);
  if (!match) {
    return NextResponse.json({ error: 'unrecognized recipient' }, { status: 400 });
  }
  const garage_id = match[1];

  const supabase = getServiceClient();

  // Idempotence
  const { data: existing } = await supabase
    .from('factures_achats')
    .select('id')
    .eq('raw_email_id', event.data.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ duplicate: true });

  const pdfAttachment = event.data.attachments?.find(
    (a) => a.contentType === 'application/pdf' || a.filename?.endsWith('.pdf'),
  );

  const parsed = await parseSupplierInvoice({
    from: event.data.from,
    subject: event.data.subject,
    text: event.data.text,
    html: event.data.html,
    pdfBase64: pdfAttachment?.content,
  });

  // Upload PDF to Supabase Storage (best-effort)
  let pdf_url: string | null = null;
  if (pdfAttachment?.content) {
    const { data: up } = await supabase.storage
      .from('supplier-invoices')
      .upload(
        `${garage_id}/${event.data.id}.pdf`,
        Buffer.from(pdfAttachment.content, 'base64'),
        { contentType: 'application/pdf', upsert: true },
      );
    pdf_url = up?.path ?? null;
  }

  await supabase.from('factures_achats').insert({
    garage_id,
    fournisseur: parsed.fournisseur,
    fournisseur_email: event.data.from,
    numero_facture: parsed.numero ?? null,
    date_facture: parsed.date ?? null,
    total_ht: parsed.totalHt ?? null,
    total_tva: parsed.totalTva ?? null,
    total_ttc: parsed.totalTtc ?? null,
    pdf_url,
    raw_email_id: event.data.id,
    parsed_data: parsed,
  });

  return NextResponse.json({ ok: true });
}
