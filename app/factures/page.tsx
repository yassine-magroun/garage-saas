'use client';

import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Plus, Eye, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const initialInvoices = [
  {
    number: 'FAC-2026-001',
    client: 'Ahmed Ben Ali',
    vehicle: 'TMAX 125',
    date: '15/01/2026',
    amount: '120€',
    status: 'Payée',
  },
  {
    number: 'FAC-2026-002',
    client: 'Karim Dupont',
    vehicle: 'Yamaha XMAX 300',
    date: '28/01/2026',
    amount: '230€',
    status: 'Payée',
  },
  {
    number: 'FAC-2026-003',
    client: 'Sami Trabelsi',
    vehicle: 'Piaggio Liberty 125',
    date: '05/02/2026',
    amount: '85€',
    status: 'Payée',
  },
  {
    number: 'FAC-2026-004',
    client: 'Youssef Martin',
    vehicle: 'Honda PCX 125',
    date: '12/02/2026',
    amount: '65€',
    status: 'En attente',
  },
  {
    number: 'FAC-2026-005',
    client: 'Fatima Zahra',
    vehicle: 'Kymco Agility 125',
    date: '18/02/2026',
    amount: '95€',
    status: 'Payée',
  },
  {
    number: 'FAC-2026-006',
    client: 'Mohamed Alami',
    vehicle: 'Peugeot Tweet 125',
    date: '25/02/2026',
    amount: '150€',
    status: 'Payée',
  },
  {
    number: 'FAC-2026-007',
    client: 'Leila Bouazza',
    vehicle: 'Sym Symphony 125',
    date: '03/03/2026',
    amount: '75€',
    status: 'En attente',
  },
  {
    number: 'FAC-2026-008',
    client: 'Ahmed Ben Ali',
    vehicle: 'TMAX 125',
    date: '08/03/2026',
    amount: '320€',
    status: 'En retard',
  },
  {
    number: 'FAC-2026-009',
    client: 'Nadia El Mansouri',
    vehicle: 'Honda Forza 300',
    date: '12/03/2026',
    amount: '180€',
    status: 'Payée',
  },
  {
    number: 'FAC-2026-010',
    client: 'Karim Dupont',
    vehicle: 'Yamaha XMAX 300',
    date: '15/03/2026',
    amount: '95€',
    status: 'En attente',
  },
  {
    number: 'FAC-2026-011',
    client: 'Rachid Tazi',
    vehicle: 'Piaggio MP3 300',
    date: '18/03/2026',
    amount: '450€',
    status: 'Payée',
  },
  {
    number: 'FAC-2026-012',
    client: 'Sofia Bennani',
    vehicle: 'Kymco Xciting 400',
    date: '22/03/2026',
    amount: '210€',
    status: 'En attente',
  },
];

const statusPalette: Record<string, string> = {
  Payée: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'En attente': 'bg-amber-50 text-amber-700 border border-amber-200',
  'En retard': 'bg-red-50 text-red-700 border border-red-200',
};

const defaultClients = [
  'Ahmed Ben Ali',
  'Karim Dupont',
  'Sami Trabelsi',
  'Youssef Martin',
  'Fatima Zahra',
  'Mohamed Alami',
  'Leila Bouazza',
  'Nadia El Mansouri',
  'Rachid Tazi',
  'Sofia Bennani'
];

const interventions = [
  'Révision complète',
  'Vidange & freinage',
  'Réparation embrayage',
  'Batterie & électrique',
  'Réparation freins',
  'Changement pneus',
  'Réparation moteur',
  'Révision distribution',
  'Réparation suspension',
  'Contrôle technique'
];

export default function FacturesPage() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<typeof initialInvoices[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({
    client: '',
    vehicle: '',
    amount: '',
    date: '',
  });
  const [clientsList, setClientsList] = useState(defaultClients);
  const [garageName, setGarageName] = useState('2roues Pasteur');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      try {
        const parsed = JSON.parse(savedClients);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClientsList(parsed.map((c: any) => c.name || c));
        }
      } catch {
      }
    }

    const savedParams = localStorage.getItem('params');
    if (savedParams) {
      try {
        const parsed = JSON.parse(savedParams);
        if (parsed?.garageName) setGarageName(parsed.garageName);
      } catch {
      }
    }
  }, []);

  const totalFactures = invoices.length;
  const totalFacture = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount.replace('€', '')), 0);
  const montantPaye = invoices.filter(inv => inv.status === 'Payée').reduce((sum, inv) => sum + parseFloat(inv.amount.replace('€', '')), 0);
  const montantAttente = totalFacture - montantPaye;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('factures');
    if (stored) {
      try { setInvoices(JSON.parse(stored)); } catch { }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('factures', JSON.stringify(invoices));
  }, [invoices]);

  const handleCreateInvoice = () => {
    if (!form.client || !form.vehicle || !form.amount || !form.date) {
      setToast({ message: 'Tous les champs sont nécessaires', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const newInvoice = {
      number: `FAC-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      client: form.client,
      vehicle: form.vehicle,
      date: form.date,
      amount: `${form.amount}€`,
      status: 'En attente',
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setForm({ client: '', vehicle: '', amount: '', date: '' });
    setIsModalOpen(false);
    setToast({ message: 'Facture créée avec succès !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const markAsPaid = (number: string) => {
    setInvoices(invoices.map(inv => inv.number === number ? { ...inv, status: 'Payée' } : inv));
    setToast({ message: 'Facture marquée comme payée !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activePage="factures" garageName={garageName} />

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Factures</h1>
              <p className="text-sm text-gray-500 mt-1">Suivez les factures émises du garage</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Créer une facture
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total factures</p>
                  <p className="text-4xl font-semibold text-gray-900">{totalFactures}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Montant total facturé</p>
                  <p className="text-4xl font-semibold text-gray-900">{totalFacture}€</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Montant payé</p>
                  <p className="text-4xl font-semibold text-emerald-600">{montantPaye}€</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Montant en attente</p>
                  <p className="text-4xl font-semibold text-amber-600">{montantAttente}€</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex gap-2 border-b border-gray-100">
            <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 -mb-px">Toutes</button>
            <button className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Payées</button>
            <button className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">En attente</button>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {invoices.map((invoice) => (
              <article
                key={invoice.number}
                className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <h2 className="font-medium text-gray-900 text-sm">{invoice.number}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{invoice.client}</p>
                    <p className="text-xs text-gray-500">{invoice.vehicle}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded border ${statusPalette[invoice.status]}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      invoice.status === 'Payée' ? 'bg-emerald-500' :
                      invoice.status === 'En attente' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></div>
                    {invoice.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-6 text-xs text-gray-600 mb-4">
                  <span className="flex items-center gap-2">
                    <span>📅</span>
                    {invoice.date}
                  </span>
                  <span className="flex items-center gap-2 font-semibold text-gray-900">
                    <span>💰</span>
                    {invoice.amount}
                  </span>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => setSelectedInvoice(invoice)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 active:bg-blue-200 transition-colors duration-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Voir
                  </button>

                  {invoice.status === 'En attente' && (
                    <button
                      onClick={() => markAsPaid(invoice.number)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 active:bg-emerald-200 transition-colors duration-200"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Payer
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>

          <div className="bg-white border border-gray-100 rounded-lg p-6 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{totalFactures} factures affichées</p>
          </div>
        </main>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Détails de la facture</h3>
            <p className="text-sm text-gray-600">Numéro : <span className="font-medium text-gray-900">{selectedInvoice.number}</span></p>
            <p className="text-sm text-gray-600">Client : <span className="font-medium text-gray-900">{selectedInvoice.client}</span></p>
            <p className="text-sm text-gray-600">Véhicule : <span className="font-medium text-gray-900">{selectedInvoice.vehicle}</span></p>
            <p className="text-sm text-gray-600">Date : <span className="font-medium text-gray-900">{selectedInvoice.date}</span></p>
            <p className="text-sm text-gray-600">Montant : <span className="font-medium text-gray-900">{selectedInvoice.amount}</span></p>
            <p className="text-sm text-gray-600">Statut : <span className="font-medium text-gray-900">{selectedInvoice.status}</span></p>
            <button
              onClick={() => setSelectedInvoice(null)}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        title="Créer une facture"
        onClose={() => setIsModalOpen(false)}
        actions={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateInvoice}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Enregistrer
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client</label>
            <select
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Sélectionner un client</option>
              {clientsList.map((client) => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Véhicule</label>
            <input
              value={form.vehicle}
              onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Ex: TMAX 125"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (€)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: 150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  );
}