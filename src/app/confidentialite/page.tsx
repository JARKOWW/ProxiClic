import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactEmail, LegalPage, LegalSection } from '@/components/LegalPage';
import { legalInfo, RETENTION } from '@/lib/legal';

export const metadata: Metadata = { title: 'Politique de confidentialité' };

const DATA = [
  {
    what: 'Compte : prénom, nom, adresse e-mail, mot de passe (chiffré, jamais lisible), type de compte, quartier, ville, code postal, date de naissance, et si vous les indiquez : téléphone, présentation, compétences',
    why: 'Créer et gérer votre compte, vous mettre en relation avec des voisins proches. La date de naissance sert à vérifier l’âge minimum (18 ans pour les aidants) et à vous proposer l’affichage le plus confortable.',
    basis: 'Exécution du contrat (CGU), art. 6.1.b du RGPD',
  },
  {
    what: 'Demandes d’aide, propositions et rendez-vous',
    why: 'Organiser les interventions à domicile.',
    basis: 'Exécution du contrat',
  },
  {
    what: 'Messages échangés entre membres',
    why: 'Permettre aux membres de préparer une intervention.',
    basis: 'Exécution du contrat',
  },
  {
    what: 'Avis, notes, compliments et photos jointes à un avis',
    why: 'Informer les demandeurs sur la qualité des aidants, calculer les grades.',
    basis: 'Intérêt légitime de la plateforme et de ses membres (art. 6.1.f)',
  },
  {
    what: 'Questions posées à l’assistant automatique (IA)',
    why: 'Répondre à vos questions sur le site. Les questions ne sont pas enregistrées par Proxi’Clic.',
    basis: 'Intérêt légitime (aide aux utilisateurs)',
  },
  {
    what: 'Données techniques : adresse IP et adresse e-mail associées aux tentatives de connexion',
    why: 'Protéger les comptes contre les tentatives d’intrusion.',
    basis: 'Intérêt légitime (sécurité), art. 32 du RGPD',
  },
];

export default function PrivacyPage() {
  const info = legalInfo();
  const contact = <ContactEmail email={info.contactEmail} configured={info.contactConfigured} />;
  return (
    <LegalPage
      title="Politique de confidentialité"
      updatedAt={info.updatedAt}
      intro={
        <p>
          Cette page explique quelles données Proxi’Clic collecte, pourquoi, combien de temps elles sont gardées et
          comment exercer vos droits, conformément au Règlement général sur la protection des données (RGPD) et à la
          loi Informatique et Libertés.
        </p>
      }
    >
      <LegalSection id="responsable" title="Qui est responsable de vos données ?">
        <p>
          Le responsable du traitement est <strong>{info.editorName}</strong>, éditeur du site (voir les{' '}
          <Link href="/mentions-legales" className="link">
            mentions légales
          </Link>
          ). Pour toute question sur vos données : {contact}.
        </p>
      </LegalSection>

      <LegalSection id="donnees" title="Quelles données, pour quoi faire ?">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-line border-b-2">
                <th className="py-2 pr-4">Données</th>
                <th className="py-2 pr-4">Utilisation</th>
                <th className="py-2">Base légale</th>
              </tr>
            </thead>
            <tbody>
              {DATA.map((row) => (
                <tr key={row.what} className="border-line border-b align-top">
                  <td className="py-3 pr-4">{row.what}</td>
                  <td className="py-3 pr-4">{row.why}</td>
                  <td className="py-3">{row.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Nous ne vendons aucune donnée, ne faisons pas de publicité et n’utilisons aucun outil de mesure d’audience.
        </p>
      </LegalSection>

      <LegalSection id="visibilite" title="Qui voit quoi ?">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Les autres membres voient uniquement votre prénom, l’initiale de votre nom, votre quartier, votre ville, votre
            présentation et, pour les aidants, leurs compétences, leurs avis et leur grade.
          </li>
          <li>Votre numéro de téléphone n’est communiqué qu’à la personne avec qui un rendez-vous est confirmé.</li>
          <li>Votre adresse e-mail, votre nom complet et votre date de naissance ne sont jamais montrés aux autres membres.</li>
          <li>Les avis et leurs photos sont publics : ne mettez pas de photo où l’on peut vous reconnaître ou lire une adresse.</li>
        </ul>
      </LegalSection>

      <LegalSection id="destinataires" title="Prestataires et transferts hors de l’Union européenne">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Hébergement</strong> : {info.host.name} ({info.host.address}).
            {info.hostKey === 'vercel' &&
              ' Vercel est une société américaine : le transfert est encadré par les clauses contractuelles types de la Commission européenne prévues dans l’accord de traitement des données de Vercel. Les serveurs du site sont configurés dans la région de Paris.'}
            {info.hostKey === 'contabo' && ' Les données sont stockées dans l’Union européenne.'}
          </li>
          <li>
            <strong>Assistant automatique (IA)</strong> : les questions posées à l’assistant « Une question ? » sont envoyées
            à Groq Inc. (États-Unis), qui génère la réponse. Les adresses e-mail, numéros de téléphone et longues suites de
            chiffres sont masqués avant l’envoi. Groq ne conserve pas les questions au-delà du traitement lorsque l’option
            « Zero Data Retention » est activée ; sinon, elles peuvent être gardées jusqu’à 30 jours pour la sécurité de son
            service. Le transfert est encadré par les clauses contractuelles types de la Commission européenne. N’écrivez
            jamais de données personnelles dans l’assistant.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="durees" title="Combien de temps vos données sont-elles gardées ?">
        <ul className="list-disc space-y-2 pl-6">
          <li>Compte et données associées : tant que le compte existe. Vous pouvez le supprimer à tout moment depuis « Mon profil ».</li>
          <li>
            Compte inactif (aucune connexion pendant {RETENTION.inactiveAccountYears} ans) : supprimé automatiquement, avec
            toutes ses données.
          </li>
          <li>Demandes annulées : supprimées {RETENTION.cancelledRequestMonths} mois après leur publication.</li>
          <li>Compteurs de tentatives de connexion (adresse IP, e-mail) : effacés au plus tard une heure après la dernière tentative.</li>
          <li>Sauvegardes : écrasées en 30 jours au plus, ce qui efface aussi les comptes supprimés.</li>
        </ul>
      </LegalSection>

      <LegalSection id="droits" title="Vos droits">
        <p>Vous disposez des droits suivants sur vos données :</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Accès et portabilité</strong> : bouton « Télécharger mes données » dans{' '}
            <Link href="/profil" className="link">
              Mon profil
            </Link>
            .
          </li>
          <li><strong>Rectification</strong> : modifiez votre profil à tout moment.</li>
          <li><strong>Effacement</strong> : bouton « Supprimer mon compte » dans Mon profil. La suppression est immédiate et définitive.</li>
          <li><strong>Opposition et limitation</strong>, et directives sur le sort de vos données après votre décès : écrivez à {contact}.</li>
        </ul>
        <p>
          Nous répondons dans un délai d’un mois. Si vous estimez que vos droits ne sont pas respectés, vous pouvez
          adresser une réclamation à la CNIL :{' '}
          <a href="https://www.cnil.fr/fr/plaintes" className="link">
            cnil.fr/fr/plaintes
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="securite" title="Sécurité">
        <p>
          Connexion chiffrée (HTTPS), mots de passe chiffrés avec bcrypt, limitation des tentatives de connexion,
          déconnexion de tous les appareils lors d’un changement de mot de passe, accès de chaque membre limité à ses
          propres conversations et rendez-vous, sauvegardes chiffrées.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies">
        <p>
          Le site dépose un seul cookie, <code>proxitech_session</code>, qui garde votre connexion pendant 7 jours au plus.
          Il est strictement nécessaire au fonctionnement du service et n’exige donc pas votre consentement (article 82 de
          la loi Informatique et Libertés). Aucun cookie publicitaire ni de mesure d’audience n’est utilisé. Les polices
          d’écriture sont hébergées sur nos serveurs : votre navigateur ne contacte aucun service tiers.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
