import type { Facture, Client, GarageSettings } from '../../../../lib/types';
import { toNum } from '../../../../lib/helpers/money';

export interface GarageForAutomation extends GarageSettings {
  comptableEmail: string | null;
  emailFrom: string | null;
  gsheetId: string | null;
}

export function mapFactureRow(r: Record<string, unknown>): Facture {
  return {
    id: String(r.id),
    garageId: String(r.garage_id),
    clientId: String(r.client_id),
    devisId: r.devis_id ? String(r.devis_id) : null,
    interventionId: r.intervention_id ? String(r.intervention_id) : null,
    status: r.status as Facture['status'],
    totalHt: toNum(r.total_ht),
    tvaRate: toNum(r.tva_rate),
    totalTtc: toNum(r.total_ttc),
    amountPaid: toNum(r.amount_paid),
    dueDate: r.due_date ? String(r.due_date) : null,
    notes: r.notes ? String(r.notes) : null,
    createdAt: String(r.created_at),
    displayRef: r.display_ref ? String(r.display_ref) : undefined,
  };
}

export function mapGarageRow(r: Record<string, unknown>): GarageForAutomation {
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    phone: String(r.phone ?? ''),
    address: String(r.address ?? ''),
    email: r.email ? String(r.email) : undefined,
    siret: r.siret ? String(r.siret) : undefined,
    logoUrl: r.logo_url ? String(r.logo_url) : undefined,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    comptableEmail: r.comptable_email ? String(r.comptable_email) : null,
    emailFrom: r.email_from ? String(r.email_from) : null,
    gsheetId: r.gsheet_id ? String(r.gsheet_id) : null,
  };
}

export function mapClientRow(r: Record<string, unknown>): Client {
  return {
    id: String(r.id),
    garageId: String(r.garage_id),
    name: String(r.name ?? ''),
    phone: String(r.phone ?? ''),
    email: r.email ? String(r.email) : undefined,
    address: r.address ? String(r.address) : undefined,
    vehicle: r.vehicle ? String(r.vehicle) : undefined,
    licensePlate: r.immatriculation ? String(r.immatriculation) : undefined,
    vip: Boolean(r.is_vip ?? r.vip),
    lastVisit: Number(r.last_visit_days ?? 0),
    lastContactDate: r.last_contact_date ? String(r.last_contact_date) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}
