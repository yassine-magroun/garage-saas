export const toNum = (v: unknown): number => {
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }
  return 0;
};

export const computeHT = (ttc: unknown, tvaRate = 20): number => {
  const n = toNum(ttc);
  return Math.round((n / (1 + tvaRate / 100)) * 100) / 100;
};

export const formatEUR = (n: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
