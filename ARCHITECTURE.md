# Architecture Backend - Prête pour Supabase

## 📐 Structure du Projet

```
lib/
├── types.ts       # Types/models métier centralisés
├── mocks.ts       # Données mock pour développement
├── api.ts         # Client API abstrait (ready for Supabase)
└── utils.ts       # Utilitaires et helpers
```

## 🏗️ Architecture Couches

### 1. **Types (lib/types.ts)**
Définition centralisée de tous les types métier:
- `Client` - Clients avec immatriculation, VIP status
- `Intervention` - Interventions liées aux clients
- `Facture` - Factures liées clients/interventions
- `GarageSettings` - Configuration du garage
- Interfaces support: `DashboardStats`, `ApiResponse`, `PaginatedResponse`

### 2. **Données Mock (lib/mocks.ts)**
- `DEFAULT_GARAGE` - Configuration par défaut
- `DEFAULT_CLIENTS` - Clients de test
- `DEFAULT_INTERVENTIONS` - Interventions de test
- `DEFAULT_FACTURES` - Factures de test

À remplacer par des appels API en production.

### 3. **API Client (lib/api.ts)**
Abstraction pour les appels API avec localStorage fallback:

```typescript
// Actuellement: localStorage (développement)
await clientsAPI.getAll()          // ✅ Récupère de localStorage
await clientsAPI.create(data)      // ✅ Crée et persiste
await clientsAPI.update(id, data)  // ✅ Modifie
await clientsAPI.delete(id)        // ✅ Supprime
```

**Prêt pour Supabase**: Modifiez simplement les implémentations avec `apiCall()`:

```typescript
// Production: Supabase
async getAll(): Promise<Client[]> {
  const result = await apiCall<Client[]>('/clients');
  return result.success ? result.data || [] : [];
}
```

### 4. **Utilitaires (lib/utils.ts)**
- `format.*` - Formatage (amount, date, phone, initials)
- `calculations.*` - Stats et calculs
- `validate.*` - Validation données
- `lookup.*` - Recherche et filtrage
- `colors.*` - Mappages couleurs par status
- `storage.*` - Helpers localStorage

## 🔄 Flux de Données

```
PageComponent
    ↓
useEffect() → API/localStorage
    ↓
state (clients, interventions, factures)
    ↓
Affichage + Formulaires
    ↓
handleSubmit() → API.create/update/delete
    ↓
localStorage persiste
```

## 🚀 Migration vers Supabase (Prochaines étapes)

### 1. Configuration
```typescript
// lib/supabase.ts (À créer)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
```

### 2. Remplacer les implémentations API
```typescript
// lib/api.ts - clientsAPI.getAll()
async getAll(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
  
  if (error) throw error
  return data || []
}
```

### 3. Tables Supabase requises
```sql
-- Garages
CREATE TABLE garages (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  email TEXT,
  siret TEXT UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  garage_id UUID REFERENCES garages(id),
  name TEXT NOT NULL,
  phone TEXT,
  vehicle TEXT,
  immatriculation TEXT,
  vip BOOLEAN DEFAULT FALSE,
  last_visit DATE,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Interventions
CREATE TABLE interventions (
  id UUID PRIMARY KEY,
  garage_id UUID REFERENCES garages(id),
  client_id UUID REFERENCES clients(id),
  vehicle TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  date DATE,
  price DECIMAL(10,2),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Factures
CREATE TABLE factures (
  id UUID PRIMARY KEY,
  garage_id UUID REFERENCES garages(id),
  client_id UUID REFERENCES clients(id),
  intervention_id UUID REFERENCES interventions(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  date DATE,
  due_date DATE,
  paid_at DATE,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## ✅ Cohérence des Données

Tous les types partagent:
- `id: string` - Identifiant unique
- `garageId: string` - Multi-garage ready
- `createdAt: string` - ISO 8601
- `updatedAt: string` - ISO 8601

Format de liaison:
- Interventions → clientId (n-to-1)
- Factures → clientId + interventionId (n-to-1)
- Tout → garageId (multi-tenant)

## 📱 Intégration Pages

Chaque page suit le pattern:
```typescript
import { clientsAPI, interventionsAPI } from '@/lib/api'
import { format, lookup, storage } from '@/lib/utils'

// Dans useEffect
const [clients, setClients] = useState<Client[]>([])
const clients = await clientsAPI.getAll()

// Dans le rendu
<p>{format.amount(invoice.amount)}€</p>
<div className={colors.status(invoice.status)}>
```

## 🔐 Sécurité pour Production

À implémenter avant Supabase:
- ✅ Row-level security (RLS) Supabase
- ✅ Variables d'environnement sécurisées
- ✅ Validation côté serveur
- ✅ Rate limiting
- ✅ Authentification utilisateur
- ✅ Audit logs

## 📊 Dashboard intègre les données réelles
- Charge depuis localStorage → API → Supabase
- KPIs calculés en temps réel
- Pas de données en dur (sauf mocks initiaux)

---

**Status**: Architecture ready for production migration ✅
