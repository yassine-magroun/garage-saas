/**
 * POST /api/factures/remind
 * Sends reminder emails for unpaid/partial factures older than 7 days.
 * Call this from a cron job (e.g. Vercel Cron, GitHub Actions, etc.)
 * Protected by CRON_SECRET header.
 */
import { Resend } from 'resend';
import { supabase } from '../../../../lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY!);

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

export async function POST(req: Request): Promise<Response> {
  // Lightweight auth — CRON_SECRET in header or body
  const secret = req.headers.get('x-cron-secret') ?? '';
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch overdue factures with client email
  const { data, error } = await supabase
    .from('factures')
    .select('id, garage_id, client_id, total_ttc, amount_paid, created_at, display_ref, clients(name, email), garages(name, phone)')
    .in('status', ['unpaid', 'partial'])
    .lte('created_at', sevenDaysAgo);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    const client = row.clients as Record<string, unknown> | null;
    const garage = row.garages as Record<string, unknown> | null;
    const clientEmail = client?.email as string | null;

    if (!clientEmail) { skipped++; continue; }

    const clientName = (client?.name as string) ?? 'Client';
    const garageName = (garage?.name as string) ?? 'MecaniGo';
    const garagePhone = (garage?.phone as string) ?? '';
    const invoiceRef = (row.display_ref as string) ?? `FAC-${(row.id as string).slice(0, 8).toUpperCase()}`;
    const totalTtc = Number(row.total_ttc);
    const amountPaid = Number(row.amount_paid);
    const resteDu = Math.max(0, totalTtc - amountPaid);
    const createdAt = row.created_at as string;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:32px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0F1117;padding:24px 32px;">
          <span style="font-size:22px;font-weight:700;color:#FF6B2B;">${garageName}</span>
          <p style="margin:4px 0 0;font-size:11px;color:#8B8FA8;">Rappel de paiement</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:14px;color:#1A1A2E;">Bonjour <strong>${clientName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.7;">
            Nous vous rappelons que la facture <strong>${invoiceRef}</strong> du ${fmtDate(createdAt)} reste impayée.
          </p>
          <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:16px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#92400E;">Montant total</td>
                <td style="font-size:12px;color:#92400E;text-align:right;">Reste dû</td>
              </tr>
              <tr>
                <td style="font-size:18px;font-weight:700;color:#1A1A2E;">${fmtAmount(totalTtc)}</td>
                <td style="font-size:18px;font-weight:700;color:#D97706;text-align:right;">${fmtAmount(resteDu)}</td>
              </tr>
            </table>
          </div>
          ${garagePhone ? `<p style="font-size:13px;color:#555;">Pour régler ou pour toute question : <strong>${garagePhone}</strong></p>` : ''}
          <p style="margin:16px 0 0;font-size:13px;color:#888;">Cordialement,<br/><strong style="color:#FF6B2B;">${garageName}</strong></p>
        </td></tr>
        <tr><td style="background:#0F1117;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8B8FA8;">Vous recevez cet email automatique de rappel de ${garageName}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

    const { error: sendError } = await resend.emails.send({
      from: 'MecaniGo <onboarding@resend.dev>',
      to: [clientEmail],
      subject: `Rappel : facture ${invoiceRef} en attente de paiement`,
      html,
    });

    if (!sendError) sent++;
    else skipped++;
  }

  return Response.json({ sent, skipped, total: rows.length });
}
