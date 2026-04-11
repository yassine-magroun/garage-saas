/**
 * POST /api/clients/retention
 * Trigger 5: email clients not contacted in 90+ days reminding them their vehicle needs a check-up.
 * Protected by CRON_SECRET. Call weekly.
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

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Clients with no contact in 90 days (or never contacted) who have an email
  const { data, error: fetchError } = await supabase
    .from('clients')
    .select('id, garage_id, name, email, vehicle, last_visit_days, last_contact_date, garages(name, phone)')
    .not('email', 'is', null)
    .or(`last_contact_date.is.null,last_contact_date.lte.${ninetyDaysAgo}`)
    .gt('last_visit_days', 89);

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    const clientEmail = row.email as string | null;
    if (!clientEmail) { skipped++; continue; }

    const garage = row.garages as Record<string, unknown> | null;
    const clientName = (row.name as string) ?? 'Client';
    const garageName = (garage?.name as string) ?? 'MecaniGo';
    const garagePhone = (garage?.phone as string) ?? '';
    const vehicle = (row.vehicle as string) ?? 'votre véhicule';
    const garageId = String(row.garage_id);
    const daysSince = Number(row.last_visit_days);

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:Inter,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:32px 0;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
<tr><td style="background:#0F1117;padding:24px 32px;">
  <span style="font-size:22px;font-weight:700;color:#FF6B2B;">${garageName}</span>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">🏍️ Il est temps de vérifier ${vehicle}</h2>
<p style="font-size:14px;color:#555;line-height:1.7;">Bonjour <strong>${clientName}</strong>,<br/><br/>
Cela fait <strong>${daysSince} jours</strong> que nous n'avons pas eu le plaisir de vous accueillir.
Votre véhicule <strong>${vehicle}</strong> mérite peut-être une petite révision pour rouler en toute sécurité.</p>
<div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:16px;margin:20px 0;">
  <p style="margin:0;font-size:14px;color:#0369A1;font-weight:600;">🔧 Contrôle de routine recommandé</p>
  <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#0C4A6E;line-height:1.8;">
    <li>Vidange et filtres</li>
    <li>Pression et état des pneus</li>
    <li>Freins et plaquettes</li>
    <li>Éclairage et signalisation</li>
  </ul>
</div>
${garagePhone ? `<p style="font-size:13px;color:#555;">Prenez rendez-vous : <strong>${garagePhone}</strong></p>` : ''}
<p style="margin:16px 0 0;font-size:13px;color:#888;">À bientôt,<br/><strong style="color:#FF6B2B;">${garageName}</strong></p>
</td></tr>
<tr><td style="background:#0F1117;padding:16px 32px;text-align:center;"><p style="margin:0;font-size:11px;color:#8B8FA8;">Vous recevez cet email car vous êtes client de ${garageName}.</p></td></tr>
</table></td></tr></table></body></html>`;

    const { error } = await resend.emails.send({
      from: 'MecaniGo <onboarding@resend.dev>',
      to: [clientEmail],
      subject: `🏍️ ${vehicle} — une révision s'impose — ${garageName}`,
      html,
    });

    if (!error) {
      // Update last_contact_date so we don't resend next week
      await supabase
        .from('clients')
        .update({ last_contact_date: new Date().toISOString() })
        .eq('id', row.id as string);
    }

    await logTrigger(garageId, 'CLIENT_RETENTION', {
      resourceType: 'client', resourceId: row.id as string,
      clientId: row.id as string,
      status: error ? 'error' : 'success',
      message: error ? error.message : `Relance envoyée à ${clientEmail} (${daysSince}j sans visite)`,
    });

    if (!error) sent++;
    else skipped++;
  }

  return Response.json({ sent, skipped, total: rows.length });
}
