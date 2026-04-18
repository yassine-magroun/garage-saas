import { NextResponse } from 'next/server';

type RequestBody = {
  factureId?: string;
  clientName?: string;
  clientEmail?: string;
  amountHt?: number;
  totalTtc?: number;
  tva?: number;
  displayRef?: string;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
};

type ZapierPayload = {
  facture_id: string;
  client_name: string;
  client_email: string;
  amount_ht: number;
  amount_ttc: number;
  tva: number;
  invoice_number: string;
  status: string;
  payment_status: string;
  garage_name: string;
  pdf_url: string;
  created_at: string;
  month_label: string;
  day_label: string;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://garage-saas-one.vercel.app';

function monthLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function dayLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export async function POST(req: Request): Promise<NextResponse> {
  const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL;

  console.log('[Zapier] POST /api/zapier called');

  if (!zapierWebhookUrl) {
    console.error('[Zapier] ZAPIER_WEBHOOK_URL is not set in env');
    return NextResponse.json({ error: 'ZAPIER_WEBHOOK_URL not configured' }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    console.error('[Zapier] Failed to parse request body');
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { factureId, clientName, clientEmail, amountHt, totalTtc, tva, displayRef, status, paymentStatus, createdAt } = body;

  if (!factureId) {
    console.error('[Zapier] Missing factureId in body');
    return NextResponse.json({ error: 'factureId is required' }, { status: 400 });
  }

  const now = createdAt ?? new Date().toISOString();

  const payload: ZapierPayload = {
    facture_id: factureId,
    client_name: clientName ?? 'Client',
    client_email: clientEmail ?? '',
    amount_ht: amountHt ?? 0,
    amount_ttc: totalTtc ?? 0,
    tva: tva ?? 0,
    invoice_number: displayRef ?? factureId,
    status: status ?? 'émise',
    payment_status: paymentStatus ?? 'unpaid',
    garage_name: 'MecaniGo',
    pdf_url: `${APP_URL}/api/factures/${factureId}/pdf`,
    created_at: now,
    month_label: monthLabel(now),
    day_label: dayLabel(now),
  };

  console.log('[Zapier] Sending payload to Zapier:', JSON.stringify(payload));

  try {
    const res = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[Zapier] Zapier responded with status:', res.status);
  } catch (e) {
    // Silent fail — ne bloque pas la création de facture
    console.error('[Zapier] Webhook call failed:', e);
    return NextResponse.json({ success: false, error: 'Zapier webhook failed' }, { status: 200 });
  }

  console.log('[Zapier] Webhook sent successfully for factureId:', factureId);
  return NextResponse.json({ success: true });
}
