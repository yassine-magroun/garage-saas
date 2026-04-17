/**
 * Supabase API — multi-tenant, garage_id scoped
 * snake_case → camelCase via mappers
 * garage_id injected automatically on every write
 */

import { supabase } from './supabase';
import { getGarageId } from './garage';
import { toNum } from './helpers/money';
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
  AnalyticsStats,
  StatusHistory,
  Prestation,
  TriggerLog,
  Piece,
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

const mapTriggerLog = (r: Record<string, unknown>): TriggerLog => ({
  id: String(r.id),
  garageId: String(r.garage_id),
  triggerType: String(r.trigger_type),
  resourceType: r.resource_type ? String(r.resource_type) : null,
  resourceId: r.resource_id ? String(r.resource_id) : null,
  clientId: r.client_id ? String(r.client_id) : null,
  status: (r.status as TriggerLog['status']) ?? 'success',
  message: r.message ? String(r.message) : null,
  createdAt: String(r.created_at),
});

const mapClient = (r: Record<string, unknown>): Client => ({
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
});

const mapIntervention = (r: Record<string, unknown>): Intervention => ({
  id: String(r.id),
  garageId: String(r.garage_id),
  clientId: String(r.client_id),
  vehicleId: r.vehicle_id ? String(r.vehicle_id) : undefined,
  vehicule: r.vehicule ? String(r.vehicule) : undefined,
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
    interventionId: row.intervention_id ? String(row.intervention_id) : null,
    status: row.status as FactureStatus,
    totalHt: toNum(row.total_ht),
    tvaRate: toNum(row.tva_rate),
    totalTtc: toNum(row.total_ttc),
    amountPaid: toNum(row.amount_paid),
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

// ─── Trigger Logging ──────────────────────────────────────────────────────────

/** Fire-and-forget: insert a row into trigger_logs. Never throws. */
export async function logTrigger(
  garageId: string,
  triggerType: string,
  opts: {
    resourceType?: string;
    resourceId?: string;
    clientId?: string;
    status?: TriggerLog['status'];
    message?: string;
  } = {},
): Promise<void> {
  void supabase.from('trigger_logs').insert({
    garage_id: garageId,
    trigger_type: triggerType,
    resource_type: opts.resourceType ?? null,
    resource_id: opts.resourceId ?? null,
    client_id: opts.clientId ?? null,
    status: opts.status ?? 'success',
    message: opts.message ?? null,
  });
}

export async function getTriggerLogs(limit = 8): Promise<TriggerLog[]> {
  const garageId = await getGarageId();
  const { data } = await supabase
    .from('trigger_logs')
    .select('*')
    .eq('garage_id', garageId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => mapTriggerLog(r as Record<string, unknown>));
}

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
        immatriculation: payload.licensePlate ?? null,
        is_vip: payload.vip ?? false,
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
        vehicule: payload.vehicule ?? null,
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

  const devisId = devisRow.id as string;

  // Trigger 2: notify client about new devis (fire-and-forget)
  if (typeof window !== 'undefined') {
    void fetch('/api/notify/devis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devisId, garageId }),
    });
  }

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

  // Trigger 4: devis accepted → auto-create intervention
  if (newStatus === 'accepted') {
    try {
      const devis = await getDevisWithItems(id, garageId);
      const type = devis.items?.[0]?.description ?? 'Prestation';
      const created = await interventionsAPI.create({
        clientId: devis.clientId,
        type,
        status: 'En attente' as Intervention['status'],
        date: new Date().toISOString().slice(0, 10),
        price: devis.totalHt,
      });
      await logTrigger(garageId, 'AUTO_INTERVENTION', {
        resourceType: 'intervention',
        resourceId: created.id,
        clientId: devis.clientId,
        message: `Intervention "${type}" créée depuis devis accepté`,
      });
    } catch {
      await logTrigger(garageId, 'AUTO_INTERVENTION', {
        status: 'error',
        message: 'Échec création intervention automatique',
      });
    }
  }
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

  // Trigger 2: notify client about new facture (fire-and-forget)
  if (typeof window !== 'undefined') {
    void fetch('/api/notify/facture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factureId, garageId }),
    });
  }

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
    .select('total_ttc, amount_paid, status, intervention_id, client_id')
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

  const clientId = current.client_id as string;

  // Trigger 2: notify client payment received (fire-and-forget)
  if (typeof window !== 'undefined') {
    void fetch('/api/notify/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factureId, garageId, amount }),
    });
  }

  // Trigger 1: facture fully paid → advance linked intervention to "Livré"
  if (newStatus === 'paid' && current.intervention_id) {
    const intId = String(current.intervention_id);
    await supabase
      .from('interventions')
      .update({ status: 'Livré', updated_at: new Date().toISOString() })
      .eq('id', intId)
      .eq('garage_id', garageId);
    await logTrigger(garageId, 'INTERVENTION_STATUS', {
      resourceType: 'intervention',
      resourceId: intId,
      clientId,
      message: 'Intervention → Livré (facture payée)',
    });
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
    .select('id, name, phone, address, email, siret, logo_url, created_at, updated_at')
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
    logoUrl: r.logo_url ? String(r.logo_url) : undefined,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function updateGarageLogoUrl(garageId: string, logoUrl: string): Promise<void> {
  const { error } = await supabase
    .from('garages')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', garageId);
  if (error) throw new Error(error.message);
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

// ─── Facture from Intervention (Trigger 4) ───────────────────────────────────

/** Auto-create a facture draft from an intervention (Trigger 4: Prêt → facture). */
export async function createFactureFromIntervention(
  interventionId: string,
  garageId: string,
): Promise<Facture> {
  const { data: intData, error: intError } = await supabase
    .from('interventions')
    .select('*')
    .eq('id', interventionId)
    .eq('garage_id', garageId)
    .single();
  if (intError) throw new Error(intError.message);
  const intervention = mapIntervention(intData as Record<string, unknown>);

  const displayRef = await nextDisplayRef('factures', garageId, 'FAC');
  const tvaRate = 20;
  const totalHt = intervention.price;
  const totalTtc = totalHt * (1 + tvaRate / 100);

  const { data: factureRow, error: factureError } = await supabase
    .from('factures')
    .insert({
      garage_id: garageId,
      client_id: intervention.clientId,
      intervention_id: interventionId,
      status: 'unpaid' as FactureStatus,
      total_ht: totalHt,
      tva_rate: tvaRate,
      total_ttc: totalTtc,
      amount_paid: 0,
      display_ref: displayRef,
    })
    .select('*')
    .single();
  if (factureError) throw new Error(factureError.message);

  const factureId = (factureRow as Record<string, unknown>).id as string;

  await supabase.from('facture_items').insert({
    facture_id: factureId,
    garage_id: garageId,
    description: intervention.type,
    quantity: 1,
    unit_price_ht: totalHt,
  });

  await logStatusChange(garageId, 'facture', factureId, null, 'unpaid');
  await logTrigger(garageId, 'AUTO_FACTURE_DRAFT', {
    resourceType: 'facture',
    resourceId: factureId,
    message: `Brouillon ${displayRef} créé depuis intervention ${interventionId}`,
  });

  return getFactureWithPayments(factureId, garageId);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalyticsStats(garageId: string): Promise<AnalyticsStats> {
  const now = new Date();
  const ms56d = 56 * 24 * 60 * 60 * 1000;
  const ms30d = 30 * 24 * 60 * 60 * 1000;
  const since56d = new Date(now.getTime() - ms56d).toISOString();
  const since30d = new Date(now.getTime() - ms30d).toISOString();

  const [paidResult, devisResult] = await Promise.all([
    supabase
      .from('factures')
      .select('id, total_ttc, client_id, created_at, updated_at, clients(name)')
      .eq('garage_id', garageId)
      .eq('status', 'paid')
      .gte('created_at', since56d),
    supabase
      .from('devis')
      .select('status')
      .eq('garage_id', garageId),
  ]);

  const paidRows = (paidResult.data ?? []) as Array<Record<string, unknown>>;
  const devisRows = (devisResult.data ?? []) as Array<Record<string, unknown>>;

  // ── Top client (last 30 days) ─────────────────────────────────────────────
  const clientMap: Record<string, { name: string; total: number }> = {};
  for (const r of paidRows) {
    if ((r.created_at as string) < since30d) continue;
    const cid = String(r.client_id);
    const name = (r.clients as { name: string } | null)?.name ?? 'Inconnu';
    if (!clientMap[cid]) clientMap[cid] = { name, total: 0 };
    clientMap[cid].total += Number(r.total_ttc);
  }
  const top = Object.values(clientMap).sort((a, b) => b.total - a.total)[0] ?? null;

  // ── Devis → facture conversion rate ──────────────────────────────────────
  const totalDevis = devisRows.length;
  const acceptedDevis = devisRows.filter((r) => r.status === 'accepted').length;
  const conversionRate = totalDevis > 0 ? Math.round((acceptedDevis / totalDevis) * 100) : 0;

  // ── Avg payment delay (days from created_at to updated_at on paid factures)
  let avgPaymentDelayDays = 0;
  if (paidRows.length > 0) {
    const totalDays = paidRows.reduce((sum, r) => {
      const created = new Date(r.created_at as string).getTime();
      const paid = new Date(r.updated_at as string).getTime();
      return sum + Math.max(0, (paid - created) / (1000 * 60 * 60 * 24));
    }, 0);
    avgPaymentDelayDays = Math.round((totalDays / paidRows.length) * 10) / 10;
  }

  // ── 8-week revenue bar chart ──────────────────────────────────────────────
  const weeklyRevenue = Array.from({ length: 8 }, (_, i) => {
    const w = 7 - i; // w=7 is oldest, w=0 is current
    const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd   = new Date(now.getTime() -  w      * 7 * 24 * 60 * 60 * 1000);
    const ca = paidRows
      .filter((r) => {
        const d = new Date(r.created_at as string).getTime();
        return d >= weekStart.getTime() && d < weekEnd.getTime();
      })
      .reduce((sum, r) => sum + Number(r.total_ttc), 0);
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    return { weekLabel: label, ca };
  });

  return {
    topClientName: top?.name ?? null,
    topClientRevenue: top?.total ?? 0,
    conversionRate,
    avgPaymentDelayDays,
    weeklyRevenue,
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

// ─── Pièces (Stock) ───────────────────────────────────────────────────────────

function mapPiece(row: Record<string, unknown>): Piece {
  return {
    id: String(row.id),
    garageId: String(row.garage_id),
    name: String(row.name ?? ''),
    reference: row.reference ? String(row.reference) : null,
    category: String(row.category ?? 'Autre'),
    stockQuantity: Number(row.stock_quantity ?? 0),
    stockMin: Number(row.stock_min ?? 0),
    priceAchatHt: Number(row.price_achat_ht ?? 0),
    priceVenteHt: Number(row.price_vente_ht ?? 0),
    fournisseur: row.fournisseur ? String(row.fournisseur) : null,
    createdAt: String(row.created_at),
  };
}

export const piecesStockAPI = {
  async getAll(garageId: string): Promise<Piece[]> {
    const { data, error } = await supabase
      .from('pieces')
      .select('*')
      .eq('garage_id', garageId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapPiece(r as Record<string, unknown>));
  },

  async create(
    garageId: string,
    payload: Omit<Piece, 'id' | 'garageId' | 'createdAt'>,
  ): Promise<Piece> {
    const { data, error } = await supabase
      .from('pieces')
      .insert({
        garage_id: garageId,
        name: payload.name,
        reference: payload.reference ?? null,
        category: payload.category || 'Autre',
        stock_quantity: payload.stockQuantity,
        stock_min: payload.stockMin,
        price_achat_ht: payload.priceAchatHt,
        price_vente_ht: payload.priceVenteHt,
        fournisseur: payload.fournisseur ?? null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapPiece(data as Record<string, unknown>);
  },

  async update(
    id: string,
    garageId: string,
    payload: Partial<Omit<Piece, 'id' | 'garageId' | 'createdAt'>>,
  ): Promise<Piece> {
    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.reference !== undefined) updates.reference = payload.reference;
    if (payload.category !== undefined) updates.category = payload.category;
    if (payload.stockQuantity !== undefined) updates.stock_quantity = payload.stockQuantity;
    if (payload.stockMin !== undefined) updates.stock_min = payload.stockMin;
    if (payload.priceAchatHt !== undefined) updates.price_achat_ht = payload.priceAchatHt;
    if (payload.priceVenteHt !== undefined) updates.price_vente_ht = payload.priceVenteHt;
    if (payload.fournisseur !== undefined) updates.fournisseur = payload.fournisseur;
    const { data, error } = await supabase
      .from('pieces')
      .update(updates)
      .eq('id', id)
      .eq('garage_id', garageId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapPiece(data as Record<string, unknown>);
  },

  async delete(id: string, garageId: string): Promise<void> {
    const { error } = await supabase.from('pieces').delete().eq('id', id).eq('garage_id', garageId);
    if (error) throw new Error(error.message);
  },

  async decrementStock(id: string, garageId: string, quantity: number): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('pieces')
      .select('stock_quantity')
      .eq('id', id)
      .eq('garage_id', garageId)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    const newQty = Math.max(0, Number((current as Record<string, unknown>).stock_quantity) - quantity);
    const { error } = await supabase
      .from('pieces')
      .update({ stock_quantity: newQty })
      .eq('id', id)
      .eq('garage_id', garageId);
    if (error) throw new Error(error.message);
  },
};

// ─── Facture directe (sans devis) ────────────────────────────────────────────

export async function createFactureDirect(
  garageId: string,
  clientId: string,
  items: Array<{ description: string; quantity: number; unitPriceHt: number; pieceId?: string }>,
  options?: { tvaRate?: number; dueDate?: string; notes?: string },
): Promise<Facture> {
  const tvaRate = options?.tvaRate ?? 20;
  const totalHt = items.reduce((sum, i) => sum + i.quantity * i.unitPriceHt, 0);
  const totalTtc = totalHt * (1 + tvaRate / 100);
  const displayRef = await nextDisplayRef('factures', garageId, 'FAC');

  const { data: factureRow, error: factureError } = await supabase
    .from('factures')
    .insert({
      garage_id: garageId,
      client_id: clientId,
      status: 'unpaid' as FactureStatus,
      total_ht: totalHt,
      tva_rate: tvaRate,
      total_ttc: totalTtc,
      amount_paid: 0,
      due_date: options?.dueDate ?? null,
      notes: options?.notes ?? null,
      display_ref: displayRef,
    })
    .select('*')
    .single();
  if (factureError) throw new Error(factureError.message);

  const factureId = (factureRow as Record<string, unknown>).id as string;

  if (items.length > 0) {
    await supabase.from('facture_items').insert(
      items.map((i) => ({
        facture_id: factureId,
        garage_id: garageId,
        description: i.description,
        quantity: i.quantity,
        unit_price_ht: i.unitPriceHt,
      })),
    );
  }

  // Decrement stock for pieces used
  const pieceItems = items.filter((i) => i.pieceId);
  for (const pi of pieceItems) {
    await piecesStockAPI.decrementStock(pi.pieceId!, garageId, pi.quantity).catch(() => {});
  }

  await logStatusChange(garageId, 'facture', factureId, null, 'unpaid');

  // Notify client (fire-and-forget)
  if (typeof window !== 'undefined') {
    void fetch('/api/notify/facture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factureId, garageId }),
    });
  }

  const newFacture = await getFactureWithPayments(factureId, garageId);

  // Zapier webhook notification (fire-and-forget, server-side via /api/zapier)
  if (typeof window !== 'undefined') {
    const tvaAmount = (newFacture.totalTtc ?? 0) - (newFacture.totalHt ?? 0);
    void fetch('/api/zapier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factureId: newFacture.id,
        clientName: newFacture.clientName ?? 'Client',
        clientEmail: newFacture.clientEmail ?? '',
        amountHt: newFacture.totalHt ?? 0,
        totalTtc: newFacture.totalTtc ?? 0,
        tva: Math.round(tvaAmount * 100) / 100,
        displayRef: newFacture.displayRef ?? newFacture.id,
        status: newFacture.status ?? 'émise',
        paymentStatus: newFacture.amountPaid > 0 ? 'partial' : 'unpaid',
        createdAt: newFacture.createdAt ?? new Date().toISOString(),
      }),
    });
  }

  return newFacture;
}

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
