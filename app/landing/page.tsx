import Link from 'next/link';
import {
  Zap,
  FileText,
  Users,
  Wrench,
  Package,
  BarChart2,
  Mail,
  ChevronRight,
  CheckCircle,
  Star,
} from 'lucide-react';

export const metadata = {
  title: 'MecaniGo — Gérez votre garage moto en 2 minutes',
  description: 'Devis, factures, clients, stock et automatisations pour les garages motos et scooters. Essai gratuit 14 jours.',
};

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 hover:border-[#FF6B2B]/30 transition-colors group">
      <div className={`inline-flex p-3 ${bg} rounded-xl mb-4`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#8B8FA8] leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PricingCard({
  name,
  price,
  desc,
  features,
  highlight = false,
  cta,
}: {
  name: string;
  price: string;
  desc: string;
  features: string[];
  highlight?: boolean;
  cta?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-8 flex flex-col ${
        highlight
          ? 'border-[#FF6B2B] bg-gradient-to-b from-[#FF6B2B]/10 to-[#1A1D27]'
          : 'border-[#2A2D3A] bg-[#1A1D27]'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-[#FF6B2B] text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide">
            LE PLUS POPULAIRE
          </span>
        </div>
      )}
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#FF6B2B] uppercase tracking-widest mb-1">{name}</p>
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-sm text-[#8B8FA8] pb-1">€ HT/mois</span>
        </div>
        <p className="text-sm text-[#8B8FA8] mt-2">{desc}</p>
      </div>
      <ul className="space-y-3 flex-1 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-[#C4C7D4]">
            <CheckCircle className="w-4 h-4 text-[#FF6B2B] flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/auth/signup"
        className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${
          highlight
            ? 'bg-[#FF6B2B] text-white hover:bg-[#E55A1F]'
            : 'bg-white/5 border border-[#2A2D3A] text-white hover:bg-white/10'
        }`}
      >
        {cta ?? 'Commencer l\'essai gratuit'}
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 border-b border-[#2A2D3A]/60 bg-[#0F1117]/90 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FF6B2B]" />
            <span className="text-lg font-bold text-[#FF6B2B]">MecaniGo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-[#8B8FA8] hover:text-white transition-colors px-4 py-2"
            >
              Se connecter
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-semibold bg-[#FF6B2B] text-white px-4 py-2 rounded-lg hover:bg-[#E55A1F] transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#FF6B2B] rounded-full blur-[160px] opacity-[0.07]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FF6B2B]/10 border border-[#FF6B2B]/25 rounded-full px-4 py-1.5 text-sm text-[#FF6B2B] font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Conçu pour les garages 2 roues
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Gérez votre garage moto
            <span className="block text-[#FF6B2B]">en 2 minutes.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#8B8FA8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Devis, factures, clients, stock et relances automatiques — tout en un. <br className="hidden sm:block" />
            Sans formation. Sans Excel. Sans papier.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/auth/signup"
              className="group flex items-center gap-2 bg-[#FF6B2B] text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-[#E55A1F] transition-all shadow-[0_0_40px_rgba(255,107,43,0.3)]"
            >
              Essai gratuit 14 jours
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 border border-[#2A2D3A] text-[#C4C7D4] px-8 py-4 rounded-xl text-base font-medium hover:bg-white/5 hover:text-white transition-all"
            >
              Se connecter
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[#8B8FA8]">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Sans carte bancaire
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Données hébergées en Europe
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Conforme RGPD
            </span>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="bg-[#1A1D27] border-y border-[#2A2D3A] py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#FF6B2B] uppercase tracking-widest mb-4">Reconnaissez-vous ces situations ?</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12">
            Fini le papier, les Excel et les oublis.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { emoji: '📄', before: 'Devis sur papier perdus', after: 'Devis pro en 60 secondes, envoyés par email' },
              { emoji: '📊', before: 'Excel compliqués à maintenir', after: 'Dashboard automatique en temps réel' },
              { emoji: '💸', before: 'Factures oubliées, retards de paiement', after: 'Relances automatiques J+7 et J+30' },
            ].map((item) => (
              <div key={item.emoji} className="bg-[#0F1117] border border-[#2A2D3A] rounded-xl p-6 text-left">
                <div className="text-3xl mb-4">{item.emoji}</div>
                <p className="text-sm text-red-400 line-through mb-2">{item.before}</p>
                <p className="text-sm text-emerald-400 font-medium">{item.after}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#FF6B2B] uppercase tracking-widest mb-3">Tout ce dont vous avez besoin</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Une seule app. Zéro complication.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={FileText}
              title="Devis & Factures pro"
              desc="Créez des devis et factures PDF en 60 secondes avec numérotation automatique, TVA et suivi des paiements."
              color="text-[#FF6B2B]"
              bg="bg-[#FF6B2B]/10"
            />
            <FeatureCard
              icon={Users}
              title="Gestion clients"
              desc="Fiche client complète avec historique des véhicules, interventions passées et relances de fidélisation automatiques."
              color="text-blue-400"
              bg="bg-blue-500/10"
            />
            <FeatureCard
              icon={Wrench}
              title="Suivi interventions"
              desc="Pipeline en 4 étapes : En attente → En cours → Prêt → Livré. Notification SMS/email automatique quand le véhicule est prêt."
              color="text-purple-400"
              bg="bg-purple-500/10"
            />
            <FeatureCard
              icon={Package}
              title="Stock & Pièces"
              desc="Catalogue de pièces avec alertes de rupture, prix d'achat/vente et intégration directe dans vos devis."
              color="text-amber-400"
              bg="bg-amber-500/10"
            />
            <FeatureCard
              icon={BarChart2}
              title="Analytics & Insights"
              desc="CA mensuel, taux de conversion devis, délai moyen de paiement et graphique 8 semaines. Prenez de meilleures décisions."
              color="text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <FeatureCard
              icon={Mail}
              title="Automatisations"
              desc="Emails automatiques : devis créé, facture disponible, paiement reçu, rappels J+7 et J+30. Zéro oubli, zéro effort."
              color="text-pink-400"
              bg="bg-pink-500/10"
            />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-[#1A1D27] border-y border-[#2A2D3A] py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-[#FF6B2B] fill-[#FF6B2B]" />
            ))}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Rejoignez les premiers garages pilotes
          </h2>
          <p className="text-[#8B8FA8] max-w-xl mx-auto mb-10">
            MecaniGo est en accès anticipé. Soyez parmi les premiers garages à profiter de tarifs fondateurs et à façonner le produit avec nous.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { value: '14 jours', label: 'Essai gratuit, sans engagement' },
              { value: '< 5 min', label: 'Pour créer votre premier devis' },
              { value: '100%', label: 'Données hébergées en EU' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0F1117] rounded-xl border border-[#2A2D3A] p-6">
                <p className="text-3xl font-extrabold text-[#FF6B2B] mb-1">{stat.value}</p>
                <p className="text-sm text-[#8B8FA8]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#FF6B2B] uppercase tracking-widest mb-3">Tarifs transparents</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Simple. Prévisible. Sans surprise.</h2>
            <p className="text-[#8B8FA8]">14 jours d&apos;essai gratuit sur toutes les formules. Résiliation en 1 clic.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <PricingCard
              name="Starter"
              price="59"
              desc="Idéal pour démarrer"
              features={[
                'Jusqu\'à 100 clients',
                'Devis & factures illimités',
                'PDF professionnels',
                'Suivi des paiements',
                'Support email',
              ]}
            />
            <PricingCard
              name="Pro"
              price="99"
              desc="Pour les garages en croissance"
              highlight
              features={[
                'Clients illimités',
                'Tout le plan Starter',
                'Stock & pièces',
                'Automatisations email',
                'Analytics avancés',
                'Multi-véhicules par client',
                'Support prioritaire',
              ]}
            />
            <PricingCard
              name="Business"
              price="149"
              desc="Pour les équipes et réseaux"
              cta="Contacter l'équipe"
              features={[
                'Tout le plan Pro',
                'Multi-utilisateurs (5 comptes)',
                'API REST accès complet',
                'Onboarding dédié',
                'SLA 99,9 % garanti',
                'Intégration comptable',
                'Manager de compte dédié',
              ]}
            />
          </div>

          <p className="text-center text-xs text-[#8B8FA8] mt-6">
            Tous les prix sont HT. TVA en sus. Facturation mensuelle ou annuelle (–2 mois).
          </p>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6B2B] rounded-full blur-[120px] opacity-[0.08]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Prêt à moderniser votre garage ?
          </h2>
          <p className="text-[#8B8FA8] mb-8">
            Commencez gratuitement, sans carte bancaire. Votre premier devis en moins de 5 minutes.
          </p>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 bg-[#FF6B2B] text-white px-10 py-4 rounded-xl text-base font-semibold hover:bg-[#E55A1F] transition-all shadow-[0_0_40px_rgba(255,107,43,0.25)]"
          >
            Essai gratuit 14 jours — sans CB
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#2A2D3A] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF6B2B]" />
            <span className="font-bold text-[#FF6B2B]">MecaniGo</span>
            <span className="text-xs text-[#8B8FA8] ml-2">© {new Date().getFullYear()} MecaniGo SAS</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/legal/cgu" className="text-xs text-[#8B8FA8] hover:text-[#FF6B2B] transition-colors">CGU</Link>
            <Link href="/legal/privacy" className="text-xs text-[#8B8FA8] hover:text-[#FF6B2B] transition-colors">Confidentialité</Link>
            <a href="mailto:contact@mecanigo.fr" className="text-xs text-[#8B8FA8] hover:text-[#FF6B2B] transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
