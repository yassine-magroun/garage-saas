'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageLayout from './components/PageLayout';
import {
  Euro,
  TrendingUp,
  TrendingDown,
  Clock,
  Wrench,
  FileText,
  CheckCircle,
  UserPlus,
  Plus,
  Eye,
} from 'lucide-react';
import { getDashboardStats } from '../lib/api';
import { getGarageId } from '../lib/garage';
import type { DashboardStats } from '../lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function calcEvolution(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="w-9 h-9 bg-gray-100 rounded-lg" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-7 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: React.ReactNode;
}

function KpiCard({ icon, iconBg, label, value, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col gap-3">
        <div className={`p-2 ${iconBg} rounded-lg w-fit`}>{icon}</div>
        <div>
          <p className="text-xs md:text-sm font-medium text-gray-500">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 leading-tight">{value}</p>
          {sub && <div className="mt-1">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const garageId = await getGarageId();
        const s = await getDashboardStats(garageId);
        setStats(s);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur chargement');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const evolution = stats ? calcEvolution(stats.caThisMonth, stats.caLastMonth) : null;

  return (
    <PageLayout activePage="dashboard" garageName="2roues Pasteur">
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 md:py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Tableau de bord</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Bienvenue sur l&apos;espace de gestion
            </p>
          </div>
          <span className="inline-flex items-center self-start md:self-auto px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
            Garage actif
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* KPI Grid — 2 cols mobile, 3 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* 1 — CA ce mois */}
              <KpiCard
                icon={<Euro className="w-5 h-5 text-emerald-600" />}
                iconBg="bg-emerald-50"
                label="CA ce mois"
                value={stats ? fmtCurrency(stats.caThisMonth) : '—'}
              />

              {/* 2 — CA mois dernier */}
              <KpiCard
                icon={<Euro className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-50"
                label="CA mois dernier"
                value={stats ? fmtCurrency(stats.caLastMonth) : '—'}
              />

              {/* 3 — Évolution % */}
              <KpiCard
                icon={
                  evolution !== null && evolution >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )
                }
                iconBg={
                  evolution !== null && evolution >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                }
                label="Évolution CA"
                value={
                  evolution === null
                    ? '—'
                    : `${evolution >= 0 ? '+' : ''}${evolution.toFixed(1)} %`
                }
                sub={
                  evolution !== null ? (
                    <span
                      className={`text-xs font-medium ${
                        evolution >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      vs mois dernier
                    </span>
                  ) : undefined
                }
              />

              {/* 4 — Factures en attente */}
              <KpiCard
                icon={<Clock className="w-5 h-5 text-amber-600" />}
                iconBg="bg-amber-50"
                label="Factures en attente"
                value={stats ? String(stats.pendingInvoicesCount) : '—'}
                sub={
                  stats && stats.pendingInvoicesAmount > 0 ? (
                    <span className="text-xs text-amber-600 font-medium">
                      {fmtCurrency(stats.pendingInvoicesAmount)}
                    </span>
                  ) : undefined
                }
              />

              {/* 5 — Interventions actives */}
              <KpiCard
                icon={<Wrench className="w-5 h-5 text-purple-600" />}
                iconBg="bg-purple-50"
                label="Interventions actives"
                value={stats ? String(stats.activeInterventionsCount) : '—'}
              />

              {/* 6 — Devis en cours */}
              <KpiCard
                icon={<FileText className="w-5 h-5 text-indigo-600" />}
                iconBg="bg-indigo-50"
                label="Devis en cours"
                value={stats ? String(stats.activeDevisCount) : '—'}
                sub={
                  stats && stats.activeDevisCount > 0 ? (
                    <Link
                      href="/devis"
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Voir les devis →
                    </Link>
                  ) : undefined
                }
              />
            </>
          )}
        </div>

        {/* Recent Activity + Recent Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">
              Activité récente
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg mt-0.5 flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900">
                    Facture FAC-2026-012 créée pour Sofia Bennani
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Il y a 2h</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900">
                    Intervention terminée pour Nadia El Mansouri
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Il y a 4h</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-lg mt-0.5 flex-shrink-0">
                  <Wrench className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900">
                    Réparation embrayage en cours pour Ahmed Ben Ali
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Il y a 6h</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg mt-0.5 flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900">
                    Client ajouté : Rachid Tazi
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Hier</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Clients récents</h3>
              <Link
                href="/clients"
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:bg-blue-50 px-2 md:px-3 py-1.5 rounded-lg transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Voir tous</span>
                <span className="md:hidden">Voir</span>
              </Link>
            </div>
            <ul className="space-y-3">
              {[
                { initials: 'AB', bg: 'bg-blue-100', text: 'text-blue-700', name: 'Ahmed Ben Ali', vehicle: 'TMAX 125' },
                { initials: 'KD', bg: 'bg-emerald-100', text: 'text-emerald-700', name: 'Karim Dupont', vehicle: 'Yamaha XMAX 300' },
                { initials: 'FZ', bg: 'bg-purple-100', text: 'text-purple-700', name: 'Fatima Zahra', vehicle: 'Kymco Agility 125' },
                { initials: 'NM', bg: 'bg-amber-100', text: 'text-amber-700', name: 'Nadia El Mansouri', vehicle: 'Honda Forza 300' },
              ].map((c) => (
                <li key={c.initials} className="flex items-center gap-3">
                  <div
                    className={`w-9 md:w-10 h-9 md:h-10 ${c.bg} rounded-lg flex items-center justify-center text-xs font-semibold ${c.text} flex-shrink-0`}
                  >
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.vehicle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-5">
            Actions rapides
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/interventions"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Nouvelle intervention</span>
              <span className="md:hidden">Intervention</span>
            </Link>
            <Link
              href="/factures"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors font-medium text-sm shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Créer une facture</span>
              <span className="md:hidden">Facture</span>
            </Link>
            <Link
              href="/devis"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors font-medium text-sm shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Créer un devis</span>
              <span className="md:hidden">Devis</span>
            </Link>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
