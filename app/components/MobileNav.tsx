'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, Users, Wrench, FileText, ClipboardList, Settings, Zap } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function MobileNav({
  activePage,
}: {
  activePage: 'dashboard' | 'clients' | 'interventions' | 'factures' | 'devis' | 'parametres';
  garageName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: '/',              label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/clients',       label: 'Clients',          icon: Users           },
    { href: '/interventions', label: 'Interventions',    icon: Wrench          },
    { href: '/factures',      label: 'Factures',         icon: FileText        },
    { href: '/devis',         label: 'Devis',            icon: ClipboardList   },
    { href: '/parametres',    label: 'Paramètres',       icon: Settings        },
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#1A1D27] border-b border-[#2A2D3A] px-4 py-3 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#FF6B2B]" />
          <span className="text-sm font-bold text-[#FF6B2B]">MecaniGo</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-[#8B8FA8] hover:bg-white/5 hover:text-white rounded-lg transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Drawer */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-30 top-12"
            onClick={() => setIsOpen(false)}
          />
          <nav className="md:hidden fixed left-0 top-12 bottom-0 w-60 bg-[#1A1D27] border-r border-[#2A2D3A] z-30 overflow-y-auto">
            <div className="px-4 py-4 border-b border-[#2A2D3A]">
              <p className="text-xs text-[#8B8FA8]">La gestion garage, enfin simple.</p>
            </div>
            <ul className="space-y-0.5 px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  (item.href === '/' && activePage === 'dashboard') ||
                  (item.href !== '/' && activePage === item.href.slice(1));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#FF6B2B]/10 text-[#FF6B2B]'
                          : 'text-[#8B8FA8] hover:bg-white/5 hover:text-white'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
