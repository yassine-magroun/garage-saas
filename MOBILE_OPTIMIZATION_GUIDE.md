# 📱 Guide Optimisation Responsive Mobile

## Quick Start - Apply to All Pages

### Pattern à copier/coller pour chaque page

#### 1. **Imports**
```typescript
'use client';

// Remove this:
// import Sidebar from '../components/Sidebar';

// Add this:
import PageLayout from '../components/PageLayout';
```

#### 2. **Return Statement**
```typescript
// BEFORE:
return (
  <div className="min-h-screen bg-gray-50 flex">
    <Sidebar activePage="clients" garageName={garageName} />
    <div className="flex-1 flex flex-col">
      <header>...</header>
      <main>...</main>
    </div>
  </div>
)

// AFTER:
return (
  <PageLayout activePage="clients" garageName={garageName}>
    <header>...</header>
    <main>...</main>
  </PageLayout>
)
```

#### 3. **Tailwind Classes - Find & Replace**

| Old | New | Raison |
|-----|-----|--------|
| `px-8 py-5` | `px-4 md:px-8 py-4 md:py-5` | Mobile padding réduit |
| `p-8 space-y-8` | `p-4 md:p-8 space-y-6 md:space-y-8` | Espacement compacte mobile |
| `text-3xl font-semibold` | `text-2xl md:text-3xl font-semibold` | Texte scaled mobile |
| `text-lg` | `text-base md:text-lg` | Sous-titres scaled |
| `gap-6` | `gap-3 md:gap-6` | Espacement card mobile |
| `rounded-xl` | `rounded-lg md:rounded-xl` | Border radius réduit mobile |
| `w-10 h-10` | `w-9 md:w-10 h-9 md:h-10` | Icons plus petites mobile |
| `flex md:flex-row items-start md:items-center` | Vertical mobile, horizontal desktop | Stack responsive |

#### 4. **Sections principales**

**Grille KPI (stats, metrics):**
```typescript
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
  {/* 2 colonnes sur petit écran, 4 sur desktop */}
</div>
```

**Section contenu (cards, listes):**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6">
  {/* 1 colonne mobile, 2 desktop */}
</div>
```

**Boutons d'action (fullwidth mobile):**
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
  <button className="flex items-center justify-center px-4 md:px-6 py-3">
    <Icon className="w-4 h-4 mr-2" />
    <span className="hidden md:inline">Long text</span>
    <span className="md:hidden">Short</span>
  </button>
</div>
```

#### 5. **Overflow & Scrolling**

```typescript
{/* Long content */}
<main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
  {/* Partagé avec tous les sections */}
</main>
```

#### 6. **Modaux Mobiles-Friendly**

```typescript
{isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-lg">
      {/* contenu modal peut scroller sur mobile */}
    </div>
  </div>
)}
```

---

## Pages à Optimiser

### ✅ app/page.tsx (Dashboard)
**Status:** Complètement optimisé

### ⏳ app/clients/page.tsx
**À faire:**
1. Remplacer Sidebar par PageLayout
2. Header: px-8 → px-4 md:px-8
3. Stats grid: 4 cols → 2 cols mobile
4. Client cards: grid-cols-1 md:grid-cols-2
5. Boutons: fullwidth mobile avec texte caché

### ⏳ app/interventions/page.tsx
**À faire:**
1. Même pattern PageLayout
2. Header mobile-friendly
3. Intervention cards responsive (2 col mobile max)
4. Search bar fullwidth mobile
5. Status badges compact mobile

### ⏳ app/factures/page.tsx
**À faire:**
1. PageLayout wrapper
2. KPI cards: 2 col mobile, 4 col desktop
3. Invoice list: 1 col mobile
4. Montants formatés compacts
5. Modal facture scrollable

### ⏳ app/parametres/page.tsx
**À faire:**
1. PageLayout
2. Form inputs fullwidth mobile
3. Input groups stacked mobile
4. Boutons actions fullwidth

---

## Style System à Respecter

**Colors & Status:**
```typescript
// Dans lib/utils.ts, utilise colors.status()
const statusClass = colors.status(invoice.status)
return <div className={statusClass}>{invoice.status}</div>
```

**Spacing Scale:**
```
Mobile:  p-4, gap-3, space-y-3
Desktop: p-6+, gap-6, space-y-6+
```

**Typography:**
```
Mobile:   text-xs md:text-sm (labels)
          text-sm md:text-base (body)
          text-xl md:text-2xl (titles)
          text-2xl md:text-3xl (main headers)

Desktop: Additionne ~1 niveau de taille
```

**Breakpoints:**
```
sm: 640px (hidden sm:block, sm:hidden)
md: 768px (hidden md:block, md:hidden) ← À utiliser partout
lg: 1024px (hidden lg:block)
xl: 1280px (hidden xl:block)
```

---

## Checklist Avant Commit

### Pour chaque page optimisée:
- [ ] Importe `PageLayout` au lieu de `Sidebar`
- [ ] Wraps contenu avec `<PageLayout>`
- [ ] Adapte tous les paddings (px, py)
- [ ] Adapte grilles (2 col mobile min)
- [ ] Teste sur mobile Chrome DevTools (375px width)
- [ ] Teste sur tablet (768px)
- [ ] Teste sur desktop (1920px)
- [ ] Vérifie boutons fullwidth mobile
- [ ] Vérifie texte lisible sans zoom
- [ ] Vérifie scroll smoothness

---

## Performance Tips

1. **Images:** Toujours load images responsif
   ```typescript
   <img 
     src="..." 
     alt="..." 
     className="w-full h-auto" // Auto scale
   />
   ```

2. **Avoid Nested Scrolling:** Utilise `overflow-y-auto` sur main seulement

3. **Touch Targets:** Boutons min 44x44px sur mobile
   ```typescript
   // ✅ Bon
   <button className="px-4 py-3 text-sm">Touch</button> // 44px+ height
   
   // ❌ Mauvais
   <button className="px-2 py-1 text-xs">Tiny</button> // Trop petit
   ```

4. **Avoid Hover:** Pas animations hover sur mobile, utilise 'active' au lieu
   ```typescript
   className="hover:bg-gray-100 active:bg-gray-200"
   ```

---

## Après Optimisation Mobile → Intégration Backend

Une fois mobile fait, vous pouvez passer aux appels API:
1. Changer localStorage → `clientsAPI.getAll()`
2. Ajouter `import { format } from '@/lib/utils'`
3. Utiliser `format.amount()`, `format.date()`, etc.
4. Utiliser `colors.status()` pour le style

```typescript
// Exemple avant
const [clients, setClients] = useState(initialClients)

// Exemple après
useEffect(() => {
  clientsAPI.getAll().then(setClients)
}, [])
```

---

**Estimated time per page:** 15-20 min using find-replace template
**Total remaining:** ±1h for all 4 pages

Que tu finisses les optimisations seul ou veux qu'on continuing ensemble?
