'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '../components/AuthGuard';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { ArrowLeft, Euro, Clock, CreditCard, X } from 'lucide-react';
import { getFacturesList, getFactureWithPayments, addPayment } from '../../lib/api';
import { getGarageId } from '../../lib/garage';
import type { Facture, FactureStatus, Payment, PaymentMethod } from '../../lib/types';

const STATUS_LABELS: Record<FactureStatus, string> = {
  unpaid: 'Non payée',
  partial: 'Partielle',
  paid: 'Payée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<FactureStatus, string> = {
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
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

  // Filter
  const [filter, setFilter] = useState<FactureStatus | 'all'>('all');

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

      // Refresh the facture
      const updated = await getFactureWithPayments(selectedFacture.id, garageId);
      setSelectedFacture(updated);
      setFactures((prev) => prev.map((f) => (f.id === updated.id ? { ...f, status: updated.status, amountPaid: updated.amountPaid } : f)));

      setPaymentModal(false);
      setPaymentForm({ amount: '', method: 'cash', notes: '' });
      showToast(`Paiement de ${payment.amount.toFixed(2)} € enregistré`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur ajout paiement', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const filtered = filter === 'all' ? factures : factures.filter((f) => f.status === filter);

  // Stats
  const caTotal = factures.filter((f) => f.status === 'paid').reduce((s, f) => s + f.totalTtc, 0);
  const pendingCount = factures.filter((f) => f.status === 'unpaid' || f.status === 'partial').length;
  const pendingAmount = factures
    .filter((f) => f.status === 'unpaid' || f.status === 'partial')
    .reduce((s, f) => s + (f.totalTtc - f.amountPaid), 0);

  return (
    <AuthGuard>
      <PageLayout activePage="factures" garageName="2roues Pasteur">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-4 md:px-8 py-4 md:py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-slate-100">
              Factures
            </h1>
          </div>
        </header>

        <main className="p-4 md:p-8 space-y-6 overflow-y-auto bg-gray-50/30">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200/60 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Euro className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">CA encaissé</p>
                  <p className="text-xl font-bold text-emerald-600">{caTotal.toFixed(2)} €</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200/60 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Clock className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">En attente</p>
                  <p className="text-xl font-bold text-red-600">
                    {pendingCount} · {pendingAmount.toFixed(2)} €
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200/60 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Total factures</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-100">
                    {factures.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-gray-100 dark:border-slate-700">
            {(['all', 'unpaid', 'partial', 'paid', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  filter === s
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-100'
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
                <p className="text-sm text-gray-500 dark:text-slate-400">Chargement...</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">Aucune facture</p>
              ) : (
                filtered.map((facture) => (
                  <button
                    key={facture.id}
                    onClick={() => void handleSelectFacture(facture)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedFacture?.id === facture.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {facture.clientName ?? facture.clientId.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {new Date(facture.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[facture.status]}`}
                      >
                        {STATUS_LABELS[facture.status]}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-300">
                        Total: <strong>{facture.totalTtc.toFixed(2)} €</strong>
                      </span>
                      {facture.amountPaid > 0 && (
                        <span className="text-emerald-600">
                          Payé: {facture.amountPaid.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Selected facture detail */}
            {selectedFacture && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200/60 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                      Facture — {selectedFacture.clientName ?? selectedFacture.clientId.slice(0, 8)}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {new Date(selectedFacture.createdAt).toLocaleDateString('fr-FR')}
                      {selectedFacture.dueDate &&
                        ` · Échéance: ${new Date(selectedFacture.dueDate).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[selectedFacture.status]}`}
                  >
                    {STATUS_LABELS[selectedFacture.status]}
                  </span>
                </div>

                {/* Items */}
                {selectedFacture.items && selectedFacture.items.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Lignes
                    </p>
                    {selectedFacture.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-slate-900 rounded-lg"
                      >
                        <span className="text-gray-900 dark:text-slate-100">{item.description}</span>
                        <span className="text-gray-600 dark:text-slate-300 ml-4 whitespace-nowrap">
                          {item.quantity} × {item.unitPriceHt.toFixed(2)} € ={' '}
                          {item.totalHt.toFixed(2)} € HT
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="flex justify-end gap-6 text-sm font-medium pt-2 border-t border-gray-100 dark:border-slate-700">
                  <span className="text-gray-600 dark:text-slate-300">
                    HT: {selectedFacture.totalHt.toFixed(2)} €
                  </span>
                  <span className="text-gray-600 dark:text-slate-300">
                    TVA {selectedFacture.tvaRate}%
                  </span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">
                    TTC: {selectedFacture.totalTtc.toFixed(2)} €
                  </span>
                </div>

                {/* Payments */}
                {selectedFacture.payments && selectedFacture.payments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Paiements
                    </p>
                    {selectedFacture.payments.map((payment: Payment) => (
                      <div
                        key={payment.id}
                        className="flex justify-between items-center text-sm p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800"
                      >
                        <span className="text-emerald-700 dark:text-emerald-300">
                          {METHOD_LABELS[payment.method]} ·{' '}
                          {new Date(payment.paidAt).toLocaleDateString('fr-FR')}
                          {payment.notes && ` · ${payment.notes}`}
                        </span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          +{payment.amount.toFixed(2)} €
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-end text-sm text-gray-600 dark:text-slate-300">
                      Reste dû:{' '}
                      <strong className="ml-1 text-gray-900 dark:text-slate-100">
                        {Math.max(
                          0,
                          selectedFacture.totalTtc - selectedFacture.amountPaid,
                        ).toFixed(2)}{' '}
                        €
                      </strong>
                    </div>
                  </div>
                )}

                {/* Add payment button */}
                {(selectedFacture.status === 'unpaid' || selectedFacture.status === 'partial') && (
                  <button
                    onClick={() => setPaymentModal(true)}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  Enregistrer un paiement
                </h3>
                <button
                  onClick={() => setPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    Montant (€)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={`Max: ${(selectedFacture.totalTtc - selectedFacture.amountPaid).toFixed(2)} €`}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    Mode de paiement
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })
                    }
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-sm"
                  >
                    {(Object.entries(METHOD_LABELS) as [PaymentMethod, string][]).map(
                      ([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    Notes (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Référence, commentaire..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPaymentModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => void handleAddPayment()}
                  disabled={isSubmittingPayment || !paymentForm.amount}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmittingPayment ? 'Enregistrement...' : 'Valider'}
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
