'use client';

import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { Save, User, Bell, Shield, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ParametresPage() {
  const [settings, setSettings] = useState({
    garageName: 'MecaniGo',
    address: '123 Rue de la Moto, 75001 Paris',
    phone: '01 23 45 67 89',
    email: 'contact@mecanigo.fr',
    notifications: true,
    darkMode: true,
    language: 'fr',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('params');
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch { }
    }
  }, []);

  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('params', JSON.stringify(settings));
    }
    setToast({ message: 'Paramètres sauvegardés avec succès !', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const inputCls = 'w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50 focus:border-[#FF6B2B]/50 transition-all';

  return (
    <PageLayout activePage="parametres">
      <header className="bg-[#1A1D27] border-b border-[#2A2D3A] px-4 md:px-8 py-4 md:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Paramètres</h1>
            <p className="text-sm text-[#8B8FA8] mt-1">Configurez votre application garage</p>
          </div>
          <button
            onClick={saveSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2B] text-white rounded-lg hover:bg-[#E55A1F] transition-colors font-medium text-sm"
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        {/* Informations garage */}
        <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-[#FF6B2B]/10 rounded-lg">
              <User className="w-4 h-4 text-[#FF6B2B]" />
            </div>
            <div>
              <h3 className="font-medium text-white">Informations garage</h3>
              <p className="text-xs text-[#8B8FA8] mt-0.5">Informations générales de votre établissement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Nom du garage</label>
              <input
                type="text"
                value={settings.garageName}
                onChange={(e) => setSettings({ ...settings, garageName: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Adresse</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg">
              <Bell className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Notifications</h3>
              <p className="text-xs text-[#8B8FA8] mt-0.5">Gérez vos préférences de notification</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Notifications push</p>
              <p className="text-xs text-[#8B8FA8] mt-0.5">Recevoir des notifications sur les nouvelles interventions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-[#2A2D3A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B2B]" />
            </label>
          </div>
        </div>

        {/* Apparence */}
        <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-500/10 rounded-lg">
              <Palette className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Apparence</h3>
              <p className="text-xs text-[#8B8FA8] mt-0.5">Personnalisez l&apos;apparence de l&apos;application</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Mode sombre</p>
                <p className="text-xs text-[#8B8FA8] mt-0.5">Basculer vers le thème sombre</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-[#2A2D3A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B2B]" />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Langue</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full max-w-xs border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50 transition-all"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-red-500/10 rounded-lg">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Sécurité</h3>
              <p className="text-xs text-[#8B8FA8] mt-0.5">Gérez la sécurité de votre compte</p>
            </div>
          </div>

          <div className="space-y-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2A2D3A] text-sm font-medium text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors">
              Changer le mot de passe
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
              Activer l&apos;authentification à deux facteurs
            </button>
          </div>
        </div>
      </main>

      <Toast toast={toast} />
    </PageLayout>
  );
}
