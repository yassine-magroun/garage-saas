'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import {
  Receipt,
  Euro,
  Clock,
  Users,
  FileText,
  CheckCircle,
  Wrench,
  UserPlus,
  Phone,
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
  const caTotal = factures.reduce((sum, f) => {
    const raw = typeof f.amount === 'string' ? (f.amount as string).replace('€', '').trim() : String(f.amount);
    return sum + (Number(raw) || 0);
  }, 0);
  const interventionsEnCours = interventions.filter((i) => i.status === 'En cours').length;
  const totalClients = clients.length;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('dashboardFactures', JSON.stringify(factures));
  }, [factures]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('dashboardInterventions', JSON.stringify(interventions));
  }, [interventions]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activePage="dashboard" garageName={garageName} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Tableau de bord</h1>
              <p className="text-sm text-gray-500 mt-2">Bienvenue sur l'espace de gestion de 2roues Pasteur</p>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                Garage en activité
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Factures enregistrées</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{totalFactures}</p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">CA (factures)</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{caTotal.toFixed(0)}€</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg">
                  <Euro className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Interventions en cours</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{interventionsEnCours}</p>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total clients</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{totalClients}</p>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity and Recent Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activité récente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Activité récente</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Facture FAC-2026-012 créée pour Sofia Bennani</p>
                    <p className="text-xs text-gray-500 mt-1">Il y a 2h</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg mt-0.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Intervention terminée pour Nadia El Mansouri</p>
                    <p className="text-xs text-gray-500 mt-1">Il y a 4h</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg mt-0.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Réparation embrayage en cours pour Ahmed Ben Ali</p>
                    <p className="text-xs text-gray-500 mt-1">Il y a 6h</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg mt-0.5">
                    <UserPlus className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Client ajouté : Rachid Tazi</p>
                    <p className="text-xs text-gray-500 mt-1">Hier</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Clients récents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Clients récents</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all duration-200">
                  <Eye className="w-4 h-4 mr-1.5" />
                  Voir tous
                </button>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-semibold text-blue-700">
                    AB
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Ahmed Ben Ali</p>
                    <p className="text-xs text-gray-500">TMAX 125</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xs font-semibold text-emerald-700">
                    KD
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Karim Dupont</p>
                    <p className="text-xs text-gray-500">Yamaha XMAX 300</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xs font-semibold text-purple-700">
                    FZ
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Fatima Zahra</p>
                    <p className="text-xs text-gray-500">Kymco Agility 125</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xs font-semibold text-amber-700">
                    NM
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Nadia El Mansouri</p>
                    <p className="text-xs text-gray-500">Honda Forza 300</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 font-medium text-sm shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle intervention
              </button>
              <button className="flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors duration-200 font-medium text-sm shadow-sm">
                <FileText className="w-4 h-4 mr-2" />
                Créer une facture
              </button>
              <button className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors duration-200 font-medium text-sm shadow-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter un client
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
