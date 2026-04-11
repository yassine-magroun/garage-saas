/**
 * POST /api/alerts/overdue
 * Trigger 3: escalation email for factures unpaid after 30 days (stronger than J+7 reminder).
 * Protected by CRON_SECRET. Call weekly.
 */
import { Resend } from 'resend';
import { supabase } from '../../../../lib/supabase';
import { logTrigger } from '../../../../lib/api';

const resend = new Resend(process.env.RESEND_API_KEY!);

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

export async function POST(req: Request): Promise<Response> {
  const secret = req.headers.get('x-cron-secret') ?? '';
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  // Exclude the J+7 window — only pick up factures older than 30 days
  const { data, error: fetchError } = await supabase
    .from('factures')
    .select('id, garage_id, total_ttc, amount_paid, created_at, display_ref, clients(id, name, email), garages(name, phone, email)')
    .in('status', ['unpaid', 'partial'])
    .lte('created_at', thirtyDaysAgo);

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });

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
    const garageId = String(row.garage_id);
    const ref = (row.display_ref as string) ?? `FAC-${(row.id as string).slice(0, 8).toUpperCase()}`;
    const totalTtc = Number(row.total_ttc);
    const amountPaid = Number(row.amount_paid);
    const resteDu = Math.max(0, totalTtc - amountPaid);
    const daysOverdue = Math.floor((Date.now() - new Date(row.created_at as string).getTime()) / (1000 * 60 * 60 * 24));

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:Inter,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:32px 0;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0F1117;padding:24px 32px;">
  <span style="font-size:22px;font-weight:700;color:#FF6B2B;">${garageName}</span>
  <p style="margin:4px 0 0;font-size:11px;color:#EF4444;">⚠️ Facture en retard de paiement</p>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;font-size:20px;color:#DC2626;">🚨 Facture impayée depuis ${daysOverdue} jours</h2>
<p style="font-size:14px;color:#555;line-height:1.7;">Bonjour <strong>${clientName}</strong>,<br/><br/>
Malgré nos relances précédentes, la facture <strong>${ref}</strong> du ${fmtDate(row.created_at as string)} reste impayée.</p>
<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin-bottom:20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:12px;color:#DC2626;">Montant total</td><td style="font-size:12px;color:#DC2626;text-align:right;">Reste dû</td></tr>
<tr><td style="font-size:20px;font-weight:700;color:#1A1A2E;">${fmtAmount(totalTtc)}</td>
    <td style="font-size:20px;font-weight:700;color:#DC2626;text-align:right;">${fmtAmount(resteDu)}</td></tr>
</table>
</div>
<p style="font-size:14px;color:#555;line-height:1.7;">
Conformément à la législation en vigueur, des <strong>pénalités de retard</strong> peuvent être appliquées.
Nous vous invitons à régulariser cette situation dans les plus brefs délais.
</p>
${garagePhone ? `<p style="font-size:13px;color:#555;">Contact immédiat : <strong>${garagePhone}</strong></p>` : ''}
<p style="margin:16px 0 0;font-size:13px;color:#888;"><strong style="color:#FF6B2B;">${garageName}</strong></p>
</td></tr>
</table></td></tr></table></body></html>`;

    const { error } = await resend.emails.send({
      from: 'MecaniGo <onboarding@resend.dev>',
      to: [clientEmail],
      subject: `🚨 URGENT — Facture ${ref} impayée depuis ${daysOverdue} jours`,
      html,
    });

    await logTrigger(garageId, 'ALERT_OVERDUE', {
      resourceType: 'facture', resourceId: row.id as string,
      clientId: client?.id as string ?? undefined,
      status: error ? 'error' : 'success',
      message: error ? error.message : `Escalade envoyée à ${clientEmail} (${daysOverdue}j)`,
    });

    if (!error) sent++;
    else skipped++;
  }

  return Response.json({ sent, skipped, total: rows.length });
}
