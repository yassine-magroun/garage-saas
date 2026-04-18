import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Providers from './providers';
import CommandPalette from './components/CommandPalette';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'MecaniGo — La gestion garage, enfin simple.',
  description: 'SaaS de gestion pour garages moto et scooter en France.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="fr" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
        <body className="min-h-full">
          <Providers>{children}</Providers>
          <CommandPalette />
        </body>
      </html>
    </ClerkProvider>
  );
}
