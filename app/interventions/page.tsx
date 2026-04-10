'use client';

import PageLayout from '../components/PageLayout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Plus, CheckCircle, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const initialInterventions = [
  { id: 'int1', clientId: '2', vehicle: 'Yamaha XMAX 300', type: 'Révision complète', status: 'En cours', date: '25/03/2026', price: 120 },
  { id: 'int2', clientId: '3', vehicle: 'Piaggio Liberty 125', type: 'Vidange & freinage', status: 'Terminé', date: '23/03/2026', price: 85 },
  { id: 'int3', clientId: '1', vehicle: 'TMAX 125', type: 'Réparation embrayage', status: 'En cours', date: '26/03/2026', price: 230 },
  { id: 'int4', clientId: '4', vehicle: 'Honda PCX 125', type: 'Batterie & électrique', status: 'Terminé', date: '22/03/2026', price: 65 },
  { id: 'int5', clientId: '5', vehicle: 'Kymco Agility 125', type: 'Réparation freins', status: 'En cours', date: '24/03/2026', price: 95 },
  { id: 'int6', clientId: '6', vehicle: 'Peugeot Tweet 125', type: 'Changement pneus', status: 'Planifié', date: '27/03/2026', price: 150 },
  { id: 'int7', clientId: '7', vehicle: 'Sym Symphony 125', type: 'Révision distribution', status: 'En cours', date: '26/03/2026', price: 180 },
  { id: 'int8', clientId: '8', vehicle: 'Honda Forza 300', type: 'Contrôle technique', status: 'Terminé', date: '20/03/2026', price: 45 },
];

const statusStyles: Record<string, string> = {
  'En cours': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Terminé: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Planifié: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

const statusDot: Record<string, string> = {
  'En cours': 'bg-amber-500',
  Terminé: 'bg-emerald-500',
  Planifié: 'bg-blue-500',
};

export default function InterventionsPage() {
  const searchParams = useSearchParams();
  const [interventions, setInterventions] = useState(initialInterventions);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<typeof initialInterventions[0] | null>(null);
  const [isNewInterventionOpen, setIsNewInterventionOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [interventionForm, setInterventionForm] = useState({ client: '', vehicle: '', type: '', price: '', date: '' });

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'Client inconnu';
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('interventions');
    if (stored) {
      try { setInterventions(JSON.parse(stored)); } catch { }
    }
    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      try { setClients(JSON.parse(savedClients)); } catch { }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('interventions', JSON.stringify(interventions));
  }, [interventions]);

  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      setIsNewInterventionOpen(true);
    }
  }, [searchParams]);

  const markAsCompleted = (index: number) => {
    setInterventions(interventions.map((item, i) =>
      i === index ? { ...item, status: 'Terminé' } : item
    ));
    setToast({ message: 'Intervention marquée comme terminée !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateIntervention = () => {
    if (!interventionForm.client || !interventionForm.vehicle || !interventionForm.type || !interventionForm.price || !interventionForm.date) {
      setToast({ message: 'Tous les champs sont nécessaires', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const newIntervention = {
      id: Date.now().toString(),
      clientId: interventionForm.client,
      vehicle: interventionForm.vehicle,
      type: interventionForm.type,
      status: 'En cours',
      date: interventionForm.date,
      price: parseFloat(interventionForm.price),
    };
    setInterventions((prev) => [newIntervention, ...prev]);
    setInterventionForm({ client: '', vehicle: '', type: '', price: '', date: '' });
    setIsNewInterventionOpen(false);
    setToast({ message: 'Intervention ajoutée avec succès !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

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
        {/* Filter tabs */}
        <section className="flex gap-1 border-b border-[#2A2D3A]">
          <button className="px-4 py-3 text-sm font-medium text-[#FF6B2B] border-b-2 border-[#FF6B2B] -mb-px">Tous</button>
          <button className="px-4 py-3 text-sm font-medium text-[#8B8FA8] hover:text-white transition-colors">En cours</button>
          <button className="px-4 py-3 text-sm font-medium text-[#8B8FA8] hover:text-white transition-colors">Terminées</button>
        </section>

        {/* Intervention cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interventions.map((intervention, idx) => (
            <article
              key={`${intervention.id}-${idx}`}
              className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-5 hover:border-[#3A3D4A] transition-colors group"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <h2 className="font-medium text-white text-sm">{getClientName(intervention.clientId)}</h2>
                  <p className="text-xs text-[#8B8FA8] mt-0.5">{intervention.vehicle}</p>
                  <p className="mt-2 text-xs font-medium text-[#C4C7D4]">{intervention.type}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded ${statusStyles[intervention.status]}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${statusDot[intervention.status]}`} />
                  {intervention.status}
                </span>
              </div>

              <div className="flex items-center gap-6 text-xs text-[#8B8FA8] mb-4">
                <span>{intervention.date}</span>
                <span className="font-semibold text-white">{intervention.price} €</span>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {intervention.status !== 'Terminé' && (
                  <button
                    onClick={() => markAsCompleted(idx)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Terminer
                  </button>
                )}
                <button
                  onClick={() => setSelectedIntervention(intervention)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 text-[#FF6B2B] text-xs font-medium hover:bg-[#FF6B2B]/20 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Voir
                </button>
              </div>
            </article>
          ))}
        </section>

        <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6 text-sm text-[#8B8FA8]">
          <p className="font-semibold text-white">Résumé</p>
          <p className="mt-2">{interventions.length} interventions affichées</p>
        </div>
      </main>

      {/* Detail modal */}
      {selectedIntervention && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Détails de l&apos;intervention</h3>
            <div className="space-y-2">
              <p className="text-sm text-[#8B8FA8]">Client: <span className="font-medium text-white">{getClientName(selectedIntervention.clientId)}</span></p>
              <p className="text-sm text-[#8B8FA8]">Véhicule: <span className="font-medium text-white">{selectedIntervention.vehicle}</span></p>
              <p className="text-sm text-[#8B8FA8]">Type: <span className="font-medium text-white">{selectedIntervention.type}</span></p>
              <p className="text-sm text-[#8B8FA8]">Date: <span className="font-medium text-white">{selectedIntervention.date}</span></p>
              <p className="text-sm text-[#8B8FA8]">Prix: <span className="font-medium text-white">{selectedIntervention.price} €</span></p>
              <p className="text-sm text-[#8B8FA8]">Statut: <span className="font-medium text-white">{selectedIntervention.status}</span></p>
            </div>
            <button
              onClick={() => setSelectedIntervention(null)}
              className="mt-5 w-full px-4 py-2.5 bg-[#FF6B2B] text-white rounded-lg font-medium hover:bg-[#E55A1F] transition-colors text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

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
              onClick={handleCreateIntervention}
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
            <select
              value={interventionForm.client}
              onChange={(e) => setInterventionForm({ ...interventionForm, client: e.target.value })}
              className="w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Véhicule</label>
            <input
              value={interventionForm.vehicle}
              onChange={(e) => setInterventionForm({ ...interventionForm, vehicle: e.target.value })}
              className="w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
              placeholder="Modèle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Type d&apos;intervention</label>
            <input
              value={interventionForm.type}
              onChange={(e) => setInterventionForm({ ...interventionForm, type: e.target.value })}
              className="w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
              placeholder="Ex: Vidange"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Prix (€)</label>
              <input
                type="number"
                value={interventionForm.price}
                onChange={(e) => setInterventionForm({ ...interventionForm, price: e.target.value })}
                className="w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Date</label>
              <input
                type="date"
                value={interventionForm.date}
                onChange={(e) => setInterventionForm({ ...interventionForm, date: e.target.value })}
                className="w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </PageLayout>
  );
}
