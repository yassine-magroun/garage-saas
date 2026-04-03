'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, Users, Wrench, FileText, ClipboardList, Settings } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function MobileNav({ 
  activePage, 
  garageName 
}: { 
  activePage: 'dashboard' | 'clients' | 'interventions' | 'factures' | 'devis' | 'parametres';
  garageName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/interventions', label: 'Interventions', icon: Wrench },
    { href: '/factures', label: 'Factures', icon: FileText },
    { href: '/devis', label: 'Devis', icon: ClipboardList },
    { href: '/parametres', label: 'Paramètres', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Header with Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 px-4 py-3 z-40 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-gray-900">{garageName || '2roues Pasteur'}</h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-40 z-30 top-12 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <nav className="md:hidden fixed left-0 top-12 bottom-0 w-64 bg-white border-r border-gray-100 z-30 overflow-y-auto shadow-lg">
            <div className="px-4 py-4 border-b border-gray-100">
              <p className="text-xs text-gray-500">Gestion garage</p>
            </div>
            <ul className="space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = 
                  (item.href === '/' && activePage === 'dashboard') ||
                  (item.href !== '/' && activePage === item.href.slice(1));
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="w-4 h-4" />
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
