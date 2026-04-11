import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Facture, FactureItem } from '../../lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

function padId(id: string, displayRef?: string): string {
  return displayRef ?? `FAC-${id.slice(0, 8).toUpperCase()}`;
}

const STATUS_LABELS: Record<string, string> = {
  unpaid: 'Non payée',
  partial: 'Partielle',
  paid: 'Payée',
  cancelled: 'Annulée',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A1A2E',
    padding: 40,
    backgroundColor: '#FFFFFF',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  brandName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#FF6B2B',
  },
  brandTagline: {
    fontSize: 9,
    color: '#8B8FA8',
    marginTop: 3,
  },
  garageInfo: {
    fontSize: 9,
    color: '#555',
    marginTop: 6,
    lineHeight: 1.5,
  },
  invoiceLabelBlock: {
    alignItems: 'flex-end',
  },
  invoiceLabel: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#CCCCCC',
    letterSpacing: 3,
  },
  invoiceNumber: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1A2E',
    marginTop: 4,
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#666',
    marginTop: 3,
    lineHeight: 1.5,
  },

  // Divider
  divider: {
    height: 2,
    backgroundColor: '#FF6B2B',
    marginVertical: 16,
    borderRadius: 1,
  },
  dividerThin: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },

  // Client block
  clientSection: {
    marginBottom: 20,
  },
  clientLabel: {
    fontSize: 9,
    color: '#8B8FA8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  clientAddress: {
    fontSize: 9,
    color: '#555',
    lineHeight: 1.5,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },

  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FF6B2B',
    padding: 8,
    borderRadius: 4,
    marginBottom: 1,
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    fontSize: 9,
    color: '#1A1A2E',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },

  // Totals
  totalsBlock: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    minWidth: 220,
  },
  totalsLabel: {
    fontSize: 9,
    color: '#666',
    width: 130,
    textAlign: 'right',
    paddingRight: 12,
  },
  totalsValue: {
    fontSize: 9,
    color: '#1A1A2E',
    fontFamily: 'Helvetica-Bold',
    width: 80,
    textAlign: 'right',
  },
  totalsTtcLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1A2E',
    width: 130,
    textAlign: 'right',
    paddingRight: 12,
  },
  totalsTtcValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#FF6B2B',
    width: 80,
    textAlign: 'right',
  },
  totalsGreen: {
    color: '#10B981',
  },
  totalsRed: {
    color: '#EF4444',
  },
  totalsDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: 220,
    marginVertical: 6,
  },

  // Footer
  footer: {
    marginTop: 32,
  },
  footerText: {
    fontSize: 8,
    color: '#8B8FA8',
    textAlign: 'center',
    lineHeight: 1.6,
    marginTop: 8,
  },
  footerBrand: {
    fontSize: 9,
    color: '#FF6B2B',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoicePDFProps {
  facture: Facture;
  garageName?: string;
  garageAddress?: string;
  garagePhone?: string;
  garageEmail?: string;
  garageSiret?: string;
  garageTva?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoicePDF({
  facture,
  garageName = 'MecaniGo',
  garageAddress = '123 Rue de la Moto, 75001 Paris',
  garagePhone = '01 23 45 67 89',
  garageEmail = 'contact@mecanigo.fr',
  garageSiret = 'SIRET : 123 456 789 00010',
  garageTva = 'TVA intracommunautaire : FR12 123456789',
}: InvoicePDFProps) {
  const invoiceNum = padId(facture.id, facture.displayRef);
  const tvaAmount = facture.totalHt * (facture.tvaRate / 100);
  const resteDu = Math.max(0, facture.totalTtc - facture.amountPaid);
  const items: FactureItem[] = facture.items ?? [];

  const statusColors: Record<string, string> = {
    paid: '#10B981',
    unpaid: '#EF4444',
    partial: '#F59E0B',
    cancelled: '#9CA3AF',
  };
  const statusBg: Record<string, string> = {
    paid: '#D1FAE5',
    unpaid: '#FEE2E2',
    partial: '#FEF3C7',
    cancelled: '#F3F4F6',
  };

  return (
    <Document title={`Facture ${invoiceNum}`} author="MecaniGo" creator="MecaniGo">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.brandName}>{garageName}</Text>
            <Text style={s.brandTagline}>La gestion garage, enfin simple.</Text>
            <Text style={s.garageInfo}>
              {garageAddress}{'\n'}
              {garagePhone}{'\n'}
              {garageEmail}
            </Text>
          </View>
          <View style={s.invoiceLabelBlock}>
            <Text style={s.invoiceLabel}>FACTURE</Text>
            <Text style={s.invoiceNumber}>{invoiceNum}</Text>
            <Text style={s.invoiceMeta}>
              Date : {fmtDate(facture.createdAt)}{'\n'}
              {facture.dueDate ? `Échéance : ${fmtDate(facture.dueDate)}` : ''}
            </Text>
            {/* Status badge */}
            <View style={{ marginTop: 6 }}>
              <Text
                style={[
                  s.statusBadge,
                  {
                    color: statusColors[facture.status] ?? '#666',
                    backgroundColor: statusBg[facture.status] ?? '#F3F4F6',
                  },
                ]}
              >
                {STATUS_LABELS[facture.status] ?? facture.status}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Orange divider ── */}
        <View style={s.divider} />

        {/* ── Client block ── */}
        <View style={s.clientSection}>
          <Text style={s.clientLabel}>Facturé à :</Text>
          <Text style={s.clientName}>{facture.clientName ?? '—'}</Text>
          <Text style={s.clientAddress}>
            {[facture.clientPhone, facture.clientEmail, facture.clientAddress]
              .filter(Boolean)
              .join('\n')}
          </Text>
        </View>

        {/* ── Items table ── */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.colDesc]}>Description</Text>
            <Text style={[s.tableHeaderCell, s.colQty]}>Qté</Text>
            <Text style={[s.tableHeaderCell, s.colUnit]}>PU HT</Text>
            <Text style={[s.tableHeaderCell, s.colTotal]}>Total HT</Text>
          </View>

          {/* Rows */}
          {items.length > 0 ? (
            items.map((item: FactureItem, idx: number) => (
              <View
                key={item.id}
                style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}
              >
                <Text style={[s.tableCell, s.colDesc]}>{item.description}</Text>
                <Text style={[s.tableCell, s.colQty]}>{item.quantity}</Text>
                <Text style={[s.tableCell, s.colUnit]}>{fmtAmount(item.unitPriceHt)}</Text>
                <Text style={[s.tableCell, s.colTotal]}>{fmtAmount(item.totalHt)}</Text>
              </View>
            ))
          ) : (
            <View style={s.tableRow}>
              <Text style={[s.tableCell, s.colDesc]}>Prestation de service</Text>
              <Text style={[s.tableCell, s.colQty]}>1</Text>
              <Text style={[s.tableCell, s.colUnit]}>{fmtAmount(facture.totalHt)}</Text>
              <Text style={[s.tableCell, s.colTotal]}>{fmtAmount(facture.totalHt)}</Text>
            </View>
          )}
        </View>

        {/* ── Totals ── */}
        <View style={s.totalsBlock}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Sous-total HT</Text>
            <Text style={s.totalsValue}>{fmtAmount(facture.totalHt)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>TVA ({facture.tvaRate} %)</Text>
            <Text style={s.totalsValue}>{fmtAmount(tvaAmount)}</Text>
          </View>
          <View style={s.totalsDivider} />
          <View style={s.totalsRow}>
            <Text style={s.totalsTtcLabel}>TOTAL TTC</Text>
            <Text style={s.totalsTtcValue}>{fmtAmount(facture.totalTtc)}</Text>
          </View>
          {facture.amountPaid > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Montant payé</Text>
              <Text style={[s.totalsValue, s.totalsGreen]}>{fmtAmount(facture.amountPaid)}</Text>
            </View>
          )}
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Reste dû</Text>
            <Text style={[s.totalsValue, resteDu > 0 ? s.totalsRed : s.totalsGreen]}>
              {fmtAmount(resteDu)}
            </Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {facture.notes && (
          <>
            <View style={s.dividerThin} />
            <Text style={{ fontSize: 9, color: '#666', lineHeight: 1.5 }}>
              Note : {facture.notes}
            </Text>
          </>
        )}

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View style={s.divider} />
          <Text style={s.footerBrand}>{garageName} — La gestion garage, enfin simple.</Text>
          <Text style={s.footerText}>
            Merci de votre confiance.{'\n'}
            {garageSiret} · {garageTva}{'\n'}
            En cas de retard de paiement, des pénalités de retard seront appliquées conformément à la loi.
          </Text>
        </View>

      </Page>
    </Document>
  );
}
