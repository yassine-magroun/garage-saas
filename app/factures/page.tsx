'use client';

import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Plus, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

const initialInvoices = [
  {
    id: '1',
    clientId: '1',
    interventionId: '1',
    amount: 120,
    status: 'Payée',
    date: '15/01/2026',
  },
];

export default function FacturesPage() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [clients, setClients] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<typeof initialInvoices[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [garageName, setGarageName] = useState('2roues Pasteur');
  const [form, setForm] = useState({
    clientId: '',
    interventionId: '',
    amount: '',
    date: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('factures');
    if (stored) {
      try { setInvoices(JSON.parse(stored)); } catch { }
    }

    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      try { setClients(JSON.parse(savedClients)); } catch { }
    }

    const savedInterventions = localStorage.getItem('interventions');
    if (savedInterventions) {
      try { setInterventions(JSON.parse(savedInterventions)); } catch { }
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
    localStorage.setItem('factures', JSON.stringify(invoices));
  }, [invoices]);

  const totalFactures = invoices.length;
  const totalFacture = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const montantPaye = invoices.filter(inv => inv.status === 'Payée').reduce((sum, inv) => sum + inv.amount, 0);
  const montantAttente = totalFacture - montantPaye;

  const handleCreateInvoice = () => {
    if (!form.clientId || !form.interventionId || !form.amount || !form.date) {
      setToast({ message: 'Tous les champs sont nécessaires', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const newInvoice = {
      id: Date.now().toString(),
      clientId: form.clientId,
      interventionId: form.interventionId,
      amount: parseFloat(form.amount),
      status: 'En attente',
      date: form.date,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setForm({ clientId: '', interventionId: '', amount: '', date: '' });
    setIsModalOpen(false);
    setToast({ message: 'Facture créée avec succès !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const markAsPaid = (id: string) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'Payée' } : inv));
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {invoices.map((invoice) => {
              const client = clients.find(c => c.id === invoice.clientId);
              const intervention = interventions.find(i => i.id === invoice.interventionId);
              return (
                <article
                  key={invoice.id}
                  className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-medium text-gray-900 text-sm">Facture {invoice.id}</h2>
                      <p className="text-xs text-gray-500 mt-1">{invoice.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'Payée' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        invoice.status === 'En attente' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">Client:</span> {client?.name || 'Client inconnu'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">Intervention:</span> {intervention?.type || 'Intervention inconnue'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">Montant:</span> {invoice.amount}€
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="bg-white border border-gray-100 rounded-lg p-6 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{invoices.length} factures affichées</p>
          </div>
        </main>
      </div>

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
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Intervention</label>
            <select
              value={form.interventionId}
              onChange={(e) => setForm({ ...form, interventionId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Sélectionner une intervention</option>
              {interventions.map(intervention => (
                <option key={intervention.id} value={intervention.id}>
                  {intervention.type}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (€)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
                placeholder="Ex: 150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>
      </Modal>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Détails de la facture</h3>
            <p className="text-sm text-gray-600">Numéro : <span className="font-medium text-gray-900">FAC-{selectedInvoice.id}</span></p>
            <p className="text-sm text-gray-600">Client : <span className="font-medium text-gray-900">{clients.find(c => c.id === selectedInvoice.clientId)?.name || 'Client inconnu'}</span></p>
            <p className="text-sm text-gray-600">Intervention : <span className="font-medium text-gray-900">{interventions.find(i => i.id === selectedInvoice.interventionId)?.type || 'Intervention inconnue'}</span></p>
            <p className="text-sm text-gray-600">Véhicule : <span className="font-medium text-gray-900">{interventions.find(i => i.id === selectedInvoice.interventionId)?.vehicle || 'Véhicule inconnu'}</span></p>
            <p className="text-sm text-gray-600">Date : <span className="font-medium text-gray-900">{selectedInvoice.date}</span></p>
            <p className="text-sm text-gray-600">Montant : <span className="font-medium text-gray-900">{selectedInvoice.amount}€</span></p>
            <p className="text-sm text-gray-600">Statut : <span className="font-medium text-gray-900">{selectedInvoice.status}</span></p>
            {selectedInvoice.status !== 'Payée' && (
              <button
                onClick={() => {
                  markAsPaid(selectedInvoice.id);
                  setSelectedInvoice(null);
                }}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Marquer comme payée
              </button>
            )}
            <button
              onClick={() => setSelectedInvoice(null)}
              className="mt-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}