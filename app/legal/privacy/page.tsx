import Link from 'next/link';
import { Zap } from 'lucide-react';

export const metadata = { title: 'Politique de confidentialité — MecaniGo' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white">
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
        <h1 className="text-3xl font-bold text-white mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-[#8B8FA8] mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')} — Conforme RGPD (UE) 2016/679</p>

        <div className="space-y-8 text-sm text-[#C4C7D4] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Responsable du traitement</h2>
            <p><strong className="text-white">MecaniGo SAS</strong><br />
            Siège social : Paris (75001), France<br />
            Email : <a href="mailto:dpo@mecanigo.fr" className="text-[#FF6B2B] hover:underline">dpo@mecanigo.fr</a><br />
            Délégué à la Protection des Données (DPO) : <a href="mailto:dpo@mecanigo.fr" className="text-[#FF6B2B] hover:underline">dpo@mecanigo.fr</a></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Données collectées</h2>
            <p>Dans le cadre de l&apos;utilisation du Service MecaniGo, nous collectons les catégories de données suivantes :</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border border-[#2A2D3A] rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#1A1D27]">
                    <th className="text-left px-4 py-2 text-[#8B8FA8] font-medium">Catégorie</th>
                    <th className="text-left px-4 py-2 text-[#8B8FA8] font-medium">Données</th>
                    <th className="text-left px-4 py-2 text-[#8B8FA8] font-medium">Finalité</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Compte', 'Nom, email, identifiant Clerk', 'Authentification et accès'],
                    ['Garage', 'Nom, adresse, SIRET, téléphone, logo', 'Gestion du compte professionnel'],
                    ['Clients du garage', 'Nom, email, téléphone, véhicule', 'Gestion de la clientèle du garage'],
                    ['Factures/Devis', 'Montants, dates, statuts', 'Gestion administrative'],
                    ['Données techniques', 'Adresse IP, user-agent, logs', 'Sécurité et débogage'],
                  ].map(([cat, data, purpose], i) => (
                    <tr key={i} className="border-t border-[#2A2D3A]">
                      <td className="px-4 py-2 text-white font-medium">{cat}</td>
                      <td className="px-4 py-2 text-[#C4C7D4]">{data}</td>
                      <td className="px-4 py-2 text-[#8B8FA8]">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Bases légales du traitement</h2>
            <ul className="space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">Exécution d&apos;un contrat</strong> — pour la fourniture du Service souscrit.</li>
              <li><strong className="text-white">Intérêt légitime</strong> — pour la sécurité, la prévention des fraudes et l&apos;amélioration du Service.</li>
              <li><strong className="text-white">Obligation légale</strong> — pour la conservation des données comptables et fiscales.</li>
              <li><strong className="text-white">Consentement</strong> — pour les communications marketing optionnelles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Durées de conservation</h2>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Données de compte actif : durée de la relation contractuelle + 3 ans.</li>
              <li>Données comptables et factures : 10 ans (obligation légale, art. L.123-22 C. com.).</li>
              <li>Logs techniques : 12 mois glissants.</li>
              <li>Données supprimées suite à demande RGPD : anonymisation immédiate, sauf obligation légale de conservation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Hébergement et sous-traitants</h2>
            <p>Les données sont hébergées en Union Européenne par :</p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">Supabase</strong> (base de données, stockage) — région EU West.</li>
              <li><strong className="text-white">Vercel</strong> (hébergement application) — région EU.</li>
              <li><strong className="text-white">Clerk</strong> (authentification) — certifié SOC2 Type II, données EU.</li>
              <li><strong className="text-white">Resend</strong> (emails transactionnels) — traitement aux USA avec clauses contractuelles types.</li>
            </ul>
            <p className="mt-2">Chaque sous-traitant a signé un Accord de Traitement des Données (DPA) conforme au RGPD.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Vos droits RGPD</h2>
            <p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :</p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">Droit d&apos;accès</strong> — obtenir une copie de vos données.</li>
              <li><strong className="text-white">Droit de rectification</strong> — corriger des données inexactes.</li>
              <li><strong className="text-white">Droit à l&apos;effacement</strong> — via <code className="text-[#FF6B2B]">DELETE /api/user/data</code> dans vos Paramètres, ou par email au DPO.</li>
              <li><strong className="text-white">Droit à la portabilité</strong> — export de vos données en JSON/CSV.</li>
              <li><strong className="text-white">Droit d&apos;opposition</strong> — pour les traitements fondés sur l&apos;intérêt légitime.</li>
              <li><strong className="text-white">Droit à la limitation</strong> — geler un traitement en cours de contestation.</li>
            </ul>
            <p className="mt-2">Pour exercer ces droits : <a href="mailto:dpo@mecanigo.fr" className="text-[#FF6B2B] hover:underline">dpo@mecanigo.fr</a>. Réponse sous 30 jours. En cas de refus ou de non-réponse, vous pouvez introduire une réclamation auprès de la <strong className="text-white">CNIL</strong> (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#FF6B2B] hover:underline">www.cnil.fr</a>).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Cookies et traceurs</h2>
            <p>MecaniGo utilise uniquement des cookies strictement nécessaires au fonctionnement du Service (session, authentification). Aucun cookie publicitaire ou de profilage tiers n&apos;est déposé sans votre consentement explicite.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Sécurité</h2>
            <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement TLS en transit, chiffrement au repos, authentification multi-facteurs disponible, journalisation des accès, tests de sécurité réguliers. En cas de violation de données, vous serez notifié dans les 72 heures si celle-ci est susceptible d&apos;engendrer un risque pour vos droits et libertés.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Modifications</h2>
            <p>Nous pouvons mettre à jour cette politique. En cas de changement substantiel, vous serez notifié par email 15 jours avant l&apos;entrée en vigueur. La date de dernière mise à jour est indiquée en haut de ce document.</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-[#2A2D3A] px-6 py-4 flex flex-wrap justify-center gap-4">
        <span className="text-[11px] text-[#8B8FA8]">© {new Date().getFullYear()} MecaniGo SAS</span>
        <Link href="/legal/cgu" className="text-[11px] text-[#8B8FA8] hover:text-[#FF6B2B] transition-colors">CGU</Link>
      </footer>
    </div>
  );
}
