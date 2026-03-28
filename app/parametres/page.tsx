'use client';

import Link from 'next/link';
import PageLayout from '../components/PageLayout';
import { setDarkTheme } from '../components/ThemeProvider';
import Toast from '../components/Toast';
import { Save, User, Bell, Shield, Palette, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ParametresPage() {
  const [settings, setSettings] = useState({
    garageName: '2roues Pasteur',
    address: '123 Rue de la Moto, 75001 Paris',
    phone: '01 23 45 67 89',
    email: 'contact@2rouespasteur.fr',
    notifications: true,
    darkMode: false,
    language: 'fr'
  });

  const [settingsErrors, setSettingsErrors] = useState<{ garageName?: string; phone?: string; email?: string }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('params');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.darkMode !== undefined) {
          setDarkTheme(parsed.darkMode);
        }
        setSettings(parsed);
      } catch { }
    }
  }, []);

  const saveSettings = () => {
    const errors: typeof settingsErrors = {};
    if (!settings.garageName.trim()) errors.garageName = 'Nom du garage requis';
    if (!settings.phone.trim()) errors.phone = 'Téléphone requis';
    if (!settings.email.trim()) errors.email = 'Email requis';
    if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) errors.email = 'Email invalide';

    setSettingsErrors(errors);
    if (Object.keys(errors).length > 0) {
      setToast({ message: 'Merci de corriger les erreurs avant sauvegarde', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('params', JSON.stringify(settings));
    }
    setDarkTheme(settings.darkMode);
    setToast({ message: 'Paramètres sauvegardés avec succès !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <PageLayout activePage="parametres" garageName={settings.garageName}>
        <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-4 md:px-8 py-4 md:py-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-slate-100">Paramètres</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-slate-300 mt-1">Configurez votre application garage</p>
          </div>
          <button
            onClick={saveSettings}
            className="inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 font-medium text-sm shadow-sm"
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8">
          {/* Informations garage */}
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Informations garage</h3>
                <p className="text-xs text-gray-500 mt-0.5">Informations générales de votre établissement</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du garage</label>
                <input
                  type="text"
                  value={settings.garageName}
                  onChange={(e) => setSettings({ ...settings, garageName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-50 rounded-lg">
                <Bell className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500 mt-0.5">Gérez vos préférences de notification</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Notifications push</p>
                  <p className="text-xs text-gray-500">Recevoir des notifications sur les nouvelles interventions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Apparence */}
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-purple-50 rounded-lg">
                <Palette className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Apparence</h3>
                <p className="text-xs text-gray-500 mt-0.5">Personnalisez l'apparence de l'application</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Mode sombre</p>
                  <p className="text-xs text-gray-500">Basculer vers le thème sombre</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => {
                      const next = { ...settings, darkMode: e.target.checked };
                      setSettings(next);
                      setDarkTheme(next.darkMode);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Langue</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-red-50 rounded-lg">
                <Shield className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Sécurité</h3>
                <p className="text-xs text-gray-500 mt-0.5">Gérez la sécurité de votre compte</p>
              </div>
            </div>

            <div className="space-y-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200">
                Changer le mot de passe
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 active:bg-red-100 transition-colors duration-200">
                Activer l'authentification à deux facteurs
              </button>
            </div>
          </div>
        </main>
      </PageLayout>

      <Toast toast={toast} />
    </>
  );
}