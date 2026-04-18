import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { Resend } from 'resend';
import type { NextRequest } from 'next/server';
import { getFactureWithPayments } from '../../../../lib/api';
import { InvoicePDF } from '../../../components/InvoicePDF';

const resend = new Resend(process.env.RESEND_API_KEY!);

const STATUS_LABELS: Record<string, string> = {
  unpaid: 'Non payée',
  partial: 'Partiellement payée',
  paid: 'Payée',
  cancelled: 'Annulée',
};

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

interface SendEmailBody {
  factureId: string;
  garageId: string;
  clientEmail: string;
  clientName: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: SendEmailBody;
  try {
    body = (await request.json()) as SendEmailBody;
  } catch {
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { factureId, garageId, clientEmail, clientName } = body;
  console.log('Email route called', { factureId, garageId, clientEmail });
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

  if (!factureId || !garageId || !clientEmail) {
    return Response.json(
      { error: 'factureId, garageId et clientEmail sont requis' },
      { status: 400 },
    );
  }

  let facture;
  try {
    facture = await getFactureWithPayments(factureId, garageId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Facture introuvable';
    return Response.json({ error: message }, { status: 404 });
  }

  const invoiceNum = facture.displayRef ?? `FAC-${facture.id.slice(0, 8).toUpperCase()}`;
  const statusLabel = STATUS_LABELS[facture.status] ?? facture.status;

  // Generate PDF buffer
  const element = React.createElement(InvoicePDF, { facture }) as React.ReactElement<
    React.ComponentProps<typeof import('@react-pdf/renderer').Document>
  >;
  const pdfBuffer = await renderToBuffer(element);

  // Build email HTML
  const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre facture MecaniGo</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0F1117;padding:28px 36px;">
              <span style="font-size:26px;font-weight:700;color:#FF6B2B;letter-spacing:-0.5px;">MecaniGo</span>
              <p style="margin:4px 0 0;font-size:12px;color:#8B8FA8;">La gestion garage, enfin simple.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              <p style="margin:0 0 20px;font-size:15px;color:#1A1A2E;">
                Bonjour <strong>${clientName ?? 'Client'}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
                Veuillez trouver ci-joint votre facture <strong>${invoiceNum}</strong>.
              </p>

              <!-- Summary card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#F8F9FC;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:12px;color:#8B8FA8;padding-bottom:6px;">Numéro de facture</td>
                        <td style="font-size:12px;color:#8B8FA8;text-align:right;padding-bottom:6px;">Date</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;font-weight:600;color:#1A1A2E;">${invoiceNum}</td>
                        <td style="font-size:14px;font-weight:600;color:#1A1A2E;text-align:right;">${fmtDate(facture.createdAt)}</td>
                      </tr>
                      <tr><td colspan="2" style="padding:10px 0;"><hr style="border:none;border-top:1px solid #E5E7EB;margin:0;"/></td></tr>
                      <tr>
                        <td style="font-size:12px;color:#8B8FA8;padding-bottom:6px;">Montant TTC</td>
                        <td style="font-size:12px;color:#8B8FA8;text-align:right;padding-bottom:6px;">Statut</td>
                      </tr>
                      <tr>
                        <td style="font-size:20px;font-weight:700;color:#FF6B2B;">${fmtAmount(facture.totalTtc)}</td>
                        <td style="text-align:right;">
                          <span style="
                            display:inline-block;
                            padding:3px 10px;
                            border-radius:99px;
                            font-size:11px;
                            font-weight:600;
                            background:${facture.status === 'paid' ? '#D1FAE5' : facture.status === 'unpaid' ? '#FEE2E2' : '#FEF3C7'};
                            color:${facture.status === 'paid' ? '#059669' : facture.status === 'unpaid' ? '#DC2626' : '#D97706'};
                          ">${statusLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6;">
                Pour toute question concernant cette facture, n'hésitez pas à contacter votre garage directement.
              </p>
              <p style="margin:0;font-size:14px;color:#1A1A2E;">
                Cordialement,<br/>
                <strong style="color:#FF6B2B;">L'équipe MecaniGo</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0F1117;padding:20px 36px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#8B8FA8;line-height:1.6;">
                MecaniGo · La gestion garage, enfin simple.<br/>
                Vous recevez cet email car une facture vous a été adressée.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  console.log('Sending email via Resend...');
  const { data, error } = await resend.emails.send({
    from: 'MecaniGo <onboarding@resend.dev>',
    to: [clientEmail],
    subject: `Votre facture MecaniGo - ${invoiceNum}`,
    html: emailHtml,
    attachments: [
      {
        filename: `facture-${invoiceNum}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  });

  console.log('Resend result:', { data, error });

  if (error) {
  console.error('Resend error:', error);
  return Response.json({ error: error.message }, { status: 500 });
}

// ✅ Zapier webhook
await fetch("https://hooks.zapier.com/hooks/catch/27236872/uj2qe3i/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    factureId,
    garageId,
    clientEmail,
    clientName,
    invoiceNum,
  }),
});

return Response.json({ success: true, invoiceNum });

}
