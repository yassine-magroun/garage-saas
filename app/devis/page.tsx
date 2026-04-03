'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '../components/AuthGuard';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  createDevis,
  getDevisList,
  getDevisWithItems,
  updateDevisStatus,
  convertDevisToFacture,
  clientsAPI,
} from '../../lib/api';
import { getGarageId } from '../../lib/garage';
import type { Devis, DevisStatus, DevisItem, Client } from '../../lib/types';

interface DraftItem {
  description: string;
  quantity: number;
  unitPriceHt: number;
}

const STATUS_LABELS: Record<DevisStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  refused: 'Refusé',
  expired: 'Expiré',
};

const STATUS_COLORS: Record<DevisStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refused: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function DevisPage() {
  const router = useRouter();
  const [garageId, setGarageId] = useState('');
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    clientId: '',
    tvaRate: '20',
    validUntil: '',
    notes: '',
  });
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [itemForm, setItemForm] = useState({ description: '', quantity: '1', unitPriceHt: '0' });

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
        const [devis, cls] = await Promise.all([getDevisList(gid), clientsAPI.getAll()]);
        setDevisList(devis);
        setClients(cls);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erreur chargement', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const handleSelectDevis = async (devis: Devis) => {
    setSelectedDevis(devis);
    try {
      const full = await getDevisWithItems(devis.id, garageId);
      setSelectedDevis(full);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur chargement détail', 'error');
    }
  };

  const addDraftItem = () => {
    const qty = Number(itemForm.quantity);
    const price = Number(itemForm.unitPriceHt);
    if (!itemForm.description.trim() || qty <= 0 || price < 0) {
      showToast('Description, quantité et prix obligatoires', 'error');
      return;
    }
    setDraftItems((prev) => [
      ...prev,
      { description: itemForm.description.trim(), quantity: qty, unitPriceHt: price },
    ]);
    setItemForm({ description: '', quantity: '1', unitPriceHt: '0' });
  };

  const removeDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalHt = draftItems.reduce((sum, i) => sum + i.quantity * i.unitPriceHt, 0);
  const tvaRate = Number(form.tvaRate) || 20;
  const totalTtc = totalHt * (1 + tvaRate / 100);

  const handleCreateDevis = async () => {
    if (!form.clientId) {
      showToast('Sélectionnez un client', 'error');
      return;
    }
    if (draftItems.length === 0) {
      showToast('Ajoutez au moins une ligne', 'error');
      return;
    }
    try {
      const created = await createDevis(garageId, form.clientId, draftItems, {
        tvaRate,
        validUntil: form.validUntil || undefined,
        notes: form.notes || undefined,
      });
      setDevisList((prev) => [created, ...prev]);
      setForm({ clientId: '', tvaRate: '20', validUntil: '', notes: '' });
      setDraftItems([]);
      showToast('Devis créé', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur création devis', 'error');
    }
  };

  const handleStatusChange = async (devis: Devis, newStatus: DevisStatus) => {
    try {
      await updateDevisStatus(devis.id, garageId, newStatus);
      const updated = { ...devis, status: newStatus };
      setDevisList((prev) => prev.map((d) => (d.id === devis.id ? updated : d)));
      if (selectedDevis?.id === devis.id) setSelectedDevis(updated);
      showToast('Statut mis à jour', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur mise à jour statut', 'error');
    }
  };

  const handleConvert = async () => {
    if (!selectedDevis) return;
    setIsConverting(true);
    try {
      await convertDevisToFacture(selectedDevis.id, garageId);
      const updated = { ...selectedDevis, status: 'accepted' as DevisStatus };
      setDevisList((prev) => prev.map((d) => (d.id === selectedDevis.id ? updated : d)));
      setSelectedDevis(updated);
      showToast('Devis converti en facture', 'success');
      setTimeout(() => router.push('/factures'), 1000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur conversion', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <AuthGuard>
      <PageLayout activePage="devis" garageName="2roues Pasteur">
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
              Devis
            </h1>
          </div>
        </header>

        <main className="p-4 md:p-8 space-y-6 overflow-y-auto bg-gray-50/30">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Create form */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200/60 dark:border-slate-700 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                Créer un devis
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-slate-300 whitespace-nowrap">
                    TVA %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.tvaRate}
                    onChange={(e) => setForm({ ...form, tvaRate: e.target.value })}
                    className="flex-1 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-3 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Valable jusqu&apos;au
                  </label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Notes (optionnel)"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Item form */}
              <div className="border border-gray-100 dark:border-slate-700 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-slate-900">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Ajouter une ligne
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="sm:col-span-1 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Qté"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                    className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="PU HT €"
                      value={itemForm.unitPriceHt}
                      onChange={(e) => setItemForm({ ...itemForm, unitPriceHt: e.target.value })}
                      className="flex-1 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-sm"
                    />
                    <button
                      onClick={addDraftItem}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Draft items */}
              {draftItems.length > 0 && (
                <div className="space-y-2">
                  {draftItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {item.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {item.quantity} × {item.unitPriceHt.toFixed(2)} € ={' '}
                          {(item.quantity * item.unitPriceHt).toFixed(2)} € HT
                        </p>
                      </div>
                      <button
                        onClick={() => removeDraftItem(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-end gap-6 text-sm font-medium text-gray-700 dark:text-slate-300 pt-2 border-t border-gray-100 dark:border-slate-700">
                    <span>HT: {totalHt.toFixed(2)} €</span>
                    <span>TTC: {totalTtc.toFixed(2)} €</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateDevis}
                disabled={!form.clientId || draftItems.length === 0}
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Créer le devis
              </button>
            </div>

            {/* Devis list */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200/60 dark:border-slate-700 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">
                Devis existants
              </h2>
              {isLoading ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">Chargement...</p>
              ) : devisList.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">Aucun devis</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {devisList.map((devis) => (
                    <button
                      key={devis.id}
                      onClick={() => void handleSelectDevis(devis)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selectedDevis?.id === devis.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {devis.clientName ?? devis.clientId.slice(0, 8)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[devis.status]}`}
                        >
                          {STATUS_LABELS[devis.status]}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {devis.totalTtc.toFixed(2)} € TTC
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {new Date(devis.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected devis detail */}
          {selectedDevis && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200/60 dark:border-slate-700 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    Détail du devis
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Client: {selectedDevis.clientName ?? selectedDevis.clientId} ·{' '}
                    {new Date(selectedDevis.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedDevis.status}
                    onChange={(e) =>
                      void handleStatusChange(selectedDevis, e.target.value as DevisStatus)
                    }
                    disabled={selectedDevis.status === 'accepted'}
                    className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 disabled:opacity-50"
                  >
                    {(Object.keys(STATUS_LABELS) as DevisStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  {selectedDevis.status !== 'accepted' && selectedDevis.status !== 'refused' && (
                    <button
                      onClick={() => void handleConvert()}
                      disabled={isConverting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isConverting ? 'Conversion...' : 'Convertir en facture'}
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              {selectedDevis.items && selectedDevis.items.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {selectedDevis.items.map((item: DevisItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border border-gray-100 dark:border-slate-700 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {item.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {item.quantity} × {item.unitPriceHt.toFixed(2)} € HT
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {item.totalHt.toFixed(2)} € HT
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  Chargement des lignes...
                </p>
              )}

              <div className="flex justify-end gap-6 text-sm font-medium text-gray-700 dark:text-slate-300 pt-3 border-t border-gray-100 dark:border-slate-700">
                <span>HT: {selectedDevis.totalHt.toFixed(2)} €</span>
                <span>TVA {selectedDevis.tvaRate}%</span>
                <span className="text-base font-bold text-gray-900 dark:text-slate-100">
                  TTC: {selectedDevis.totalTtc.toFixed(2)} €
                </span>
              </div>
            </div>
          )}
        </main>
      </PageLayout>
      <Toast toast={toast} />
    </AuthGuard>
  );
}
