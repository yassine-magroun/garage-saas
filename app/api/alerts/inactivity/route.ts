/**
 * POST /api/alerts/inactivity
 * Trigger 3: if no new intervention in last 7 days, email the garage owner.
 * Protected by CRON_SECRET header. Call daily from a cron job.
 */
import { Resend } from 'resend';
import { supabase } from '../../../../lib/supabase';
import { logTrigger } from '../../../../lib/api';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request): Promise<Response> {
  const secret = req.headers.get('x-cron-secret') ?? '';
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all garages with their owner email
  const { data: garages } = await supabase
    .from('garages')
    .select('id, name, email, phone')
    .is('deleted_at', null);

  const rows = (garages ?? []) as Array<Record<string, unknown>>;
  let sent = 0;
  let skipped = 0;

  for (const garage of rows) {
    const garageId = String(garage.id);
    const garageEmail = garage.email as string | null;
    const garageName = (garage.name as string) ?? 'Votre garage';

    if (!garageEmail) { skipped++; continue; }

    // Check if any intervention was created in the last 7 days
    const { count } = await supabase
      .from('interventions')
      .select('id', { count: 'exact', head: true })
      .eq('garage_id', garageId)
      .gte('created_at', sevenDaysAgo);

    if ((count ?? 0) > 0) { skipped++; continue; }

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:Inter,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:32px 0;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
<tr><td style="background:#0F1117;padding:24px 32px;">
  <span style="font-size:22px;font-weight:700;color:#FF6B2B;">${garageName}</span>
  <p style="margin:4px 0 0;font-size:11px;color:#8B8FA8;">Alerte activité</p>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">⚠️ Aucune nouvelle intervention cette semaine</h2>
<p style="font-size:14px;color:#555;line-height:1.7;">
  Bonjour,<br/><br/>
  Votre tableau de bord MecaniGo indique qu'aucune nouvelle intervention n'a été enregistrée
  au cours des <strong>7 derniers jours</strong>.
</p>
<div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:16px;margin:20px 0;">
  <p style="margin:0;font-size:14px;color:#92400E;font-weight:600;">💡 Actions suggérées</p>
  <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#78350F;line-height:1.8;">
    <li>Contacter vos clients pour rappels d'entretien</li>
    <li>Vérifier les devis en attente de réponse</li>
    <li>Envoyer des offres de service à votre base clients</li>
  </ul>
</div>
<p style="font-size:13px;color:#888;">Cet email est envoyé automatiquement chaque semaine sans activité.<br/>
<strong style="color:#FF6B2B;">${garageName} via MecaniGo</strong></p>
</td></tr>
</table></td></tr></table></body></html>`;

    const { error } = await resend.emails.send({
      from: 'MecaniGo <onboarding@resend.dev>',
      to: [garageEmail],
      subject: `⚠️ Aucune intervention cette semaine — ${garageName}`,
      html,
    });

    await logTrigger(garageId, 'ALERT_INACTIVITY', {
      status: error ? 'error' : 'success',
      message: error ? error.message : `Alerte envoyée à ${garageEmail}`,
    });

    if (!error) sent++;
    else skipped++;
  }

  return Response.json({ sent, skipped, total: rows.length });
}
