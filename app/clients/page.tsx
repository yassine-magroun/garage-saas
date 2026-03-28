'use client';

import Link from 'next/link';
import PageLayout from '../components/PageLayout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Search, Phone, Truck, UserCheck, Eye, Plus, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

const initialClients = [
  { id: '1', name: 'Ahmed Ben Ali', phone: '06 11 22 33 44', vehicle: 'TMAX 125', immatriculation: 'AA-123-BB', vip: false, lastVisit: 2 },
  { id: '2', name: 'Karim Dupont', phone: '06 55 44 33 22', vehicle: 'Yamaha XMAX 300', immatriculation: 'BB-456-CC', vip: true, lastVisit: 5 },
  { id: '3', name: 'Sami Trabelsi', phone: '07 77 66 55 44', vehicle: 'Piaggio Liberty 125', immatriculation: 'CC-789-DD', vip: false, lastVisit: 8 },
  { id: '4', name: 'Youssef Martin', phone: '06 99 88 77 66', vehicle: 'Honda PCX 125', immatriculation: 'DD-101-EE', vip: false, lastVisit: 12 },
  { id: '5', name: 'Fatima Zahra', phone: '06 44 55 66 77', vehicle: 'Kymco Agility 125', immatriculation: 'EE-202-FF', vip: true, lastVisit: 3 },
  { id: '6', name: 'Mohamed Alami', phone: '07 22 33 44 55', vehicle: 'Peugeot Tweet 125', immatriculation: 'FF-303-GG', vip: false, lastVisit: 15 },
  { id: '7', name: 'Leila Bouazza', phone: '06 88 77 66 55', vehicle: 'Sym Symphony 125', immatriculation: 'GG-404-HH', vip: false, lastVisit: 7 },
  { id: '8', name: 'Nadia El Mansouri', phone: '07 11 22 33 44', vehicle: 'Honda Forza 300', immatriculation: 'HH-505-II', vip: true, lastVisit: 1 },
  { id: '9', name: 'Rachid Tazi', phone: '06 66 77 88 99', vehicle: 'Piaggio MP3 300', immatriculation: 'II-606-JJ', vip: false, lastVisit: 9 },
  { id: '10', name: 'Sofia Bennani', phone: '07 55 44 33 22', vehicle: 'Kymco Xciting 400', immatriculation: 'JJ-707-KK', vip: false, lastVisit: 4 },
];

const initialStats = [
  { title: 'Total clients', value: initialClients.length, color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'Nouveaux ce mois', value: 2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { title: 'Clients actifs', value: 8, color: 'text-green-600', bg: 'bg-green-50' },
  { title: 'Clients VIP', value: 3, color: 'text-teal-600', bg: 'bg-teal-50' },
];

export default function ClientsPage() {
  const [clients, setClients] = useState(initialClients);
  const [selectedClient, setSelectedClient] = useState<typeof initialClients[0] | null>(null);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [clientForm, setClientForm] = useState({ name: '', phone: '', vehicle: '', immatriculation: '', vip: false });
  const [clientErrors, setClientErrors] = useState<{ name?: string; phone?: string; vehicle?: string; email?: string }>({});
  const [garageName, setGarageName] = useState('2roues Pasteur');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('clients');
    if (saved) {
      try { setClients(JSON.parse(saved)); } catch { }
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
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  const stats = [
    { title: 'Total clients', value: clients.length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Clients VIP', value: clients.filter((c) => (c as any).vip).length, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'Nouveaux ce mois', value: Math.min(5, clients.length), color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Clients actifs', value: Math.max(0, clients.length - 2), color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const viewClient = (index: number) => {
    setSelectedClient(clients[index]);
  };

  const callClient = (phone: string) => {
    window.open(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleCreateClient = () => {
    const errors: typeof clientErrors = {};

    if (!clientForm.name.trim()) errors.name = 'Nom obligatoire';
    if (!clientForm.phone.trim()) errors.phone = 'Téléphone obligatoire';
    if (!clientForm.vehicle.trim()) errors.vehicle = 'Véhicule obligatoire';

    setClientErrors(errors);

    if (Object.keys(errors).length > 0) {
      setToast({ message: 'Veuillez corriger les champs avant enregistrement', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const newClient = {
      id: Date.now().toString(),
      name: clientForm.name,
      phone: clientForm.phone,
      vehicle: clientForm.vehicle,
      immatriculation: clientForm.immatriculation || '',
      vip: clientForm.vip,
      lastVisit: 0,
    };

    setClients((prev) => [newClient, ...prev]);
    setClientForm({ name: '', phone: '', vehicle: '', immatriculation: '', vip: false });
    setClientErrors({});
    setIsAddClientOpen(false);
    setToast({ message: 'Client ajouté avec succès !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <PageLayout activePage="clients" garageName={garageName}>
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-4 md:px-8 py-4 md:py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-300">
            <Link href="/" className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-slate-100">Clients</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-slate-300 mt-1">Gérez vos clients</p>
          </div>
          <button
            onClick={() => setIsAddClientOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.title} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${stat.color}`} />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </section>

          <section className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg p-6">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 dark:text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un client, un téléphone ou un véhicule"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-6">Actions rapides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => setIsAddClientOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 shadow-sm">
                <Plus className="w-4 h-4" />
                Ajouter un client
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-200 shadow-sm">
                <Truck className="w-4 h-4" />
                Nouvelle intervention
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors duration-200 shadow-sm">
                <Plus className="w-4 h-4" />
                Créer une facture
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clients.map((client, index) => {
              const initials = client.name
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <article key={client.phone} className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-semibold text-blue-600">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{client.name}</h3>
                        <p className="text-xs text-gray-500">{client.vehicle}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      Actif
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs text-gray-500">Dernière visite: il y a {client.lastVisit} jours</span>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => callClient(client.phone)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Appeler
                    </button>
                    <button
                      onClick={() => viewClient(index)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 hover:bg-blue-100 active:bg-blue-200 transition-colors duration-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Voir
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-sm text-gray-500 dark:text-slate-300 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-300">
            <p className="font-semibold text-gray-700">Résumé</p>
            <p className="mt-2">{clients.length} clients affichés</p>
          </div>
        </main>

      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-sm shadow-lg border border-gray-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Fiche client</h3>
            <p className="text-sm text-gray-600 dark:text-slate-300">Nom : <span className="font-medium text-gray-900 dark:text-slate-100">{selectedClient.name}</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Téléphone : <span className="font-medium text-gray-900 dark:text-slate-100">{selectedClient.phone}</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Véhicule : <span className="font-medium text-gray-900 dark:text-slate-100">{selectedClient.vehicle}</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Immatriculation : <span className="font-medium text-gray-900 dark:text-slate-100">{selectedClient.immatriculation || 'Non spécifiée'}</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">VIP : <span className="font-medium text-gray-900 dark:text-slate-100">{selectedClient.vip ? 'Oui' : 'Non'}</span></p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Dernière visite : <span className="font-medium text-gray-900 dark:text-slate-100">il y a {selectedClient.lastVisit} jours</span></p>
            <button
              onClick={() => setSelectedClient(null)}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isAddClientOpen}
        title="Ajouter un client"
        onClose={() => setIsAddClientOpen(false)}
        actions={
          <>
            <button
              onClick={() => setIsAddClientOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateClient}
              disabled={!clientForm.name || !clientForm.phone || !clientForm.vehicle}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !clientForm.name || !clientForm.phone || !clientForm.vehicle
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              value={clientForm.name}
              onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-all duration-200"
              placeholder="Ex: Ahmed Ben Ali"
            />
            {clientErrors.name && <p className="mt-1 text-xs text-red-600">{clientErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              value={clientForm.phone}
              onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-all duration-200"
              placeholder="Ex: 06 11 22 33 44"
            />
            {clientErrors.phone && <p className="mt-1 text-xs text-red-600">{clientErrors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule</label>
            <input
              value={clientForm.vehicle}
              onChange={(e) => setClientForm({ ...clientForm, vehicle: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-all duration-200"
              placeholder="Ex: TMAX 125"
            />
            {clientErrors.vehicle && <p className="mt-1 text-xs text-red-600">{clientErrors.vehicle}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation</label>
            <input
              value={clientForm.immatriculation}
              onChange={(e) => setClientForm({ ...clientForm, immatriculation: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 transition-all duration-200"
              placeholder="Ex: AA-123-BB"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={clientForm.vip}
              onChange={(e) => setClientForm({ ...clientForm, vip: e.target.checked })}
              id="vip-client"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="vip-client" className="text-sm text-gray-700">VIP</label>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </PageLayout>
  );
}

