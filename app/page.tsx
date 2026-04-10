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

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline() {
  return (
    <svg viewBox="0 0 80 28" fill="none" width="80" height="28" aria-hidden="true">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B2B" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF6B2B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,24 L10,20 L20,18 L30,13 L40,16 L50,9 L60,6 L70,4 L80,2 L80,28 L0,28 Z"
        fill="url(#sparkGrad)"
      />
      <path
        d="M0,24 L10,20 L20,18 L30,13 L40,16 L50,9 L60,6 L70,4 L80,2"
        stroke="#FF6B2B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border border-[#FF6B2B]/15 p-6 animate-pulse backdrop-blur-[12px]"
      style={{ background: 'rgba(26,29,39,0.8)' }}
    >
      <div className="flex flex-col gap-4">
        <div className="w-9 h-9 bg-[#2A2D3A] rounded-lg" />
        <div className="space-y-2">
          <div className="h-3 bg-[#2A2D3A] rounded w-2/3" />
          <div className="h-7 bg-[#2A2D3A] rounded w-3/4" />
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
  dominant?: boolean;
}

function KpiCard({ icon, iconBg, label, value, sub, dominant }: KpiCardProps) {
  return (
    <div
      className="relative rounded-2xl border border-[#FF6B2B]/15 p-6 backdrop-blur-[12px] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#FF6B2B]/40 hover:shadow-[0_8px_32px_rgba(255,107,43,0.10)]"
      style={{
        background: dominant
          ? 'linear-gradient(135deg, rgba(255,107,43,0.12) 0%, rgba(26,29,39,0.8) 65%)'
          : 'rgba(26,29,39,0.8)',
      }}
    >
      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-start justify-between">
          <div className={`p-2 ${iconBg} rounded-lg w-fit`}>{icon}</div>
          {dominant && <Sparkline />}
        </div>
        <div>
          <p className="text-xs md:text-sm font-medium text-[#8B8FA8]">{label}</p>
          <p
            className={`font-bold text-white mt-1 leading-tight tabular-nums ${
              dominant ? 'text-3xl' : 'text-xl md:text-2xl'
            }`}
          >
            {value}
          </p>
          {sub && <div className="mt-1.5">{sub}</div>}
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
    <PageLayout activePage="dashboard">
      <main className="flex-1 p-4 md:p-8 space-y-5 md:space-y-7 overflow-y-auto">

        {/* ── ELEMENT 1: North Star Hero ─────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl flex items-center justify-between px-6 md:px-10 border border-[#FF6B2B]/15"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(255,107,43,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(255,107,43,0.08) 0%, transparent 50%),
              #0F1117
            `,
            minHeight: '140px',
          }}
        >
          {/* Subtle grid texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
            }}
          />

          {/* Left: copy */}
          <div className="relative flex flex-col gap-2.5 py-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FF6B2B]/15 text-[#FF6B2B] border border-[#FF6B2B]/25 w-fit">
              ⚡ Garage actif
            </span>
            <h1 className="text-2xl md:text-[32px] font-bold text-white leading-tight tracking-tight">
              Bonjour, MecaniGo
            </h1>
            <p className="text-sm text-[#8B8FA8]">Votre garage en un coup d&apos;œil</p>
          </div>

        </div>

        {/* ── ELEMENT 3: Stat Pills ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#8B8FA8]">
          <span>
            🔧{' '}
            <span className="text-[#FF6B2B] font-semibold tabular-nums">
              {stats ? stats.activeInterventionsCount : '—'}
            </span>{' '}
            en cours
          </span>
          <span className="text-[#2A2D3A] hidden sm:inline">·</span>
          <span>
            📋{' '}
            <span className="text-[#FF6B2B] font-semibold tabular-nums">
              {stats ? stats.pendingInvoicesCount : '—'}
            </span>{' '}
            factures en attente
          </span>
          <span className="text-[#2A2D3A] hidden sm:inline">·</span>
          <span>
            💰{' '}
            <span className="text-[#FF6B2B] font-semibold tabular-nums">
              {stats ? fmtCurrency(stats.caThisMonth) : '—'}
            </span>{' '}
            ce mois
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ── ELEMENT 2: Glassmorphism KPI Grid ─────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* 1 — CA ce mois — DOMINANT */}
              <KpiCard
                dominant
                icon={<Euro className="w-5 h-5 text-[#FF6B2B]" />}
                iconBg="bg-[#FF6B2B]/15"
                label="CA ce mois"
                value={stats ? fmtCurrency(stats.caThisMonth) : '—'}
              />

              {/* 2 — CA mois dernier */}
              <KpiCard
                icon={<Euro className="w-5 h-5 text-blue-400" />}
                iconBg="bg-blue-500/15"
                label="CA mois dernier"
                value={stats ? fmtCurrency(stats.caLastMonth) : '—'}
              />

              {/* 3 — Évolution % */}
              <KpiCard
                icon={
                  evolution !== null && evolution >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )
                }
                iconBg={evolution !== null && evolution >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}
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
                        evolution >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      vs mois dernier
                    </span>
                  ) : undefined
                }
              />

              {/* 4 — Factures en attente */}
              <KpiCard
                icon={<Clock className="w-5 h-5 text-amber-400" />}
                iconBg="bg-amber-500/15"
                label="Factures en attente"
                value={stats ? String(stats.pendingInvoicesCount) : '—'}
                sub={
                  stats && stats.pendingInvoicesAmount > 0 ? (
                    <span className="text-xs text-amber-400 font-medium">
                      {fmtCurrency(stats.pendingInvoicesAmount)}
                    </span>
                  ) : undefined
                }
              />

              {/* 5 — Interventions actives */}
              <KpiCard
                icon={<Wrench className="w-5 h-5 text-purple-400" />}
                iconBg="bg-purple-500/15"
                label="Interventions actives"
                value={stats ? String(stats.activeInterventionsCount) : '—'}
              />

              {/* 6 — Devis en cours */}
              <KpiCard
                icon={<FileText className="w-5 h-5 text-[#FF6B2B]" />}
                iconBg="bg-[#FF6B2B]/15"
                label="Devis en cours"
                value={stats ? String(stats.activeDevisCount) : '—'}
                sub={
                  stats && stats.activeDevisCount > 0 ? (
                    <Link
                      href="/devis"
                      className="text-xs text-[#FF6B2B] hover:text-[#FF8C55] font-medium"
                    >
                      Voir les devis →
                    </Link>
                  ) : undefined
                }
              />
            </>
          )}
        </div>

        {/* ── Recent Activity + Recent Clients ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">
              Activité récente
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/15 rounded-lg mt-0.5 flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-white">
                    Facture FAC-2026-012 créée pour Sofia Bennani
                  </p>
                  <p className="text-xs text-[#8B8FA8] mt-0.5">Il y a 2h</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/15 rounded-lg mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-white">
                    Intervention terminée pour Nadia El Mansouri
                  </p>
                  <p className="text-xs text-[#8B8FA8] mt-0.5">Il y a 4h</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/15 rounded-lg mt-0.5 flex-shrink-0">
                  <Wrench className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-white">
                    Réparation embrayage en cours pour Ahmed Ben Ali
                  </p>
                  <p className="text-xs text-[#8B8FA8] mt-0.5">Il y a 6h</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/15 rounded-lg mt-0.5 flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-white">
                    Client ajouté : Rachid Tazi
                  </p>
                  <p className="text-xs text-[#8B8FA8] mt-0.5">Hier</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold text-white">Clients récents</h3>
              <Link
                href="/clients"
                className="text-xs md:text-sm text-[#FF6B2B] hover:text-[#FF8C55] font-medium flex items-center gap-1 hover:bg-[#FF6B2B]/10 px-2 md:px-3 py-1.5 rounded-lg transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Voir tous</span>
                <span className="md:hidden">Voir</span>
              </Link>
            </div>
            <ul className="space-y-3">
              {[
                { initials: 'AB', bg: 'bg-blue-500/20', text: 'text-blue-300', name: 'Ahmed Ben Ali', vehicle: 'TMAX 125' },
                { initials: 'KD', bg: 'bg-emerald-500/20', text: 'text-emerald-300', name: 'Karim Dupont', vehicle: 'Yamaha XMAX 300' },
                { initials: 'FZ', bg: 'bg-purple-500/20', text: 'text-purple-300', name: 'Fatima Zahra', vehicle: 'Kymco Agility 125' },
                { initials: 'NM', bg: 'bg-amber-500/20', text: 'text-amber-300', name: 'Nadia El Mansouri', vehicle: 'Honda Forza 300' },
              ].map((c) => (
                <li key={c.initials} className="flex items-center gap-3">
                  <div
                    className={`w-9 md:w-10 h-9 md:h-10 ${c.bg} rounded-lg flex items-center justify-center text-xs font-semibold ${c.text} flex-shrink-0`}
                  >
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-[#8B8FA8] truncate">{c.vehicle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-5">
            Actions rapides
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/interventions?openModal=true"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E55A1F] transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Nouvelle intervention</span>
              <span className="md:hidden">Intervention</span>
            </Link>
            <Link
              href="/factures"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-[#2A2D3A] text-white rounded-lg hover:bg-white/10 transition-colors font-medium text-sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Créer une facture</span>
              <span className="md:hidden">Facture</span>
            </Link>
            <Link
              href="/devis"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-[#2A2D3A] text-white rounded-lg hover:bg-white/10 transition-colors font-medium text-sm"
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
