import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Bridge: browser can't hold INTERNAL_AUTOMATION_TOKEN, so it calls this server
 * route which then forwards to the automation with the secret.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: facture_id } = await params;
  if (!facture_id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const baseUrl = process.env.BASE_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

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
    const data = await res.json() as Record<string, unknown>;
    return NextResponse.json({ forwarded: true, result: data });
  } catch (e) {
    console.error('[trigger-automation] forward failed', e);
    return NextResponse.json({ forwarded: false }, { status: 200 });
  }
}
