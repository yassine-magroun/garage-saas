'use client';

import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

type PageLayoutProps = {
  children: React.ReactNode;
  activePage: 'dashboard' | 'clients' | 'interventions' | 'factures' | 'parametres';
  garageName?: string;
};

export default function PageLayout({ 
  children, 
  activePage,
  garageName = '2roues Pasteur'
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar activePage={activePage} garageName={garageName} />

      {/* Mobile Navigation */}
      <MobileNav activePage={activePage} garageName={garageName} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:w-auto pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
