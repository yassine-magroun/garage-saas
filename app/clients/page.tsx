'use client';

import PageLayout from '../components/PageLayout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Search, Phone, Eye, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { clientsAPI } from '../../lib/api';
import type { Client } from '../../lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '', phone: '', vehicle: '', immatriculation: '', vip: false,
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load clients from Supabase on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await clientsAPI.getAll();
        setClients(data);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erreur chargement clients', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const filteredClients = searchQuery.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery) ||
          (c.vehicle ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : clients;

  const stats = [
    { title: 'Total clients', value: clients.length },
    { title: 'Clients VIP', value: clients.filter((c) => c.vip).length },
    { title: 'Nouveaux ce mois', value: Math.min(5, clients.length) },
    { title: 'Clients actifs', value: Math.max(0, clients.length - 2) },
  ];

  const callClient = (phone: string) => {
    window.open(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleCreateClient = async () => {
    if (!clientForm.name || !clientForm.phone || !clientForm.vehicle) {
      showToast('Tous les champs sont nécessaires', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const created = await clientsAPI.create({
        name: clientForm.name,
        phone: clientForm.phone,
        vehicle: clientForm.vehicle,
        licensePlate: clientForm.immatriculation || undefined,
        vip: clientForm.vip,
        lastVisit: 0,
      });
      setClients((prev) => [created, ...prev]);
      setClientForm({ name: '', phone: '', vehicle: '', immatriculation: '', vip: false });
      setIsAddClientOpen(false);
      showToast('Client ajouté avec succès !', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur création client', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout activePage="clients">
      <header className="bg-[#1A1D27] border-b border-[#2A2D3A] px-4 md:px-8 py-4 md:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Clients</h1>
            <p className="text-sm text-[#8B8FA8] mt-1">Gérez vos clients</p>
          </div>
          <button
            onClick={() => setIsAddClientOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E55A1F] transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        {/* Stats */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.title} className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-5">
              <p className="text-sm font-medium text-[#8B8FA8]">{stat.title}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        {/* Search */}
        <section className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8B8FA8] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un client, un téléphone ou un véhicule"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#2A2D3A] rounded-lg bg-[#0F1117] text-white text-sm placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50 focus:border-[#FF6B2B]/50 transition-all"
            />
          </div>
        </section>

        {/* Client cards */}
        {isLoading ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl animate-pulse" />
            ))}
          </section>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-16 text-[#8B8FA8] text-sm">
            {searchQuery ? `Aucun client trouvé pour "${searchQuery}"` : 'Aucun client — ajoutez-en un !'}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.map((client) => {
              const initials = client.name
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <article
                  key={client.id}
                  className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-5 hover:border-[#3A3D4A] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FF6B2B]/10 rounded-lg flex items-center justify-center text-sm font-semibold text-[#FF6B2B]">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-medium text-white text-sm">{client.name}</h3>
                        <p className="text-xs text-[#8B8FA8]">{client.vehicle ?? '—'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded border ${
                      client.vip
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${client.vip ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                      {client.vip ? 'VIP' : 'Actif'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs text-[#8B8FA8]">
                      {client.lastVisit > 0
                        ? `Dernière visite: il y a ${client.lastVisit} jours`
                        : 'Nouveau client'}
                    </span>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => callClient(client.phone)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2D3A] text-xs font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Appeler
                    </button>
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 text-xs font-medium text-[#FF6B2B] hover:bg-[#FF6B2B]/20 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Voir
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6 text-sm text-[#8B8FA8]">
          <p className="font-semibold text-white">Résumé</p>
          <p className="mt-2">{filteredClients.length} clients affichés</p>
        </div>
      </main>

      {/* Client detail modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Fiche client</h3>
            <div className="space-y-2">
              <p className="text-sm text-[#8B8FA8]">Nom : <span className="font-medium text-white">{selectedClient.name}</span></p>
              <p className="text-sm text-[#8B8FA8]">Téléphone : <span className="font-medium text-white">{selectedClient.phone}</span></p>
              <p className="text-sm text-[#8B8FA8]">Véhicule : <span className="font-medium text-white">{selectedClient.vehicle ?? '—'}</span></p>
              <p className="text-sm text-[#8B8FA8]">Immatriculation : <span className="font-medium text-white">{selectedClient.licensePlate ?? 'Non spécifiée'}</span></p>
              <p className="text-sm text-[#8B8FA8]">Email : <span className="font-medium text-white">{selectedClient.email ?? '—'}</span></p>
              <p className="text-sm text-[#8B8FA8]">VIP : <span className="font-medium text-white">{selectedClient.vip ? 'Oui' : 'Non'}</span></p>
              <p className="text-sm text-[#8B8FA8]">Dernière visite : <span className="font-medium text-white">
                {selectedClient.lastVisit > 0 ? `il y a ${selectedClient.lastVisit} jours` : 'Nouveau client'}
              </span></p>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="mt-5 w-full px-4 py-2.5 bg-[#FF6B2B] text-white rounded-lg font-medium hover:bg-[#E55A1F] transition-colors text-sm"
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
              className="px-4 py-2 rounded-lg border border-[#2A2D3A] text-sm font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => void handleCreateClient()}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-[#FF6B2B] text-white text-sm font-medium hover:bg-[#E55A1F] disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Nom</label>
            <input
              value={clientForm.name}
              onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              className="w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Téléphone</label>
            <input
              value={clientForm.phone}
              onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
              className="w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Véhicule</label>
            <input
              value={clientForm.vehicle}
              onChange={(e) => setClientForm({ ...clientForm, vehicle: e.target.value })}
              className="w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8B8FA8] mb-1">Immatriculation</label>
            <input
              value={clientForm.immatriculation}
              onChange={(e) => setClientForm({ ...clientForm, immatriculation: e.target.value })}
              className="w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50"
              placeholder="Ex: AA-123-BB"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={clientForm.vip}
              onChange={(e) => setClientForm({ ...clientForm, vip: e.target.checked })}
              id="vip-client"
              className="h-4 w-4 rounded border-[#2A2D3A] accent-[#FF6B2B]"
            />
            <label htmlFor="vip-client" className="text-sm text-[#8B8FA8]">VIP</label>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </PageLayout>
  );
}
