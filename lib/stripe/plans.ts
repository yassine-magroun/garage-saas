export interface StripePlan {
  name: string;
  price: number; // EUR/month
  priceId: string;
  features: string[];
}

export const PLANS: Record<'starter' | 'pro' | 'enterprise', StripePlan> = {
  starter: {
    name: 'Starter',
    price: 59,
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    features: [
      "Jusqu'à 3 utilisateurs",
      'Gestion des clients et véhicules',
      'Devis et factures illimitées',
      'Gestion du stock (50 pièces)',
      'Support par email',
    ],
  },
  pro: {
    name: 'Pro',
    price: 99,
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    features: [
      'Utilisateurs illimités',
      'Tout le plan Starter',
      'Alertes stock en temps réel',
      'Automatisations (emails, relances)',
      'Statistiques avancées',
      'Support prioritaire',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 149,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
    features: [
      'Tout le plan Pro',
      'Multi-garage',
      'API et intégrations personnalisées',
      'Onboarding dédié',
      'SLA 99,9 % de disponibilité',
      'Support téléphonique 24/7',
    ],
  },
};
