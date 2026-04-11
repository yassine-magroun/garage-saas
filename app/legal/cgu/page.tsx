import Link from 'next/link';
import { Zap } from 'lucide-react';

export const metadata = { title: 'CGU — MecaniGo' };

export default function CguPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white">
      {/* Nav bar */}
      <nav className="border-b border-[#2A2D3A] px-6 py-4 flex items-center justify-between">
        <Link href="/landing" className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#FF6B2B]" />
          <span className="text-lg font-bold text-[#FF6B2B]">MecaniGo</span>
        </Link>
        <Link href="/" className="text-sm text-[#8B8FA8] hover:text-white transition-colors">
          Retour au tableau de bord
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales d&apos;Utilisation</h1>
        <p className="text-sm text-[#8B8FA8] mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="space-y-8 text-sm text-[#C4C7D4] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 1 — Objet</h2>
            <p>Les présentes Conditions Générales d&apos;Utilisation (« CGU ») régissent l&apos;accès et l&apos;utilisation de la plateforme SaaS <strong className="text-white">MecaniGo</strong> (ci-après « le Service »), éditée par MecaniGo SAS, société par actions simplifiée au capital de 10 000 €, dont le siège social est situé à Paris (75001), immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro B 123 456 789.</p>
            <p className="mt-2">Le Service est une solution de gestion destinée aux professionnels de la réparation de véhicules à deux-roues (garages motos, scooters et cycles). En accédant au Service, l&apos;Utilisateur accepte sans réserve les présentes CGU.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 2 — Accès au Service</h2>
            <p>L&apos;accès au Service est réservé aux professionnels disposant d&apos;un numéro SIRET valide et exerçant une activité de réparation ou de maintenance de véhicules à moteur. L&apos;inscription est soumise à la création d&apos;un compte via le service d&apos;authentification Clerk. L&apos;Utilisateur est responsable de la confidentialité de ses identifiants de connexion.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 3 — Abonnement et Tarifs</h2>
            <p>Le Service est proposé sous forme d&apos;abonnement mensuel selon les formules suivantes :</p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">Starter — 59 € HT/mois</strong> : jusqu&apos;à 100 clients, fonctionnalités de base (devis, factures, interventions).</li>
              <li><strong className="text-white">Pro — 99 € HT/mois</strong> : clients illimités, automatisations, stock, analytics.</li>
              <li><strong className="text-white">Business — 149 € HT/mois</strong> : multi-utilisateurs, API, support prioritaire, onboarding dédié.</li>
            </ul>
            <p className="mt-2">Les prix sont exprimés hors taxe (HT). La TVA applicable est celle en vigueur au moment de la facturation. MecaniGo se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 4 — Résiliation</h2>
            <p>L&apos;Utilisateur peut résilier son abonnement à tout moment depuis son espace Paramètres ou en contactant support@mecanigo.fr. La résiliation prend effet à la fin de la période en cours. Aucun remboursement prorata ne sera effectué sauf obligation légale.</p>
            <p className="mt-2">MecaniGo se réserve le droit de suspendre ou résilier tout compte en cas de manquement grave aux présentes CGU, d&apos;impayé persistant de plus de 15 jours ou d&apos;utilisation frauduleuse du Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 5 — Obligations de l&apos;Utilisateur</h2>
            <p>L&apos;Utilisateur s&apos;engage à :</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Fournir des informations exactes lors de l&apos;inscription et les maintenir à jour.</li>
              <li>Utiliser le Service uniquement dans le cadre de son activité professionnelle légale.</li>
              <li>Ne pas tenter d&apos;accéder aux données d&apos;autres Utilisateurs.</li>
              <li>Respecter les droits de propriété intellectuelle de MecaniGo.</li>
              <li>Ne pas utiliser le Service à des fins de spam ou d&apos;envoi non sollicité.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 6 — Données Personnelles</h2>
            <p>Le traitement des données personnelles est régi par la Politique de Confidentialité disponible à l&apos;adresse <Link href="/legal/privacy" className="text-[#FF6B2B] hover:underline">/legal/privacy</Link>. L&apos;Utilisateur dispose d&apos;un droit de suppression de ses données via l&apos;endpoint RGPD <code className="text-[#FF6B2B]">DELETE /api/user/data</code> ou en contactant dpo@mecanigo.fr.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 7 — Propriété Intellectuelle</h2>
            <p>L&apos;ensemble des éléments composant le Service (logiciel, interface, marques, logos, textes, graphismes) est la propriété exclusive de MecaniGo SAS ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation non autorisée est formellement interdite.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 8 — Responsabilité et Garanties</h2>
            <p>MecaniGo s&apos;engage à fournir le Service avec un niveau de disponibilité de 99,5 % par mois (hors maintenances planifiées). En cas d&apos;indisponibilité imputable à MecaniGo excédant ce seuil, l&apos;Utilisateur pourra demander un avoir proportionnel.</p>
            <p className="mt-2">MecaniGo ne saurait être tenu responsable des pertes ou dommages indirects résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le Service. La responsabilité totale de MecaniGo est limitée aux sommes effectivement perçues au cours des trois derniers mois précédant le fait générateur.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 9 — Modification des CGU</h2>
            <p>MecaniGo se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs seront informés de toute modification substantielle par email avec un préavis de 15 jours. La poursuite de l&apos;utilisation du Service après ce délai vaut acceptation des nouvelles CGU.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Article 10 — Droit Applicable et Juridiction</h2>
            <p>Les présentes CGU sont régies par le droit français. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux compétents de <strong className="text-white">Paris</strong> seront seuls compétents, sauf disposition légale contraire applicable aux consommateurs.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
            <p>Pour toute question relative aux présentes CGU : <a href="mailto:legal@mecanigo.fr" className="text-[#FF6B2B] hover:underline">legal@mecanigo.fr</a></p>
          </section>

        </div>
      </main>

      <footer className="border-t border-[#2A2D3A] px-6 py-4 text-center">
        <p className="text-[11px] text-[#8B8FA8]">© {new Date().getFullYear()} MecaniGo SAS — Tous droits réservés</p>
      </footer>
    </div>
  );
}
