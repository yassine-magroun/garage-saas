import { NextResponse } from 'next/server';

type ZapierPayload = {
  client_name: string;
  amount: number;
  invoice_number: string;
  status: string;
  garage_name: string;
  pdf_url: string;
};

type RequestBody = {
  clientName?: string;
  totalTtc?: number;
  displayRef?: string;
  factureId?: string;
  status?: string;
};

export async function POST(req: Request): Promise<NextResponse> {
  const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL;

  if (!zapierWebhookUrl) {
    return NextResponse.json({ error: 'ZAPIER_WEBHOOK_URL not configured' }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { clientName, totalTtc, displayRef, factureId, status } = body;

  if (!factureId) {
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

  try {
    await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Silent fail — don't block invoice creation
    console.error('Zapier webhook failed:', e);
    return NextResponse.json({ success: false, error: 'Zapier webhook failed' }, { status: 200 });
  }

  return NextResponse.json({ success: true });
}
