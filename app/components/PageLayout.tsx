'use client';

import Link from 'next/link';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

type PageLayoutProps = {
  children: React.ReactNode;
  activePage: 'dashboard' | 'clients' | 'interventions' | 'factures' | 'devis' | 'stock' | 'parametres' | 'livre-de-police';
  garageName?: string;
};

export default function PageLayout({ children, activePage }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col md:flex-row">
      <Sidebar activePage={activePage} />
      <MobileNav activePage={activePage} />
      <div className="flex-1 flex flex-col w-full md:w-auto pt-12 md:pt-0 min-h-screen">
        {children}
        <footer className="mt-auto border-t border-[#2A2D3A] px-6 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <span className="text-[11px] text-[#8B8FA8]">© {new Date().getFullYear()} MecaniGo</span>
          <Link href="/legal/cgu" className="text-[11px] text-[#8B8FA8] hover:text-[#FF6B2B] transition-colors">CGU</Link>
          <Link href="/legal/privacy" className="text-[11px] text-[#8B8FA8] hover:text-[#FF6B2B] transition-colors">Confidentialité</Link>
        </footer>
      </div>
    </div>
  );
}
