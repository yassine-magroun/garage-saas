'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { Euro, Clock, CreditCard, X, FileDown, Mail, Copy } from 'lucide-react';
import { getFacturesList, getFactureWithPayments, addPayment, duplicateFacture } from '../../lib/api';
import { getGarageId } from '../../lib/garage';
import type { Facture, FactureStatus, Payment, PaymentMethod } from '../../lib/types';

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const gid = await getGarageId();
        setGarageId(gid);
        const list = await getFacturesList(gid);
        setFactures(list);
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
      showToast(`Paiement de ${payment.amount.toFixed(2)} € enregistré`, 'success');
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

  const filtered = filter === 'all' ? factures : factures.filter((f) => f.status === filter);

  const caTotal = factures.filter((f) => f.status === 'paid').reduce((s, f) => s + f.totalTtc, 0);
  const pendingCount = factures.filter((f) => f.status === 'unpaid' || f.status === 'partial').length;
  const pendingAmount = factures
    .filter((f) => f.status === 'unpaid' || f.status === 'partial')
    .reduce((s, f) => s + (f.totalTtc - f.amountPaid), 0);

  return (
    <AuthGuard>
      <PageLayout activePage="factures">
        <header className="bg-[#1A1D27] border-b border-[#2A2D3A] px-4 md:px-8 py-4 md:py-5">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Factures</h1>
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

          <div className="grid gap-6 lg:grid-cols-2">
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

            {/* Selected facture detail */}
            {selectedFacture && (
              <div className="bg-[#1A1D27] p-6 rounded-xl border border-[#2A2D3A] space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedFacture.displayRef ?? selectedFacture.id.slice(0, 8).toUpperCase()} — {selectedFacture.clientName ?? selectedFacture.clientId.slice(0, 8)}
                    </h3>
                    <p className="text-xs text-[#8B8FA8]">
                      {new Date(selectedFacture.createdAt).toLocaleDateString('fr-FR')}
                      {selectedFacture.dueDate &&
                        ` · Échéance: ${new Date(selectedFacture.dueDate).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[selectedFacture.status]}`}>
                    {STATUS_LABELS[selectedFacture.status]}
                  </span>
                </div>

                {selectedFacture.items && selectedFacture.items.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#8B8FA8] uppercase tracking-wide">Lignes</p>
                    {selectedFacture.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm p-2 bg-[#0F1117] rounded-lg">
                        <span className="text-white">{item.description}</span>
                        <span className="text-[#C4C7D4] ml-4 whitespace-nowrap">
                          {item.quantity} × {item.unitPriceHt.toFixed(2)} € = {item.totalHt.toFixed(2)} € HT
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-6 text-sm font-medium pt-2 border-t border-[#2A2D3A]">
                  <span className="text-[#C4C7D4]">HT: {selectedFacture.totalHt.toFixed(2)} €</span>
                  <span className="text-[#C4C7D4]">TVA {selectedFacture.tvaRate}%</span>
                  <span className="font-bold text-white">TTC: {selectedFacture.totalTtc.toFixed(2)} €</span>
                </div>

                {selectedFacture.payments && selectedFacture.payments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#8B8FA8] uppercase tracking-wide">Paiements</p>
                    {selectedFacture.payments.map((payment: Payment) => (
                      <div
                        key={payment.id}
                        className="flex justify-between items-center text-sm p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                      >
                        <span className="text-emerald-400">
                          {METHOD_LABELS[payment.method]} ·{' '}
                          {new Date(payment.paidAt).toLocaleDateString('fr-FR')}
                          {payment.notes && ` · ${payment.notes}`}
                        </span>
                        <span className="font-semibold text-emerald-400">
                          +{payment.amount.toFixed(2)} €
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-end text-sm text-[#8B8FA8]">
                      Reste dû:{' '}
                      <strong className="ml-1 text-white">
                        {Math.max(0, selectedFacture.totalTtc - selectedFacture.amountPaid).toFixed(2)} €
                      </strong>
                    </div>
                  </div>
                )}

                {/* Action buttons in detail panel */}
                <div className="flex gap-2 pt-2 border-t border-[#2A2D3A]">
                  <button
                    onClick={() => handleDownloadPdf(selectedFacture)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2D3A] text-xs font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Télécharger PDF
                  </button>
                  <button
                    onClick={() => handleOpenEmailModal(selectedFacture)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#FF6B2B]/30 text-xs font-medium text-[#FF6B2B] hover:bg-[#FF6B2B]/10 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Envoyer par email
                  </button>
                </div>

                {(selectedFacture.status === 'unpaid' || selectedFacture.status === 'partial') && (
                  <button
                    onClick={() => setPaymentModal(true)}
                    className="w-full px-4 py-3 bg-[#FF6B2B] text-white rounded-xl text-sm font-medium hover:bg-[#E55A1F] transition-colors"
                  >
                    Enregistrer un paiement
                  </button>
                )}
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
      <Toast toast={toast} />
    </AuthGuard>
  );
}
