'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../components/AuthGuard';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { Plus, Trash2, Copy } from 'lucide-react';
import {
  createDevis,
  getDevisList,
  getDevisWithItems,
  updateDevisStatus,
  convertDevisToFacture,
  duplicateDevis,
  clientsAPI,
  prestationsAPI,
} from '../../lib/api';
import { getGarageId } from '../../lib/garage';
import type { Devis, DevisStatus, DevisItem, Client, Prestation } from '../../lib/types';

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
  draft: 'bg-[#2A2D3A] text-[#8B8FA8] border-[#3A3D4A]',
  sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  refused: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function DevisPage() {
  const router = useRouter();
  const [garageId, setGarageId] = useState('');
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [form, setForm] = useState({ clientId: '', tvaRate: '20', validUntil: '', notes: '' });
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
        const [devis, cls, prests] = await Promise.all([
          getDevisList(gid),
          clientsAPI.getAll(),
          prestationsAPI.getAll(gid).catch(() => [] as Prestation[]),
        ]);
        setDevisList(devis);
        setClients(cls);
        setPrestations(prests);
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

  const addPrestationToForm = (p: Prestation) => {
    setDraftItems((prev) => [...prev, {
      description: p.name,
      quantity: 1,
      unitPriceHt: p.priceHt,
    }]);
  };

  const handleDuplicate = async (devis: Devis) => {
    setIsDuplicating(true);
    try {
      const copy = await duplicateDevis(devis.id, garageId);
      setDevisList((prev) => [copy, ...prev]);
      showToast(`Devis dupliqué → ${copy.displayRef ?? copy.id.slice(0, 8)}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur duplication', 'error');
    } finally {
      setIsDuplicating(false);
    }
  };

  const totalHt = draftItems.reduce((sum, i) => sum + i.quantity * i.unitPriceHt, 0);
  const tvaRate = Number(form.tvaRate) || 20;
  const totalTtc = totalHt * (1 + tvaRate / 100);

  const handleCreateDevis = async () => {
    if (!form.clientId) { showToast('Sélectionnez un client', 'error'); return; }
    if (draftItems.length === 0) { showToast('Ajoutez au moins une ligne', 'error'); return; }
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

  const inputCls = 'border border-[#2A2D3A] rounded-xl px-4 py-3 bg-[#0F1117] text-white placeholder-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50';

  return (
    <AuthGuard>
      <PageLayout activePage="devis">
        <header className="bg-[#1A1D27] border-b border-[#2A2D3A] px-4 md:px-8 py-4 md:py-5">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Devis</h1>
        </header>

        <main className="p-4 md:p-8 space-y-6 overflow-y-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Create form */}
            <div className="lg:col-span-2 bg-[#1A1D27] p-6 rounded-xl border border-[#2A2D3A] space-y-4">
              <h2 className="text-lg font-bold text-white">Créer un devis</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-[#8B8FA8] whitespace-nowrap">TVA %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.tvaRate}
                    onChange={(e) => setForm({ ...form, tvaRate: e.target.value })}
                    className={`flex-1 ${inputCls}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8B8FA8] mb-1">Valable jusqu&apos;au</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className={`w-full ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8B8FA8] mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Notes (optionnel)"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className={`w-full ${inputCls}`}
                  />
                </div>
              </div>

              {/* Catalogue quick-add */}
              {prestations.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const p = prestations.find((x) => x.id === e.target.value);
                      if (p) addPrestationToForm(p);
                      e.target.value = '';
                    }}
                    className={inputCls}
                  >
                    <option value="" disabled>⚡ Ajouter depuis le catalogue...</option>
                    {prestations.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.category ? `[${p.category}] ` : ''}{p.name} — {p.priceHt.toFixed(2)} € HT
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Item form */}
              <div className="border border-[#2A2D3A] rounded-xl p-4 space-y-3 bg-[#0F1117]">
                <p className="text-sm font-medium text-[#8B8FA8]">Ajouter une ligne manuellement</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className={`sm:col-span-1 border border-[#2A2D3A] rounded-lg px-3 py-2 bg-[#1A1D27] text-white placeholder-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50`}
                  />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Qté"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                    className="border border-[#2A2D3A] rounded-lg px-3 py-2 bg-[#1A1D27] text-white placeholder-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="PU HT €"
                      value={itemForm.unitPriceHt}
                      onChange={(e) => setItemForm({ ...itemForm, unitPriceHt: e.target.value })}
                      className="flex-1 border border-[#2A2D3A] rounded-lg px-3 py-2 bg-[#1A1D27] text-white placeholder-[#8B8FA8] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
                    />
                    <button
                      onClick={addDraftItem}
                      className="px-3 py-2 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E55A1F] transition-colors"
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
                      className="flex items-center justify-between p-3 border border-[#2A2D3A] rounded-xl bg-[#0F1117]"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{item.description}</p>
                        <p className="text-xs text-[#8B8FA8]">
                          {item.quantity} × {item.unitPriceHt.toFixed(2)} € ={' '}
                          {(item.quantity * item.unitPriceHt).toFixed(2)} € HT
                        </p>
                      </div>
                      <button
                        onClick={() => removeDraftItem(idx)}
                        className="text-[#8B8FA8] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-end gap-6 text-sm font-medium text-[#C4C7D4] pt-2 border-t border-[#2A2D3A]">
                    <span>HT: {totalHt.toFixed(2)} €</span>
                    <span className="text-white font-bold">TTC: {totalTtc.toFixed(2)} €</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateDevis}
                disabled={!form.clientId || draftItems.length === 0}
                className="w-full px-4 py-3 bg-[#FF6B2B] text-white rounded-xl text-sm font-medium hover:bg-[#E55A1F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Créer le devis
              </button>
            </div>

            {/* Devis list */}
            <div className="lg:col-span-1 bg-[#1A1D27] p-6 rounded-xl border border-[#2A2D3A]">
              <h2 className="text-lg font-bold text-white mb-4">Devis existants</h2>
              {isLoading ? (
                <p className="text-sm text-[#8B8FA8]">Chargement...</p>
              ) : devisList.length === 0 ? (
                <p className="text-sm text-[#8B8FA8]">Aucun devis</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {devisList.map((devis) => (
                    <div
                      key={devis.id}
                      className={`rounded-xl border transition-colors ${
                        selectedDevis?.id === devis.id
                          ? 'border-[#FF6B2B] bg-[#FF6B2B]/10'
                          : 'border-[#2A2D3A] hover:bg-white/5'
                      }`}
                    >
                      <button
                        onClick={() => void handleSelectDevis(devis)}
                        className="w-full text-left p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-[#FF6B2B]">
                            {devis.displayRef ?? devis.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[devis.status]}`}>
                            {STATUS_LABELS[devis.status]}
                          </span>
                        </div>
                        <div className="text-xs text-[#8B8FA8] mb-0.5">
                          {devis.clientName ?? devis.clientId.slice(0, 8)}
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {devis.totalTtc.toFixed(2)} € TTC
                        </div>
                        <div className="text-xs text-[#8B8FA8]">
                          {new Date(devis.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </button>
                      <div className="px-3 pb-2">
                        <button
                          onClick={() => void handleDuplicate(devis)}
                          disabled={isDuplicating}
                          className="inline-flex items-center gap-1 text-xs text-[#8B8FA8] hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                          <Copy className="w-3 h-3" />
                          Dupliquer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected devis detail */}
          {selectedDevis && (
            <div className="bg-[#1A1D27] p-6 rounded-xl border border-[#2A2D3A]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedDevis.displayRef ?? 'Détail du devis'}
                  </h3>
                  <p className="text-sm text-[#8B8FA8]">
                    Client: {selectedDevis.clientName ?? selectedDevis.clientId} ·{' '}
                    {new Date(selectedDevis.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedDevis.status}
                    onChange={(e) => void handleStatusChange(selectedDevis, e.target.value as DevisStatus)}
                    disabled={selectedDevis.status === 'accepted'}
                    className="border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
                  >
                    {(Object.keys(STATUS_LABELS) as DevisStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  {selectedDevis.status !== 'accepted' && selectedDevis.status !== 'refused' && (
                    <button
                      onClick={() => void handleConvert()}
                      disabled={isConverting}
                      className="px-4 py-2 bg-[#FF6B2B] text-white rounded-xl text-sm font-medium hover:bg-[#E55A1F] disabled:opacity-50 transition-colors"
                    >
                      {isConverting ? 'Conversion...' : 'Convertir en facture'}
                    </button>
                  )}
                </div>
              </div>

              {selectedDevis.items && selectedDevis.items.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {selectedDevis.items.map((item: DevisItem) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-[#2A2D3A] rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-white">{item.description}</p>
                        <p className="text-xs text-[#8B8FA8]">
                          {item.quantity} × {item.unitPriceHt.toFixed(2)} € HT
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-white">{item.totalHt.toFixed(2)} € HT</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#8B8FA8] mb-4">Chargement des lignes...</p>
              )}

              <div className="flex justify-end gap-6 text-sm font-medium text-[#C4C7D4] pt-3 border-t border-[#2A2D3A]">
                <span>HT: {selectedDevis.totalHt.toFixed(2)} €</span>
                <span>TVA {selectedDevis.tvaRate}%</span>
                <span className="text-base font-bold text-white">TTC: {selectedDevis.totalTtc.toFixed(2)} €</span>
              </div>
            </div>
          )}
        </main>
      </PageLayout>
      <Toast toast={toast} />
    </AuthGuard>
  );
}
