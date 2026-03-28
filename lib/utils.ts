/**
 * Utilitaires et helpers pour le projet
 */

import { Client, Intervention, Facture } from './types';

/**
 * Formatage et conversion
 */
export const format = {
  amount: (amount: any): string => {
    const num = Number(amount);
    return isNaN(num) ? '0' : num.toFixed(0);
  },

  currency: (amount: any): string => {
    return `${format.amount(amount)}€`;
  },

  date: (date: string): string => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('fr-FR');
    } catch {
      return date;
    }
  },

  phone: (phone: string): string => {
    return phone?.replace(/(\d{2})(?=\d)/g, '$1 ') || '';
  },

  initials: (name: string): string => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '';
  },
};

/**
 * Calculs et statistiques
 */
export const calculations = {
  totalAmount: (items: { amount: number }[]): number => {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  },

  averageAmount: (items: { amount: number }[]): number => {
    if (items.length === 0) return 0;
    return calculations.totalAmount(items) / items.length;
  },

  countByStatus: <T extends { status: string }>(items: T[], status: string): number => {
    return items.filter(item => item.status === status).length;
  },

  filterByDate: <T extends { date: any }>(items: T[], startDate: Date, endDate: Date): T[] => {
    return items.filter(item => {
      const date = new Date(item.date);
      return date >= startDate && date <= endDate;
    });
  },

  dateRange: (days: number): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  },
};

/**
 * Validation
 */
export const validate = {
  email: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  phone: (phone: string): boolean => {
    const re = /^[\d\s+\-()]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 9;
  },

  siret: (siret: string): boolean => {
    return siret.replace(/\D/g, '').length === 14;
  },

  amount: (amount: any): boolean => {
    const num = Number(amount);
    return !isNaN(num) && num > 0;
  },
};

/**
 * Lookup/Finding helpers
 */
export const lookup = {
  clientById: (clients: Client[], id: string): Client | undefined => {
    return clients.find(c => c.id === id);
  },

  interventionById: (interventions: Intervention[], id: string): Intervention | undefined => {
    return interventions.find(i => i.id === id);
  },

  factureById: (factures: Facture[], id: string): Facture | undefined => {
    return factures.find(f => f.id === id);
  },

  clientsByIds: (clients: Client[], ids: string[]): Client[] => {
    return clients.filter(c => ids.includes(c.id));
  },

  interventionsByClientId: (interventions: Intervention[], clientId: string): Intervention[] => {
    return interventions.filter(i => i.clientId === clientId);
  },
};

/**
 * Couleurs et téléchargement
 */
export const colors = {
  status: (status: string): string => {
    const statusColors: Record<string, string> = {
      'Payée': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'En attente': 'bg-amber-50 text-amber-700 border border-amber-200',
      'En retard': 'bg-red-50 text-red-700 border border-red-200',
      'En cours': 'bg-amber-50 text-amber-700 border border-amber-200',
      'Terminé': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Planifié': 'bg-blue-50 text-blue-700 border border-blue-200',
    };
    return statusColors[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
  },
};

/**
 * Storage helpers
 */
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      if (typeof window === 'undefined') return defaultValue || null;
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

export const theme = {
  apply: (isDark: boolean) => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
  },

  load: (): boolean => {
    if (typeof window === 'undefined') return false;
    const params = storage.get<Record<string, any>>('params', {});
    return Boolean(params?.darkMode);
  },

  set: (isDark: boolean) => {
    if (typeof window === 'undefined') return;
    const params = storage.get<Record<string, any>>('params', {});
    const nextParams = { ...params, darkMode: isDark };
    storage.set('params', nextParams);
    theme.apply(isDark);
  },
};
