'use client';

import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { Save, User, Bell, Shield, Palette, Package, Plus, Trash2, Pencil, Check, X, ImageIcon, Calculator } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { prestationsAPI, getGarageSettings, updateGarageLogoUrl } from '../../lib/api';
import { getGarageId } from '../../lib/garage';
import { supabase } from '../../lib/supabase';
import type { Prestation } from '../../lib/types';

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

  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [garageId, setGarageId] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [comptableEmail, setComptableEmail] = useState('');
  const [comptableSaving, setComptableSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [prestForm, setPrestForm] = useState({ name: '', priceHt: '', tvaRate: '20', category: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', priceHt: '', tvaRate: '', category: '' });
  const [prestLoading, setPrestLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('params');
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch { }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const gid = await getGarageId();
        setGarageId(gid);
        const [list, garage] = await Promise.all([
          prestationsAPI.getAll(gid).catch(() => [] as Prestation[]),
          getGarageSettings(gid).catch(() => null),
        ]);
        setPrestations(list);
        if (garage?.logoUrl) setLogoUrl(garage.logoUrl);
      } catch {
        // silently ignore
      }
    };
    void load();
  }, []);

  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('params', JSON.stringify(settings));
    }
    showToast('Paramètres sauvegardés avec succès !', 'success');
  };

  const saveComptableEmail = async () => {
    setComptableSaving(true);
    try {
      const res = await fetch('/api/garage/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comptable_email: comptableEmail }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Erreur serveur');
      }
      showToast('Email comptable sauvegardé', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    } finally {
      setComptableSaving(false);
    }
  };

  const handleAddPrestation = async () => {
    if (!prestForm.name.trim() || !prestForm.priceHt) {
      showToast('Nom et prix requis', 'error');
      return;
    }
    setPrestLoading(true);
    try {
      const created = await prestationsAPI.create(garageId, {
        name: prestForm.name.trim(),
        priceHt: Number(prestForm.priceHt),
        tvaRate: Number(prestForm.tvaRate) || 20,
        category: prestForm.category.trim() || undefined,
      });
      setPrestations((prev) => [...prev, created]);
      setPrestForm({ name: '', priceHt: '', tvaRate: '20', category: '' });
      showToast('Prestation ajoutée', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur ajout', 'error');
    } finally {
      setPrestLoading(false);
    }
  };

  const handleDeletePrestation = async (id: string) => {
    try {
      await prestationsAPI.delete(id, garageId);
      setPrestations((prev) => prev.filter((p) => p.id !== id));
      showToast('Prestation supprimée', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur suppression', 'error');
    }
  };

  const startEdit = (p: Prestation) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      priceHt: String(p.priceHt),
      tvaRate: String(p.tvaRate),
      category: p.category ?? '',
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const updated = await prestationsAPI.update(id, garageId, {
        name: editForm.name.trim(),
        priceHt: Number(editForm.priceHt),
        tvaRate: Number(editForm.tvaRate),
        category: editForm.category.trim(),
      });
      setPrestations((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      showToast('Prestation mise à jour', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur mise à jour', 'error');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !garageId) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      showToast('Format accepté : PNG, JPEG, WEBP, SVG', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo max 2 MB', 'error');
      return;
    }
    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `${garageId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('garage-logos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);
      const { data: urlData } = supabase.storage.from('garage-logos').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      await updateGarageLogoUrl(garageId, publicUrl);
      setLogoUrl(publicUrl);
      showToast('Logo mis à jour', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur upload', 'error');
    } finally {
      setLogoUploading(false);
    }
  };

  const inputCls = 'w-full border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50 focus:border-[#FF6B2B]/50 transition-all';
  const smallInputCls = 'border border-[#2A2D3A] rounded-lg px-2 py-1.5 text-sm bg-[#0F1117] text-white placeholder-[#8B8FA8] focus:outline-none focus:ring-1 focus:ring-[#FF6B2B]/50';

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
              <input type="text" value={settings.garageName} onChange={(e) => setSettings({ ...settings, garageName: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Téléphone</label>
              <input type="tel" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Adresse</label>
              <input type="text" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Email</label>
              <input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        {/* ── LOGO GARAGE ── */}
        <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 rounded-lg">
              <ImageIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Logo du garage</h3>
              <p className="text-xs text-[#8B8FA8] mt-0.5">Affiché en haut à gauche des factures PDF · PNG/JPEG/SVG · max 2 MB</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {/* Preview */}
            <div className="w-20 h-20 rounded-xl border border-[#2A2D3A] bg-[#0F1117] flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                : <ImageIcon className="w-8 h-8 text-[#3A3D4A]" />}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => void handleLogoUpload(e)} />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#2A2D3A] rounded-lg text-sm text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
              >
                {logoUploading ? 'Upload en cours...' : 'Choisir un logo'}
              </button>
              {logoUrl && <p className="text-xs text-emerald-400">✓ Logo actif</p>}
            </div>
          </div>
        </div>

        {/* ── PRESTATIONS CATALOGUE ── */}
        <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-[#FF6B2B]/10 rounded-lg">
              <Package className="w-4 h-4 text-[#FF6B2B]" />
            </div>
            <div>
              <h3 className="font-medium text-white">Catalogue de prestations</h3>
              <p className="text-xs text-[#8B8FA8] mt-0.5">Ajoutez vos prestations fréquentes pour les réutiliser en 1 clic</p>
            </div>
          </div>

          {/* Add form */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
            <input
              type="text"
              placeholder="Nom de la prestation"
              value={prestForm.name}
              onChange={(e) => setPrestForm({ ...prestForm, name: e.target.value })}
              className={`sm:col-span-2 ${inputCls}`}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Prix HT (€)"
              value={prestForm.priceHt}
              onChange={(e) => setPrestForm({ ...prestForm, priceHt: e.target.value })}
              className={inputCls}
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="TVA %"
                value={prestForm.tvaRate}
                onChange={(e) => setPrestForm({ ...prestForm, tvaRate: e.target.value })}
                className={`w-20 ${inputCls}`}
              />
              <input
                type="text"
                placeholder="Catégorie"
                value={prestForm.category}
                onChange={(e) => setPrestForm({ ...prestForm, category: e.target.value })}
                className={`flex-1 ${inputCls}`}
              />
            </div>
          </div>
          <button
            onClick={() => void handleAddPrestation()}
            disabled={prestLoading || !prestForm.name || !prestForm.priceHt}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B2B] text-white rounded-lg text-sm font-medium hover:bg-[#E55A1F] disabled:opacity-50 transition-colors mb-5"
          >
            <Plus className="w-4 h-4" />
            Ajouter une prestation
          </button>

          {/* List */}
          {prestations.length === 0 ? (
            <p className="text-sm text-[#8B8FA8]">Aucune prestation configurée.</p>
          ) : (
            <div className="space-y-2">
              {prestations.map((p) =>
                editingId === p.id ? (
                  <div key={p.id} className="flex items-center gap-2 p-3 bg-[#0F1117] border border-[#FF6B2B]/30 rounded-xl">
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={`flex-1 ${smallInputCls}`} />
                    <input type="number" value={editForm.priceHt} onChange={(e) => setEditForm({ ...editForm, priceHt: e.target.value })} className={`w-24 ${smallInputCls}`} />
                    <input type="number" value={editForm.tvaRate} onChange={(e) => setEditForm({ ...editForm, tvaRate: e.target.value })} className={`w-16 ${smallInputCls}`} placeholder="TVA%" />
                    <input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={`w-28 ${smallInputCls}`} placeholder="Catégorie" />
                    <button onClick={() => void handleSaveEdit(p.id)} className="p-1.5 text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-[#8B8FA8] hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 bg-[#0F1117] border border-[#2A2D3A] rounded-xl group">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white">{p.name}</span>
                      {p.category && <span className="ml-2 text-xs text-[#8B8FA8] bg-[#2A2D3A] px-2 py-0.5 rounded-full">{p.category}</span>}
                    </div>
                    <span className="text-sm text-white font-semibold tabular-nums whitespace-nowrap">
                      {p.priceHt.toFixed(2)} € HT
                      <span className="text-xs text-[#8B8FA8] ml-1">· TVA {p.tvaRate}%</span>
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(p)} className="p-1.5 text-[#8B8FA8] hover:text-[#FF6B2B]"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => void handleDeletePrestation(p.id)} className="p-1.5 text-[#8B8FA8] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
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
              <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })} className="sr-only peer" />
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
                <input type="checkbox" checked={settings.darkMode} onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })} className="sr-only peer" />
                <div className="w-10 h-6 bg-[#2A2D3A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B2B]" />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Langue</label>
              <select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} className="w-full max-w-xs border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm bg-[#0F1117] text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/50 transition-all">
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

        {/* Comptabilité */}
        <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 rounded-lg">
              <Calculator className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Comptabilité</h3>
              <p className="text-xs text-[#8B8FA8] mt-0.5">Envoi automatique du résumé hebdomadaire chaque vendredi à 18h</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#8B8FA8] mb-1.5">Email de votre comptable</label>
              <input
                type="email"
                value={comptableEmail}
                onChange={(e) => setComptableEmail(e.target.value)}
                placeholder="comptable@cabinet.fr"
                className={inputCls}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => void saveComptableEmail()}
                disabled={comptableSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B2B] text-white rounded-lg text-sm font-medium hover:bg-[#E55A1F] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <Save className="w-4 h-4" />
                {comptableSaving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>

      </main>

      <Toast toast={toast} />
    </PageLayout>
  );
}
