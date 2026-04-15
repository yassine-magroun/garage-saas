'use client';

import { useState, useEffect, useCallback } from 'react';
import { Suspense } from 'react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import VehiclePhotoUpload from '../components/VehiclePhotoUpload';
import { Plus, FileDown, Search, BookOpen, Camera, X } from 'lucide-react';
import type { LivreDePolice } from '../../lib/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function marge(entry: LivreDePolice): number | null {
  if (entry.prixVente == null) return null;
  return entry.prixVente - entry.prixAchat - entry.coutReparations;
}

function hasPhotos(e: LivreDePolice): boolean {
  return !!(e.photoFace ?? e.photoDos ?? e.photoCoteGauche ?? e.photoCoteDroit);
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  marque: string; modele: string; immatriculation: string; vin: string;
  annee: string; couleur: string; kilometrage_achat: string;
  date_achat: string; prix_achat: string;
  vendeur_nom: string; vendeur_identite: string; vendeur_adresse: string;
  mode_reglement_achat: string; cout_reparations: string; notes_reparations: string;
  date_vente: string; prix_vente: string;
  acheteur_nom: string; acheteur_identite: string; acheteur_adresse: string;
  mode_reglement_vente: string;
  photo_face: string | null;
  photo_dos: string | null;
  photo_cote_gauche: string | null;
  photo_cote_droit: string | null;
};

const EMPTY_FORM: FormState = {
  marque: '', modele: '', immatriculation: '', vin: '',
  annee: '', couleur: '', kilometrage_achat: '',
  date_achat: new Date().toISOString().slice(0, 10), prix_achat: '',
  vendeur_nom: '', vendeur_identite: '', vendeur_adresse: '',
  mode_reglement_achat: 'Espèces', cout_reparations: '0', notes_reparations: '',
  date_vente: '', prix_vente: '',
  acheteur_nom: '', acheteur_identite: '', acheteur_adresse: '',
  mode_reglement_vente: '',
  photo_face: null, photo_dos: null, photo_cote_gauche: null, photo_cote_droit: null,
};

const MODES_REGLEMENT = ['Espèces', 'Virement', 'Chèque', 'CB'];

// ─── Component ────────────────────────────────────────────────────────────────

function LivreDePoliceContent() {
  const [entries, setEntries] = useState<LivreDePolice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<LivreDePolice | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [garageId, setGarageId] = useState('');
  // Stable ID used as storage path prefix for new entry photos
  const [photoEntryId, setPhotoEntryId] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch garageId once on mount
  useEffect(() => {
    fetch('/api/garage/me')
      .then((r) => r.json() as Promise<{ garageId: string | null }>)
      .then(({ garageId: gid }) => { if (gid) setGarageId(gid); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/livre-de-police');
      if (!res.ok) throw new Error('Erreur chargement');
      const data = (await res.json()) as LivreDePolice[];
      setEntries(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Live marge ──
  const liveMarge =
    form.prix_vente && form.prix_achat
      ? Number(form.prix_vente) - Number(form.prix_achat) - Number(form.cout_reparations || 0)
      : null;

  // ── Open modal for new entry ──
  const openNew = () => {
    setEditEntry(null);
    setForm(EMPTY_FORM);
    setPhotoEntryId(crypto.randomUUID());
    setModalOpen(true);
  };

  // ── Open modal to edit ──
  const openEdit = (e: LivreDePolice) => {
    setEditEntry(e);
    setPhotoEntryId(e.id);
    setForm({
      marque: e.marque, modele: e.modele, immatriculation: e.immatriculation,
      vin: e.vin ?? '', annee: e.annee != null ? String(e.annee) : '',
      couleur: e.couleur ?? '', kilometrage_achat: e.kilometrageAchat != null ? String(e.kilometrageAchat) : '',
      date_achat: e.dateAchat, prix_achat: String(e.prixAchat),
      vendeur_nom: e.vendeurNom ?? '', vendeur_identite: e.vendeurIdentite ?? '',
      vendeur_adresse: e.vendeurAdresse ?? '',
      mode_reglement_achat: e.modeReglementAchat,
      cout_reparations: String(e.coutReparations), notes_reparations: e.notesReparations ?? '',
      date_vente: e.dateVente ?? '', prix_vente: e.prixVente != null ? String(e.prixVente) : '',
      acheteur_nom: e.acheteurNom ?? '', acheteur_identite: e.acheteurIdentite ?? '',
      acheteur_adresse: e.acheteurAdresse ?? '',
      mode_reglement_vente: e.modeReglementVente ?? '',
      photo_face: e.photoFace, photo_dos: e.photoDos,
      photo_cote_gauche: e.photoCoteGauche, photo_cote_droit: e.photoCoteDroit,
    });
    setModalOpen(true);
  };

  // ── Save ──
  const handleSave = async () => {
    if (!form.marque.trim() || !form.modele.trim() || !form.immatriculation.trim() || !form.date_achat) {
      showToast('Marque, modèle, immatriculation et date achat sont obligatoires', 'error');
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      marque: form.marque.trim(),
      modele: form.modele.trim(),
      immatriculation: form.immatriculation.trim().toUpperCase(),
      vin: form.vin.trim() || null,
      annee: form.annee ? Number(form.annee) : null,
      couleur: form.couleur.trim() || null,
      kilometrage_achat: form.kilometrage_achat ? Number(form.kilometrage_achat) : null,
      date_achat: form.date_achat,
      prix_achat: Number(form.prix_achat) || 0,
      vendeur_nom: form.vendeur_nom.trim() || null,
      vendeur_identite: form.vendeur_identite.trim() || null,
      vendeur_adresse: form.vendeur_adresse.trim() || null,
      mode_reglement_achat: form.mode_reglement_achat,
      cout_reparations: Number(form.cout_reparations) || 0,
      notes_reparations: form.notes_reparations.trim() || null,
      date_vente: form.date_vente || null,
      prix_vente: form.prix_vente ? Number(form.prix_vente) : null,
      acheteur_nom: form.acheteur_nom.trim() || null,
      acheteur_identite: form.acheteur_identite.trim() || null,
      acheteur_adresse: form.acheteur_adresse.trim() || null,
      mode_reglement_vente: form.mode_reglement_vente || null,
      photo_face: form.photo_face,
      photo_dos: form.photo_dos,
      photo_cote_gauche: form.photo_cote_gauche,
      photo_cote_droit: form.photo_cote_droit,
    };

    try {
      let res: Response;
      if (editEntry) {
        res = await fetch('/api/livre-de-police', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editEntry.id, ...payload }),
        });
      } else {
        res = await fetch('/api/livre-de-police', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Erreur serveur');
      }
      const saved = (await res.json()) as LivreDePolice;
      if (editEntry) {
        setEntries((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
        showToast('Entrée mise à jour', 'success');
      } else {
        setEntries((prev) => [saved, ...prev]);
        showToast('Entrée créée', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Export PDF (print) ──
  const handleExport = () => { window.print(); };

  // ── Filter ──
  const q = search.toLowerCase();
  const displayed = q
    ? entries.filter(
        (e) =>
          e.marque.toLowerCase().includes(q) ||
          e.modele.toLowerCase().includes(q) ||
          e.immatriculation.toLowerCase().includes(q),
      )
    : entries;

  const inp = 'w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50 focus:border-[#FF6B2B]/50 transition-all';
  const sel = `${inp} cursor-pointer`;
  const showVente = !editEntry || editEntry.statut === 'en_stock';

  // Photo slots config
  const photoSlots = [
    { key: 'photo_face' as const,        slot: 'face',        label: 'Face avant'  },
    { key: 'photo_dos' as const,         slot: 'dos',         label: 'Face arrière' },
    { key: 'photo_cote_gauche' as const, slot: 'cote_gauche', label: 'Côté gauche' },
    { key: 'photo_cote_droit' as const,  slot: 'cote_droit',  label: 'Côté droit'  },
  ] as const;

  return (
    <PageLayout activePage="livre-de-police">
      {/* Header */}
      <header className="bg-[#1A1D27] border-b border-[#2A2D3A] px-4 md:px-8 py-4 md:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#FF6B2B]" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-semibold text-white">Livre de Police</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FF6B2B]/10 text-[#FF6B2B] border border-[#FF6B2B]/20">
                  {entries.length}
                </span>
              </div>
              <p className="text-sm text-[#8B8FA8] mt-0.5">Registre légal des achats/ventes de véhicules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#2A2D3A] text-white rounded-lg hover:bg-white/5 transition-colors font-medium text-sm"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E55A1F] transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle entrée
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-5 overflow-y-auto">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8FA8] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par marque, modèle, immatriculation…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#1A1D27] border border-[#2A2D3A] rounded-lg text-sm text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50 focus:border-[#FF6B2B]/50 transition-all"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 text-[#8B8FA8] text-sm">
            {search ? 'Aucun résultat pour cette recherche' : 'Aucune entrée dans le registre'}
          </div>
        ) : (
          <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2D3A]">
                    {['N°', 'Date achat', 'Marque Modèle', 'Immat', 'Prix achat', 'Charges', 'Prix vente', 'Marge', 'Photos', 'Statut'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#8B8FA8] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((e) => {
                    const m = marge(e);
                    const photos = hasPhotos(e);
                    return (
                      <tr
                        key={e.id}
                        className="border-b border-[#2A2D3A] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => openEdit(e)}
                      >
                        <td className="px-4 py-3 font-mono text-[#8B8FA8] text-xs">{e.numeroOrdre}</td>
                        <td className="px-4 py-3 text-white whitespace-nowrap">{fmtDate(e.dateAchat)}</td>
                        <td className="px-4 py-3 text-white font-medium">{e.marque} {e.modele}</td>
                        <td className="px-4 py-3 font-mono text-white">{e.immatriculation}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt(e.prixAchat)}</td>
                        <td className="px-4 py-3 text-[#8B8FA8] tabular-nums">{fmt(e.coutReparations)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt(e.prixVente)}</td>
                        <td className={`px-4 py-3 tabular-nums font-semibold ${m == null ? 'text-[#8B8FA8]' : m >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {m == null ? '—' : fmt(m)}
                        </td>
                        <td className="px-4 py-3">
                          <span title={photos ? 'Photos disponibles' : 'Aucune photo'}>
                            <Camera className={`w-4 h-4 ${photos ? 'text-emerald-400' : 'text-[#3A3D4A]'}`} />
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${e.statut === 'en_stock' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#2A2D3A] text-[#8B8FA8] border border-[#3A3D4A]'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${e.statut === 'en_stock' ? 'bg-emerald-500' : 'bg-[#8B8FA8]'}`} />
                            {e.statut === 'en_stock' ? 'En stock' : 'Vendu'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                            className="text-xs text-[#8B8FA8] hover:text-white transition-colors"
                          >
                            Modifier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="text-xs text-[#8B8FA8]">
          <span className="font-semibold text-white">{displayed.length}</span> entrée{displayed.length !== 1 ? 's' : ''} affichée{displayed.length !== 1 ? 's' : ''}
          {' · '}
          <span className="text-emerald-400 font-semibold">{entries.filter((e) => e.statut === 'en_stock').length}</span> en stock
          {' · '}
          <span className="font-semibold">{entries.filter((e) => e.statut === 'vendu').length}</span> vendu{entries.filter((e) => e.statut === 'vendu').length !== 1 ? 's' : ''}
        </div>
      </main>

      {/* ── Entry Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-[#1A1D27] border border-[#2A2D3A] shadow-2xl my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#2A2D3A] px-6 py-4">
              <h3 className="text-base font-semibold text-white">
                {editEntry ? `Modifier l'entrée #${editEntry.numeroOrdre}` : 'Nouvelle entrée'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-8">

              {/* ── SECTION ACHAT ── */}
              <section>
                <h4 className="text-xs font-semibold text-[#FF6B2B] uppercase tracking-wider mb-4">Achat</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Marque *</label>
                    <input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} className={inp} placeholder="Ex: Yamaha" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Modèle *</label>
                    <input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} className={inp} placeholder="Ex: XMAX 300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Immatriculation *</label>
                    <input value={form.immatriculation} onChange={(e) => setForm({ ...form, immatriculation: e.target.value })} className={inp} placeholder="Ex: AB-123-CD" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">VIN</label>
                    <input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className={inp} placeholder="Numéro châssis" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Année</label>
                    <input type="number" min="1900" max="2099" value={form.annee} onChange={(e) => setForm({ ...form, annee: e.target.value })} className={inp} placeholder="Ex: 2021" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Couleur</label>
                    <input value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className={inp} placeholder="Ex: Bleu" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Kilométrage achat</label>
                    <input type="number" min="0" value={form.kilometrage_achat} onChange={(e) => setForm({ ...form, kilometrage_achat: e.target.value })} className={inp} placeholder="Ex: 12500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Date achat *</label>
                    <input type="date" value={form.date_achat} onChange={(e) => setForm({ ...form, date_achat: e.target.value })} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Prix achat (€)</label>
                    <input type="number" min="0" step="0.01" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: e.target.value })} className={inp} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Vendeur — Nom</label>
                    <input value={form.vendeur_nom} onChange={(e) => setForm({ ...form, vendeur_nom: e.target.value })} className={inp} placeholder="Nom complet" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Vendeur — Identité</label>
                    <input value={form.vendeur_identite} onChange={(e) => setForm({ ...form, vendeur_identite: e.target.value })} className={inp} placeholder="N° pièce identité" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Mode règlement</label>
                    <select value={form.mode_reglement_achat} onChange={(e) => setForm({ ...form, mode_reglement_achat: e.target.value })} className={sel}>
                      {MODES_REGLEMENT.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Adresse vendeur</label>
                    <input value={form.vendeur_adresse} onChange={(e) => setForm({ ...form, vendeur_adresse: e.target.value })} className={inp} placeholder="Adresse complète" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Coût réparations (€)</label>
                    <input type="number" min="0" step="0.01" value={form.cout_reparations} onChange={(e) => setForm({ ...form, cout_reparations: e.target.value })} className={inp} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Notes réparations</label>
                    <input value={form.notes_reparations} onChange={(e) => setForm({ ...form, notes_reparations: e.target.value })} className={inp} placeholder="Détail des travaux effectués" />
                  </div>
                </div>
              </section>

              {/* ── SECTION PHOTOS ── */}
              <section>
                <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">
                  État du véhicule — Photos
                </h4>
                {!garageId ? (
                  <p className="text-xs text-[#8B8FA8]">Chargement…</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {photoSlots.map(({ key, slot, label }) => (
                      <VehiclePhotoUpload
                        key={slot}
                        label={label}
                        value={form[key]}
                        onChange={(url) => setForm((prev) => ({ ...prev, [key]: url }))}
                        garageId={garageId}
                        vehicleId={photoEntryId}
                        slot={slot}
                        onLightbox={setLightbox}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* ── SECTION VENTE ── */}
              {showVente && (
                <section>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">Vente</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Date vente</label>
                      <input type="date" value={form.date_vente} onChange={(e) => setForm({ ...form, date_vente: e.target.value })} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Prix vente (€)</label>
                      <input type="number" min="0" step="0.01" value={form.prix_vente} onChange={(e) => setForm({ ...form, prix_vente: e.target.value })} className={inp} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Mode règlement</label>
                      <select value={form.mode_reglement_vente} onChange={(e) => setForm({ ...form, mode_reglement_vente: e.target.value })} className={sel}>
                        <option value="">— Choisir —</option>
                        {MODES_REGLEMENT.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Acheteur — Nom</label>
                      <input value={form.acheteur_nom} onChange={(e) => setForm({ ...form, acheteur_nom: e.target.value })} className={inp} placeholder="Nom complet" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Acheteur — Identité</label>
                      <input value={form.acheteur_identite} onChange={(e) => setForm({ ...form, acheteur_identite: e.target.value })} className={inp} placeholder="N° pièce identité" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Adresse acheteur</label>
                      <input value={form.acheteur_adresse} onChange={(e) => setForm({ ...form, acheteur_adresse: e.target.value })} className={inp} placeholder="Adresse complète" />
                    </div>
                  </div>

                  {liveMarge != null && (
                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold ${liveMarge >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      Marge estimée : {liveMarge >= 0 ? '+' : ''}{liveMarge.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Modal footer */}
            <div className="border-t border-[#2A2D3A] px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#2A2D3A] text-sm font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#FF6B2B] text-white text-sm font-medium hover:bg-[#E55A1F] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-[#8B8FA8] transition-colors z-10"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightbox}
            alt="Photo véhicule"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Toast toast={toast} />
    </PageLayout>
  );
}

export default function LivreDePolicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F1117]" />}>
      <LivreDePoliceContent />
    </Suspense>
  );
}
