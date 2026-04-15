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
  logoUrl?: string;
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
  vehicle?: string;           // vehicle text — model description
  licensePlate?: string;      // license_plate
  vip: boolean;
  lastVisit: number;          // last_visit_days int
  lastContactDate?: string | null; // last_contact_date timestamp
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
  displayRef?: string;
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
  interventionId?: string | null;
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
  displayRef?: string;
}

// ── Pièces (Stock) ────────────────────────────────────────────────────────────

export interface Piece {
  id: string;
  garageId: string;
  name: string;
  reference: string | null;
  category: string;
  stockQuantity: number;
  stockMin: number;
  priceAchatHt: number;
  priceVenteHt: number;
  fournisseur: string | null;
  createdAt: string;
}

export type StockStatus = 'ok' | 'alerte' | 'rupture';

export function getStockStatus(piece: Piece): StockStatus {
  if (piece.stockQuantity <= 0) return 'rupture';
  if (piece.stockQuantity <= piece.stockMin) return 'alerte';
  return 'ok';
}

// ── Prestations ───────────────────────────────────────────────────────────────

export interface Prestation {
  id: string;
  garageId: string;
  name: string;
  priceHt: number;
  tvaRate: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
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

export interface WeeklyRevenue {
  weekLabel: string;
  ca: number;
}

export interface AnalyticsStats {
  topClientName: string | null;
  topClientRevenue: number;
  conversionRate: number;      // 0–100 integer
  avgPaymentDelayDays: number; // rounded to 1 decimal
  weeklyRevenue: WeeklyRevenue[];
}

// ── Trigger Logs ──────────────────────────────────────────────────────────────

export interface TriggerLog {
  id: string;
  garageId: string;
  triggerType: string;
  resourceType: string | null;
  resourceId: string | null;
  clientId: string | null;
  status: 'success' | 'error' | 'skipped';
  message: string | null;
  createdAt: string;
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

// ── Livre de Police ───────────────────────────────────────────────────────────

export type LivreDePoliceStatut = 'en_stock' | 'vendu';

export interface LivreDePolice {
  id: string;
  garageId: string;
  numeroOrdre: number;
  marque: string;
  modele: string;
  immatriculation: string;
  vin: string | null;
  annee: number | null;
  couleur: string | null;
  kilometrageAchat: number | null;
  dateAchat: string;
  prixAchat: number;
  vendeurNom: string | null;
  vendeurIdentite: string | null;
  vendeurAdresse: string | null;
  modeReglementAchat: string;
  coutReparations: number;
  notesReparations: string | null;
  dateVente: string | null;
  prixVente: number | null;
  acheteurNom: string | null;
  acheteurIdentite: string | null;
  acheteurAdresse: string | null;
  modeReglementVente: string | null;
  photos: string[];
  statut: LivreDePoliceStatut;
  createdAt: string;
  updatedAt: string;
}

// ── Form data helpers ─────────────────────────────────────────────────────────

export type ClientFormData = Omit<Client, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>;
export type InterventionFormData = Omit<Intervention, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>;
