import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let facture_id: string;
  try {
    const body = await req.json() as { facture_id?: string };
    if (!body.facture_id) throw new Error('missing facture_id');
    facture_id = body.facture_id;
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `${req.headers.get('x-forwarded-proto') ?? 'https'}://${req.headers.get('host')}`;

  const token = process.env.INTERNAL_AUTOMATION_TOKEN;

  try {
    const res = await fetch(`${baseUrl}/api/automations/facture-payee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ facture_id }),
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
