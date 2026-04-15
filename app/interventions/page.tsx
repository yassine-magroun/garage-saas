'use client';

import { Suspense } from 'react';
import PageLayout from '../components/PageLayout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Plus, ChevronRight } from 'lucide-react';
import InterventionSelect from '../components/InterventionSelect';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { interventionsAPI, clientsAPI } from '../../lib/api';
import { getGarageId } from '../../lib/garage';
import type { Intervention, Client } from '../../lib/types';

// ─── Status config ─────────────────────────────────────────────────────────────

type IntStatus = 'En attente' | 'En cours' | 'Prêt' | 'Livré';

const STATUS_ORDER: IntStatus[] = ['En attente', 'En cours', 'Prêt', 'Livré'];

const STATUS_STYLE: Record<IntStatus, string> = {
  'En attente': 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  'En cours':   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'Prêt':       'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'Livré':      'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

const STATUS_DOT: Record<IntStatus, string> = {
  'En attente': 'bg-slate-400',
  'En cours':   'bg-amber-500',
  'Prêt':       'bg-emerald-500',
  'Livré':      'bg-blue-500',
};

function nextStatus(current: string): IntStatus | null {
  const idx = STATUS_ORDER.indexOf(current as IntStatus);
  if (idx < 0 || idx >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}

// ─── Component ────────────────────────────────────────────────────────────────

function InterventionsContent() {
  const searchParams = useSearchParams();
  const [garageId, setGarageId] = useState('');
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewInterventionOpen, setIsNewInterventionOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filter, setFilter] = useState<string>('Tous');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [interventionForm, setInterventionForm] = useState({
    clientId: '', vehicle: '', type: '', price: '', date: new Date().toISOString().slice(0, 10),
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.name ?? 'Client inconnu';
  const getClientEmail = (clientId: string) => clients.find((c) => c.id === clientId)?.email ?? '';

  // Load from Supabase
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const gid = await getGarageId();
        setGarageId(gid);
        const [ints, cls] = await Promise.all([interventionsAPI.getAll(), clientsAPI.getAll()]);
        setInterventions(ints);
        setClients(cls);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erreur chargement', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  // Auto-open modal from query param
  useEffect(() => {
    if (searchParams.get('openModal') === 'true') setIsNewInterventionOpen(true);
  }, [searchParams]);

  // Advance status by one step
  const handleAdvanceStatus = async (intervention: Intervention) => {
    const next = nextStatus(intervention.status);
    if (!next) return;
    setUpdatingId(intervention.id);
    try {
      const res = await fetch('/api/intervention/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interventionId: intervention.id,
          garageId,
          newStatus: next,
          clientEmail: getClientEmail(intervention.clientId),
          clientName: getClientName(intervention.clientId),
          vehicle: intervention.type,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Erreur mise à jour');
      }
      setInterventions((prev) => prev.map((i) => i.id === intervention.id ? { ...i, status: next as Intervention['status'] } : i));
      showToast(next === 'Prêt' ? '✅ Véhicule prêt — email client envoyé' : `Statut → ${next}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateIntervention = async () => {
    if (!interventionForm.clientId || !interventionForm.vehicle || !interventionForm.type || !interventionForm.price || !interventionForm.date) {
      showToast('Tous les champs sont nécessaires', 'error');
      return;
    }
    try {
      const created = await interventionsAPI.create({
        clientId: interventionForm.clientId,
        vehicleId: interventionForm.vehicle,
        type: interventionForm.type,
        status: 'En attente' as Intervention['status'],
        date: interventionForm.date,
        price: parseFloat(interventionForm.price),
      });
      setInterventions((prev) => [created, ...prev]);
      setInterventionForm({ clientId: '', vehicle: '', type: '', price: '', date: new Date().toISOString().slice(0, 10) });
      setIsNewInterventionOpen(false);
      showToast('Intervention créée', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur création', 'error');
    }
  };

  const FILTER_TABS = ['Tous', ...STATUS_ORDER];
  const displayed = filter === 'Tous' ? interventions : interventions.filter((i) => i.status === filter);

  const inputCls = 'w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50';

  return (
    <PageLayout activePage="interventions">
      <header className="bg-[#1A1D27] border-b border-[#2A2D3A] px-4 md:px-8 py-4 md:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Interventions</h1>
            <p className="text-sm text-[#8B8FA8] mt-1">Suivez les interventions en temps réel</p>
          </div>
          <button
            onClick={() => setIsNewInterventionOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E55A1F] transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle intervention
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">

        {/* Pipeline status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUS_ORDER.map((s) => {
            const count = interventions.filter((i) => i.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? 'Tous' : s)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  filter === s ? 'border-[#FF6B2B] bg-[#FF6B2B]/10' : 'border-[#2A2D3A] bg-[#1A1D27] hover:border-[#3A3D4A]'
                }`}
              >
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${STATUS_STYLE[s]}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                  {s}
                </div>
                <p className="text-2xl font-bold text-white">{count}</p>
              </button>
            );
          })}
        </div>

        {/* Filter tabs */}
        <section className="flex gap-1 border-b border-[#2A2D3A] overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                filter === tab ? 'text-[#FF6B2B] border-[#FF6B2B]' : 'text-[#8B8FA8] border-transparent hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </section>

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-[#8B8FA8] text-sm">
            Aucune intervention {filter !== 'Tous' ? `"${filter}"` : ''}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayed.map((intervention) => {
              const next = nextStatus(intervention.status);
              const isUpdating = updatingId === intervention.id;
              const style = STATUS_STYLE[intervention.status as IntStatus] ?? STATUS_STYLE['En attente'];
              const dot = STATUS_DOT[intervention.status as IntStatus] ?? STATUS_DOT['En attente'];

              return (
                <article
                  key={intervention.id}
                  className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-5 hover:border-[#3A3D4A] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-white text-sm truncate">{getClientName(intervention.clientId)}</h2>
                      <p className="text-xs text-[#8B8FA8] mt-0.5 truncate">{intervention.type}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded whitespace-nowrap ${style}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      {intervention.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#8B8FA8] mb-4">
                    <span>{new Date(intervention.date).toLocaleDateString('fr-FR')}</span>
                    <span className="font-semibold text-white">{intervention.price} €</span>
                  </div>

                  {/* Status progress bar */}
                  <div className="flex gap-1 mb-4">
                    {STATUS_ORDER.map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          STATUS_ORDER.indexOf(s) <= STATUS_ORDER.indexOf(intervention.status as IntStatus)
                            ? 'bg-[#FF6B2B]'
                            : 'bg-[#2A2D3A]'
                        }`}
                      />
                    ))}
                  </div>

                  {next && (
                    <button
                      onClick={() => void handleAdvanceStatus(intervention)}
                      disabled={isUpdating}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 text-[#FF6B2B] text-xs font-medium hover:bg-[#FF6B2B]/20 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Mise à jour...' : (
                        <>
                          Passer à <strong>{next}</strong>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        )}

        <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-4 text-sm text-[#8B8FA8]">
          <span className="font-semibold text-white">{displayed.length}</span> intervention{displayed.length !== 1 ? 's' : ''} affichée{displayed.length !== 1 ? 's' : ''}
        </div>
      </main>

      {/* New intervention modal */}
      <Modal
        isOpen={isNewInterventionOpen}
        title="Nouvelle intervention"
        onClose={() => setIsNewInterventionOpen(false)}
        actions={
          <>
            <button
              onClick={() => setIsNewInterventionOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#2A2D3A] text-sm font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => void handleCreateIntervention()}
              className="px-4 py-2 rounded-lg bg-[#FF6B2B] text-white text-sm font-medium hover:bg-[#E55A1F] transition-colors"
            >
              Enregistrer
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Client</label>
            <select value={interventionForm.clientId} onChange={(e) => setInterventionForm({ ...interventionForm, clientId: e.target.value })} className={inputCls}>
              <option value="">Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Véhicule</label>
            <input value={interventionForm.vehicle} onChange={(e) => setInterventionForm({ ...interventionForm, vehicle: e.target.value })} className={inputCls} placeholder="Ex: XMAX 300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Type d&apos;intervention</label>
            <InterventionSelect
              value={interventionForm.type}
              onChange={(label, prixDefaut) => {
                setInterventionForm((prev) => ({
                  ...prev,
                  type: label,
                  ...(prixDefaut && prixDefaut > 0 && !prev.price ? { price: String(prixDefaut) } : {}),
                }));
              }}
              inputClassName={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Prix (€)</label>
              <input type="number" value={interventionForm.price} onChange={(e) => setInterventionForm({ ...interventionForm, price: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Date</label>
              <input type="date" value={interventionForm.date} onChange={(e) => setInterventionForm({ ...interventionForm, date: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </PageLayout>
  );
}

export default function InterventionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F1117]" />}>
      <InterventionsContent />
    </Suspense>
  );
}
