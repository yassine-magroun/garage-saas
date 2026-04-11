import { renderToBuffer, Document } from '@react-pdf/renderer';
import React from 'react';
import type { NextRequest } from 'next/server';
import { getFactureWithPayments, getGarageSettings } from '../../../../lib/api';
import { InvoicePDF } from '../../../components/InvoicePDF';

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const factureId = searchParams.get('factureId');
  const garageId = searchParams.get('garageId');

  if (!factureId || !garageId) {
    return new Response(
      JSON.stringify({ error: 'factureId and garageId are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let facture;
  try {
    facture = await getFactureWithPayments(factureId, garageId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Facture introuvable';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const garage = await getGarageSettings(garageId);

  const invoiceNum = facture.displayRef ?? `FAC-${facture.id.slice(0, 8).toUpperCase()}`;

  const garageProps = garage
    ? {
        garageName: garage.name,
        garageAddress: garage.address,
        garagePhone: garage.phone,
        garageEmail: garage.email,
        garageSiret: garage.siret ? `SIRET : ${garage.siret}` : undefined,
        garageLogoUrl: garage.logoUrl ?? undefined,
      }
    : {};

  // Cast to Document element type expected by renderToBuffer
  const element = React.createElement(InvoicePDF, { facture, ...garageProps }) as React.ReactElement<
    React.ComponentProps<typeof Document>
  >;
  const buffer = await renderToBuffer(element);

  // Convert Node Buffer → Uint8Array so the Web Response BodyInit accepts it
  const uint8 = new Uint8Array(buffer);

  return new Response(uint8, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${invoiceNum}.pdf"`,
      'Content-Length': String(uint8.byteLength),
    },
  });
}
