import { redirect } from 'next/navigation';
import { Footer, Header } from '@/components/Header';
import { getCurrentUser, homeFor } from '@/lib/auth';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  return (
    <>
      <Header user={null} />
      <main id="contenu" className="container-page flex-1 py-10">
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>
      <Footer />
    </>
  );
}
