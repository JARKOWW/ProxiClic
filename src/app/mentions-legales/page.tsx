import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactEmail, LegalPage, LegalSection } from '@/components/LegalPage';
import { legalInfo } from '@/lib/legal';

export const metadata: Metadata = { title: 'Mentions légales' };

export default function LegalNoticePage() {
  const info = legalInfo();
  return (
    <LegalPage
      title="Mentions légales"
      updatedAt={info.updatedAt}
      intro={<p>Informations prévues par l’article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN).</p>}
    >
      <LegalSection id="editeur" title="Éditeur du site">
        <p>
          <strong>{info.editorName}</strong>
          {info.editorStatus && <> — {info.editorStatus}</>}
        </p>
        {info.editorAddress && <p>Adresse : {info.editorAddress}</p>}
        {info.editorRegistration && <p>Immatriculation : {info.editorRegistration}</p>}
        <p>
          Contact : <ContactEmail email={info.contactEmail} configured={info.contactConfigured} />
        </p>
        <p>Directeur ou directrice de la publication : {info.publicationDirector}</p>
      </LegalSection>

      <LegalSection id="hebergeur" title="Hébergeur">
        <p>
          <strong>{info.host.name}</strong>
          <br />
          {info.host.address}
          <br />
          Téléphone : {info.host.phone}
          <br />
          <a href={info.host.website} className="link">
            {info.host.website.replace('https://', '')}
          </a>
        </p>
      </LegalSection>

      <LegalSection id="service" title="Nature du service">
        <p>
          Proxi’Clic est une plateforme gratuite de mise en relation entre voisins : des aidants bénévoles, à l’aise
          avec le numérique, proposent leur aide à domicile à des personnes qui rencontrent une difficulté avec un
          appareil ou une démarche en ligne. Proxi’Clic n’effectue pas lui-même les interventions. Les règles
          d’utilisation figurent dans les <Link href="/cgu" className="link">conditions générales d’utilisation</Link>.
        </p>
      </LegalSection>

      <LegalSection id="donnees" title="Données personnelles et cookies">
        <p>
          Le traitement de vos données est décrit dans la{' '}
          <Link href="/confidentialite" className="link">
            politique de confidentialité
          </Link>
          . Le site n’utilise qu’un cookie, strictement nécessaire au maintien de votre connexion : il ne demande donc
          pas de consentement.
        </p>
      </LegalSection>

      <LegalSection id="propriete" title="Propriété intellectuelle">
        <p>
          Le nom Proxi’Clic, le logo, les textes et le code du site sont la propriété de l’éditeur. Toute reproduction
          sans autorisation est interdite. Les contenus publiés par les membres (demandes, avis, photos) restent leur
          propriété ; ils accordent à l’éditeur le droit de les afficher sur le site le temps de leur publication.
        </p>
      </LegalSection>

      <LegalSection id="signalement" title="Signaler un contenu illicite">
        <p>
          Pour signaler un contenu ou un comportement contraire à la loi ou aux CGU, écrivez à{' '}
          <ContactEmail email={info.contactEmail} configured={info.contactConfigured} /> en précisant la page concernée
          et la raison du signalement. Chaque signalement est examiné et vous recevez une réponse.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
