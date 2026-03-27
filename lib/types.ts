/**
 * Types métier centralisés pour Garage SaaS
 * Architecture prête pour Supabase
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
  vehicle: string;
  immatriculation: string;
  vip: boolean;
  lastVisit: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
};

export type InterventionStatus = 'Planifié' | 'En cours' | 'Terminé';

export type Intervention = {
  id: string;
  garageId: string;
  clientId: string;
  vehicle: string;
  type: string;
  status: InterventionStatus;
  date: string;
  price: number;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type FactureStatus = 'En attente' | 'Payée' | 'En retard';

export type Facture = {
  id: string;
  garageId: string;
  clientId: string;
  interventionId?: string;
  amount: number;
  status: FactureStatus;
  date: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// Types pour les listes
export type ClientList = Client[];
export type InterventionList = Intervention[];
export type FactureList = Facture[];

// Types pour les stats/dashboard
export type DashboardStats = {
  totalFactures: number;
  caTotal: number;
  interventionsEnCours: number;
  totalClients: number;
  montantPaye?: number;
  montantEnAttente?: number;
  tauxPaiement?: number;
};

// Types API
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

// Types pour les formulaires
export type ClientFormData = Omit<Client, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>;
export type InterventionFormData = Omit<Intervention, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>;
export type FactureFormData = Omit<Facture, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>;
