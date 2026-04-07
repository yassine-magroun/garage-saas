<div align="center">

# ⚡ MecaniGo

### La gestion garage, enfin simple.

**SaaS de gestion complète pour les garages moto en France**

[![Live](https://img.shields.io/badge/Live-Vercel-black?style=for-the-badge&logo=vercel)](https://garage-saas-one.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

-----

*MecaniGo transforme la gestion d’un atelier moto — de 2h d’administratif par jour à 15 minutes.*

</div>

-----

## 🎯 Le Problème

Des milliers de garages moto en France gèrent encore leur activité avec :

- Des carnets papier et fichiers Excel
- Zéro KPI, zéro visibilité sur le chiffre d’affaires
- Des factures créées à la main, envoyées par SMS
- Aucune automatisation des processus métier

**MecaniGo résout ça.**

-----

## 🚀 Fonctionnalités

### Dashboard KPI Temps Réel

- Chiffre d’affaires mensuel avec sparkline de tendance
- Évolution CA mois par mois
- Factures en attente (nombre + montant)
- Interventions actives
- Devis en cours
- Activité récente + clients récents

### Pipeline Devis → Facture → Paiement

- Création de devis avec lignes détaillées
- Conversion devis → facture en 1 clic
- Enregistrement des paiements (partiel ou total)
- Statuts automatiques : Brouillon · Envoyé · Accepté · Payée · Non payée

### Facturation PDF Professionnelle

- Génération automatique de factures PDF brandées MecaniGo
- Template conforme : TVA 20%, montants HT/TTC, mentions légales
- Téléchargement PDF en 1 clic
- Envoi par email au client avec PDF en pièce jointe

### Gestion Clients & Interventions

- Fiche client complète (nom, téléphone, email, véhicule)
- Historique des interventions par client
- Suivi des réparations en cours
- Actions rapides depuis le dashboard

### Notifications Email

- Envoi automatique de factures par email
- Template email HTML professionnel MecaniGo
- PDF attaché automatiquement

-----

## 🛠️ Stack Technique

|Couche      |Technologie            |Rôle                                    |
|------------|-----------------------|----------------------------------------|
|**Frontend**|Next.js 16 (App Router)|Interface utilisateur React             |
|**Styling** |Tailwind CSS           |Design system MecaniGo dark theme       |
|**Backend** |Next.js API Routes     |Logique métier & endpoints              |
|**Database**|Supabase (PostgreSQL)  |Données, auth, real-time                |
|**PDF**     |@react-pdf/renderer    |Génération factures PDF                 |
|**Email**   |Resend                 |Envoi transactionnel avec pièces jointes|
|**Hosting** |Vercel                 |Déploiement cloud, CI/CD automatique    |
|**Language**|TypeScript (strict)    |Zéro `any`, type-safe                   |

-----

## 📐 Architecture

```
garage-saas-app/
├── app/
│   ├── page.tsx                  # Dashboard KPI
│   ├── clients/page.tsx          # Gestion clients
│   ├── interventions/page.tsx    # Suivi interventions
│   ├── factures/page.tsx         # Facturation + PDF + email
│   ├── devis/page.tsx            # Gestion devis
│   ├── parametres/page.tsx       # Paramètres garage
│   └── api/
│       └── invoice/
│           ├── pdf/route.ts      # Génération PDF
│           └── send-email/route.ts # Envoi email Resend
├── components/
│   ├── InvoicePDF.tsx            # Template PDF facture
│   └── ...
├── lib/
│   ├── api.ts                    # Logique métier centralisée
│   ├── supabase.ts               # Client Supabase
│   └── types.ts                  # Types TypeScript
└── DESIGN.md                     # Design system MecaniGo
```

**Principe architectural** : Toute la logique métier est dans `lib/api.ts`. Les pages consomment cette API. Zéro appel Supabase direct dans les composants → extensible mobile (React Native) plus tard.

-----

## 🎨 Design System

MecaniGo utilise un design system custom dark theme inspiré de Linear/Stripe :

- **Primary** : `#FF6B2B` (orange électrique)
- **Background** : `#0F1117` (dark)
- **Surface** : `#1A1D27` (cards)
- **Typography** : Inter
- **Cards** : Glassmorphism + hover lift
- **Hero** : Gradient mesh radial orange

Détails complets dans [`DESIGN.md`](./DESIGN.md)

-----

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/your-username/garage-saas.git
cd garage-saas/garage-saas-app

# Install
npm install

# Environment variables
cp .env.example .env.local
# Fill in your Supabase URL, Anon Key, and Resend API Key

# Run
npm run dev
```

Ouvrir <http://localhost:3000>

-----

## 🔐 Variables d’Environnement

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
```

-----

## 🗺️ Roadmap

- [x] Dashboard KPI temps réel
- [x] Flow complet Devis → Facture → Paiement
- [x] Génération PDF facture professionnelle
- [x] Envoi email avec PDF attaché
- [x] Design system MecaniGo dark theme
- [x] Déploiement Vercel production
- [ ] Authentification Clerk (multi-tenant)
- [ ] SMS “véhicule prêt” (Twilio)
- [ ] IA agentique : relances automatiques
- [ ] IA agentique : prise de RDV intelligente
- [ ] IA agentique : diagnostic préventif
- [ ] App mobile React Native
- [ ] Facturation FACTUR-X (obligatoire 2027)

-----

## 📊 Méthode

Ce projet a été construit avec une approche **tech consulting** :

1. **Audit terrain** → Identification des pain points métier
1. **Data modeling** → Structuration des flux (clients, devis, factures, paiements)
1. **Product design** → Dashboard KPI, workflows automatisés
1. **Build & deploy** → Développement full-stack, déploiement cloud
1. **Itération** → Feedback utilisateur, amélioration continue

-----

## 👤 Auteur

**Yassine Magroun** — Data & Process Consultant

- LinkedIn : [Yassine Magroun](https://www.linkedin.com/in/yassine-magroun/)
- Email : yassine.magroun1@outlook.fr

-----

<div align="center">

**MecaniGo** — La gestion garage, enfin simple.

⚡ Built with Next.js · Supabase · Vercel · Resend

</div>