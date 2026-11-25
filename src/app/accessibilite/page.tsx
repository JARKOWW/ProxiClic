import type { Metadata } from 'next';
import { Footer, Header } from '@/components/Header';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Accessibilité' };

const MEASURES = [
  'Deux affichages pour les demandeurs : un affichage complet, et un affichage simplifié qui réunit tout sur une seule page, avec un sommaire et des textes encore plus grands. On peut changer d’affichage à tout moment.',
  'Texte de grande taille (18 à 20 px) avec la police Atkinson Hyperlegible, conçue pour les personnes malvoyantes. Le texte peut être agrandi à 200 % sans perte de contenu.',
  'Couleurs contrastées (au moins 4,5:1 pour le texte) et aucune information donnée par la couleur seule.',
  'Navigation complète au clavier, focus toujours visible et lien d’évitement « Aller au contenu principal ».',
  'Boutons et zones cliquables d’au moins 48 pixels de haut, aux intitulés explicites.',
  'Formulaires avec étiquettes, consignes et messages d’erreur reliés à chaque champ, et annoncés aux lecteurs d’écran.',
  'Confirmation demandée avant toute action difficile à annuler (annuler une demande, refuser une proposition…).',
  'Langue de la page déclarée, titres hiérarchisés, zones de la page identifiées (en-tête, navigation, contenu, pied de page).',
  'Animations désactivées pour les personnes qui ont choisi de réduire les animations sur leur appareil.',
];

export default async function AccessibilityPage() {
  const user = await getCurrentUser();

  return (
    <>
      <Header user={user} />
      <main id="contenu" className="container-page flex-1 py-8 sm:py-10">
        <article className="mx-auto max-w-3xl space-y-8">
          <h1 className="page-title">Déclaration d’accessibilité</h1>

          <p className="text-lg">
            Proxi’Clic s’engage à rendre son site accessible à tous, conformément à l’article 47 de la loi n° 2005-102
            du 11 février 2005. Cette déclaration s’applique à l’ensemble du site Proxi’Clic.
          </p>

          <section aria-labelledby="etat" className="card space-y-3">
            <h2 id="etat" className="text-2xl">
              État de conformité
            </h2>
            <p>
              Le site a été conçu en suivant le Référentiel général d’amélioration de l’accessibilité (RGAA), version
              4.1. Aucun audit de conformité n’a encore été réalisé : en attendant cet audit, le site est déclaré{' '}
              <strong>non conforme</strong> au RGAA.
            </p>
          </section>

          <section aria-labelledby="mesures" className="card space-y-3">
            <h2 id="mesures" className="text-2xl">
              Ce que nous avons mis en place
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              {MEASURES.map((measure) => (
                <li key={measure}>{measure}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="technologies" className="card space-y-3">
            <h2 id="technologies" className="text-2xl">
              Technologies utilisées
            </h2>
            <p>HTML, CSS et JavaScript.</p>
          </section>

          <section aria-labelledby="recours" className="card space-y-3">
            <h2 id="recours" className="text-2xl">
              Signaler un problème et voies de recours
            </h2>
            <p>
              Si vous n’arrivez pas à accéder à un contenu ou à un service, signalez-le au responsable du site : nous
              vous proposerons une autre façon d’y accéder.
            </p>
            <p>
              Si vous n’obtenez pas de réponse, vous pouvez saisir le Défenseur des droits, par son formulaire en ligne
              sur{' '}
              <a href="https://www.defenseurdesdroits.fr" className="link">
                defenseurdesdroits.fr
              </a>
              , par téléphone au 09 69 39 00 00, ou par courrier gratuit, sans timbre : Défenseur des droits, Libre
              réponse 71120, 75342 Paris CEDEX 07.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
