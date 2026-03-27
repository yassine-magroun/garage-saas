import Link from 'next/link';
import { LayoutDashboard, Users, Wrench, FileText, Settings } from 'lucide-react';

type SidebarItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
};

export default function Sidebar({ activePage, garageName }: { activePage: 'dashboard' | 'clients' | 'interventions' | 'factures' | 'parametres'; garageName?: string }) {
  const items: SidebarItem[] = [
    { href: '/', label: 'Tableau de bord', icon: LayoutDashboard, active: activePage === 'dashboard' },
    { href: '/clients', label: 'Clients', icon: Users, active: activePage === 'clients' },
    { href: '/interventions', label: 'Interventions', icon: Wrench, active: activePage === 'interventions' },
    { href: '/factures', label: 'Factures', icon: FileText, active: activePage === 'factures' },
    { href: '/parametres', label: 'Paramètres', icon: Settings, active: activePage === 'parametres' },
  ];

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">{garageName || '2roues Pasteur'}</h1>
        <p className="text-xs text-gray-500 mt-1">Gestion garage</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    item.active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
