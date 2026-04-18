import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { FLAGS } from '../../../lib/feature-flags';

export const dynamic = 'force-dynamic';

type CheckResult = 'ok' | 'warn' | 'error';

interface HealthCheck {
  status: CheckResult;
  latency?: number;
  detail?: string;
}

async function timedCheck(fn: () => Promise<void>): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await fn();
    return { status: 'ok', latency: Date.now() - start };
  } catch (e) {
    return { status: 'error', latency: Date.now() - start, detail: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(): Promise<NextResponse> {
  const checks: Record<string, HealthCheck> = {};

  // Supabase DB ping
  checks.supabase_db = await timedCheck(async () => {
    const { error } = await supabase.from('garages').select('id').limit(1);
    if (error) throw new Error(error.message);
  });

  // Supabase storage (best-effort)
  checks.supabase_storage = await timedCheck(async () => {
    const { error } = await supabase.storage.listBuckets();
    if (error) throw new Error(error.message);
  });

  // Resend API key
  checks.resend = {
    status: process.env.RESEND_API_KEY ? 'ok' : 'warn',
    detail: process.env.RESEND_API_KEY ? undefined : 'RESEND_API_KEY not set',
  };

  // Clerk
  checks.clerk = {
    status: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'ok' : 'error',
    detail: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? undefined : 'CLERK key missing',
  };

  // Automation token
  checks.automation = {
    status: process.env.INTERNAL_AUTOMATION_TOKEN ? 'ok' : 'warn',
    detail: process.env.INTERNAL_AUTOMATION_TOKEN ? undefined : 'INTERNAL_AUTOMATION_TOKEN not set — PDF automation disabled',
  };

  // GCP / GSheet (optional)
  checks.gsheet = {
    status: process.env.GCP_SERVICE_ACCOUNT_JSON ? 'ok' : 'warn',
    detail: process.env.GCP_SERVICE_ACCOUNT_JSON ? undefined : 'GCP_SERVICE_ACCOUNT_JSON not set — GSheet tracking disabled',
  };

  // Feature flags snapshot
  const flags = FLAGS as Record<string, boolean>;

  // Commit SHA (set by Vercel)
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local';

  const allOk = Object.values(checks).every(c => c.status !== 'error');
  const hasWarn = Object.values(checks).some(c => c.status === 'warn');
  const overallStatus = allOk ? (hasWarn ? 'degraded' : 'ok') : 'error';

  return NextResponse.json(
    {
      status: overallStatus,
      version,
      ts: new Date().toISOString(),
      checks,
      flags,
    },
    { status: overallStatus === 'error' ? 503 : 200 },
  );
}
