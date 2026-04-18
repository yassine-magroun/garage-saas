'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import {
  Search, X, Users, FileText, Wrench, Package,
  Plus, ClipboardList, Clock, Zap, ArrowRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { INTERVENTIONS_CATALOG } from '../../lib/interventions-catalog';

type ResultItem = {
  type: 'client' | 'facture' | 'intervention' | 'prestation';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

type ActionItem = {
  id: string;
  label: string;
  shortcut?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const QUICK_ACTIONS: ActionItem[] = [
  { id: 'new-int', label: 'Nouvelle intervention', shortcut: '⌘I', href: '/interventions?openModal=true', icon: Plus },
  { id: 'new-devis', label: 'Nouveau devis', shortcut: '⌘D', href: '/devis?openModal=true', icon: ClipboardList },
  { id: 'new-fac', label: 'Nouvelle facture', shortcut: '⌘F', href: '/factures?openModal=true', icon: FileText },
  { id: 'clients', label: 'Voir tous les clients', href: '/clients', icon: Users },
  { id: 'stock', label: 'Gérer le stock', href: '/stock', icon: Package },
];

const SHORTCUTS: Record<string, string> = {
  i: '/interventions?openModal=true',
  d: '/devis?openModal=true',
  f: '/factures?openModal=true',
};

const TYPE_ICONS: Record<ResultItem['type'], React.ComponentType<{ className?: string }>> = {
  client: Users,
  facture: FileText,
  intervention: Wrench,
  prestation: Package,
};

const TYPE_LABELS: Record<ResultItem['type'], string> = {
  client: 'CLIENTS',
  facture: 'FACTURES',
  intervention: 'INTERVENTIONS',
  prestation: 'PRESTATIONS',
};

const HISTORY_KEY = 'mg_cmd_history';

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as string[]; }
  catch { return []; }
}

function pushHistory(q: string) {
  if (!q.trim()) return;
  const next = [q, ...loadHistory().filter(x => x !== q)].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const garageIdRef = useRef<string | null>(null);
  const dataLoadedRef = useRef(false);
  const fuseRef = useRef<Fuse<ResultItem> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef(query);
  const resultsRef = useRef(results);
  const selectedIdxRef = useRef(selectedIdx);

  queryRef.current = query;
  resultsRef.current = results;
  selectedIdxRef.current = selectedIdx;

  const closeAndReset = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIdx(0);
  }, []);

  const navigate = useCallback((href: string, label?: string) => {
    if (label) { pushHistory(label); setHistory(loadHistory()); }
    router.push(href);
    closeAndReset();
  }, [router, closeAndReset]);

  const loadData = useCallback(async () => {
    if (dataLoadedRef.current) return;
    let gid = garageIdRef.current;
    if (!gid) {
      const r = await fetch('/api/garage/me').then(x => x.json() as Promise<{ garageId: string | null }>);
      gid = r.garageId ?? null;
      garageIdRef.current = gid;
    }
    if (!gid) return;
    dataLoadedRef.current = true;

    const [cRes, fRes, iRes] = await Promise.all([
      supabase.from('clients').select('id, name, vehicle, phone').eq('garage_id', gid).limit(200),
      supabase.from('factures').select('id, display_ref').eq('garage_id', gid).limit(200),
      supabase.from('interventions').select('id, type, vehicule').eq('garage_id', gid).limit(200),
    ]);

    const items: ResultItem[] = [
      ...(cRes.data ?? []).map(c => ({
        type: 'client' as const,
        id: String(c.id),
        title: String(c.name),
        subtitle: (c.vehicle as string | null) ?? (c.phone as string | null) ?? undefined,
        href: '/clients',
      })),
      ...(fRes.data ?? []).map(f => ({
        type: 'facture' as const,
        id: String(f.id),
        title: (f.display_ref as string | null) ?? `#${String(f.id).slice(0, 6)}`,
        href: '/factures',
      })),
      ...(iRes.data ?? []).map(i => ({
        type: 'intervention' as const,
        id: String(i.id),
        title: String(i.type),
        subtitle: (i.vehicule as string | null) ?? undefined,
        href: '/interventions',
      })),
      ...INTERVENTIONS_CATALOG.map(p => ({
        type: 'prestation' as const,
        id: p.id,
        title: p.label,
        subtitle: `${p.categorie} — ${p.prix_defaut}€`,
        href: '/interventions?openModal=true',
      })),
    ];

    fuseRef.current = new Fuse(items, {
      keys: ['title', 'subtitle'],
      threshold: 0.35,
      includeScore: true,
    });
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setHistory(loadHistory());
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openPalette(); }
      if (e.key === 'Escape') closeAndReset();
    };
    const onEvent = () => openPalette();
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onEvent);
    };
  }, [openPalette, closeAndReset]);

  // Arrow + Enter navigation (registered while open)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const q = queryRef.current;
      const res = resultsRef.current;
      const idx = selectedIdxRef.current;

      // Quick-action shortcuts while palette open
      if ((e.metaKey || e.ctrlKey) && SHORTCUTS[e.key]) {
        e.preventDefault();
        navigate(SHORTCUTS[e.key]);
        return;
      }

      const isSearching = q.length >= 2;
      const totalItems = isSearching ? res.length : QUICK_ACTIONS.length + loadHistory().length;

      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, totalItems - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isSearching && res[idx]) {
          navigate(res[idx].href, res[idx].title);
        } else if (!isSearching) {
          if (idx < QUICK_ACTIONS.length) navigate(QUICK_ACTIONS[idx].href, QUICK_ACTIONS[idx].label);
          else {
            const h = loadHistory();
            const hItem = h[idx - QUICK_ACTIONS.length];
            if (hItem) setQuery(hItem);
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, navigate]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 40); setSelectedIdx(0); }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setSelectedIdx(0); return; }
    if (!fuseRef.current) return;
    setResults(fuseRef.current.search(query).slice(0, 14).map(r => r.item));
    setSelectedIdx(0);
  }, [query]);

  if (!open) return null;

  const isSearching = query.length >= 2;
  const groups = (['client', 'facture', 'intervention', 'prestation'] as const).map(type => ({
    type,
    items: results.filter(r => r.type === type),
    offset: results.findIndex(r => r.type === type),
  })).filter(g => g.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[13vh] px-4"
      onMouseDown={() => closeAndReset()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl bg-[#1A1D27] rounded-2xl shadow-2xl border border-[#2A2D3A] overflow-hidden"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#2A2D3A]">
          <Search className="w-4 h-4 text-[#8B8FA8] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher clients, factures, interventions…"
            className="flex-1 bg-transparent text-sm text-white placeholder-[#8B8FA8] outline-none"
          />
          {query ? (
            <button onClick={() => { setQuery(''); setResults([]); }} className="text-[#8B8FA8] hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="text-[10px] text-[#8B8FA8] bg-[#2A2D3A] px-1.5 py-0.5 rounded border border-[#3A3D4A] flex-shrink-0">Esc</kbd>
          )}
        </div>

        <div className="max-h-[56vh] overflow-y-auto">
          {/* Quick actions when idle */}
          {!isSearching && (
            <>
              <PaletteSection label="ACTIONS RAPIDES">
                {QUICK_ACTIONS.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <PaletteRow
                      key={a.id}
                      icon={<Icon className="w-3.5 h-3.5" />}
                      title={a.label}
                      shortcut={a.shortcut}
                      selected={i === selectedIdx}
                      onSelect={() => navigate(a.href, a.label)}
                      onHover={() => setSelectedIdx(i)}
                    />
                  );
                })}
              </PaletteSection>

              {history.length > 0 && (
                <PaletteSection label="RÉCENTS">
                  {history.map((h, i) => (
                    <PaletteRow
                      key={h}
                      icon={<Clock className="w-3.5 h-3.5" />}
                      title={h}
                      selected={QUICK_ACTIONS.length + i === selectedIdx}
                      onSelect={() => setQuery(h)}
                      onHover={() => setSelectedIdx(QUICK_ACTIONS.length + i)}
                    />
                  ))}
                </PaletteSection>
              )}
            </>
          )}

          {/* Search results */}
          {isSearching && results.length === 0 && (
            <p className="px-4 py-8 text-sm text-center text-[#8B8FA8]">
              Aucun résultat pour «{query}»
            </p>
          )}
          {isSearching && groups.map(({ type, items, offset }) => {
            const Icon = TYPE_ICONS[type];
            return (
              <PaletteSection key={type} label={TYPE_LABELS[type]}>
                {items.map((item, i) => (
                  <PaletteRow
                    key={item.id}
                    icon={<Icon className="w-3.5 h-3.5" />}
                    title={item.title}
                    subtitle={item.subtitle}
                    selected={offset + i === selectedIdx}
                    onSelect={() => navigate(item.href, item.title)}
                    onHover={() => setSelectedIdx(offset + i)}
                  />
                ))}
              </PaletteSection>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#2A2D3A] bg-[#0F1117]/80">
          <div className="flex items-center gap-3 text-[10px] text-[#8B8FA8]/70">
            <span><kbd className="font-mono bg-[#2A2D3A] px-1 py-0.5 rounded text-[9px]">↑↓</kbd> naviguer</span>
            <span><kbd className="font-mono bg-[#2A2D3A] px-1 py-0.5 rounded text-[9px]">↵</kbd> ouvrir</span>
            <span><kbd className="font-mono bg-[#2A2D3A] px-1 py-0.5 rounded text-[9px]">⌘I</kbd> intervention</span>
            <span><kbd className="font-mono bg-[#2A2D3A] px-1 py-0.5 rounded text-[9px]">⌘D</kbd> devis</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#8B8FA8]/50">
            <Zap className="w-3 h-3 text-[#FF6B2B]" />
            <span>MecaniGo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaletteSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-[#8B8FA8]/60 uppercase tracking-wider">{label}</p>
      {children}
    </div>
  );
}

function PaletteRow({
  icon, title, subtitle, shortcut, selected, onSelect, onHover,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  shortcut?: string;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
        selected ? 'bg-[#FF6B2B]/10' : 'hover:bg-white/5'
      }`}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      <span className={`flex-shrink-0 ${selected ? 'text-[#FF6B2B]' : 'text-[#8B8FA8]'}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${selected ? 'text-white' : 'text-[#C8CBDA]'}`}>{title}</p>
        {subtitle && <p className="text-[11px] text-[#8B8FA8] truncate">{subtitle}</p>}
      </div>
      {shortcut && (
        <kbd className="text-[10px] text-[#8B8FA8] bg-[#2A2D3A] px-1.5 py-0.5 rounded border border-[#3A3D4A] flex-shrink-0">{shortcut}</kbd>
      )}
      {selected && !shortcut && <ArrowRight className="w-3 h-3 text-[#FF6B2B] flex-shrink-0" />}
    </button>
  );
}
