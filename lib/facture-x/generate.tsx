import React from 'react';
import { renderToBuffer, Document } from '@react-pdf/renderer';
import { buildFacturXXml } from './xml-cii';
import { attachXmlToPdf } from './pdf-a3';
import { InvoicePDF } from '../../app/components/InvoicePDF';
import type { Facture, GarageSettings, Client } from '../types';

interface GenerateParams {
  facture: Facture;
  garage: GarageSettings;
  client: Client;
}

export async function generateFacturX(params: GenerateParams): Promise<Buffer> {
  const { facture, garage } = params;

  const garageProps = {
    garageName: garage.name,
    garageAddress: garage.address,
    garagePhone: garage.phone,
    garageEmail: garage.email,
    garageSiret: garage.siret ? `SIRET : ${garage.siret}` : undefined,
    garageLogoUrl: garage.logoUrl ?? undefined,
  };

  const element = React.createElement(InvoicePDF, { facture, ...garageProps }) as React.ReactElement<
    React.ComponentProps<typeof Document>
  >;

  const pdfBuffer = await renderToBuffer(element);

  const xml = buildFacturXXml(params);

  const factureXBuffer = await attachXmlToPdf(
    Buffer.from(pdfBuffer),
    xml,
    'factur-x.xml',
  );

  return factureXBuffer;
}

export async function generateStandardPdf(params: GenerateParams): Promise<Buffer> {
  const { facture, garage } = params;

  const garageProps = {
    garageName: garage.name,
    garageAddress: garage.address,
    garagePhone: garage.phone,
    garageEmail: garage.email,
    garageSiret: garage.siret ? `SIRET : ${garage.siret}` : undefined,
    garageLogoUrl: garage.logoUrl ?? undefined,
  };

  const element = React.createElement(InvoicePDF, { facture, ...garageProps }) as React.ReactElement<
    React.ComponentProps<typeof Document>
  >;

  return Buffer.from(await renderToBuffer(element));
}
