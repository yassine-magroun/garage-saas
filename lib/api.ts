/**
 * Structure préparée pour appels API Supabase
 * En développement : utilise les données localStorage/mocks
 * En production : remplacer par les vraies requêtes Supabase
 */

import { Client, Intervention, Facture, ApiResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Client API générique
 * À adapter pour Supabase ou autre backend
 */
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API Error: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clients API
 */
export const clientsAPI = {
  async getAll(): Promise<Client[]> {
    // À remplacer par: return apiCall<Client[]>('/clients')
    const stored = localStorage.getItem('clients');
    return stored ? JSON.parse(stored) : [];
  },

  async getById(id: string): Promise<Client | null> {
    const clients = await this.getAll();
    return clients.find(c => c.id === id) || null;
  },

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    // À remplacer par: return apiCall<Client>('/clients', { method: 'POST', body })
    const newClient: Client = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const clients = await this.getAll();
    const updated = [...clients, newClient];
    localStorage.setItem('clients', JSON.stringify(updated));
    return newClient;
  },

  async update(id: string, data: Partial<Client>): Promise<Client | null> {
    const clients = await this.getAll();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...clients[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    clients[index] = updated;
    localStorage.setItem('clients', JSON.stringify(clients));
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const clients = await this.getAll();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem('clients', JSON.stringify(filtered));
    return true;
  },
};

/**
 * Interventions API
 */
export const interventionsAPI = {
  async getAll(): Promise<Intervention[]> {
    const stored = localStorage.getItem('interventions');
    return stored ? JSON.parse(stored) : [];
  },

  async getByClientId(clientId: string): Promise<Intervention[]> {
    const interventions = await this.getAll();
    return interventions.filter(i => i.clientId === clientId);
  },

  async create(data: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>): Promise<Intervention> {
    const newIntervention: Intervention = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const interventions = await this.getAll();
    const updated = [...interventions, newIntervention];
    localStorage.setItem('interventions', JSON.stringify(updated));
    return newIntervention;
  },

  async update(id: string, data: Partial<Intervention>): Promise<Intervention | null> {
    const interventions = await this.getAll();
    const index = interventions.findIndex(i => i.id === id);
    if (index === -1) return null;

    const updated = {
      ...interventions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    interventions[index] = updated;
    localStorage.setItem('interventions', JSON.stringify(interventions));
    return updated;
  },
};

/**
 * Factures API
 */
export const facturesAPI = {
  async getAll(): Promise<Facture[]> {
    const stored = localStorage.getItem('factures');
    return stored ? JSON.parse(stored) : [];
  },

  async getByClientId(clientId: string): Promise<Facture[]> {
    const factures = await this.getAll();
    return factures.filter(f => f.clientId === clientId);
  },

  async create(data: Omit<Facture, 'id' | 'createdAt' | 'updatedAt'>): Promise<Facture> {
    const newFacture: Facture = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const factures = await this.getAll();
    const updated = [...factures, newFacture];
    localStorage.setItem('factures', JSON.stringify(updated));
    return newFacture;
  },

  async update(id: string, data: Partial<Facture>): Promise<Facture | null> {
    const factures = await this.getAll();
    const index = factures.findIndex(f => f.id === id);
    if (index === -1) return null;

    const updated = {
      ...factures[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    factures[index] = updated;
    localStorage.setItem('factures', JSON.stringify(updated));
    return updated;
  },
};

/**
 * Paramètres/Settings API
 */
export const settingsAPI = {
  async get() {
    const stored = localStorage.getItem('params');
    return stored ? JSON.parse(stored) : null;
  },

  async update(data: any) {
    localStorage.setItem('params', JSON.stringify(data));
    return data;
  },
};
