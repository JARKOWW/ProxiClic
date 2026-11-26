import { Footer, Header } from '@/components/Header';
import { getCurrentUser } from '@/lib/auth';

/** Mise en page commune aux pages légales : titre, date de mise à jour, sections en cartes. */
export async function LegalPage({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  updatedAt?: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <>
      <Header user={user} />
      <main id="contenu" className="container-page flex-1 py-8 sm:py-10">
        <article className="mx-auto max-w-3xl space-y-6">
          <h1 className="page-title">{title}</h1>
          {updatedAt && <p className="text-ink-soft">Dernière mise à jour : {updatedAt}</p>}
          {intro && <div className="space-y-3 text-lg">{intro}</div>}
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="card space-y-3">
      <h2 id={id} className="text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Adresse e-mail de contact, cliquable si elle est configurée. */
export function ContactEmail({ email, configured }: { email: string; configured: boolean }) {
  return configured ? (
    <a href={`mailto:${email}`} className="link break-all">
      {email}
    </a>
  ) : (
    <strong>{email}</strong>
  );
}
