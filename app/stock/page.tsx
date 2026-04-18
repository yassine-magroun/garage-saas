'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { Package, Plus, Pencil, Trash2, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { piecesStockAPI } from '../../lib/api';
import { getGarageId } from '../../lib/garage';
import type { Piece } from '../../lib/types';
import { getStockStatus } from '../../lib/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

const CATEGORIES = ['Autre', 'Moteur', 'Freinage', 'Transmission', 'Électricité', 'Carrosserie', 'Pneumatiques', 'Filtres', 'Lubrifiants', 'Accessoires'];

// ─── Stock badge ─────────────────────────────────────────────────────────────

function StockBadge({ piece }: { piece: Piece }) {
  const status = getStockStatus(piece);
  if (status === 'rupture') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
      <XCircle className="w-3 h-3" /> Rupture
    </span>
  );
  if (status === 'alerte') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <AlertTriangle className="w-3 h-3" /> Alerte
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle className="w-3 h-3" /> OK
    </span>
  );
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = {
  name: '',
  reference: '',
  category: 'Autre',
  stockQuantity: '0',
  stockMin: '0',
  priceAchatHt: '0',
  priceVenteHt: '0',
  fournisseur: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StockPage() {
  const [garageId, setGarageId] = useState('');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const gid = await getGarageId();
        setGarageId(gid);
        const list = await piecesStockAPI.getAll(gid);
        setPieces(list);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erreur chargement', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (piece: Piece) => {
    setEditingId(piece.id);
    setForm({
      name: piece.name,
      reference: piece.reference ?? '',
      category: piece.category,
      stockQuantity: String(piece.stockQuantity),
      stockMin: String(piece.stockMin),
      priceAchatHt: String(piece.priceAchatHt),
      priceVenteHt: String(piece.priceVenteHt),
      fournisseur: piece.fournisseur ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Nom obligatoire', 'error'); return; }
    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        reference: form.reference.trim() || null,
        category: form.category,
        stockQuantity: Number(form.stockQuantity),
        stockMin: Number(form.stockMin),
        priceAchatHt: Number(form.priceAchatHt),
        priceVenteHt: Number(form.priceVenteHt),
        fournisseur: form.fournisseur.trim() || null,
      };
      if (editingId) {
        const updated = await piecesStockAPI.update(editingId, garageId, payload);
        setPieces((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        showToast('Pièce mise à jour', 'success');
      } else {
        const created = await piecesStockAPI.create(garageId, payload);
        setPieces((prev) => [created, ...prev]);
        showToast('Pièce ajoutée', 'success');
      }
      setShowForm(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (piece: Piece) => {
    if (!confirm(`Supprimer "${piece.name}" ?`)) return;
    try {
      await piecesStockAPI.delete(piece.id, garageId);
      setPieces((prev) => prev.filter((p) => p.id !== piece.id));
      showToast('Pièce supprimée', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur suppression', 'error');
    }
  };

  // Stats
  const ruptures = pieces.filter((p) => getStockStatus(p) === 'rupture').length;
  const alertes = pieces.filter((p) => getStockStatus(p) === 'alerte').length;

  // Filter
  const categories = ['all', ...Array.from(new Set(pieces.map((p) => p.category))).sort()];
  const filtered = pieces
    .filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
    .filter((p) =>
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.reference ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.fournisseur ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const inputCls = 'border border-[#2A2D3A] rounded-xl px-4 py-2.5 bg-[#0F1117] text-white placeholder-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50 w-full';

  return (
    <AuthGuard>
      <PageLayout activePage="stock">
        <Toast toast={toast} />

        <header className="bg-[#1A1D27] border-b border-[#2A2D3A] px-4 md:px-8 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-[#FF6B2B]" />
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Stock & Pièces</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E55A1F] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter une pièce</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </header>

        <main className="p-4 md:p-8 space-y-6 overflow-y-auto">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-4">
              <p className="text-xs text-[#8B8FA8] mb-1">Total références</p>
              <p className="text-2xl font-bold text-white">{pieces.length}</p>
            </div>
            <div className="bg-[#1A1D27] rounded-xl border border-amber-500/20 p-4">
              <p className="text-xs text-[#8B8FA8] mb-1">Alertes stock</p>
              <p className="text-2xl font-bold text-amber-400">{alertes}</p>
            </div>
            <div className="bg-[#1A1D27] rounded-xl border border-red-500/20 p-4">
              <p className="text-xs text-[#8B8FA8] mb-1">Ruptures</p>
              <p className="text-2xl font-bold text-red-400">{ruptures}</p>
            </div>
          </div>

          {/* Alert banner */}
          {(ruptures > 0 || alertes > 0) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">
                {ruptures > 0 && <><strong>{ruptures} pièce{ruptures > 1 ? 's' : ''} en rupture</strong>{alertes > 0 ? ' · ' : ''}</>}
                {alertes > 0 && <><strong>{alertes} pièce{alertes > 1 ? 's' : ''} en alerte</strong></>}
                {' '}— pensez à réapprovisionner.
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Rechercher une pièce, référence, fournisseur…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border border-[#2A2D3A] rounded-xl px-4 py-2.5 bg-[#0F1117] text-white placeholder-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-[#2A2D3A] rounded-xl px-4 py-2.5 bg-[#0F1117] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'Toutes catégories' : c}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-[#8B8FA8]">Chargement…</div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucune pièce trouvée"
                description="Ajoutez des pièces à votre stock pour les retrouver ici."
                compact
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2A2D3A]">
                      {['Pièce', 'Catégorie', 'Stock', 'Prix achat HT', 'Prix vente HT', 'Fournisseur', 'Statut', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#8B8FA8] uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((piece, idx) => (
                      <tr
                        key={piece.id}
                        className={`border-b border-[#2A2D3A] last:border-0 hover:bg-white/[0.02] transition-colors ${
                          getStockStatus(piece) === 'rupture'
                            ? 'bg-red-500/[0.03]'
                            : getStockStatus(piece) === 'alerte'
                            ? 'bg-amber-500/[0.03]'
                            : idx % 2 === 1
                            ? 'bg-white/[0.01]'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{piece.name}</p>
                          {piece.reference && (
                            <p className="text-xs text-[#8B8FA8] font-mono">{piece.reference}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#8B8FA8] whitespace-nowrap">{piece.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-semibold text-white">{piece.stockQuantity}</span>
                          {piece.stockMin > 0 && (
                            <span className="text-xs text-[#8B8FA8] ml-1">/ min {piece.stockMin}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#8B8FA8] whitespace-nowrap">{fmtPrice(piece.priceAchatHt)}</td>
                        <td className="px-4 py-3 font-medium text-[#FF6B2B] whitespace-nowrap">{fmtPrice(piece.priceVenteHt)}</td>
                        <td className="px-4 py-3 text-[#8B8FA8] whitespace-nowrap">{piece.fournisseur ?? '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><StockBadge piece={piece} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openEdit(piece)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[#8B8FA8] hover:text-white transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => void handleDelete(piece)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#8B8FA8] hover:text-red-400 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* ── Add/Edit modal ── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-[#2A2D3A]">
                <h2 className="text-lg font-bold text-white">
                  {editingId ? 'Modifier la pièce' : 'Ajouter une pièce'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/5 text-[#8B8FA8] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B8FA8] mb-1">Nom *</label>
                    <input
                      type="text"
                      placeholder="Plaquettes de frein"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8B8FA8] mb-1">Référence</label>
                    <input
                      type="text"
                      placeholder="REF-001"
                      value={form.reference}
                      onChange={(e) => setForm({ ...form, reference: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B8FA8] mb-1">Catégorie</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className={inputCls}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#8B8FA8] mb-1">Fournisseur</label>
                    <input
                      type="text"
                      placeholder="Nom du fournisseur"
                      value={form.fournisseur}
                      onChange={(e) => setForm({ ...form, fournisseur: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B8FA8] mb-1">Quantité en stock</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.stockQuantity}
                      onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8B8FA8] mb-1">Seuil d'alerte (min)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.stockMin}
                      onChange={(e) => setForm({ ...form, stockMin: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B8FA8] mb-1">Prix achat HT (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.priceAchatHt}
                      onChange={(e) => setForm({ ...form, priceAchatHt: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8B8FA8] mb-1">Prix vente HT (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.priceVenteHt}
                      onChange={(e) => setForm({ ...form, priceVenteHt: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2.5 border border-[#2A2D3A] rounded-xl text-sm text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 bg-[#FF6B2B] rounded-xl text-sm font-medium text-white hover:bg-[#E55A1F] disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </AuthGuard>
  );
}
