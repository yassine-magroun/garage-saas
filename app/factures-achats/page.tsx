'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import PageLayout from '../components/PageLayout';
import { toast } from 'sonner';
import { FileText, Check, X, ExternalLink } from 'lucide-react';
import { getGarageId } from '../../lib/garage';
import { supabase } from '../../lib/supabase';

interface FactureAchat {
  id: string;
  fournisseur: string;
  fournisseurEmail: string | null;
  numeroFacture: string | null;
  dateFacture: string | null;
  totalHt: number | null;
  totalTva: number | null;
  totalTtc: number | null;
  pdfUrl: string | null;
  statut: 'en_attente' | 'validee' | 'rejetee';
  createdAt: string;
}

const STATUT_LABELS: Record<FactureAchat['statut'], string> = {
  en_attente: 'En attente',
  validee: 'Validée',
  rejetee: 'Rejetée',
};

const STATUT_COLORS: Record<FactureAchat['statut'], string> = {
  en_attente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  validee: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejetee: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function mapRow(r: Record<string, unknown>): FactureAchat {
  return {
    id: String(r.id),
    fournisseur: String(r.fournisseur ?? ''),
    fournisseurEmail: r.fournisseur_email ? String(r.fournisseur_email) : null,
    numeroFacture: r.numero_facture ? String(r.numero_facture) : null,
    dateFacture: r.date_facture ? String(r.date_facture) : null,
    totalHt: r.total_ht != null ? Number(r.total_ht) : null,
    totalTva: r.total_tva != null ? Number(r.total_tva) : null,
    totalTtc: r.total_ttc != null ? Number(r.total_ttc) : null,
    pdfUrl: r.pdf_url ? String(r.pdf_url) : null,
    statut: (r.statut as FactureAchat['statut']) ?? 'en_attente',
    createdAt: String(r.created_at),
  };
}

export default function FacturesAchatsPage() {
  const [factures, setFactures] = useState<FactureAchat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(message); else toast.error(message);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const garageId = await getGarageId();
        const { data, error } = await supabase
          .from('factures_achats')
          .select('*')
          .eq('garage_id', garageId)
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        setFactures((data ?? []).map((r) => mapRow(r as Record<string, unknown>)));
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erreur chargement', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const handleStatut = async (id: string, statut: FactureAchat['statut']) => {
    const garageId = await getGarageId();
    const { error } = await supabase
      .from('factures_achats')
      .update({ statut })
      .eq('id', id)
      .eq('garage_id', garageId);
    if (error) { showToast(error.message, 'error'); return; }
    setFactures((prev) => prev.map((f) => f.id === id ? { ...f, statut } : f));
    showToast(`Facture ${statut === 'validee' ? 'validée' : 'rejetée'}`, 'success');
  };

  return (
    <AuthGuard>
      <PageLayout activePage="factures">
        <header className="bg-[#1A1D27] border-b border-[#2A2D3A] px-4 md:px-8 py-4 md:py-5">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Factures d&apos;achat</h1>
          <p className="text-sm text-[#8B8FA8] mt-1">Factures fournisseurs reçues par email</p>
        </header>

        <main className="p-4 md:p-8 space-y-4 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : factures.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText className="h-10 w-10 text-[#3A3D4A]" />
              <p className="text-[#8B8FA8]">Aucune facture d&apos;achat reçue</p>
              <p className="text-xs text-[#8B8FA8] max-w-sm">
                Les factures envoyées par vos fournisseurs à votre adresse dédiée apparaîtront ici automatiquement.
              </p>
            </div>
          ) : (
            factures.map((f) => (
              <div
                key={f.id}
                className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{f.fournisseur}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUT_COLORS[f.statut]}`}>
                      {STATUT_LABELS[f.statut]}
                    </span>
                  </div>
                  {f.fournisseurEmail && (
                    <p className="text-xs text-[#8B8FA8]">{f.fournisseurEmail}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-[#8B8FA8]">
                    {f.numeroFacture && <span>Réf: {f.numeroFacture}</span>}
                    {f.dateFacture && <span>{new Date(f.dateFacture).toLocaleDateString('fr-FR')}</span>}
                    {f.totalTtc != null && (
                      <span className="font-semibold text-white">{f.totalTtc.toFixed(2)} € TTC</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {f.pdfUrl && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/supplier-invoices/${f.pdfUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-[#2A2D3A] text-[#8B8FA8] hover:text-white hover:bg-white/5 transition-colors"
                      title="Voir le PDF"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {f.statut === 'en_attente' && (
                    <>
                      <button
                        onClick={() => void handleStatut(f.id, 'validee')}
                        className="p-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Valider"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleStatut(f.id, 'rejetee')}
                        className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Rejeter"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </main>
      </PageLayout>
    </AuthGuard>
  );
}
