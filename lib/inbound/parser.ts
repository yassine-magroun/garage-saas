export interface ParsedInvoice {
  fournisseur: string;
  numero?: string;
  date?: string;
  totalHt?: number;
  totalTva?: number;
  totalTtc?: number;
}

const KNOWN_SUPPLIERS: Record<string, RegExp> = {
  'Yamaha': /@yamaha-motor\./i,
  'Honda': /@honda\./i,
  'Shimano': /@shimano\./i,
  'Bihr': /@bihr\./i,
  'Dafy': /@dafy/i,
};

function parseNum(s?: string): number | undefined {
  if (!s) return undefined;
  const n = parseFloat(s.replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

export async function parseSupplierInvoice(input: {
  from: string;
  subject?: string;
  text?: string;
  html?: string;
  pdfBase64?: string;
}): Promise<ParsedInvoice> {
  let fournisseur = 'Inconnu';
  for (const [name, rgx] of Object.entries(KNOWN_SUPPLIERS)) {
    if (rgx.test(input.from)) { fournisseur = name; break; }
  }
  if (fournisseur === 'Inconnu') {
    const domain = input.from.match(/@([^>\s]+)/)?.[1] ?? 'inconnu';
    fournisseur = domain.split('.')[0] ?? 'inconnu';
  }

  const corpus = `${input.subject ?? ''}\n${input.text ?? ''}`;

  const numero = corpus.match(/(?:facture|invoice|n°|#)\s*[:\-]?\s*([A-Z0-9\-\/]{4,})/i)?.[1];
  const dateRaw = corpus.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1];
  const date = dateRaw ? dateRaw.split('/').reverse().join('-') : undefined;

  const ttcMatch = corpus.match(/total\s*ttc[^\d]*([\d\s,\.]+)/i)?.[1];
  const htMatch = corpus.match(/total\s*ht[^\d]*([\d\s,\.]+)/i)?.[1];
  const tvaMatch = corpus.match(/(?:tva|t\.v\.a\.)[^\d]*([\d\s,\.]+)/i)?.[1];

  return {
    fournisseur,
    numero,
    date,
    totalTtc: parseNum(ttcMatch),
    totalHt: parseNum(htMatch),
    totalTva: parseNum(tvaMatch),
  };
}
