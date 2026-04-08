import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
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
      <html lang="fr" className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full">{children}</body>
      </html>
    </ClerkProvider>
  );
}
