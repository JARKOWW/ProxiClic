import { and, count, countDistinct, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { bookings, requests, reviews, users } from '@/db/schema';

export type HelperStats = { completed: number; reviewCount: number; average: number | null };

const EMPTY: HelperStats = { completed: 0, reviewCount: 0, average: null };

/** Interventions effectuées et note moyenne de chaque aidant. */
export async function allHelperStats(): Promise<Map<number, HelperStats>> {
  const [done, rated] = await Promise.all([
    db
      .select({ helperId: bookings.helperId, n: count() })
      .from(bookings)
      .where(eq(bookings.status, 'completed'))
      .groupBy(bookings.helperId),
    db
      .select({ helperId: reviews.helperId, n: count(), average: sql<number>`avg(${reviews.rating})` })
      .from(reviews)
      .groupBy(reviews.helperId),
  ]);

  const stats = new Map<number, HelperStats>();
  for (const row of done) stats.set(row.helperId, { ...EMPTY, completed: row.n });
  for (const row of rated) {
    stats.set(row.helperId, {
      ...(stats.get(row.helperId) ?? EMPTY),
      reviewCount: row.n,
      average: Number(row.average),
    });
  }
  return stats;
}

export async function helperStats(helperId: number): Promise<HelperStats> {
  return (await allHelperStats()).get(helperId) ?? EMPTY;
}

/** Aidants les plus actifs : d'abord le nombre d'interventions, puis la note moyenne. */
export async function topHelpers(limit: number) {
  const [stats, helpers] = await Promise.all([
    allHelperStats(),
    db.query.users.findMany({
      where: eq(users.role, 'helper'),
      columns: { id: true, firstName: true, lastName: true, neighborhood: true, city: true, skills: true, bio: true },
    }),
  ]);

  return helpers
    .map((helper) => ({ ...helper, stats: stats.get(helper.id) ?? EMPTY }))
    .filter((helper) => helper.stats.completed > 0)
    .sort((a, b) => b.stats.completed - a.stats.completed || (b.stats.average ?? 0) - (a.stats.average ?? 0))
    .slice(0, limit);
}

/** Derniers avis accompagnés d'un commentaire. */
export function latestReviews(limit: number) {
  return db.query.reviews.findMany({
    where: isNotNull(reviews.comment),
    with: {
      author: { columns: { firstName: true, lastName: true, neighborhood: true } },
      helper: { columns: { id: true, firstName: true, lastName: true } },
      photos: { columns: { id: true } },
      booking: { with: { request: { columns: { title: true, category: true } } } },
    },
    orderBy: desc(reviews.createdAt),
    limit,
  });
}

/**
 * Profil public d'un aidant : uniquement ce que les autres membres ont le droit de voir
 * (ni e-mail, ni téléphone, ni nom complet), avec tous ses avis.
 */
export async function helperProfile(helperId: number) {
  const helper = await db.query.users.findFirst({
    where: and(eq(users.id, helperId), eq(users.role, 'helper')),
    columns: { id: true, firstName: true, lastName: true, neighborhood: true, city: true, bio: true, skills: true, createdAt: true },
  });
  if (!helper) return null;

  const [stats, reviewRows] = await Promise.all([
    helperStats(helperId),
    db.query.reviews.findMany({
      where: eq(reviews.helperId, helperId),
      with: {
        author: { columns: { firstName: true, lastName: true, neighborhood: true } },
        photos: { columns: { id: true } },
        booking: { with: { request: { columns: { title: true, category: true } } } },
      },
      orderBy: desc(reviews.createdAt),
    }),
  ]);

  // Répartition des notes (5 → 1 étoile) et nombre de fois où chaque compliment a été reçu.
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviewRows.filter((review) => review.rating === stars).length,
  }));
  const tagCounts = new Map<string, number>();
  for (const review of reviewRows) {
    for (const tag of review.tags?.split(',') ?? []) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  return { helper, stats, reviews: reviewRows, distribution, tagCounts };
}

/** Chiffres clés affichés sur la page d'accueil. */
export async function communityStats() {
  const [[members], [done], [rating], [areas]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(bookings).where(eq(bookings.status, 'completed')),
    db.select({ n: count(), average: sql<number | null>`avg(${reviews.rating})` }).from(reviews),
    db.select({ n: countDistinct(users.neighborhood) }).from(users),
  ]);
  return {
    members: members.n,
    completed: done.n,
    reviewCount: rating.n,
    average: rating.average === null ? null : Number(rating.average),
    neighborhoods: areas.n,
  };
}

/** Dernières demandes ouvertes, sans aucune information personnelle (page publique). */
export function latestOpenRequests(limit: number) {
  return db
    .select({
      id: requests.id,
      title: requests.title,
      category: requests.category,
      neighborhood: requests.neighborhood,
      city: requests.city,
      createdAt: requests.createdAt,
    })
    .from(requests)
    .where(and(eq(requests.status, 'open')))
    .orderBy(desc(requests.createdAt))
    .limit(limit);
}
