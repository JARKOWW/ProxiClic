import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactEmail, LegalPage, LegalSection } from '@/components/LegalPage';
import { HELPER_MIN_AGE, MIN_AGE } from '@/lib/age';
import { GRADES } from '@/lib/grades';
import { legalInfo } from '@/lib/legal';

export const metadata: Metadata = { title: 'Conditions générales d’utilisation' };

export default function TermsPage() {
  const info = legalInfo();
  const contact = <ContactEmail email={info.contactEmail} configured={info.contactConfigured} />;
  return (
    <LegalPage
      title="Conditions générales d’utilisation"
      updatedAt={info.updatedAt}
      intro={
        <p>
          Ces conditions fixent les règles d’utilisation de Proxi’Clic. En créant un compte, vous les acceptez. Elles
          sont écrites simplement : si un point n’est pas clair, écrivez-nous à {contact}.
        </p>
      }
    >
      <LegalSection id="objet" title="1. Ce que fait Proxi’Clic">
        <p>
          Proxi’Clic met en relation des <strong>demandeurs</strong>, qui ont besoin d’aide avec un appareil ou une
          démarche en ligne, et des <strong>aidants</strong>, des voisins à l’aise avec le numérique qui viennent les aider
          à domicile.
        </p>
        <p>
          Proxi’Clic est un <strong>intermédiaire</strong> : il n’effectue pas les interventions, n’emploie pas les aidants
          et ne garantit pas le résultat d’une intervention. L’utilisation du site est gratuite et les interventions sont
          bénévoles : un aidant ne peut demander aucun paiement.
        </p>
      </LegalSection>

      <LegalSection id="compte" title="2. Votre compte">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Il faut avoir au moins {MIN_AGE} ans pour s’inscrire, et au moins <strong>{HELPER_MIN_AGE} ans pour être aidant</strong>.
          </li>
          <li>Les informations de votre profil doivent être exactes. Un seul compte par personne.</li>
          <li>Votre mot de passe est personnel : ne le communiquez à personne, pas même à un aidant.</li>
          <li>
            Vous pouvez supprimer votre compte à tout moment depuis{' '}
            <Link href="/profil" className="link">
              Mon profil
            </Link>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="securite" title="3. Règles de sécurité, pour tous">
        <ul className="list-disc space-y-2 pl-6">
          <li>Un aidant ne demande <strong>jamais</strong> un mot de passe, un code bancaire, un code reçu par SMS ni de l’argent.</li>
          <li>Le demandeur reste présent pendant l’intervention. Il peut demander à un proche d’être là.</li>
          <li>L’aidant n’accède qu’aux appareils et aux données nécessaires à l’intervention, et ne copie rien.</li>
          <li>Avant une intervention qui touche aux données (ordinateur lent, transfert, réinstallation), une sauvegarde est faite ou proposée.</li>
          <li>
            Profiter de la faiblesse ou de l’ignorance d’une personne est un délit (article 223-15-2 du Code pénal). Tout
            comportement de ce type est signalé aux autorités et entraîne la fermeture du compte.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="conduite" title="4. Ce qui est interdit">
        <p>Il est interdit de publier des contenus illégaux, injurieux, discriminatoires ou trompeurs, d’utiliser le site
          à des fins commerciales ou publicitaires, de harceler un membre, de publier les coordonnées d’un tiers, ou de
          laisser un avis sur une intervention qui n’a pas eu lieu.</p>
      </LegalSection>

      <LegalSection id="avis" title="5. Avis, notes et grades">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Avis vérifiés</strong> : seul le demandeur d’un rendez-vous marqué comme effectué peut laisser un avis,
            une seule fois par rendez-vous. Les avis ne sont ni achetés ni rémunérés.
          </li>
          <li>Les avis sont publiés immédiatement, sans tri : tous apparaissent, du plus récent au plus ancien.</li>
          <li>L’aidant peut répondre publiquement une fois sous chaque avis.</li>
          <li>
            Le <strong>grade</strong> d’un aidant dépend uniquement du nombre d’interventions effectuées :{' '}
            {GRADES.map((grade) => `${grade.name} (dès ${grade.min} intervention${grade.min > 1 ? 's' : ''})`).join(', ')}. La note moyenne est la moyenne simple des
            notes reçues.
          </li>
          <li>Un avis contraire à ces règles peut être signalé et retiré après examen.</li>
        </ul>
      </LegalSection>

      <LegalSection id="classement" title="6. Ordre d’affichage">
        <p>
          Les demandes d’aide sont présentées aux aidants de la même ville, celles de leur quartier en premier, puis de la
          plus récente à la plus ancienne. Les propositions reçues par un demandeur sont affichées de la plus récente à la
          plus ancienne, avec le grade et la note de chaque aidant. Aucun membre ne peut payer pour être mieux placé.
        </p>
      </LegalSection>

      <LegalSection id="signalement" title="7. Signaler un problème">
        <p>
          Un avis, un message ou un comportement vous pose problème ? Utilisez le lien « Signaler » à côté de l’avis, ou
          écrivez à {contact}. Nous pouvons retirer un contenu, avertir, suspendre ou fermer le compte d’un membre qui ne
          respecte pas ces règles. En cas de danger, appelez le 17 ou le 112.
        </p>
      </LegalSection>

      <LegalSection id="responsabilite" title="8. Responsabilités">
        <p>
          Chaque membre est responsable de ses publications et de ses actes. L’aidant est responsable des dommages qu’il
          cause pendant une intervention : il est invité à vérifier que son assurance responsabilité civile le couvre.
          Proxi’Clic s’engage à faire de son mieux pour que le site fonctionne et soit sûr, mais ne peut être tenu
          responsable d’une intervention qu’il n’a pas réalisée.
        </p>
      </LegalSection>

      <LegalSection id="donnees" title="9. Données personnelles">
        <p>
          Le traitement de vos données est décrit dans la{' '}
          <Link href="/confidentialite" className="link">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="modification" title="10. Modification et droit applicable">
        <p>
          Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de la page, et les membres sont prévenus
          de tout changement important. Elles sont soumises au droit français. En cas de litige, une solution amiable est
          recherchée avant toute action en justice.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
