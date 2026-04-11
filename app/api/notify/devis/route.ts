/**
 * POST /api/notify/devis
 * Trigger 2: send "votre devis est prêt" email to client when a devis is created.
 */
import { Resend } from 'resend';
import { supabase } from '../../../../lib/supabase';
import { logTrigger } from '../../../../lib/api';

const resend = new Resend(process.env.RESEND_API_KEY!);

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export async function POST(req: Request): Promise<Response> {
  const { devisId, garageId } = (await req.json()) as { devisId: string; garageId: string };
  if (!devisId || !garageId) return Response.json({ error: 'Params manquants' }, { status: 400 });

  const { data: devisRow } = await supabase
    .from('devis')
    .select('display_ref, total_ttc, clients(name, email), garages(name, phone)')
    .eq('id', devisId)
    .eq('garage_id', garageId)
    .single();

  if (!devisRow) return Response.json({ skipped: true });

  const r = devisRow as Record<string, unknown>;
  const client = r.clients as Record<string, unknown> | null;
  const garage = r.garages as Record<string, unknown> | null;
  const clientEmail = client?.email as string | null;

  if (!clientEmail) {
    await logTrigger(garageId, 'DEVIS_NOTIFY', { resourceId: devisId, status: 'skipped', message: 'Pas d\'email client' });
    return Response.json({ skipped: true });
  }

  const clientName = (client?.name as string) ?? 'Client';
  const garageName = (garage?.name as string) ?? 'MecaniGo';
  const garagePhone = (garage?.phone as string) ?? '';
  const ref = (r.display_ref as string) ?? `DEV-${devisId.slice(0, 8).toUpperCase()}`;
  const totalTtc = Number(r.total_ttc);

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:Inter,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:32px 0;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
<tr><td style="background:#0F1117;padding:24px 32px;"><span style="font-size:22px;font-weight:700;color:#FF6B2B;">${garageName}</span></td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">📋 Votre devis est prêt</h2>
<p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">Bonjour <strong>${clientName}</strong>,<br/><br/>
Votre devis <strong>${ref}</strong> a été établi. Vous trouverez ci-dessous le récapitulatif :</p>
<div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:16px;margin-bottom:20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:12px;color:#0369A1;">Référence</td><td style="font-size:12px;color:#0369A1;text-align:right;">Montant TTC</td></tr>
<tr><td style="font-size:18px;font-weight:700;color:#1A1A2E;">${ref}</td><td style="font-size:18px;font-weight:700;color:#FF6B2B;text-align:right;">${fmtAmount(totalTtc)}</td></tr>
</table>
</div>
${garagePhone ? `<p style="font-size:13px;color:#555;">Pour toute question : <strong>${garagePhone}</strong></p>` : ''}
<p style="margin:16px 0 0;font-size:13px;color:#888;">Cordialement,<br/><strong style="color:#FF6B2B;">${garageName}</strong></p>
</td></tr>
<tr><td style="background:#0F1117;padding:16px 32px;text-align:center;"><p style="margin:0;font-size:11px;color:#8B8FA8;">Email envoyé par ${garageName} via MecaniGo.</p></td></tr>
</table></td></tr></table></body></html>`;

  const { error } = await resend.emails.send({
    from: 'MecaniGo <onboarding@resend.dev>',
    to: [clientEmail],
    subject: `📋 Votre devis ${ref} — ${garageName}`,
    html,
  });

  await supabase.from('clients').update({ last_contact_date: new Date().toISOString() }).eq('id', (client as Record<string, unknown>).id as string ?? '');

  await logTrigger(garageId, 'DEVIS_NOTIFY', {
    resourceType: 'devis', resourceId: devisId,
    status: error ? 'error' : 'success',
    message: error ? error.message : `Email envoyé à ${clientEmail}`,
  });

  return Response.json({ sent: !error });
}
