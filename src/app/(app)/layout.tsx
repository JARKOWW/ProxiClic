import { Footer, Header } from '@/components/Header';
import { requireUser } from '@/lib/auth';
import { unreadByConversation } from '@/lib/conversations';

// Espace connecté : toujours rendu à la demande, jamais mis en cache.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = [...(await unreadByConversation(user.id)).values()].reduce((sum, n) => sum + n, 0);

  return (
    <>
      <Header user={user} unread={unread} />
      <main id="contenu" className="container-page flex-1 py-8 sm:py-10">
        {children}
      </main>
      <Footer />
    </>
  );
}
