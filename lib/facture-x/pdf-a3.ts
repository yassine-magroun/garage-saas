import { PDFDocument, AFRelationship } from 'pdf-lib';

export async function attachXmlToPdf(
  pdfBuffer: Buffer,
  xml: string,
  filename: string,
): Promise<Buffer> {
  const pdf = await PDFDocument.load(pdfBuffer);
  await pdf.attach(Buffer.from(xml, 'utf-8'), filename, {
    mimeType: 'application/xml',
    description: 'Factur-X',
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Alternative,
  });
  pdf.setProducer('MecaniGo');
  pdf.setCreator('MecaniGo Factur-X Generator');
  return Buffer.from(await pdf.save());
}
