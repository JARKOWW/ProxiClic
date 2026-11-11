import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RequestForm } from '@/components/RequestForm';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Demander de l’aide' };

export default async function NewRequestPage() {
  const user = await requireUser();
  if (user.role !== 'client') redirect('/demandes');

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="page-title">Demander de l’aide</h1>
      <p className="page-lead">
        Expliquez simplement ce qui vous pose problème. Votre demande sera visible des aidants de {user.neighborhood}{' '}
        et de {user.city}.
      </p>
      <div className="card mt-8">
        <RequestForm />
      </div>
    </div>
  );
}
