import { redirect } from 'next/navigation';
import { Footer, Header } from '@/components/Header';
import { homeFor, requireUser, usesSimpleView } from '@/lib/auth';

// Toujours rendu à la demande : la page montre l'état à jour des rendez-vous et des messages.
export const dynamic = 'force-dynamic';

/** Affichage simplifié, réservé aux demandeurs qui l'ont choisi. */
export default async function SimpleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!usesSimpleView(user)) redirect(homeFor(user));

  return (
    <>
      <Header user={user} />
      <main id="contenu" className="container-page flex-1 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
      <Footer />
    </>
  );
}
