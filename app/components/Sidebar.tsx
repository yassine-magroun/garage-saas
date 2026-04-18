'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, Wrench, FileText, ClipboardList,
  Settings, Zap, Package, BookOpen, Search, Plus,
  ShoppingCart, TrendingUp, Shield, ExternalLink,
  ArrowDownToLine,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { supabase } from '../../lib/supabase';
import { FLAGS } from '../../lib/feature-flags';

type ActivePage =
  | 'dashboard' | 'clients' | 'interventions' | 'factures' | 'devis'
  | 'stock' | 'parametres' | 'livre-de-police' | 'factures-achats';

interface Badge { count: number; color: 'red' | 'orange' | 'default' }

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: Badge;
  external?: boolean;
  tag?: string;
}

interface NavSection { title: string; items: NavItem[] }

function BadgeDot({ badge }: { badge: Badge }) {
  if (!badge.count) return null;
  const colors = {
    red: 'bg-red-500/20 text-red-400 border border-red-500/30',
    orange: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    default: 'bg-[#2A2D3A] text-[#8B8FA8] border border-[#3A3D4A]',
  };
  return (
    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors[badge.color]}`}>
      {badge.count > 99 ? '99+' : badge.count}
    </span>
  );
}

export default function Sidebar({ activePage }: { activePage: ActivePage; garageName?: string }) {
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [healthOk, setHealthOk] = useState<boolean | null>(null);

  const garageIdRef = useRef<string | null>(null);

  // Fetch garageId + badge counts
  useEffect(() => {
    fetch('/api/garage/me')
      .then((r) => r.json() as Promise<{ garageId: string | null }>)
      .then(async ({ garageId: gid }) => {
        if (!gid) return;
        garageIdRef.current = gid;
        // Fetch badge counts in parallel
        const [intRes, facRes, stockRes, achatsRes] = await Promise.all([
          supabase.from('interventions').select('id', { count: 'exact', head: true })
            .eq('garage_id', gid).in('status', ['En attente', 'En cours']),
          supabase.from('factures').select('id', { count: 'exact', head: true })
            .eq('garage_id', gid).in('status', ['unpaid', 'partial']),
          supabase.from('pieces').select('id', { count: 'exact', head: true })
            .eq('garage_id', gid).lte('stock_quantity', 0),
          Promise.resolve(
            supabase.from('factures_achats').select('id', { count: 'exact', head: true })
              .eq('garage_id', gid).eq('statut', 'en_attente'),
          ).catch(() => ({ count: 0 as number | null })),
        ]);
        setBadges({
          interventions: intRes.count ?? 0,
          factures: facRes.count ?? 0,
          stock: stockRes.count ?? 0,
          achats: (achatsRes as { count?: number | null }).count ?? 0,
        });
      })
      .catch(() => { /* ignore */ });
  }, []);

  // Health ping every 60s
  useEffect(() => {
    const check = () =>
      fetch('/api/health')
        .then((r) => setHealthOk(r.ok))
        .catch(() => setHealthOk(false));
    void check();
    const id = setInterval(() => { void check(); }, 60_000);
    return () => clearInterval(id);
  }, []);

  const b = (key: string, color: Badge['color'] = 'default'): Badge | undefined => {
    const count = badges[key] ?? 0;
    return count > 0 ? { count, color } : undefined;
  };

  const sections: NavSection[] = [
    {
      title: 'EXPLOITATION',
      items: [
        { href: '/', label: 'Tableau de bord', icon: LayoutDashboard, active: activePage === 'dashboard' },
        { href: '/clients', label: 'Clients', icon: Users, active: activePage === 'clients' },
        { href: '/interventions', label: 'Interventions', icon: Wrench, active: activePage === 'interventions', badge: b('interventions', 'orange') },
        { href: '/devis', label: 'Devis', icon: ClipboardList, active: activePage === 'devis' },
        { href: '/factures', label: 'Factures', icon: FileText, active: activePage === 'factures', badge: b('factures', 'red') },
      ],
    },
    {
      title: 'STOCK & ACHATS',
      items: [
        { href: '/stock', label: 'Pièces', icon: Package, active: activePage === 'stock', badge: b('stock', 'red') },
        { href: '/factures-achats', label: 'Factures achats', icon: ShoppingCart, active: activePage === 'factures-achats', badge: b('achats', 'orange') },
      ],
    },
    {
      title: 'CONFORMITÉ',
      items: [
        { href: '/livre-de-police', label: 'Livre de Police', icon: BookOpen, active: activePage === 'livre-de-police' },
        ...(FLAGS.FACTUR_X_ENABLED ? [{ href: '/factures', label: 'Factur-X', icon: Shield, active: false, tag: '✓ Activé' } as NavItem] : []),
      ],
    },
    {
      title: 'COMPTABILITÉ',
      items: [
        { href: '/parametres', label: 'Rapports & config', icon: TrendingUp, active: activePage === 'parametres' },
        { href: '/parametres#gsheet', label: 'Suivi GSheet', icon: ExternalLink, active: false, external: true },
      ],
    },
    {
      title: 'PARAMÈTRES',
      items: [
        { href: '/parametres', label: 'Garage & intégrations', icon: Settings, active: activePage === 'parametres' },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex md:w-60 flex-col bg-[#1A1D27] border-r border-[#2A2D3A] h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#2A2D3A]">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#FF6B2B]" />
          <span className="text-lg font-bold text-[#FF6B2B] tracking-tight">MecaniGo</span>
        </div>
        <p className="text-[11px] text-[#8B8FA8] mt-0.5">La gestion garage, enfin simple.</p>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-[#0F1117] border border-[#2A2D3A] rounded-lg text-[#8B8FA8] text-xs hover:border-[#FF6B2B]/40 hover:text-white transition-all group"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">Rechercher…</span>
          <kbd className="text-[9px] bg-[#2A2D3A] px-1.5 py-0.5 rounded border border-[#3A3D4A] group-hover:border-[#FF6B2B]/30">⌘K</kbd>
        </button>
      </div>

      {/* Sectioned nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-[#8B8FA8]/60 uppercase tracking-wider">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={`${item.href}-${item.label}`}>
                    <Link href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                        item.active
                          ? 'bg-[#FF6B2B]/10 text-[#FF6B2B]'
                          : 'text-[#8B8FA8] hover:bg-white/5 hover:text-white'
                      }`}
                      aria-current={item.active ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate text-xs">{item.label}</span>
                      {item.tag && (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">{item.tag}</span>
                      )}
                      {item.badge && <BadgeDot badge={item.badge} />}
                      {item.external && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* CTA: nouvelle intervention */}
      <div className="px-3 pb-2">
        <Link href="/interventions?openModal=true"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#FF6B2B] text-white rounded-xl text-sm font-semibold hover:bg-[#E55A1F] transition-colors shadow-[0_0_20px_rgba(255,107,43,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Nouvelle intervention
        </Link>
      </div>

      {/* User + health */}
      <div className="px-4 py-3 border-t border-[#2A2D3A] flex items-center justify-between">
        <UserButton appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
        <div className="flex items-center gap-1.5 text-[11px] text-[#8B8FA8]">
          <span className={`w-2 h-2 rounded-full ${
            healthOk === null ? 'bg-[#8B8FA8] animate-pulse' :
            healthOk ? 'bg-emerald-500' : 'bg-red-500'
          }`} />
          <span>{healthOk === null ? '…' : healthOk ? 'Opérationnel' : 'Dégradé'}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#8B8FA8]/50">
          <ArrowDownToLine className="w-3 h-3" />
          <span>v2</span>
        </div>
      </div>
    </aside>
  );
}
