import { and, desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Flash } from '@/components/Flash';
import { CategoryBadge, EmptyState } from '@/components/ui';
import { db } from '@/db';
import { requests } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { CATEGORIES, CATEGORY_KEYS, type Category } from '@/lib/constants';
import { displayName, excerpt, formatRelative } from '@/lib/format';

export const metadata: Metadata = { title: 'Demandes d’aide' };

type Search = { categorie?: string; ville?: string; ok?: string };

export default async function RequestsFeedPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  if (user.role !== 'helper') redirect('/mes-demandes');

  const { categorie, ville, ok } = await searchParams;
  const category = (CATEGORY_KEYS as readonly string[]).includes(categorie ?? '') ? (categorie as Category) : undefined;
  const everywhere = ville === 'toutes';

  const rows = await db.query.requests.findMany({
    where: and(
      eq(requests.status, 'open'),
      category ? eq(requests.category, category) : undefined,
      everywhere ? undefined : eq(requests.city, user.city),
    ),
    with: { client: true, bookings: { columns: { helperId: true, status: true } } },
    orderBy: desc(requests.createdAt),
  });

  // Les demandes du même quartier que l'aidant passent en premier.
  const sorted = [...rows].sort(
    (a, b) => Number(b.neighborhood === user.neighborhood) - Number(a.neighborhood === user.neighborhood),
  );

  return (
    <>
      <Flash code={ok} />
      <h1 className="page-title">Demandes d’aide</h1>
      <p className="page-lead">
        {everywhere ? 'Toutes les demandes en attente d’un aidant.' : `Les demandes en attente d’un aidant à ${user.city}.`}
      </p>

      <form method="get" className="card mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="categorie" className="label">
            Catégorie
          </label>
          <select id="categorie" name="categorie" className="input" defaultValue={category ?? ''}>
            <option value="">Toutes les catégories</option>
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {CATEGORIES[key].label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="ville" className="label">
            Secteur
          </label>
          <select id="ville" name="ville" className="input" defaultValue={everywhere ? 'toutes' : ''}>
            <option value="">Ma ville ({user.city})</option>
            <option value="toutes">Toutes les villes</option>
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Filtrer
        </button>
      </form>

      <p className="mt-6 font-bold" role="status">
        {sorted.length === 0
          ? 'Aucune demande'
          : sorted.length === 1
            ? '1 demande'
            : `${sorted.length} demandes`}
      </p>

      {sorted.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Aucune demande pour le moment">
            <p>Revenez un peu plus tard, ou élargissez votre recherche à toutes les villes.</p>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {sorted.map((request) => {
            const mine = request.bookings.some((b) => b.helperId === user.id && b.status === 'pending');
            const nearby = request.neighborhood === user.neighborhood;
            return (
              <li key={request.id} className="card flex flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={request.category} />
                  {nearby && <span className="badge bg-ok-bg text-ok-ink">Dans votre quartier</span>}
                  {mine && <span className="badge bg-warn-bg text-warn-ink">Proposition envoyée</span>}
                </div>
                <h2 className="mt-3 text-xl">
                  <Link href={`/demandes/${request.id}`} className="hover:text-brand-700 no-underline hover:underline">
                    {request.title}
                  </Link>
                </h2>
                <p className="text-ink-soft mt-2 flex-1">{excerpt(request.description)}</p>
                <p className="mt-4 text-sm">
                  <strong>{displayName(request.client)}</strong> · {request.neighborhood}, {request.city} ·{' '}
                  <span className="text-ink-soft">publiée {formatRelative(request.createdAt)}</span>
                </p>
                <Link href={`/demandes/${request.id}`} className="btn btn-secondary mt-4 self-start">
                  Voir la demande<span className="sr-only"> : {request.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
