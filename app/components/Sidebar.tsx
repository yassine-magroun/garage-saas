'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Users, Wrench, FileText, ClipboardList,
  Settings, Zap, Package, BookOpen, Search, X,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { supabase } from '../../lib/supabase';

type SidebarItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
};

type ClientResult = {
  id: string;
  name: string;
  phone: string;
};

export default function Sidebar({
  activePage,
}: {
  activePage: 'dashboard' | 'clients' | 'interventions' | 'factures' | 'devis' | 'stock' | 'parametres' | 'livre-de-police';
  garageName?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [garageId, setGarageId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch garageId once on mount
  useEffect(() => {
    fetch('/api/garage/me')
      .then((r) => r.json() as Promise<{ garageId: string | null }>)
      .then(({ garageId: gid }) => { if (gid) setGarageId(gid); })
      .catch(() => {});
  }, []);

  // Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuery('');
        setResults([]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const runSearch = useCallback(
    async (q: string) => {
      if (!garageId || q.length < 2) { setResults([]); return; }
      const { data } = await supabase
        .from('clients')
        .select('id, name, phone')
        .eq('garage_id', garageId)
        .ilike('name', `%${q}%`)
        .limit(5);
      setResults((data ?? []) as ClientResult[]);
    },
    [garageId],
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSearchOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void runSearch(val); }, 300);
  };

  const handleResultClick = () => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    router.push('/clients');
  };

  const items: SidebarItem[] = [
    { href: '/',                label: 'Tableau de bord',  icon: LayoutDashboard, active: activePage === 'dashboard'        },
    { href: '/clients',         label: 'Clients',           icon: Users,           active: activePage === 'clients'          },
    { href: '/interventions',   label: 'Interventions',     icon: Wrench,          active: activePage === 'interventions'    },
    { href: '/factures',        label: 'Factures',          icon: FileText,        active: activePage === 'factures'         },
    { href: '/devis',           label: 'Devis',             icon: ClipboardList,   active: activePage === 'devis'            },
    { href: '/stock',           label: 'Stock',             icon: Package,         active: activePage === 'stock'            },
    { href: '/livre-de-police', label: 'Livre de Police',   icon: BookOpen,        active: activePage === 'livre-de-police'  },
    { href: '/parametres',      label: 'Paramètres',        icon: Settings,        active: activePage === 'parametres'       },
  ];

  return (
    <aside className="hidden md:flex md:w-60 flex-col bg-[#1A1D27] border-r border-[#2A2D3A] h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#2A2D3A]">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#FF6B2B]" />
          <span className="text-lg font-bold text-[#FF6B2B] tracking-tight">MecaniGo</span>
        </div>
        <p className="text-xs text-[#8B8FA8] mt-1 leading-snug">La gestion garage, enfin simple.</p>
      </div>

      {/* Global search */}
      <div className="px-3 pt-3 pb-1" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B8FA8] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setSearchOpen(true)}
            placeholder="Client, immatriculation…"
            className="w-full pl-8 pr-7 py-2 text-xs bg-[#0F1117] border border-[#2A2D3A] rounded-lg text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-1 focus:ring-[#FF6B2B]/50 focus:border-[#FF6B2B]/50 transition-all"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#8B8FA8] bg-[#2A2D3A] px-1 py-0.5 rounded pointer-events-none">
            ⌘K
          </kbd>

          {/* Dropdown */}
          {searchOpen && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D27] border border-[#2A2D3A] rounded-lg shadow-xl z-50 overflow-hidden">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={handleResultClick}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-sm text-white truncate">{c.name}</span>
                  <span className="text-xs text-[#8B8FA8] ml-2 flex-shrink-0">{c.phone}</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {searchOpen && query.length >= 2 && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D27] border border-[#2A2D3A] rounded-lg shadow-xl z-50 px-3 py-2.5">
              <span className="text-xs text-[#8B8FA8]">Aucun résultat</span>
            </div>
          )}
        </div>

        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setSearchOpen(false); }}
            className="absolute right-5 top-[calc(theme(spacing.3)_+_0.5rem)] text-[#8B8FA8] hover:text-white"
            aria-label="Effacer la recherche"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    item.active
                      ? 'bg-[#FF6B2B]/10 text-[#FF6B2B]'
                      : 'text-[#8B8FA8] hover:bg-white/5 hover:text-white'
                  }`}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-[#2A2D3A]">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </div>
    </aside>
  );
}
