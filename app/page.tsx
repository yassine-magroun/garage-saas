'use client';

import React, { useState, useEffect } from 'react';
import PageLayout from './components/PageLayout';
import {
  Receipt,
  Euro,
  Clock,
  Users,
  FileText,
  CheckCircle,
  Wrench,
  UserPlus,
  Eye,
  Plus,
} from 'lucide-react';

const initialDashboardFactures = [
  { amount: 120, status: 'Payée' },
  { amount: 230, status: 'Payée' },
  { amount: 85, status: 'Payée' },
  { amount: 65, status: 'En attente' },
  { amount: 95, status: 'Payée' },
  { amount: 150, status: 'Payée' },
  { amount: 75, status: 'En attente' },
];

const initialClients = [
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

const initialDashboardInterventions = [
  { status: 'En cours' },
  { status: 'Terminé' },
  { status: 'En cours' },
  { status: 'Planifié' },
  { status: 'En cours' },
  { status: 'Terminé' },
];

export default function HomePage() {
  const [factures, setFactures] = useState(initialDashboardFactures);
  const [interventions, setInterventions] = useState(initialDashboardInterventions);
  const [clients, setClients] = useState(initialClients.map((name) => ({ name })));
  const [garageName, setGarageName] = useState('2roues Pasteur');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedFactures = localStorage.getItem('factures');
    const savedInterventions = localStorage.getItem('interventions');
    if (savedFactures) {
      try { setFactures(JSON.parse(savedFactures)); } catch { }
    }
    if (savedInterventions) {
      try { setInterventions(JSON.parse(savedInterventions)); } catch { }
    }

    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      try {
        const parsedClients = JSON.parse(savedClients);
        if (Array.isArray(parsedClients)) {
          setClients(parsedClients.map((c: any) => ({ name: c.name || c }))); 
        }
      } catch { }
    }

    const savedSettings = localStorage.getItem('params');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings?.garageName) {
          setGarageName(parsedSettings.garageName);
        }
      } catch { }
    }
  }, []);

  const totalFactures = factures.length;
  const caTotal = factures.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const interventionsEnCours = interventions.filter((i) => i.status === 'En cours').length;
  const totalClients = clients.length;

  // Fonction helper pour afficher les montants de façon sécurisée
  const formatAmount = (amount: any) => {
    const num = Number(amount);
    return isNaN(num) ? '0' : num.toFixed(0);
  };

  return (
    <PageLayout activePage="dashboard" garageName={garageName}>
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 md:py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Tableau de bord</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Bienvenue sur l'espace de gestion</p>
          </div>
          <div className="flex items-center flex-shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              Garage actif
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
        {/* KPI Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="p-2 bg-blue-50 rounded-lg w-fit">
                <Receipt className="w-4 md:w-5 h-4 md:h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Factures</p>
                <p className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">{totalFactures}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg w-fit">
                <Euro className="w-4 md:w-5 h-4 md:h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">CA factures</p>
                <p className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">{formatAmount(caTotal)}€</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="p-2 bg-amber-50 rounded-lg w-fit">
                <Clock className="w-4 md:w-5 h-4 md:h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">En cours</p>
                <p className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">{interventionsEnCours}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="p-2 bg-purple-50 rounded-lg w-fit">
                <Users className="w-4 md:w-5 h-4 md:h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Clients</p>
                <p className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">{totalClients}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity and Clients - Stack on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-6">
          {/* Activité récente */}
          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Activité récente</h3>
            <ul className="space-y-3 md:space-y-4">
              <li className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg mt-0.5 flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 break-words">Facture FAC-2026-012 créée pour Sofia Bennani</p>
                  <p className="text-xs text-gray-500 mt-1">Il y a 2h</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 break-words">Intervention terminée pour Nadia El Mansouri</p>
                  <p className="text-xs text-gray-500 mt-1">Il y a 4h</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-lg mt-0.5 flex-shrink-0">
                  <Wrench className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 break-words">Réparation embrayage en cours pour Ahmed Ben Ali</p>
                  <p className="text-xs text-gray-500 mt-1">Il y a 6h</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg mt-0.5 flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 break-words">Client ajouté : Rachid Tazi</p>
                  <p className="text-xs text-gray-500 mt-1">Hier</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Clients récents */}
          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Clients récents</h3>
              <button className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center hover:bg-blue-50 px-2 md:px-3 py-1.5 rounded-lg transition-all duration-200 flex-shrink-0">
                <Eye className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                <span className="hidden md:inline">Voir tous</span>
                <span className="md:hidden">Voir</span>
              </button>
            </div>
            <ul className="space-y-3 md:space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-9 md:w-10 h-9 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                  AB
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">Ahmed Ben Ali</p>
                  <p className="text-xs text-gray-500 truncate">TMAX 125</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-9 md:w-10 h-9 md:h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xs font-semibold text-emerald-700 flex-shrink-0">
                  KD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">Karim Dupont</p>
                  <p className="text-xs text-gray-500 truncate">Yamaha XMAX 300</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-9 md:w-10 h-9 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xs font-semibold text-purple-700 flex-shrink-0">
                  FZ
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">Fatima Zahra</p>
                  <p className="text-xs text-gray-500 truncate">Kymco Agility 125</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-9 md:w-10 h-9 md:h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xs font-semibold text-amber-700 flex-shrink-0">
                  NM
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">Nadia El Mansouri</p>
                  <p className="text-xs text-gray-500 truncate">Honda Forza 300</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions rapides - Full width buttons on mobile */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <button className="flex items-center justify-center px-4 md:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 font-medium text-sm shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Nouvelle intervention</span>
              <span className="md:hidden">Intervention</span>
            </button>
            <button className="flex items-center justify-center px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors duration-200 font-medium text-sm shadow-sm">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Créer une facture</span>
              <span className="md:hidden">Facture</span>
            </button>
            <button className="flex items-center justify-center px-4 md:px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors duration-200 font-medium text-sm shadow-sm">
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Ajouter un client</span>
              <span className="md:hidden">Client</span>
            </button>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
