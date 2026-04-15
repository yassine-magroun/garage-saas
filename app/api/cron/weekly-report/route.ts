import { Resend } from 'resend';
import { supabase } from '../../../../lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY!);

type GarageRow = {
  id: string;
  name: string;
  comptable_email: string;
};

type FactureRow = {
  id: string;
  display_ref: string | null;
  created_at: string;
  total_ttc: number;
  status: string;
  clients: { name: string } | null;
};

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

const STATUS_LABELS: Record<string, string> = {
  unpaid: 'Non payée',
  partial: 'Partiellement payée',
  paid: 'Payée',
  cancelled: 'Annulée',
};

function buildEmail(garageName: string, factures: FactureRow[], weekLabel: string): string {
  const totalHt = factures.reduce((s, f) => s + Number(f.total_ttc) / 1.2, 0);
  const totalTtc = factures.reduce((s, f) => s + Number(f.total_ttc), 0);

  const rows = factures
    .map(
      (f) => `
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #2A2D3A;font-size:13px;color:#fff;">${f.display_ref ?? f.id.slice(0, 8).toUpperCase()}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #2A2D3A;font-size:13px;color:#fff;">${(f.clients as { name: string } | null)?.name ?? '—'}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #2A2D3A;font-size:13px;color:#8B8FA8;">${fmtDate(f.created_at)}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #2A2D3A;font-size:13px;color:#fff;text-align:right;">${fmtAmount(Number(f.total_ttc))}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #2A2D3A;font-size:12px;color:#8B8FA8;">${STATUS_LABELS[f.status] ?? f.status}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>Résumé semaine — MecaniGo</title></head>
<body style="margin:0;padding:0;background:#0F1117;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F1117;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1D27;border-radius:12px;overflow:hidden;border:1px solid #2A2D3A;">

        <tr><td style="background:#1A1D27;padding:28px 36px;border-bottom:1px solid #2A2D3A;">
          <span style="font-size:24px;font-weight:700;color:#FF6B2B;">MecaniGo</span>
          <p style="margin:4px 0 0;font-size:12px;color:#8B8FA8;">Résumé hebdomadaire · ${weekLabel}</p>
        </td></tr>

        <tr><td style="padding:28px 36px;">
          <p style="font-size:15px;color:#fff;margin:0 0 6px;">Bonjour,</p>
          <p style="font-size:13px;color:#8B8FA8;margin:0 0 24px;">Voici le résumé des factures émises cette semaine pour <strong style="color:#fff;">${garageName}</strong>.</p>

          <!-- KPIs -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td width="50%" style="padding-right:8px;">
                <div style="background:#0F1117;border:1px solid #2A2D3A;border-radius:8px;padding:16px;">
                  <p style="margin:0;font-size:11px;color:#8B8FA8;text-transform:uppercase;letter-spacing:.05em;">Total HT</p>
                  <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#FF6B2B;">${fmtAmount(totalHt)}</p>
                </div>
              </td>
              <td width="50%" style="padding-left:8px;">
                <div style="background:#0F1117;border:1px solid #2A2D3A;border-radius:8px;padding:16px;">
                  <p style="margin:0;font-size:11px;color:#8B8FA8;text-transform:uppercase;letter-spacing:.05em;">Total TTC (${factures.length} facture${factures.length !== 1 ? 's' : ''})</p>
                  <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#fff;">${fmtAmount(totalTtc)}</p>
                </div>
              </td>
            </tr>
          </table>

          <!-- Table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2A2D3A;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#0F1117;">
                <th style="padding:10px 14px;text-align:left;font-size:11px;color:#8B8FA8;font-weight:600;">Réf</th>
                <th style="padding:10px 14px;text-align:left;font-size:11px;color:#8B8FA8;font-weight:600;">Client</th>
                <th style="padding:10px 14px;text-align:left;font-size:11px;color:#8B8FA8;font-weight:600;">Date</th>
                <th style="padding:10px 14px;text-align:right;font-size:11px;color:#8B8FA8;font-weight:600;">TTC</th>
                <th style="padding:10px 14px;text-align:left;font-size:11px;color:#8B8FA8;font-weight:600;">Statut</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td></tr>

        <tr><td style="background:#0F1117;padding:18px 36px;text-align:center;border-top:1px solid #2A2D3A;">
          <p style="margin:0;font-size:11px;color:#8B8FA8;">MecaniGo · La gestion garage, enfin simple.<br/>Rapport automatique envoyé chaque vendredi.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET(req: Request): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all garages where comptable_email is not null
  const { data: garages, error: garagesError } = await supabase
    .from('garages')
    .select('id, name, comptable_email')
    .not('comptable_email', 'is', null)
    .not('comptable_email', 'eq', '');

  if (garagesError) return Response.json({ error: garagesError.message }, { status: 500 });
  if (!garages?.length) return Response.json({ success: true, sent: 0 });

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const fromDate = oneWeekAgo.toISOString();

  const weekLabel = `${oneWeekAgo.toLocaleDateString('fr-FR')} – ${now.toLocaleDateString('fr-FR')}`;

  let sent = 0;
  const errors: string[] = [];

  for (const garage of garages as GarageRow[]) {
    const { data: factures } = await supabase
      .from('factures')
      .select('id, display_ref, created_at, total_ttc, status, clients(name)')
      .eq('garage_id', garage.id)
      .gte('created_at', fromDate);

    if (!factures?.length) continue;

    const html = buildEmail(garage.name, factures as FactureRow[], weekLabel);

    const { error } = await resend.emails.send({
      from: 'MecaniGo <onboarding@resend.dev>',
      to: [garage.comptable_email],
      subject: '📊 Résumé semaine — MecaniGo',
      html,
    });

    if (error) {
      errors.push(`${garage.id}: ${error.message}`);
    } else {
      sent++;
    }
  }

  return Response.json({ success: true, sent, errors });
}
