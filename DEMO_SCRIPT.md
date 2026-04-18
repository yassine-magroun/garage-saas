# MecaniGo — Demo Script (15 min)

## Before you start

- Seed demo data: `npx tsx scripts/seed-demo.ts`
- Ensure Vercel deployment is green
- Open `https://mecanigo.vercel.app` in a fresh incognito window
- Keep a second tab on `/api/health` for live status

---

## Act 1 — First impressions (2 min)

### WOW #1: Login & Dashboard
1. Sign in via Clerk — notice instant dark theme, no white flash
2. Dashboard loads: KPI tiles (clients, interventions, factures, stock alerts)
3. **Show the sidebar** — sectioned nav with colored badges:
   - Orange badge on Interventions (active count)
   - Red badge on Factures (unpaid count)
   - Red badge on Stock (ruptures)

### WOW #2: Command palette
1. Press **⌘K** anywhere
2. Type "Martin" — instant fuzzy search finds Martin Dupont (Yamaha XMAX 300)
3. Press **⌘I** — jumps straight to new intervention modal
4. Mention: indexed over clients + factures + interventions + prestations catalogue

---

## Act 2 — Intervention flow (4 min)

### Create an intervention
1. Click "Nouvelle intervention" CTA (orange glow button)
2. Fill: client = Sophie Laurent, véhicule = Honda Forza 750
3. Type de prestation → type "rev" → autocomplete suggests "Révision complète" with price 120€
4. Save → **card appears instantly** at top of list

### WOW #3: Kanban view
1. Toggle to **Kanban** view (top-right icon)
2. **Drag the new card** from "En attente" → "En cours"
3. Show real-time status update — status API called, card moves
4. Drag to "Prêt" → toast: "✅ Véhicule prêt — email client envoyé"

---

## Act 3 — Facturation & paiement (4 min)

### WOW #4: Facture detail panel
1. Navigate to **Factures**
2. Click on FAC-0002 (Partial — 80€ payé / 180€)
3. Show the **sticky right panel**:
   - Financial summary with HT/TVA/TTC + reste dû in amber
   - Payment timeline: acompte CB affiché
   - Actions: Marquer payée / PDF / Email / **Factur-X** / Dupliquer / Annuler

### WOW #5: Factur-X PDF (if FLAGS.FACTUR_X_ENABLED)
1. Click "Factur-X" button → PDF/A-3 opens in new tab
2. Mention: "Conforme à la norme française, obligatoire depuis septembre 2026"
3. "Le XML CII BASIC est attaché au PDF — les comptables adorent ça"

### WOW #6: Marquer payée + email automatique
1. Click "Marquer payée" on FAC-0002
2. Fill amount 100€, mode Virement
3. Submit → status changes to "Payée"
4. Background: automation triggers → email comptable avec PDF en pièce jointe
5. GSheet append (if configured): "Le garage peut voir toutes ses factures payées en temps réel dans un Google Sheet"

---

## Act 4 — Stock & conformité (3 min)

### WOW #7: Stock ruptures
1. Navigate to **Pièces**
2. Show two items en rupture (badge rouge 2 en sidebar)
3. Show EmptyState UX if no filter results

### WOW #8: Livre de Police
1. Navigate to **Livre de Police**
2. Show the pre-filled entry (Martin Dupont, XMAX 300)
3. "Obligatoire pour tous les garages — entrée/sortie, pièce d'identité, numéro de série"
4. EXPORT CSV button → download conforme

---

## Act 5 — Health & ops (2 min)

### WOW #9: Status page
1. Open `/api/health` → JSON live
2. Show: supabase_db ✅ latency, resend ✅, flags snapshot
3. Mention: "Le sidebar lui-même fait un ping /health toutes les 60s — le point vert en bas"
4. Démo: kill wifi → point rouge "Dégradé" appears

---

## Fallback plan

If live demo fails:
- Use `localhost:3000` with seeded data
- Screenshot backup in `/public/screenshots/` (if added)
- Describe the Factur-X XML structure from `lib/facture-x/xml-cii.ts`

---

## Metrics to mention

| Metric | Value |
|--------|-------|
| Pages | 9 |
| API routes | 18+ |
| Supabase tables | 8 |
| Automation triggers | 2 (pg webhook + bridge) |
| Toasts unified | sonner — 8 pages |
| TypeScript errors | 0 |
| Vercel build | ✅ green |
