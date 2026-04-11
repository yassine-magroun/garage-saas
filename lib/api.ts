/**
 * Supabase API — multi-tenant, garage_id scoped
 * snake_case → camelCase via mappers
 * garage_id injected automatically on every write
 */

import { supabase } from './supabase';
import { getGarageId } from './garage';
import type {
  Client,
  Intervention,
  Devis,
  DevisItem,
  DevisStatus,
  Facture,
  FactureItem,
  FactureStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  DashboardStats,
  StatusHistory,
  Prestation,
} from './types';

// ─── Utilities ───────────────────────────────────────────────────────────────

const isUuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Generate next human-readable sequential ref: DEV-2026-0001 / FAC-2026-0001 */
async function nextDisplayRef(
  table: 'devis' | 'factures',
  garageId: string,
  prefix: 'DEV' | 'FAC',
): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('garage_id', garageId);
  const seq = String((count ?? 0) + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

const mapClient = (r: Record<string, unknown>): Client => ({
  id: String(r.id),
  garageId: String(r.garage_id),
  name: String(r.name ?? ''),
  phone: String(r.phone ?? ''),
  email: r.email ? String(r.email) : undefined,
  address: r.address ? String(r.address) : undefined,
  vehicle: r.vehicle ? String(r.vehicle) : undefined,
  licensePlate: r.license_plate ? String(r.license_plate) : undefined,
  vip: Boolean(r.vip),
  lastVisit: Number(r.last_visit_days ?? 0),
  createdAt: String(r.created_at),
  updatedAt: String(r.updated_at),
});

const mapIntervention = (r: Record<string, unknown>): Intervention => ({
  id: String(r.id),
  garageId: String(r.garage_id),
  clientId: String(r.client_id),
  vehicleId: r.vehicle_id ? String(r.vehicle_id) : undefined,
  type: String(r.type ?? ''),
  status: String(r.status) as Intervention['status'],
  date: String(r.date ?? ''),
  price: Number(r.price ?? 0),
  description: r.description ? String(r.description) : undefined,
  notes: r.notes ? String(r.notes) : undefined,
  createdAt: String(r.created_at),
  updatedAt: String(r.updated_at),
});

function mapDevisItem(row: Record<string, unknown>): DevisItem {
  return {
    id: row.id as string,
    devisId: row.devis_id as string,
    description: row.description as string,
    quantity: Number(row.quantity),
    unitPriceHt: Number(row.unit_price_ht),
    totalHt: Number(row.total_ht),
  };
}

function mapDevis(row: Record<string, unknown>): Devis {
  const clientsField = row.clients as { name: string } | null | undefined;
  return {
    id: row.id as string,
    garageId: row.garage_id as string,
    clientId: row.client_id as string,
    status: row.status as DevisStatus,
    totalHt: Number(row.total_ht),
    tvaRate: Number(row.tva_rate),
    totalTtc: Number(row.total_ttc),
    validUntil: row.valid_until as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    clientName: clientsField?.name ?? undefined,
    displayRef: row.display_ref ? String(row.display_ref) : undefined,
  };
}

function mapPrestation(row: Record<string, unknown>): Prestation {
  return {
    id: String(row.id),
    garageId: String(row.garage_id),
    name: String(row.name ?? ''),
    priceHt: Number(row.price_ht ?? 0),
    tvaRate: Number(row.tva_rate ?? 20),
    category: row.category ? String(row.category) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapFactureItem(row: Record<string, unknown>): FactureItem {
  return {
    id: row.id as string,
    factureId: row.facture_id as string,
    description: row.description as string,
    quantity: Number(row.quantity),
    unitPriceHt: Number(row.unit_price_ht),
    totalHt: Number(row.total_ht),
  };
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    factureId: row.facture_id as string,
    garageId: row.garage_id as string,
    amount: Number(row.amount),
    method: row.method as PaymentMethod,
    status: row.status as PaymentStatus,
    paidAt: row.paid_at as string,
    notes: row.notes as string | null,
  };
}

function mapFacture(row: Record<string, unknown>): Facture {
  const clientsField = row.clients as { name: string; phone?: string; email?: string; address?: string } | null | undefined;
  return {
    id: row.id as string,
    garageId: row.garage_id as string,
    clientId: row.client_id as string,
    devisId: row.devis_id as string | null,
    status: row.status as FactureStatus,
    totalHt: Number(row.total_ht),
    tvaRate: Number(row.tva_rate),
    totalTtc: Number(row.total_ttc),
    amountPaid: Number(row.amount_paid),
    dueDate: row.due_date as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    clientName: clientsField?.name ?? undefined,
    clientPhone: clientsField?.phone ?? undefined,
    clientEmail: clientsField?.email ?? undefined,
    clientAddress: clientsField?.address ?? undefined,
    displayRef: row.display_ref ? String(row.display_ref) : undefined,
  };
}

const mapStatusHistory = (r: Record<string, unknown>): StatusHistory => ({
  id: String(r.id),
  garageId: String(r.garage_id),
  resourceType: String(r.resource_type) as StatusHistory['resourceType'],
  resourceId: String(r.resource_id),
  previousStatus: r.previous_status ? String(r.previous_status) : undefined,
  newStatus: String(r.new_status),
  changedBy: r.changed_by ? String(r.changed_by) : null,
  changedAt: String(r.changed_at),
  metadata: (r.metadata as Record<string, unknown>) ?? undefined,
});

// ─── Business Logic Helpers ───────────────────────────────────────────────────

function computeFactureStatus(totalTtc: number, amountPaid: number): FactureStatus {
  if (amountPaid >= totalTtc) return 'paid';
  if (amountPaid > 0) return 'partial';
  return 'unpaid';
}

async function logStatusChange(
  garageId: string,
  resourceType: string,
  resourceId: string,
  previousStatus: string | null,
  newStatus: string,
): Promise<void> {
  await supabase.from('status_history').insert({
    garage_id: garageId,
    resource_type: resourceType,
    resource_id: resourceId,
    previous_status: previousStatus,
    new_status: newStatus,
  });
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clientsAPI = {
  async getAll(): Promise<Client[]> {
    const garageId = await getGarageId();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('garage_id', garageId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapClient);
  },

  async getById(id: string): Promise<Client> {
    const garageId = await getGarageId();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('garage_id', garageId)
      .single();
    if (error) throw new Error(error.message);
    return mapClient(data);
  },

  async create(
    payload: Omit<Client, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>,
  ): Promise<Client> {
    const garageId = await getGarageId();
    const { data, error } = await supabase
      .from('clients')
      .insert({
        garage_id: garageId,
        name: payload.name,
        phone: payload.phone,
        email: payload.email ?? null,
        address: payload.address ?? null,
        vehicle: payload.vehicle ?? null,
        license_plate: payload.licensePlate ?? null,
        vip: payload.vip ?? false,
        last_visit_days: payload.lastVisit ?? 0,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapClient(data);
  },
};

// ─── Interventions ────────────────────────────────────────────────────────────

export const interventionsAPI = {
  async getAll(): Promise<Intervention[]> {
    const garageId = await getGarageId();
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('garage_id', garageId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapIntervention);
  },

  async create(
    payload: Omit<Intervention, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>,
  ): Promise<Intervention> {
    const garageId = await getGarageId();
    const { data, error } = await supabase
      .from('interventions')
      .insert({
        garage_id: garageId,
        client_id: payload.clientId,
        vehicle_id: payload.vehicleId ?? null,
        type: payload.type,
        status: payload.status,
        date: payload.date,
        price: payload.price,
        description: payload.description ?? null,
        notes: payload.notes ?? null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapIntervention(data);
  },

  async update(
    id: string,
    payload: Partial<Omit<Intervention, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Intervention> {
    const garageId = await getGarageId();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.clientId !== undefined) updates.client_id = payload.clientId;
    if (payload.vehicleId !== undefined) updates.vehicle_id = payload.vehicleId ?? null;
    if (payload.type !== undefined) updates.type = payload.type;
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.date !== undefined) updates.date = payload.date;
    if (payload.price !== undefined) updates.price = payload.price;
    if (payload.description !== undefined) updates.description = payload.description ?? null;
    if (payload.notes !== undefined) updates.notes = payload.notes ?? null;
    const { data, error } = await supabase
      .from('interventions')
      .update(updates)
      .eq('id', id)
      .eq('garage_id', garageId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapIntervention(data);
  },
};

// ─── Status History ───────────────────────────────────────────────────────────

export const statusHistoryAPI = {
  async getByResource(
    resourceType: StatusHistory['resourceType'],
    resourceId: string,
  ): Promise<StatusHistory[]> {
    const garageId = await getGarageId();
    const { data, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('garage_id', garageId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('changed_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapStatusHistory);
  },

  async create(
    payload: Omit<StatusHistory, 'id' | 'changedAt'>,
  ): Promise<StatusHistory> {
    const garageId = await getGarageId();
    const { data, error } = await supabase
      .from('status_history')
      .insert({
        garage_id: garageId,
        resource_type: payload.resourceType,
        resource_id: payload.resourceId,
        previous_status: payload.previousStatus ?? null,
        new_status: payload.newStatus,
        changed_by: isUuid(payload.changedBy) ? payload.changedBy : null,
        metadata: {
          ...payload.metadata,
          actor:
            payload.changedBy && !isUuid(payload.changedBy)
              ? payload.changedBy
              : (payload.metadata?.actor ?? 'System'),
        },
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapStatusHistory(data);
  },
};

// ─── Devis ────────────────────────────────────────────────────────────────────

export async function createDevis(
  garageId: string,
  clientId: string,
  items: Array<{ description: string; quantity: number; unitPriceHt: number }>,
  options?: { validUntil?: string; notes?: string; tvaRate?: number },
): Promise<Devis> {
  const tvaRate = options?.tvaRate ?? 20;
  const totalHt = items.reduce((sum, i) => sum + i.quantity * i.unitPriceHt, 0);
  const totalTtc = totalHt * (1 + tvaRate / 100);
  const displayRef = await nextDisplayRef('devis', garageId, 'DEV');

  const { data: devisRow, error: devisError } = await supabase
    .from('devis')
    .insert({
      garage_id: garageId,
      client_id: clientId,
      status: 'draft' as DevisStatus,
      total_ht: totalHt,
      tva_rate: tvaRate,
      total_ttc: totalTtc,
      valid_until: options?.validUntil ?? null,
      notes: options?.notes ?? null,
      display_ref: displayRef,
    })
    .select('*')
    .single();
  if (devisError) throw new Error(devisError.message);

  if (items.length > 0) {
    const itemRows = items.map((i) => ({
      devis_id: devisRow.id as string,
      description: i.description,
      quantity: i.quantity,
      unit_price_ht: i.unitPriceHt,
    }));
    const { error: itemsError } = await supabase.from('devis_items').insert(itemRows);
    if (itemsError) throw new Error(itemsError.message);
  }

  await logStatusChange(garageId, 'devis', devisRow.id as string, null, 'draft');

  return mapDevis(devisRow as Record<string, unknown>);
}

export async function getDevisWithItems(id: string, garageId: string): Promise<Devis> {
  const { data, error } = await supabase
    .from('devis')
    .select('*, clients(name)')
    .eq('id', id)
    .eq('garage_id', garageId)
    .single();
  if (error) throw new Error(error.message);

  const { data: itemsData, error: itemsError } = await supabase
    .from('devis_items')
    .select('*')
    .eq('devis_id', id)
    .order('id', { ascending: true });
  if (itemsError) throw new Error(itemsError.message);

  const devis = mapDevis(data as Record<string, unknown>);
  devis.items = (itemsData ?? []).map(mapDevisItem);
  return devis;
}

export async function getDevisList(garageId: string): Promise<Devis[]> {
  const { data, error } = await supabase
    .from('devis')
    .select('*, clients(name)')
    .eq('garage_id', garageId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapDevis(r as Record<string, unknown>));
}

export async function updateDevisStatus(
  id: string,
  garageId: string,
  newStatus: DevisStatus,
): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('devis')
    .select('status')
    .eq('id', id)
    .eq('garage_id', garageId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from('devis')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('garage_id', garageId);
  if (error) throw new Error(error.message);

  await logStatusChange(
    garageId,
    'devis',
    id,
    (current as Record<string, unknown>).status as string,
    newStatus,
  );
}

export async function convertDevisToFacture(
  devisId: string,
  garageId: string,
): Promise<Facture> {
  const devis = await getDevisWithItems(devisId, garageId);

  const factureDisplayRef = await nextDisplayRef('factures', garageId, 'FAC');

  const { data: factureRow, error: factureError } = await supabase
    .from('factures')
    .insert({
      garage_id: garageId,
      client_id: devis.clientId,
      devis_id: devisId,
      status: 'unpaid' as FactureStatus,
      total_ht: devis.totalHt,
      tva_rate: devis.tvaRate,
      total_ttc: devis.totalTtc,
      amount_paid: 0,
      notes: devis.notes,
      display_ref: factureDisplayRef,
    })
    .select('*')
    .single();
  if (factureError) throw new Error(factureError.message);

  const factureId = (factureRow as Record<string, unknown>).id as string;

  if (devis.items && devis.items.length > 0) {
    const itemRows = devis.items.map((i) => ({
      facture_id: factureId,
      description: i.description,
      quantity: i.quantity,
      unit_price_ht: i.unitPriceHt,
    }));
    const { error: itemsError } = await supabase.from('facture_items').insert(itemRows);
    if (itemsError) throw new Error(itemsError.message);
  }

  const { error: devisUpdateError } = await supabase
    .from('devis')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', devisId)
    .eq('garage_id', garageId);
  if (devisUpdateError) throw new Error(devisUpdateError.message);

  await Promise.all([
    logStatusChange(garageId, 'devis', devisId, devis.status, 'accepted'),
    logStatusChange(garageId, 'facture', factureId, null, 'unpaid'),
  ]);

  return getFactureWithPayments(factureId, garageId);
}

// ─── Factures ─────────────────────────────────────────────────────────────────

export async function getFactureWithPayments(id: string, garageId: string): Promise<Facture> {
  const { data, error } = await supabase
    .from('factures')
    .select('*, clients(name, phone, email, address)')
    .eq('id', id)
    .eq('garage_id', garageId)
    .single();
  if (error) throw new Error(error.message);

  const [itemsResult, paymentsResult] = await Promise.all([
    supabase.from('facture_items').select('*').eq('facture_id', id).order('id', { ascending: true }),
    supabase
      .from('facture_payments')
      .select('*')
      .eq('facture_id', id)
      .eq('garage_id', garageId)
      .order('paid_at', { ascending: false }),
  ]);
  if (itemsResult.error) throw new Error(itemsResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);

  const facture = mapFacture(data as Record<string, unknown>);
  facture.items = (itemsResult.data ?? []).map(mapFactureItem);
  facture.payments = (paymentsResult.data ?? []).map(mapPayment);
  return facture;
}

export async function getFacturesList(garageId: string): Promise<Facture[]> {
  const { data, error } = await supabase
    .from('factures')
    .select('*, clients(name)')
    .eq('garage_id', garageId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapFacture(r as Record<string, unknown>));
}

export async function addPayment(
  factureId: string,
  garageId: string,
  amount: number,
  method: PaymentMethod,
  notes?: string,
): Promise<Payment> {
  const { data: paymentRow, error: paymentError } = await supabase
    .from('facture_payments')
    .insert({
      facture_id: factureId,
      garage_id: garageId,
      amount,
      method,
      status: 'paid' as PaymentStatus,
      notes: notes ?? null,
    })
    .select('*')
    .single();
  if (paymentError) throw new Error(paymentError.message);

  const { data: factureCurrent, error: fetchError } = await supabase
    .from('factures')
    .select('total_ttc, amount_paid, status')
    .eq('id', factureId)
    .eq('garage_id', garageId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const current = factureCurrent as Record<string, unknown>;
  const prevStatus = current.status as FactureStatus;
  const newAmountPaid = Number(current.amount_paid) + amount;
  const newStatus = computeFactureStatus(Number(current.total_ttc), newAmountPaid);

  const { error: updateError } = await supabase
    .from('factures')
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', factureId)
    .eq('garage_id', garageId);
  if (updateError) throw new Error(updateError.message);

  if (prevStatus !== newStatus) {
    await logStatusChange(garageId, 'facture', factureId, prevStatus, newStatus);
  }

  return mapPayment(paymentRow as Record<string, unknown>);
}

// ─── Garage by Clerk user ─────────────────────────────────────────────────────

export async function getGarageByClerkUserId(clerkUserId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('garages')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();
  if (error || !data) return null;
  return { id: String((data as Record<string, unknown>).id) };
}

// ─── Garage Settings ──────────────────────────────────────────────────────────

export async function getGarageSettings(garageId: string): Promise<import('./types').GarageSettings | null> {
  const { data, error } = await supabase
    .from('garages')
    .select('id, name, phone, address, email, siret, created_at, updated_at')
    .eq('id', garageId)
    .single();
  if (error) return null;
  const r = data as Record<string, unknown>;
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    phone: String(r.phone ?? ''),
    address: String(r.address ?? ''),
    email: r.email ? String(r.email) : undefined,
    siret: r.siret ? String(r.siret) : undefined,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(garageId: string): Promise<DashboardStats> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = thisMonthStart;

  const [thisMonthResult, lastMonthResult, pendingResult, activeResult, devisResult] =
    await Promise.all([
      supabase
        .from('factures')
        .select('total_ttc')
        .eq('garage_id', garageId)
        .eq('status', 'paid')
        .gte('created_at', thisMonthStart),
      supabase
        .from('factures')
        .select('total_ttc')
        .eq('garage_id', garageId)
        .eq('status', 'paid')
        .gte('created_at', lastMonthStart)
        .lt('created_at', lastMonthEnd),
      supabase
        .from('factures')
        .select('total_ttc')
        .eq('garage_id', garageId)
        .in('status', ['unpaid', 'partial']),
      supabase
        .from('interventions')
        .select('id', { count: 'exact', head: true })
        .eq('garage_id', garageId)
        .neq('status', 'Terminé'),
      supabase
        .from('devis')
        .select('id', { count: 'exact', head: true })
        .eq('garage_id', garageId)
        .in('status', ['draft', 'sent']),
    ]);

  const caThisMonth = (thisMonthResult.data ?? []).reduce(
    (sum, r) => sum + Number((r as Record<string, unknown>).total_ttc),
    0,
  );
  const caLastMonth = (lastMonthResult.data ?? []).reduce(
    (sum, r) => sum + Number((r as Record<string, unknown>).total_ttc),
    0,
  );
  const pendingInvoicesCount = (pendingResult.data ?? []).length;
  const pendingInvoicesAmount = (pendingResult.data ?? []).reduce(
    (sum, r) => sum + Number((r as Record<string, unknown>).total_ttc),
    0,
  );

  return {
    caThisMonth,
    caLastMonth,
    pendingInvoicesCount,
    pendingInvoicesAmount,
    activeInterventionsCount: activeResult.count ?? 0,
    activeDevisCount: devisResult.count ?? 0,
  };
}

// ─── Prestations ──────────────────────────────────────────────────────────────

export const prestationsAPI = {
  async getAll(garageId: string): Promise<Prestation[]> {
    const { data, error } = await supabase
      .from('prestations')
      .select('*')
      .eq('garage_id', garageId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPrestation);
  },

  async create(
    garageId: string,
    payload: { name: string; priceHt: number; tvaRate: number; category?: string },
  ): Promise<Prestation> {
    const { data, error } = await supabase
      .from('prestations')
      .insert({
        garage_id: garageId,
        name: payload.name,
        price_ht: payload.priceHt,
        tva_rate: payload.tvaRate,
        category: payload.category ?? null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapPrestation(data as Record<string, unknown>);
  },

  async update(
    id: string,
    garageId: string,
    payload: Partial<{ name: string; priceHt: number; tvaRate: number; category: string }>,
  ): Promise<Prestation> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.priceHt !== undefined) updates.price_ht = payload.priceHt;
    if (payload.tvaRate !== undefined) updates.tva_rate = payload.tvaRate;
    if (payload.category !== undefined) updates.category = payload.category || null;
    const { data, error } = await supabase
      .from('prestations')
      .update(updates)
      .eq('id', id)
      .eq('garage_id', garageId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapPrestation(data as Record<string, unknown>);
  },

  async delete(id: string, garageId: string): Promise<void> {
    const { error } = await supabase
      .from('prestations')
      .delete()
      .eq('id', id)
      .eq('garage_id', garageId);
    if (error) throw new Error(error.message);
  },
};

// ─── Duplication ──────────────────────────────────────────────────────────────

export async function duplicateDevis(sourceId: string, garageId: string): Promise<Devis> {
  const source = await getDevisWithItems(sourceId, garageId);
  const items = (source.items ?? []).map((i) => ({
    description: i.description,
    quantity: i.quantity,
    unitPriceHt: i.unitPriceHt,
  }));
  return createDevis(garageId, source.clientId, items, {
    tvaRate: source.tvaRate,
    notes: source.notes ?? undefined,
    validUntil: source.validUntil ?? undefined,
  });
}

export async function duplicateFacture(sourceId: string, garageId: string): Promise<Facture> {
  const source = await getFactureWithPayments(sourceId, garageId);
  const displayRef = await nextDisplayRef('factures', garageId, 'FAC');

  const { data: factureRow, error: factureError } = await supabase
    .from('factures')
    .insert({
      garage_id: garageId,
      client_id: source.clientId,
      devis_id: null,
      status: 'unpaid' as FactureStatus,
      total_ht: source.totalHt,
      tva_rate: source.tvaRate,
      total_ttc: source.totalTtc,
      amount_paid: 0,
      notes: source.notes,
      display_ref: displayRef,
    })
    .select('*')
    .single();
  if (factureError) throw new Error(factureError.message);

  const factureId = (factureRow as Record<string, unknown>).id as string;

  const items = source.items ?? [];
  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('facture_items').insert(
      items.map((i) => ({
        facture_id: factureId,
        description: i.description,
        quantity: i.quantity,
        unit_price_ht: i.unitPriceHt,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);
  }

  await logStatusChange(garageId, 'facture', factureId, null, 'unpaid');
  return getFactureWithPayments(factureId, garageId);
}
