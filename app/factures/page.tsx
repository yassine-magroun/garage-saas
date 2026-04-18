'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import PageLayout from '../components/PageLayout';
import { toast } from 'sonner';
import { Euro, Clock, CreditCard, X, FileDown, Mail, Copy, Plus, Package, Trash2, Shield, Ban, CheckCircle2, History } from 'lucide-react';
import { getFacturesList, getFactureWithPayments, addPayment, duplicateFacture, createFactureDirect, piecesStockAPI, clientsAPI } from '../../lib/api';
import { getGarageId } from '../../lib/garage';
import { FLAGS } from '../../lib/feature-flags';
import type { Facture, FactureStatus, Payment, PaymentMethod, Piece, Client } from '../../lib/types';

const STATUS_LABELS: Record<FactureStatus, string> = {
  unpaid: 'Non payée',
  partial: 'Partielle',
  paid: 'Payée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<FactureStatus, string> = {
  unpaid: 'bg-red-500/10 text-red-400 border-red-500/20',
  partial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-[#2A2D3A] text-[#8B8FA8] border-[#3A3D4A]',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  card: 'Carte',
  transfer: 'Virement',
  check: 'Chèque',
};

export default function FacturesPage() {
  const [garageId, setGarageId] = useState('');
  const [factures, setFactures] = useState<Facture[]>([]);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Payment modal
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    amount: string;
    method: PaymentMethod;
    notes: string;
  }>({ amount: '', method: 'cash', notes: '' });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Email modal
  const [emailModal, setEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState<Facture | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [filter, setFilter] = useState<FactureStatus | 'all'>('all');
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Nouvelle facture directe
  const [clients, setClients] = useState<Client[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ clientId: '', tvaRate: '20', dueDate: '', notes: '' });
  const [newItems, setNewItems] = useState<Array<{ description: string; quantity: number; unitPriceHt: number; pieceId?: string }>>([]);
  const [newItemForm, setNewItemForm] = useState({ description: '', quantity: '1', unitPriceHt: '0' });
  const [showPiecePicker, setShowPiecePicker] = useState(false);
  const [pieceSearch, setPieceSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(message); else toast.error(message);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const gid = await getGarageId();
        setGarageId(gid);
        const [list, cls, pcs] = await Promise.all([
          getFacturesList(gid),
          clientsAPI.getAll().catch(() => [] as Client[]),
          piecesStockAPI.getAll(gid).catch(() => [] as Piece[]),
        ]);
        setFactures(list);
        setClients(cls);
        setPieces(pcs);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erreur chargement factures', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const handleSelectFacture = async (facture: Facture) => {
    setSelectedFacture(facture);
    try {
      const full = await getFactureWithPayments(facture.id, garageId);
      setSelectedFacture(full);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur chargement détail', 'error');
    }
  };

  const handleAddPayment = async () => {
    if (!selectedFacture) return;
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) {
      showToast('Montant invalide', 'error');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      const payment = await addPayment(
        selectedFacture.id,
        garageId,
        amount,
        paymentForm.method,
        paymentForm.notes || undefined,
      );
      const updated = await getFactureWithPayments(selectedFacture.id, garageId);
      setSelectedFacture(updated);
      setFactures((prev) =>
        prev.map((f) => (f.id === updated.id ? { ...f, status: updated.status, amountPaid: updated.amountPaid } : f)),
      );
      setPaymentModal(false);
      setPaymentForm({ amount: '', method: 'cash', notes: '' });

      if (updated.status === 'paid') {
        fetch('/api/factures/trigger-paid-automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facture_id: selectedFacture.id }),
        }).catch(() => { /* silent — automation failure must not block UI */ });
        showToast(`Paiement de ${payment.amount.toFixed(2)} € enregistré`, 'success');
      } else {
        showToast(`Paiement de ${payment.amount.toFixed(2)} € enregistré`, 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur ajout paiement', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDownloadPdf = (facture: Facture) => {
    window.open(`/api/invoice/pdf?factureId=${facture.id}&garageId=${garageId}`, '_blank');
  };

  const handleOpenEmailModal = (facture: Facture) => {
    setEmailTarget(facture);
    setEmailAddress('');
    setEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailTarget || !emailAddress.trim()) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/invoice/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factureId: emailTarget.id,
          garageId,
          clientEmail: emailAddress.trim(),
          clientName: emailTarget.clientName ?? '',
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Erreur envoi');
      }
      setEmailModal(false);
      showToast('Email envoyé avec succès !', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur envoi email', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDuplicate = async (facture: Facture) => {
    setIsDuplicating(true);
    try {
      const copy = await duplicateFacture(facture.id, garageId);
      setFactures((prev) => [copy, ...prev]);
      showToast(`Facture dupliquée → ${copy.displayRef ?? copy.id.slice(0, 8)}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur duplication', 'error');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleCancelFacture = async (facture: Facture) => {
    if (!confirm(`Annuler la facture ${facture.displayRef ?? facture.id.slice(0, 8)} ?`)) return;
    try {
      const { supabase } = await import('../../lib/supabase');
      await supabase.from('factures').update({ status: 'cancelled' }).eq('id', facture.id).eq('garage_id', garageId);
      setFactures(prev => prev.map(f => f.id === facture.id ? { ...f, status: 'cancelled' as FactureStatus } : f));
      if (selectedFacture?.id === facture.id) setSelectedFacture(f => f ? { ...f, status: 'cancelled' as FactureStatus } : f);
      showToast('Facture annulée', 'success');
    } catch {
      showToast('Erreur lors de l\'annulation', 'error');
    }
  };

  const handleAddNewItem = () => {
    const qty = Number(newItemForm.quantity);
    const price = Number(newItemForm.unitPriceHt);
    if (!newItemForm.description.trim() || qty <= 0) return;
    setNewItems((prev) => [...prev, { description: newItemForm.description.trim(), quantity: qty, unitPriceHt: price }]);
    setNewItemForm({ description: '', quantity: '1', unitPriceHt: '0' });
  };

  const addPieceToNew = (p: Piece) => {
    setNewItems((prev) => [...prev, {
      description: p.reference ? `${p.name} (${p.reference})` : p.name,
      quantity: 1,
      unitPriceHt: p.priceVenteHt,
      pieceId: p.id,
    }]);
    setShowPiecePicker(false);
    setPieceSearch('');
  };

  const filteredPieces = pieces.filter((p) =>
    !pieceSearch ||
    p.name.toLowerCase().includes(pieceSearch.toLowerCase()) ||
    (p.reference ?? '').toLowerCase().includes(pieceSearch.toLowerCase()),
  );

  const handleCreateFactureDirect = async () => {
    if (!newForm.clientId) { showToast('Sélectionnez un client', 'error'); return; }
    if (newItems.length === 0) { showToast('Ajoutez au moins une ligne', 'error'); return; }
    setIsCreating(true);
    try {
      const created = await createFactureDirect(garageId, newForm.clientId, newItems, {
        tvaRate: Number(newForm.tvaRate) || 20,
        dueDate: newForm.dueDate || undefined,
        notes: newForm.notes || undefined,
      });
      setFactures((prev) => [created, ...prev]);
      setNewForm({ clientId: '', tvaRate: '20', dueDate: '', notes: '' });
      setNewItems([]);
      setShowNewForm(false);
      showToast(`Facture créée : ${created.displayRef ?? created.id.slice(0, 8)}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur création', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = filter === 'all' ? factures : factures.filter((f) => f.status === filter);

  const caTotal = factures.filter((f) => f.status === 'paid').reduce((s, f) => s + f.totalTtc, 0);
  const pendingCount = factures.filter((f) => f.status === 'unpaid' || f.status === 'partial').length;
  const pendingAmount = factures
    .filter((f) => f.status === 'unpaid' || f.status === 'partial')
    .reduce((s, f) => s + (f.totalTtc - f.amountPaid), 0);

  return (
    <AuthGuard>
      <PageLayout activePage="factures">
        <header className="bg-[#1A1D27] border-b border-[#2A2D3A] px-4 md:px-8 py-4 md:py-5 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Factures</h1>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E55A1F] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle facture</span>
          </button>
        </header>

        <main className="p-4 md:p-8 space-y-6 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1A1D27] p-5 rounded-xl border border-[#2A2D3A]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/15 rounded-lg">
                  <Euro className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-[#8B8FA8]">CA encaissé</p>
                  <p className="text-xl font-bold text-emerald-400">{caTotal.toFixed(2)} €</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1A1D27] p-5 rounded-xl border border-[#2A2D3A]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/15 rounded-lg">
                  <Clock className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-[#8B8FA8]">En attente</p>
                  <p className="text-xl font-bold text-red-400">
                    {pendingCount} · {pendingAmount.toFixed(2)} €
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#1A1D27] p-5 rounded-xl border border-[#2A2D3A]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/15 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-[#8B8FA8]">Total factures</p>
                  <p className="text-xl font-bold text-white">{factures.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Nouvelle facture directe ── */}
          {showNewForm && (
            <div className="bg-[#1A1D27] border border-[#FF6B2B]/30 rounded-xl p-5 space-y-4">
              <h2 className="text-base font-bold text-white">Nouvelle facture directe</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newForm.clientId}
                  onChange={(e) => setNewForm({ ...newForm, clientId: e.target.value })}
                  className="border border-[#2A2D3A] rounded-xl px-4 py-2.5 bg-[#0F1117] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs text-[#8B8FA8] whitespace-nowrap">TVA %</label>
                    <input type="number" min="0" max="100" value={newForm.tvaRate} onChange={(e) => setNewForm({ ...newForm, tvaRate: e.target.value })}
                      className="w-20 border border-[#2A2D3A] rounded-xl px-3 py-2.5 bg-[#0F1117] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50" />
                  </div>
                  <input type="date" value={newForm.dueDate} onChange={(e) => setNewForm({ ...newForm, dueDate: e.target.value })}
                    className="flex-1 border border-[#2A2D3A] rounded-xl px-3 py-2.5 bg-[#0F1117] text-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50" />
                </div>
              </div>

              {/* Stock picker */}
              {pieces.length > 0 && (
                <div className="relative">
                  <button type="button" onClick={() => setShowPiecePicker((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#2A2D3A] rounded-xl text-sm text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors">
                    <Package className="w-4 h-4 text-amber-400" />Ajouter depuis le stock…
                  </button>
                  {showPiecePicker && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-2 border-b border-[#2A2D3A]">
                        <input autoFocus type="text" placeholder="Rechercher…" value={pieceSearch} onChange={(e) => setPieceSearch(e.target.value)}
                          className="w-full bg-[#0F1117] border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B8FA8] focus:outline-none" />
                      </div>
                      <ul className="max-h-40 overflow-y-auto">
                        {filteredPieces.length === 0 ? (
                          <li className="px-4 py-3 text-sm text-[#8B8FA8]">Aucune pièce</li>
                        ) : filteredPieces.map((p) => (
                          <li key={p.id}>
                            <button type="button" onClick={() => addPieceToNew(p)}
                              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5">
                              <div>
                                <p className="text-sm text-white">{p.name}</p>
                                {p.reference && <p className="text-xs text-[#8B8FA8] font-mono">{p.reference}</p>}
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm font-semibold text-[#FF6B2B]">{p.priceVenteHt.toFixed(2)} €</p>
                                <p className="text-xs text-[#8B8FA8]">Stock : {p.stockQuantity}</p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Manual line */}
              <div className="border border-[#2A2D3A] rounded-xl p-3 bg-[#0F1117] space-y-2">
                <p className="text-xs text-[#8B8FA8]">Ligne manuelle</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Description" value={newItemForm.description} onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                    className="flex-1 border border-[#2A2D3A] rounded-lg px-3 py-2 bg-[#1A1D27] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50" />
                  <input type="number" min="1" value={newItemForm.quantity} onChange={(e) => setNewItemForm({ ...newItemForm, quantity: e.target.value })}
                    className="w-16 border border-[#2A2D3A] rounded-lg px-2 py-2 bg-[#1A1D27] text-white text-sm focus:outline-none" placeholder="Qté" />
                  <input type="number" min="0" step="0.01" value={newItemForm.unitPriceHt} onChange={(e) => setNewItemForm({ ...newItemForm, unitPriceHt: e.target.value })}
                    className="w-24 border border-[#2A2D3A] rounded-lg px-2 py-2 bg-[#1A1D27] text-white text-sm focus:outline-none" placeholder="PU HT" />
                  <button type="button" onClick={handleAddNewItem}
                    className="px-3 py-2 bg-[#FF6B2B]/20 text-[#FF6B2B] rounded-lg text-sm hover:bg-[#FF6B2B]/30 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items list */}
              {newItems.length > 0 && (
                <div className="space-y-1.5">
                  {newItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-[#0F1117] rounded-lg px-3 py-2">
                      <span className="text-white flex-1 truncate">{item.description}</span>
                      <span className="text-[#8B8FA8] mx-3 whitespace-nowrap">{item.quantity} × {item.unitPriceHt.toFixed(2)} €</span>
                      <button onClick={() => setNewItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-[#8B8FA8] hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="text-right text-sm font-semibold text-[#FF6B2B] pr-1">
                    Total TTC : {(newItems.reduce((s, i) => s + i.quantity * i.unitPriceHt, 0) * (1 + (Number(newForm.tvaRate) || 20) / 100)).toFixed(2)} €
                  </div>
                </div>
              )}

              <textarea placeholder="Notes (optionnel)" value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                rows={2}
                className="w-full border border-[#2A2D3A] rounded-xl px-4 py-2.5 bg-[#0F1117] text-white placeholder-[#8B8FA8] text-sm focus:outline-none resize-none" />

              <div className="flex gap-3">
                <button onClick={() => { setShowNewForm(false); setNewItems([]); }}
                  className="flex-1 px-4 py-2.5 border border-[#2A2D3A] rounded-xl text-sm text-[#8B8FA8] hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button onClick={() => void handleCreateFactureDirect()} disabled={isCreating}
                  className="flex-1 px-4 py-2.5 bg-[#FF6B2B] text-white rounded-xl text-sm font-medium hover:bg-[#E55A1F] disabled:opacity-50 transition-colors">
                  {isCreating ? 'Création…' : 'Créer la facture'}
                </button>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-[#2A2D3A]">
            {(['all', 'unpaid', 'partial', 'paid', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  filter === s
                    ? 'text-[#FF6B2B] border-[#FF6B2B]'
                    : 'text-[#8B8FA8] border-transparent hover:text-white'
                }`}
              >
                {s === 'all' ? 'Toutes' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[3fr_2fr] items-start">
            {/* Facture list */}
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-[#8B8FA8]">Chargement...</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-[#8B8FA8]">Aucune facture</p>
              ) : (
                filtered.map((facture) => (
                  <div
                    key={facture.id}
                    className={`rounded-xl border transition-all ${
                      selectedFacture?.id === facture.id
                        ? 'border-[#FF6B2B] bg-[#FF6B2B]/10'
                        : 'border-[#2A2D3A] bg-[#1A1D27] hover:border-[#3A3D4A]'
                    }`}
                  >
                    {/* Main clickable area */}
                    <button
                      onClick={() => void handleSelectFacture(facture)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-mono text-[#FF6B2B] mb-0.5">
                            {facture.displayRef ?? facture.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {facture.clientName ?? facture.clientId.slice(0, 8)}
                          </p>
                          <p className="text-xs text-[#8B8FA8]">
                            {new Date(facture.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[facture.status]}`}>
                          {STATUS_LABELS[facture.status]}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#C4C7D4]">
                          Total: <strong className="text-white">{facture.totalTtc.toFixed(2)} €</strong>
                        </span>
                        {facture.amountPaid > 0 && (
                          <span className="text-emerald-400">
                            Payé: {facture.amountPaid.toFixed(2)} €
                          </span>
                        )}
                      </div>
                    </button>

                    {/* PDF + Email + Duplicate actions */}
                    <div className="flex gap-2 px-4 pb-3">
                      <button
                        onClick={() => handleDownloadPdf(facture)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2D3A] text-xs font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
                        title="Télécharger PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        PDF
                      </button>
                      <button
                        onClick={() => handleOpenEmailModal(facture)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2D3A] text-xs font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
                        title="Envoyer par email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </button>
                      <button
                        onClick={() => void handleDuplicate(facture)}
                        disabled={isDuplicating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2D3A] text-xs font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                        title="Dupliquer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Dupliquer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sticky actions panel */}
            {selectedFacture ? (
              <div className="sticky top-4 bg-[#1A1D27] rounded-xl border border-[#2A2D3A] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-[#2A2D3A]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-[#FF6B2B] mb-0.5">
                        {selectedFacture.displayRef ?? selectedFacture.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {selectedFacture.clientName ?? selectedFacture.clientId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-[#8B8FA8] mt-0.5">
                        {new Date(selectedFacture.createdAt).toLocaleDateString('fr-FR')}
                        {selectedFacture.dueDate && ` · Éch. ${new Date(selectedFacture.dueDate).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[selectedFacture.status]}`}>
                      {STATUS_LABELS[selectedFacture.status]}
                    </span>
                  </div>
                </div>

                {/* Line items */}
                {selectedFacture.items && selectedFacture.items.length > 0 && (
                  <div className="p-4 border-b border-[#2A2D3A] space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedFacture.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs gap-3 py-1">
                        <span className="text-white truncate flex-1">{item.description}</span>
                        <span className="text-[#8B8FA8] whitespace-nowrap flex-shrink-0">
                          {item.quantity} × {item.unitPriceHt.toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Financial summary */}
                <div className="px-4 py-3 bg-[#0F1117]/60 border-b border-[#2A2D3A]">
                  <div className="flex justify-between text-xs text-[#8B8FA8] mb-1">
                    <span>HT</span><span>{selectedFacture.totalHt.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#8B8FA8] mb-2">
                    <span>TVA {selectedFacture.tvaRate}%</span>
                    <span>{(selectedFacture.totalTtc - selectedFacture.totalHt).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white border-t border-[#2A2D3A] pt-2">
                    <span>Total TTC</span><span>{selectedFacture.totalTtc.toFixed(2)} €</span>
                  </div>
                  {selectedFacture.amountPaid > 0 && (
                    <div className="flex justify-between text-xs text-emerald-400 mt-1">
                      <span>Payé</span><span>−{selectedFacture.amountPaid.toFixed(2)} €</span>
                    </div>
                  )}
                  {(selectedFacture.status === 'unpaid' || selectedFacture.status === 'partial') && (
                    <div className="flex justify-between text-sm font-semibold text-amber-400 mt-1">
                      <span>Reste dû</span>
                      <span>{Math.max(0, selectedFacture.totalTtc - selectedFacture.amountPaid).toFixed(2)} €</span>
                    </div>
                  )}
                </div>

                {/* Payment timeline */}
                {selectedFacture.payments && selectedFacture.payments.length > 0 && (
                  <div className="p-4 border-b border-[#2A2D3A]">
                    <p className="text-[10px] font-semibold text-[#8B8FA8]/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <History className="w-3 h-3" /> Historique
                    </p>
                    <div className="space-y-1.5">
                      {selectedFacture.payments.map((payment: Payment) => (
                        <div key={payment.id} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span className="text-[#8B8FA8]">
                              {METHOD_LABELS[payment.method]} · {new Date(payment.paidAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <span className="font-semibold text-emerald-400">+{payment.amount.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary action */}
                <div className="p-4 space-y-2">
                  {(selectedFacture.status === 'unpaid' || selectedFacture.status === 'partial') && (
                    <button
                      onClick={() => setPaymentModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B2B] text-white rounded-xl text-sm font-semibold hover:bg-[#E55A1F] transition-colors shadow-[0_0_16px_rgba(255,107,43,0.25)]"
                    >
                      <Euro className="w-4 h-4" />
                      Marquer payée
                    </button>
                  )}

                  {/* Secondary actions grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownloadPdf(selectedFacture)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2D3A] text-xs font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <FileDown className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => handleOpenEmailModal(selectedFacture)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2D3A] text-xs font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                    {FLAGS.FACTUR_X_ENABLED && (
                      <button
                        onClick={() => window.open(`/api/factures/${selectedFacture.id}/pdf`, '_blank')}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/30 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" /> Factur-X
                      </button>
                    )}
                    <button
                      onClick={() => void handleDuplicate(selectedFacture)}
                      disabled={isDuplicating}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2D3A] text-xs font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Copy className="w-3.5 h-3.5" /> Dupliquer
                    </button>
                  </div>

                  {selectedFacture.status !== 'cancelled' && selectedFacture.status !== 'paid' && (
                    <button
                      onClick={() => void handleCancelFacture(selectedFacture)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/20 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" /> Annuler la facture
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="sticky top-4 bg-[#1A1D27] rounded-xl border border-[#2A2D3A] border-dashed p-8 flex flex-col items-center justify-center text-center gap-2">
                <FileDown className="w-8 h-8 text-[#2A2D3A]" />
                <p className="text-xs text-[#8B8FA8]">Sélectionnez une facture pour voir les détails</p>
              </div>
            )}
          </div>
        </main>

        {/* Payment modal */}
        {paymentModal && selectedFacture && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Enregistrer un paiement</h3>
                <button
                  onClick={() => setPaymentModal(false)}
                  className="text-[#8B8FA8] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Montant (€)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={`Max: ${(selectedFacture.totalTtc - selectedFacture.amountPaid).toFixed(2)} €`}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full border border-[#2A2D3A] rounded-xl px-4 py-3 bg-[#0F1117] text-white placeholder-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Mode de paiement</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })}
                    className="w-full border border-[#2A2D3A] rounded-xl px-4 py-3 bg-[#0F1117] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
                  >
                    {(Object.entries(METHOD_LABELS) as [PaymentMethod, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Notes (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Référence, commentaire..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full border border-[#2A2D3A] rounded-xl px-4 py-3 bg-[#0F1117] text-white placeholder-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPaymentModal(false)}
                  className="flex-1 px-4 py-3 border border-[#2A2D3A] rounded-xl text-sm font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => void handleAddPayment()}
                  disabled={isSubmittingPayment || !paymentForm.amount}
                  className="flex-1 px-4 py-3 bg-[#FF6B2B] text-white rounded-xl text-sm font-medium hover:bg-[#E55A1F] disabled:opacity-50 transition-colors"
                >
                  {isSubmittingPayment ? 'Enregistrement...' : 'Valider'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email modal */}
        {emailModal && emailTarget && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Envoyer par email</h3>
                  <p className="text-xs text-[#8B8FA8] mt-0.5">
                    Facture de {emailTarget.clientName ?? emailTarget.clientId.slice(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => setEmailModal(false)}
                  className="text-[#8B8FA8] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">
                  Adresse email du client
                </label>
                <input
                  type="email"
                  placeholder="client@exemple.fr"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full border border-[#2A2D3A] rounded-xl px-4 py-3 bg-[#0F1117] text-white placeholder-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEmailModal(false)}
                  className="flex-1 px-4 py-3 border border-[#2A2D3A] rounded-xl text-sm font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => void handleSendEmail()}
                  disabled={isSendingEmail || !emailAddress.trim()}
                  className="flex-1 px-4 py-3 bg-[#FF6B2B] text-white rounded-xl text-sm font-medium hover:bg-[#E55A1F] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {isSendingEmail ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </AuthGuard>
  );
}
