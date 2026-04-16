import { NextResponse } from 'next/server';

type RequestBody = {
  clientName?: string;
  totalTtc?: number;
  displayRef?: string;
  factureId?: string;
  status?: string;
};

type ZapierPayload = {
  client_name: string;
  amount: number;
  invoice_number: string;
  status: string;
  garage_name: string;
  pdf_url: string;
};

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

  const { clientName, totalTtc, displayRef, factureId, status } = body;

  if (!factureId) {
    console.error('[Zapier] Missing factureId in body');
    return NextResponse.json({ error: 'factureId is required' }, { status: 400 });
  }

  const payload: ZapierPayload = {
    client_name: clientName ?? 'Client',
    amount: totalTtc ?? 0,
    invoice_number: displayRef ?? factureId,
    status: status ?? 'émise',
    garage_name: 'MecaniGo',
    pdf_url: `https://garage-saas-one.vercel.app/factures/${factureId}`,
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
