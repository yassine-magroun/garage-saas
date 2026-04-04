'use client';

import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

type PageLayoutProps = {
  children: React.ReactNode;
  activePage: 'dashboard' | 'clients' | 'interventions' | 'factures' | 'devis' | 'parametres';
  garageName?: string;
};

export default function PageLayout({ children, activePage }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col md:flex-row">
      <Sidebar activePage={activePage} />
      <MobileNav activePage={activePage} />
      <div className="flex-1 flex flex-col w-full md:w-auto pt-12 md:pt-0 min-h-screen">
        {children}
      </div>
    </div>
  );
}
