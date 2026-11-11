import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Flash } from '@/components/Flash';
import { CategoryBadge, EmptyState, RequestStatusBadge } from '@/components/ui';
import { db } from '@/db';
import { requests } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { formatDateTime, formatRelative } from '@/lib/format';

export const metadata: Metadata = { title: 'Mes demandes' };

export default async function MyRequestsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const user = await requireUser();
  if (user.role !== 'client') redirect('/demandes');

  const rows = await db.query.requests.findMany({
    where: eq(requests.clientId, user.id),
    with: { bookings: { with: { helper: true } } },
    orderBy: desc(requests.createdAt),
  });
  const { ok } = await searchParams;

  return (
    <>
      <Flash code={ok} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Mes demandes</h1>
          <p className="page-lead">Suivez vos demandes d’aide et les propositions de vos voisins.</p>
        </div>
        <Link href="/demandes/nouvelle" className="btn btn-primary btn-lg shrink-0">
          <span aria-hidden="true">＋</span> Demander de l’aide
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Vous n’avez pas encore de demande">
            <p>Un souci avec un appareil ? Décrivez-le, un voisin viendra vous aider.</p>
            <Link href="/demandes/nouvelle" className="btn btn-primary mt-5">
              Publier ma première demande
            </Link>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((request) => {
            const pending = request.bookings.filter((b) => b.status === 'pending').length;
            const confirmed = request.bookings.find((b) => b.status === 'confirmed');
            return (
              <li key={request.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={request.category} />
                  <RequestStatusBadge status={request.status} />
                </div>
                <h2 className="mt-3 text-xl">{request.title}</h2>
                <p className="text-ink-soft text-sm">Publiée {formatRelative(request.createdAt)}</p>

                {request.status === 'open' && pending > 0 && (
                  <p className="bg-warn-bg text-warn-ink mt-4 rounded-xl p-3 font-bold">
                    {pending === 1
                      ? '1 voisin vous propose un rendez-vous. À vous de répondre !'
                      : `${pending} voisins vous proposent un rendez-vous. À vous de choisir !`}
                  </p>
                )}
                {confirmed && (
                  <p className="bg-ok-bg text-ok-ink mt-4 rounded-xl p-3 font-bold">
                    Rendez-vous avec {confirmed.helper.firstName} : {formatDateTime(confirmed.scheduledAt)}.
                  </p>
                )}

                <Link href={`/demandes/${request.id}`} className="btn btn-secondary mt-4">
                  {request.status === 'open' && pending > 0 ? 'Voir les propositions' : 'Voir le détail'}
                  <span className="sr-only"> : {request.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
