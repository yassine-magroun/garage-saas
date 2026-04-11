import { auth } from '@clerk/nextjs/server';
import { Resend } from 'resend';
import { supabase } from '../../../../lib/supabase';
import { createFactureFromIntervention, logTrigger } from '../../../../lib/api';

const resend = new Resend(process.env.RESEND_API_KEY!);

const VALID_STATUSES = ['En attente', 'En cours', 'Prêt', 'Livré'] as const;
type IntStatus = typeof VALID_STATUSES[number];

interface StatusBody {
  interventionId: string;
  garageId: string;
  newStatus: IntStatus;
  clientEmail?: string;
  clientName?: string;
  vehicle?: string;
}

export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 });

  let body: StatusBody;
  try {
    body = await req.json() as StatusBody;
  } catch {
    return Response.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { interventionId, garageId, newStatus, clientEmail, clientName, vehicle } = body;

  if (!interventionId || !garageId || !newStatus) {
    return Response.json({ error: 'interventionId, garageId et newStatus requis' }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return Response.json({ error: `Statut invalide: ${newStatus}` }, { status: 400 });
  }

  // Update in Supabase
  const { error } = await supabase
    .from('interventions')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', interventionId)
    .eq('garage_id', garageId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Trigger 4: Prêt → auto-create facture draft
  if (newStatus === 'Prêt') {
    try {
      const facture = await createFactureFromIntervention(interventionId, garageId);
      // Return facture ref in response so UI can show it
      void logTrigger(garageId, 'AUTO_FACTURE_DRAFT', {
        resourceType: 'facture',
        resourceId: facture.id,
        message: `Brouillon ${facture.displayRef ?? facture.id} pré-rempli`,
      });
    } catch {
      void logTrigger(garageId, 'AUTO_FACTURE_DRAFT', {
        status: 'error',
        message: 'Échec création brouillon facture',
      });
    }
  }

  // Send email only when status → "Prêt"
  if (newStatus === 'Prêt' && clientEmail) {
    const garageName = await supabase
      .from('garages')
      .select('name, phone')
      .eq('id', garageId)
      .single()
      .then(({ data }) => ({ name: (data as Record<string,unknown>)?.name as string ?? 'MecaniGo', phone: (data as Record<string,unknown>)?.phone as string ?? '' }));

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:32px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0F1117;padding:24px 32px;">
          <span style="font-size:22px;font-weight:700;color:#FF6B2B;">${garageName.name}</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">🎉 Votre véhicule est prêt !</h2>
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">
            Bonjour <strong>${clientName ?? 'Client'}</strong>,<br/><br/>
            Nous avons le plaisir de vous informer que votre véhicule
            ${vehicle ? `<strong>${vehicle}</strong>` : ''} est prêt à être récupéré.
          </p>
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="margin:0;font-size:14px;color:#16A34A;font-weight:600;">✅ Intervention terminée</p>
            ${garageName.phone ? `<p style="margin:6px 0 0;font-size:13px;color:#555;">Pour toute question : <strong>${garageName.phone}</strong></p>` : ''}
          </div>
          <p style="margin:0;font-size:13px;color:#888;">Merci de votre confiance.<br/>
          <strong style="color:#FF6B2B;">${garageName.name}</strong></p>
        </td></tr>
        <tr><td style="background:#0F1117;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8B8FA8;">Vous recevez cet email car votre véhicule est en service chez ${garageName.name}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

    await resend.emails.send({
      from: 'MecaniGo <onboarding@resend.dev>',
      to: [clientEmail],
      subject: `🎉 Votre véhicule est prêt — ${garageName.name}`,
      html,
    }).catch(() => { /* non-blocking */ });
  }

  return Response.json({ success: true });
}
