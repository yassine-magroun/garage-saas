import { auth } from '@clerk/nextjs/server';
import { Resend } from 'resend';
import { supabase } from '../../../../lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY!);

interface AlertBody {
  garageId: string;
  pieceId: string;
}

interface StockAlertConfigRow {
  alert_email: string;
  alert_enabled: boolean;
}

interface PieceRow {
  id: string;
  name: string;
  reference: string | null;
  stock_quantity: number;
  stock_min: number;
  fournisseur: string | null;
  category: string;
}

export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: AlertBody;
  try {
    body = (await req.json()) as AlertBody;
  } catch {
    return Response.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { garageId, pieceId } = body;
  if (!garageId || !pieceId) {
    return Response.json({ error: 'garageId et pieceId requis' }, { status: 400 });
  }

  // Fetch piece
  const { data: pieceData, error: pieceError } = await supabase
    .from('pieces')
    .select('id, name, reference, stock_quantity, stock_min, fournisseur, category')
    .eq('id', pieceId)
    .eq('garage_id', garageId)
    .single();

  if (pieceError || !pieceData) {
    return Response.json({ error: 'Pièce introuvable' }, { status: 404 });
  }

  const piece = pieceData as PieceRow;

  // Fetch alert config
  const { data: configData } = await supabase
    .from('stock_alert_config')
    .select('alert_email, alert_enabled')
    .eq('garage_id', garageId)
    .single();

  const config = configData as StockAlertConfigRow | null;

  if (!config?.alert_enabled || !config.alert_email) {
    return Response.json({ skipped: true, reason: 'alerts_disabled' });
  }

  // Determine status label
  const statusLabel =
    piece.stock_quantity <= 0
      ? '🔴 Rupture de stock'
      : '🟡 Stock sous le seuil d\'alerte';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:Inter,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <tr><td style="background:#0F1117;padding:24px 32px;">
    <span style="font-size:22px;font-weight:700;color:#FF6B2B;">⚡ MecaniGo</span>
    <p style="margin:4px 0 0;font-size:12px;color:#8B8FA8;">Alerte stock automatique</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">${statusLabel}</h2>
    <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#92400E;padding-bottom:4px;">Pièce</td>
          <td style="font-size:13px;color:#92400E;text-align:right;padding-bottom:4px;">Référence</td>
        </tr>
        <tr>
          <td style="font-size:18px;font-weight:700;color:#1A1A2E;">${piece.name}</td>
          <td style="font-size:14px;color:#555;text-align:right;font-family:monospace;">${piece.reference ?? '—'}</td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #FDE68A;margin:16px 0;"/>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;padding:8px;">
            <p style="margin:0;font-size:11px;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;">Stock actuel</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:${piece.stock_quantity <= 0 ? '#DC2626' : '#D97706'};">${piece.stock_quantity}</p>
          </td>
          <td style="text-align:center;padding:8px;">
            <p style="margin:0;font-size:11px;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;">Seuil minimum</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#1A1A2E;">${piece.stock_min}</p>
          </td>
          <td style="text-align:center;padding:8px;">
            <p style="margin:0;font-size:11px;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;">Catégorie</p>
            <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#555;">${piece.category}</p>
          </td>
        </tr>
      </table>
    </div>
    ${piece.fournisseur
      ? `<p style="font-size:13px;color:#555;margin-bottom:20px;">Fournisseur : <strong>${piece.fournisseur}</strong></p>`
      : ''
    }
    <table cellpadding="0" cellspacing="0">
      <tr><td style="background:#FF6B2B;border-radius:8px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mecanigo.fr'}/stock"
           style="display:inline-block;padding:12px 28px;color:#fff;font-weight:600;font-size:14px;text-decoration:none;">
          Gérer le stock →
        </a>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:12px;color:#888;">Cet email est envoyé automatiquement par MecaniGo lorsque le stock d'une pièce passe sous le seuil configuré.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const { error: sendError } = await resend.emails.send({
    from: 'MecaniGo <onboarding@resend.dev>',
    to: [config.alert_email],
    subject: `⚠️ Alerte stock : ${piece.name} (${piece.stock_quantity} restant${piece.stock_quantity > 1 ? 's' : ''})`,
    html,
  });

  // Log the alert regardless of email success
  const { error: logError } = await supabase.from('stock_alerts_log').insert({
    garage_id: garageId,
    piece_id: pieceId,
    piece_name: piece.name,
    stock_current: piece.stock_quantity,
    stock_min: piece.stock_min,
    fournisseur: piece.fournisseur,
  });

  if (logError) {
    console.error('[StockAlert] Log error:', logError.message);
  }

  if (sendError) {
    return Response.json(
      { error: `Email non envoyé: ${sendError.message}`, logged: !logError },
      { status: 500 },
    );
  }

  return Response.json({ sent: true, to: config.alert_email });
}
