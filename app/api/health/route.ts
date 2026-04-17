import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Supabase ping
  try {
    const { error } = await supabase.from('garages').select('id').limit(1);
    checks.supabase = error ? 'error' : 'ok';
  } catch {
    checks.supabase = 'error';
  }

  // Resend key present
  checks.resend = process.env.RESEND_API_KEY ? 'ok' : 'error';

  // Clerk key present
  checks.clerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'ok' : 'error';

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
