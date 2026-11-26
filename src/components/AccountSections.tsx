import Link from 'next/link';
import { ChangePasswordForm, DeleteAccountForm } from './AccountSettings';

/** Mot de passe, export des données et suppression du compte (affichages complet et simplifié). */
export function AccountSections() {
  return (
    <>
      <section className="card mt-6" aria-labelledby="securite">
        <h2 id="securite" className="text-xl">
          Mot de passe
        </h2>
        <p className="text-ink-soft mt-1 mb-5">Changer de mot de passe déconnecte vos autres appareils.</p>
        <ChangePasswordForm />
      </section>

      <section className="card mt-6" aria-labelledby="donnees">
        <h2 id="donnees" className="text-xl">
          Vos données
        </h2>
        <p className="mt-2">
          Téléchargez toutes les informations que Proxi’Clic garde sur vous : profil, demandes, rendez-vous, messages et
          avis.
        </p>
        <p className="mt-4">
          <a href="/api/compte/export" className="btn btn-secondary" download>
            Télécharger mes données
          </a>
        </p>
        <p className="text-ink-soft mt-4 text-sm">
          Pour en savoir plus, lisez notre{' '}
          <Link href="/confidentialite" className="link">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>

      <section className="border-line-strong mt-6 rounded-3xl border-2 border-dashed p-6" aria-labelledby="suppression">
        <h2 id="suppression" className="text-xl">
          Supprimer mon compte
        </h2>
        <p className="mt-2 mb-5">
          Votre compte, vos demandes, vos rendez-vous, vos conversations et les avis liés sont effacés immédiatement et
          définitivement. Les personnes avec qui vous avez échangé ne verront plus ces conversations.
        </p>
        <DeleteAccountForm />
      </section>
    </>
  );
}
