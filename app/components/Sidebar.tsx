'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Users, Wrench, FileText, ClipboardList,
  Settings, Zap, Package, BookOpen, Search, X, Plus,
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

type ClientResult = { id: string; name: string; phone: string; vehicle: string | null };

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
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [garageIdReady, setGarageIdReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [healthOk, setHealthOk] = useState<boolean | null>(null);

  const garageIdRef = useRef<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch garageId + badge counts
  useEffect(() => {
    fetch('/api/garage/me')
      .then((r) => r.json() as Promise<{ garageId: string | null }>)
      .then(async ({ garageId: gid }) => {
        if (!gid) { setGarageIdReady(true); return; }
        garageIdRef.current = gid;
        setGarageIdReady(true);
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
      .catch(() => { setGarageIdReady(true); });
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

  // Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); setResults([]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click outside to close search
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const gid = garageIdRef.current;
    if (!gid || q.length < 2) { setResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    try {
      const { data } = await supabase.from('clients').select('id, name, phone, vehicle')
        .eq('garage_id', gid).or(`name.ilike.%${q}%,phone.ilike.%${q}%`).limit(6);
      setResults((data ?? []) as ClientResult[]);
    } finally { setIsSearching(false); }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSearchOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(() => { void runSearch(val); }, 280);
  };

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

      {/* Search */}
      <div className="px-3 pt-3 pb-1" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B8FA8] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setSearchOpen(true)}
            placeholder={garageIdReady ? 'Rechercher… (⌘K)' : 'Chargement…'}
            disabled={!garageIdReady}
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#0F1117] border border-[#2A2D3A] rounded-lg text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-1 focus:ring-[#FF6B2B]/50 transition-all disabled:opacity-50"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSearchOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8FA8] hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {searchOpen && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl shadow-2xl z-50 overflow-hidden">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-[#8B8FA8] uppercase tracking-wider">Clients</p>
              {results.map((c) => (
                <button key={c.id} onClick={() => { router.push('/clients'); setSearchOpen(false); setQuery(''); setResults([]); }}
                  className="w-full flex flex-col px-3 py-2 hover:bg-white/5 transition-colors text-left">
                  <span className="text-xs font-medium text-white">{c.name}</span>
                  <span className="text-[11px] text-[#8B8FA8]">{c.vehicle ?? c.phone}</span>
                </button>
              ))}
              <div className="border-t border-[#2A2D3A] px-3 py-2">
                <button onClick={() => { router.push(`/interventions?openModal=true`); setSearchOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF6B2B]/10 text-[#FF6B2B] text-xs font-medium hover:bg-[#FF6B2B]/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Nouvelle intervention
                </button>
              </div>
            </div>
          )}
          {searchOpen && isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl shadow-xl z-50 px-3 py-2.5">
              <span className="text-xs text-[#8B8FA8]">Recherche…</span>
            </div>
          )}
          {searchOpen && !isSearching && query.length >= 2 && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl shadow-xl z-50 px-3 py-2.5">
              <span className="text-xs text-[#8B8FA8]">Aucun résultat pour «{query}»</span>
            </div>
          )}
        </div>
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
