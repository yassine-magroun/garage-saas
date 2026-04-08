import Link from 'next/link';
import { LayoutDashboard, Users, Wrench, FileText, ClipboardList, Settings, Zap } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

type SidebarItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
};

export default function Sidebar({
  activePage,
}: {
  activePage: 'dashboard' | 'clients' | 'interventions' | 'factures' | 'devis' | 'parametres';
  garageName?: string;
}) {
  const items: SidebarItem[] = [
    { href: '/',              label: 'Tableau de bord',  icon: LayoutDashboard, active: activePage === 'dashboard'      },
    { href: '/clients',       label: 'Clients',           icon: Users,           active: activePage === 'clients'        },
    { href: '/interventions', label: 'Interventions',     icon: Wrench,          active: activePage === 'interventions'  },
    { href: '/factures',      label: 'Factures',          icon: FileText,        active: activePage === 'factures'       },
    { href: '/devis',         label: 'Devis',             icon: ClipboardList,   active: activePage === 'devis'          },
    { href: '/parametres',    label: 'Paramètres',        icon: Settings,        active: activePage === 'parametres'     },
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
