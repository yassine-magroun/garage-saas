/**
 * Canonical TypeScript types for Garage SaaS
 * Aligned with schema.sql — camelCase in TS, snake_case in DB
 */

export type GarageSettings = {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  siret?: string;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  garageId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  vehicle?: string;       // vehicle text — model description
  licensePlate?: string;  // license_plate
  vip: boolean;
  lastVisit: number;      // last_visit_days int
  createdAt: string;
  updatedAt: string;
};

export type InterventionStatus = 'Planifié' | 'En cours' | 'Terminé';

export type Intervention = {
  id: string;
  garageId: string;
  clientId: string;
  vehicleId?: string;     // vehicle_id text
  type: string;
  status: InterventionStatus;
  date: string;
  price: number;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// ── Devis ─────────────────────────────────────────────────────────────────────

export type DevisStatus = 'draft' | 'sent' | 'accepted' | 'refused' | 'expired';

export interface DevisItem {
  id: string;
  devisId: string;
  description: string;
  quantity: number;
  unitPriceHt: number;
  totalHt: number;
}

export interface Devis {
  id: string;
  garageId: string;
  clientId: string;
  status: DevisStatus;
  totalHt: number;
  tvaRate: number;
  totalTtc: number;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  items?: DevisItem[];
  clientName?: string;
}

// ── Factures ──────────────────────────────────────────────────────────────────

export type FactureStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check';
export type PaymentStatus = 'pending' | 'paid';

export interface FactureItem {
  id: string;
  factureId: string;
  description: string;
  quantity: number;
  unitPriceHt: number;
  totalHt: number;
}

export interface Payment {
  id: string;
  factureId: string;
  garageId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  notes: string | null;
}

export interface Facture {
  id: string;
  garageId: string;
  clientId: string;
  devisId: string | null;
  status: FactureStatus;
  totalHt: number;
  tvaRate: number;
  totalTtc: number;
  amountPaid: number;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  items?: FactureItem[];
  payments?: Payment[];
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  caThisMonth: number;
  caLastMonth: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: number;
  activeInterventionsCount: number;
  activeDevisCount: number;
}

// ── Status History ────────────────────────────────────────────────────────────

export type StatusHistoryResource = 'devis' | 'intervention' | 'facture';

export type StatusHistory = {
  id: string;
  garageId: string;
  resourceType: StatusHistoryResource;
  resourceId: string;
  previousStatus?: string;
  newStatus: string;
  changedBy?: string | null;
  changedAt: string;
  metadata?: Record<string, unknown>;
};

// ── Generic API envelope ──────────────────────────────────────────────────────

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// ── Form data helpers ─────────────────────────────────────────────────────────

export type ClientFormData = Omit<Client, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>;
export type InterventionFormData = Omit<Intervention, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>;
