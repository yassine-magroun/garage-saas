'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { INTERVENTIONS_CATALOG, CATEGORIES } from '../../lib/interventions-catalog';

type Props = {
  value: string;
  onChange: (value: string, prixDefaut?: number) => void;
  placeholder?: string;
  inputClassName?: string;
};

export default function InterventionSelect({
  value,
  onChange,
  placeholder = 'Ex: Vidange, plaquettes…',
  inputClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlighted, setHighlighted] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Keep query in sync if parent resets value
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build filtered flat list (skipping category headers in count)
  const filtered = query.trim().length === 0
    ? INTERVENTIONS_CATALOG
    : INTERVENTIONS_CATALOG.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.categorie.toLowerCase().includes(query.toLowerCase()),
      );

  // Group by category
  type Group = { categorie: string; items: typeof filtered };
  const groups: Group[] = [];
  for (const cat of CATEGORIES) {
    const items = filtered.filter((i) => i.categorie === cat);
    if (items.length > 0) groups.push({ categorie: cat, items });
  }

  // Flat selectable items (for keyboard nav index)
  const flatItems = groups.flatMap((g) => g.items);

  const selectItem = useCallback(
    (label: string, prix: number) => {
      onChange(label, prix);
      setQuery(label);
      setOpen(false);
      setHighlighted(-1);
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { setOpen(true); return; }
      return;
    }
    if (e.key === 'Escape') { setOpen(false); setHighlighted(-1); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && flatItems[highlighted]) {
        selectItem(flatItems[highlighted].label, flatItems[highlighted].prix_defaut);
      } else {
        // Free text confirmed
        onChange(query);
        setOpen(false);
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const el = listRef.current.querySelector<HTMLLIElement>(`[data-idx="${highlighted}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v); // propagate free text immediately
    setOpen(true);
    setHighlighted(-1);
  };

  const clear = () => {
    setQuery('');
    onChange('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const defaultInput =
    'w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50 focus:border-[#FF6B2B]/50 transition-all pr-16';

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={inputClassName ?? defaultInput}
          autoComplete="off"
        />
        <div className="absolute right-2 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              onClick={clear}
              className="p-1 text-[#8B8FA8] hover:text-white transition-colors"
              tabIndex={-1}
              aria-label="Effacer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-1 text-[#8B8FA8] hover:text-white transition-colors"
            tabIndex={-1}
            aria-label="Ouvrir la liste"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1A1D27] border border-[#2A2D3A] rounded-lg shadow-2xl overflow-hidden">
          <ul
            ref={listRef}
            className="overflow-y-auto"
            style={{ maxHeight: '250px' }}
          >
            {groups.length === 0 ? (
              <li className="px-3 py-4 text-xs text-[#8B8FA8] text-center">
                Aucun résultat — votre saisie sera conservée
              </li>
            ) : (
              groups.map((group) => {
                return (
                  <li key={group.categorie}>
                    {/* Category header */}
                    <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-[#8B8FA8] uppercase tracking-widest bg-[#0F1117]/60 sticky top-0">
                      {group.categorie}
                    </div>
                    <ul>
                      {group.items.map((item) => {
                        const idx = flatItems.indexOf(item);
                        const isHighlighted = highlighted === idx;
                        return (
                          <li
                            key={item.id}
                            data-idx={idx}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-sm ${
                              isHighlighted
                                ? 'bg-[#FF6B2B]/15 text-white'
                                : 'text-[#C8CBDA] hover:bg-white/5 hover:text-white'
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault(); // prevent blur before click
                              selectItem(item.label, item.prix_defaut);
                            }}
                            onMouseEnter={() => setHighlighted(idx)}
                          >
                            <span className="truncate">{item.label}</span>
                            {item.prix_defaut > 0 && (
                              <span className="ml-3 flex-shrink-0 text-xs text-[#8B8FA8] tabular-nums">
                                {item.prix_defaut} €
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
