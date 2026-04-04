# MecaniGo — Design System

> "La gestion garage, enfin simple."
> Précis. Rapide. Fiable.

---

## 1. Brand

### Identity
| Property   | Value                                   |
|------------|-----------------------------------------|
| Name       | **MecaniGo**                            |
| Tagline    | "La gestion garage, enfin simple."      |
| Domain     | SaaS B2B — garages moto France          |

### Voice & Tone
- **Direct** — phrases courtes, verbes d'action
- **Professionnel** — pas familier, pas corporate
- **Concret** — chiffres, statuts, résultats
- ❌ Pas de jargon inutile, pas de buzzwords
- ✅ "Facture générée" pas "Votre document a été créé avec succès"

### Inspiration
Linear × Notion × culture garage sport

---

## 2. Colors

### Brand (constant)
| Token                  | Hex       | Usage                          |
|------------------------|-----------|--------------------------------|
| `--mg-primary`         | `#FF6B2B` | CTA, liens actifs, focus ring  |
| `--mg-primary-dark`    | `#E55A1C` | Hover état primary             |
| `--mg-primary-light`   | `#FF8C5A` | Tints, icônes secondaires      |

### Dark mode (default)
| Token                    | Hex       | Usage                     |
|--------------------------|-----------|---------------------------|
| `--mg-bg`                | `#0F1117` | Page background           |
| `--mg-surface`           | `#1A1D27` | Cards, panels, sidebar    |
| `--mg-surface-raised`    | `#22263A` | Modales, dropdowns        |
| `--mg-border`            | `#2A2D3A` | Dividers, input borders   |
| `--mg-text`              | `#FFFFFF` | Texte principal           |
| `--mg-text-secondary`    | `#8B8FA8` | Labels, metadata          |
| `--mg-text-disabled`     | `#4B5063` | Éléments désactivés       |

### Light mode
| Token                    | Hex       |
|--------------------------|-----------|
| `--mg-bg`                | `#F8F9FC` |
| `--mg-surface`           | `#FFFFFF` |
| `--mg-surface-raised`    | `#F3F4F8` |
| `--mg-border`            | `#E5E7EB` |
| `--mg-text`              | `#0F1117` |
| `--mg-text-secondary`    | `#6B7280` |
| `--mg-text-disabled`     | `#9CA3AF` |

### Semantic
| Token             | Hex       | Usage                          |
|-------------------|-----------|--------------------------------|
| `--mg-success`    | `#10B981` | Payée, Terminé, succès         |
| `--mg-warning`    | `#F59E0B` | Partielle, attention           |
| `--mg-error`      | `#EF4444` | Non payée, erreur              |
| `--mg-info`       | `#3B82F6` | En cours, information          |

### Tailwind utilities (via `@theme inline`)
```
bg-primary         text-primary         border-primary
bg-mg-bg           text-mg-text         border-mg-border
bg-mg-surface      text-mg-text-secondary
bg-success         text-success
bg-warning         text-warning
bg-error           text-error
bg-info            text-info
```

---

## 3. Typography

### Font
**Inter** — Google Fonts
```html
<!-- via next/font/google — no @import needed -->
import { Inter } from 'next/font/google'
```

### Scale
| Name  | Size  | Line Height | Weight usage        |
|-------|-------|-------------|---------------------|
| `xs`  | 11px  | 1.4         | Labels, badges      |
| `sm`  | 13px  | 1.5         | Table cells, meta   |
| `base`| 15px  | 1.6         | Body, paragraphs    |
| `lg`  | 17px  | 1.5         | Subheadings         |
| `xl`  | 20px  | 1.4         | Card titles         |
| `2xl` | 24px  | 1.3         | Section titles      |
| `3xl` | 32px  | 1.2         | Page headings       |
| `4xl` | 48px  | 1.1         | Hero, display       |

### Weights
| Name      | Value |
|-----------|-------|
| Regular   | 400   |
| Medium    | 500   |
| Semibold  | 600   |
| Bold      | 700   |

### Rules
- Headings: `font-semibold` or `font-bold`
- UI labels: `font-medium`
- Body: `font-normal`
- Numbers/amounts: `font-semibold tabular-nums`

---

## 4. Spacing

Base unit: **4px**

| Token | Value | Common usage                  |
|-------|-------|-------------------------------|
| 1     | 4px   | Gaps fins, padding icônes     |
| 2     | 8px   | Padding badges, gaps compacts |
| 3     | 12px  | Padding inline                |
| 4     | 16px  | Gap standard entre éléments   |
| 5     | 20px  | Padding cards mobile          |
| 6     | 24px  | Padding cards desktop, gaps   |
| 8     | 32px  | Sections                      |
| 10    | 40px  | Sections spacieuses           |
| 12    | 48px  | Sections majeures             |
| 16    | 64px  | Hero, espacements larges      |
| 20    | 80px  | Top-level layout              |

---

## 5. Components

### Cards
```
border-radius: 12px (rounded-xl)
background: var(--mg-surface)
border: 1px solid var(--mg-border)
box-shadow: 0 1px 3px rgba(0,0,0,0.12)
padding: 20px (p-5) ou 24px (p-6)

hover:
  box-shadow: 0 4px 12px rgba(0,0,0,0.15)
  transform: translateY(-2px)
  transition: 150ms ease
```

### Buttons

**Primary** — CTA principal
```
bg: #FF6B2B    hover: #E55A1C    active: darken 10%
text: white    font-medium
border-radius: 8px (rounded-lg)
padding: 8px 16px (py-2 px-4)
```

**Secondary** — Action secondaire
```
bg: transparent
border: 1px solid #FF6B2B
text: #FF6B2B    hover bg: rgba(255,107,43,0.08)
border-radius: 8px
```

**Ghost** — Tertiary, navigation
```
bg: transparent    border: none
text: var(--mg-text-secondary)
hover: text var(--mg-text), bg rgba(255,255,255,0.06)
```

**Danger** — Actions destructives
```
bg: #EF4444    hover: #DC2626
text: white    border-radius: 8px
```

**Disabled state** (tous)
```
opacity: 0.5    cursor: not-allowed
```

### Badges (statuts)

| Statut           | Background          | Texte               | Border              |
|------------------|---------------------|---------------------|---------------------|
| En cours         | `#3B82F6/15`        | `#3B82F6`           | `#3B82F6/30`        |
| Terminé          | `#10B981/15`        | `#10B981`           | `#10B981/30`        |
| Planifié         | `#8B8FA8/15`        | `#8B8FA8`           | `#8B8FA8/30`        |
| Payée / paid     | `#10B981/15`        | `#10B981`           | `#10B981/30`        |
| Non payée/unpaid | `#EF4444/15`        | `#EF4444`           | `#EF4444/30`        |
| Partielle/partial| `#F59E0B/15`        | `#F59E0B`           | `#F59E0B/30`        |
| Annulée/cancelled| `#6B7280/15`        | `#6B7280`           | `#6B7280/30`        |
| Brouillon/draft  | `#6B7280/15`        | `#6B7280`           | `#6B7280/30`        |
| Envoyé/sent      | `#3B82F6/15`        | `#3B82F6`           | `#3B82F6/30`        |
| Accepté/accepted | `#10B981/15`        | `#10B981`           | `#10B981/30`        |
| Refusé/refused   | `#EF4444/15`        | `#EF4444`           | `#EF4444/30`        |

```
border-radius: 999px (rounded-full)
padding: 2px 8px
font-size: 11px    font-weight: 500
```

### Inputs
```
bg: var(--mg-surface)
border: 1px solid var(--mg-border)
border-radius: 10px (rounded-xl)
padding: 10px 14px
font-size: 14px
color: var(--mg-text)

focus:
  border-color: #FF6B2B
  box-shadow: 0 0 0 3px rgba(255,107,43,0.15)
  outline: none

placeholder: var(--mg-text-secondary)
```

### Sidebar
```
width: 240px    fixed left
background: var(--mg-surface)
border-right: 1px solid var(--mg-border)
padding: 16px

Nav item:
  padding: 8px 12px    border-radius: 8px
  gap: 10px (icon + label)
  color: var(--mg-text-secondary)

Nav item active:
  background: rgba(255,107,43,0.12)
  color: #FF6B2B
  font-weight: 500
```

---

## 6. Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│  Sidebar 240px fixed  │  Main content            │
│                       │  padding: 24px           │
│  Logo                 │                          │
│  ──────               │  Header                  │
│  nav item             │  ──────────────────────  │
│  nav item ←active     │  KPI Grid (3 cols)       │
│  nav item             │  [card][card][card]       │
│  nav item             │  [card][card][card]       │
│  nav item             │  ──────────────────────  │
│                       │  Content section         │
│  ──────               │                          │
│  Settings             │                          │
└─────────────────────────────────────────────────┘

Mobile (< 768px):
- Sidebar: hidden (bottom nav or hamburger)
- KPI grid: 2 cols → 1 col

KPI Cards gap: 16px
Section gap: 24px
```

---

## 7. Icons

**Library:** Lucide React (`lucide-react`)

| Context         | Size  | Class        |
|-----------------|-------|--------------|
| Inline / text   | 16px  | `w-4 h-4`    |
| Buttons         | 16px  | `w-4 h-4`    |
| Nav sidebar     | 18px  | `w-[18px] h-[18px]` |
| Page headings   | 20px  | `w-5 h-5`    |
| KPI cards       | 20px  | `w-5 h-5`    |
| Empty states    | 32px  | `w-8 h-8`    |

**Color:** `currentColor` (inherits from parent text color)

---

## 8. Animations & Motion

### Transitions
```css
/* Standard UI transitions */
transition-property: color, background-color, border-color, box-shadow, transform, opacity;
transition-duration: 150ms;
transition-timing-function: ease;
```

### Hover states
```css
/* Cards — lift */
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0,0,0,0.15);

/* Buttons — darken */
background-color: var(--mg-primary-dark);

/* Nav items — bg fill */
background-color: rgba(255,255,255,0.06);
```

### Focus ring
```css
outline: 2px solid #FF6B2B;
outline-offset: 2px;
border-radius: 4px;
```

### Loading skeleton
```css
animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
background: var(--mg-border);
border-radius: 6px;
```

---

## 9. Dark Mode

**Default: dark.** Toggle via `.dark` class on `<html>`.

### Implementation
```tsx
// ThemeProvider toggles document.documentElement.classList.toggle('dark', isDark)
```

### CSS Variable Strategy
```css
/* Dark (default) */
:root {
  --mg-bg: #0F1117;
  --mg-surface: #1A1D27;
  --mg-border: #2A2D3A;
  --mg-text: #FFFFFF;
  --mg-text-secondary: #8B8FA8;
}

/* Light override */
.light {
  --mg-bg: #F8F9FC;
  --mg-surface: #FFFFFF;
  --mg-border: #E5E7EB;
  --mg-text: #0F1117;
  --mg-text-secondary: #6B7280;
}
```

### Usage in components
```tsx
// ✅ CSS variables — respond to theme
<div style={{ background: 'var(--mg-surface)' }} />

// ✅ Tailwind custom tokens (registered via @theme)
<div className="bg-mg-surface border-mg-border text-mg-text" />

// ✅ Tailwind dark: prefix (explicit)
<div className="bg-white dark:bg-slate-800" />
```

---

## 10. File Structure (Design-Related)

```
app/
  globals.css          ← CSS variables + @theme tokens
  layout.tsx           ← Inter font + dark-by-default html class
  components/
    ThemeProvider.tsx  ← .dark toggle on <html>
DESIGN.md              ← This file
```

---

## Quick Reference Card

```
Primary:   #FF6B2B    bg-primary / text-primary
Success:   #10B981    bg-success / text-success
Warning:   #F59E0B    bg-warning / text-warning
Error:     #EF4444    bg-error   / text-error
Info:      #3B82F6    bg-info    / text-info

BG dark:   #0F1117    bg-mg-bg
Surface:   #1A1D27    bg-mg-surface
Border:    #2A2D3A    border-mg-border
Text:      #FFFFFF    text-mg-text
Muted:     #8B8FA8    text-mg-text-secondary

Font:      Inter 400/500/600/700
Radius:    cards 12px, buttons 8px, inputs 10px, badges 999px
Transition: 150ms ease
```
