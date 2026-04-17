import { createClient } from '@supabase/supabase-js';
import { renderToBuffer, Document } from '@react-pdf/renderer';
import React from 'react';
import type { NextRequest } from 'next/server';
import { getFactureWithPayments, getGarageSettings } from '../../../../../lib/api';
import { InvoicePDF } from '../../../../components/InvoicePDF';

// Service-role client — bypasses RLS to look up garageId from factureId alone
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: factureId } = await params;

  if (!factureId || typeof factureId !== 'string') {
    return new Response(JSON.stringify({ error: 'factureId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Look up garageId using service role (no auth required)
  const { data: row, error } = await supabaseAdmin
    .from('factures')
    .select('garage_id')
    .eq('id', factureId)
    .single();

  if (error || !row) {
    return new Response(JSON.stringify({ error: 'Facture introuvable' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const garageId: string = row.garage_id;

  let facture;
  try {
    facture = await getFactureWithPayments(factureId, garageId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Facture introuvable';
    return new Response(JSON.stringify({ error: message }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
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

  const element = React.createElement(InvoicePDF, { facture, ...garageProps }) as React.ReactElement<
    React.ComponentProps<typeof Document>
  >;
  const buffer = await renderToBuffer(element);
  const uint8 = new Uint8Array(buffer);

  return new Response(uint8, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="facture-${invoiceNum}.pdf"`,
      'Content-Length': String(uint8.byteLength),
    },
  });
}
