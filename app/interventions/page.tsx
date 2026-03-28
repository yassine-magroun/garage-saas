'use client';

import Link from 'next/link';
import PageLayout from '../components/PageLayout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Plus, Phone, CheckCircle, Eye, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

const initialInterventions = [
  {
    id: 'int1',
    clientId: '2',
    vehicle: 'Yamaha XMAX 300',
    type: 'Révision complète',
    status: 'En cours',
    date: '25/03/2026',
    price: 120,
  },
  {
    id: 'int2',
    clientId: '3',
    vehicle: 'Piaggio Liberty 125',
    type: 'Vidange & freinage',
    status: 'Terminé',
    date: '23/03/2026',
    price: 85,
  },
  {
    id: 'int3',
    clientId: '1',
    vehicle: 'TMAX 125',
    type: 'Réparation embrayage',
    status: 'En cours',
    date: '26/03/2026',
    price: 230,
  },
  {
    id: 'int4',
    clientId: '4',
    vehicle: 'Honda PCX 125',
    type: 'Batterie & électrique',
    status: 'Terminé',
    date: '22/03/2026',
    price: 65,
  },
  {
    id: 'int5',
    clientId: '5',
    vehicle: 'Kymco Agility 125',
    type: 'Réparation freins',
    status: 'En cours',
    date: '24/03/2026',
    price: 95,
  },
  {
    id: 'int6',
    clientId: '6',
    vehicle: 'Peugeot Tweet 125',
    type: 'Changement pneus',
    status: 'Planifié',
    date: '27/03/2026',
    price: 150,
  },
  {
    id: 'int7',
    clientId: '7',
    vehicle: 'Sym Symphony 125',
    type: 'Révision distribution',
    status: 'En cours',
    date: '26/03/2026',
    price: 180,
  },
  {
    id: 'int8',
    clientId: '8',
    vehicle: 'Honda Forza 300',
    type: 'Contrôle technique',
    status: 'Terminé',
    date: '20/03/2026',
    price: 45,
  },
];

const statusStyles: Record<string, string> = {
  'En cours': 'bg-amber-50 text-amber-700 border border-amber-200',
  Terminé: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Planifié: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState(initialInterventions);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<typeof initialInterventions[0] | null>(null);
  const [isNewInterventionOpen, setIsNewInterventionOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [interventionForm, setInterventionForm] = useState({ client: '', vehicle: '', type: '', price: '', date: '' });
  const [interventionErrors, setInterventionErrors] = useState<{ client?: string; vehicle?: string; type?: string; price?: string; date?: string }>({});
  const [garageName, setGarageName] = useState('2roues Pasteur');

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
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

    const savedParams = localStorage.getItem('params');
    if (savedParams) {
      try {
        const parsed = JSON.parse(savedParams);
        if (parsed?.garageName) setGarageName(parsed.garageName);
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('interventions', JSON.stringify(interventions));
  }, [interventions]);

  const markAsCompleted = (index: number) => {
    setInterventions(interventions.map((intervention, i) =>
      i === index ? { ...intervention, status: 'Terminé' } : intervention
    ));
    setToast({ message: 'Intervention marquée comme terminée !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const viewIntervention = (index: number) => {
    setSelectedIntervention(interventions[index]);
  };

  const handleCreateIntervention = () => {
    const errors: typeof interventionErrors = {};

    if (!interventionForm.client) errors.client = 'Client obligatoire';
    if (!interventionForm.vehicle.trim()) errors.vehicle = 'Véhicule obligatoire';
    if (!interventionForm.type.trim()) errors.type = 'Type d’intervention obligatoire';
    if (!interventionForm.price || isNaN(Number(interventionForm.price)) || Number(interventionForm.price) <= 0) {
      errors.price = 'Montant supérieur à 0 requis';
    }
    if (!interventionForm.date) errors.date = 'Date obligatoire';

    setInterventionErrors(errors);

    if (Object.keys(errors).length > 0) {
      setToast({ message: 'Veuillez corriger les champs avant enregistrement', type: 'error' });
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
    setInterventionErrors({});
    setIsNewInterventionOpen(false);
    setToast({ message: 'Intervention ajoutée avec succès !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <PageLayout activePage="interventions" garageName={garageName}>
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-4 md:px-8 py-4 md:py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-slate-100">Interventions</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-slate-300 mt-1">Suivez les interventions en temps réel</p>
          </div>
          <button
            onClick={() => setIsNewInterventionOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle intervention
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 space-y-8">
          <section className="flex gap-2 border-b border-gray-100">
            <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 -mb-px">Tous</button>
            <button className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">En cours</button>
            <button className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Terminées</button>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interventions.map((intervention, idx) => (
              <article
                key={`${intervention.id}-${idx}`}
                className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <h2 className="font-medium text-gray-900 text-sm">{getClientName(intervention.clientId)}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{intervention.vehicle}</p>
                    <p className="mt-2 text-xs font-medium text-gray-700">{intervention.type}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded border ${statusStyles[intervention.status]}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      intervention.status === 'Terminé' ? 'bg-emerald-500' :
                      intervention.status === 'En cours' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}></div>
                    {intervention.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-6 text-xs text-gray-600 mb-4">
                  <span className="flex items-center gap-2">
                    <span>📅</span>
                    {intervention.date}
                  </span>
                  <span className="flex items-center gap-2 font-semibold text-gray-900">
                    <span>💰</span>
                    {intervention.price}€
                  </span>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {intervention.status !== 'Terminé' && (
                    <button
                      onClick={() => markAsCompleted(idx)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 active:bg-amber-200 transition-colors duration-200"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Terminer
                    </button>
                  )}
                  <button
                    onClick={() => viewIntervention(idx)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 active:bg-blue-200 transition-colors duration-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Voir
                  </button>
                </div>
              </article>
            ))}
          </section>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-sm text-gray-500 dark:text-slate-300 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-300">
            <p className="font-semibold text-gray-700 dark:text-slate-100">Résumé</p>
            <p className="mt-2">{interventions.length} interventions affichées</p>
          </div>
      </main>

      {selectedIntervention && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Détails de l'intervention</h3>
            <p className="text-sm text-gray-600 dark:text-slate-300">Client: <span className="font-medium text-gray-900 dark:text-slate-100">{getClientName(selectedIntervention.clientId)}</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Véhicule: <span className="font-medium text-gray-900 dark:text-slate-100">{selectedIntervention.vehicle}</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Type: <span className="font-medium text-gray-900 dark:text-slate-100">{selectedIntervention.type}</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Date: <span className="font-medium text-gray-900 dark:text-slate-100">{selectedIntervention.date}</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Prix: <span className="font-medium text-gray-900 dark:text-slate-100">{selectedIntervention.price}€</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Statut: <span className="font-medium text-gray-900 dark:text-slate-100">{selectedIntervention.status}</span></p>
            <button
              onClick={() => setSelectedIntervention(null)}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition-colors"
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
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateIntervention}
              disabled={!interventionForm.client || !interventionForm.vehicle || !interventionForm.type || !interventionForm.price || !interventionForm.date}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !interventionForm.client || !interventionForm.vehicle || !interventionForm.type || !interventionForm.price || !interventionForm.date
                  ? 'bg-blue-200 text-blue-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400'
              }`}
            >
              Enregistrer
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Client</label>
            <select
              value={interventionForm.client}
              onChange={(e) => setInterventionForm({ ...interventionForm, client: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 transition-all duration-200"
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            {interventionErrors.client && <p className="mt-1 text-xs text-red-600">{interventionErrors.client}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Véhicule</label>
            <input
              value={interventionForm.vehicle}
              onChange={(e) => setInterventionForm({ ...interventionForm, vehicle: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 dark:text-slate-100 transition-all duration-200"
              placeholder="Modèle"
            />
            {interventionErrors.vehicle && <p className="mt-1 text-xs text-red-600">{interventionErrors.vehicle}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Type d'intervention</label>
            <input
              value={interventionForm.type}
              onChange={(e) => setInterventionForm({ ...interventionForm, type: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 dark:text-slate-100 transition-all duration-200"
              placeholder="Ex: Vidange"
            />
            {interventionErrors.type && <p className="mt-1 text-xs text-red-600">{interventionErrors.type}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Prix (€)</label>
              <input
                type="number"
                value={interventionForm.price}
                onChange={(e) => setInterventionForm({ ...interventionForm, price: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 dark:text-slate-100 transition-all duration-200"
              />
              {interventionErrors.price && <p className="mt-1 text-xs text-red-600">{interventionErrors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Date</label>
              <input
                type="date"
                value={interventionForm.date}
                onChange={(e) => setInterventionForm({ ...interventionForm, date: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 dark:text-slate-100 transition-all duration-200"
              />
              {interventionErrors.date && <p className="mt-1 text-xs text-red-600">{interventionErrors.date}</p>}
            </div>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </PageLayout>
  );
}
