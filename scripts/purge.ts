import './load-env';

/**
 * Applique les durées de conservation annoncées dans la politique de confidentialité (src/lib/legal.ts) :
 * - comptes sans connexion depuis RETENTION.inactiveAccountYears ans : supprimés avec toutes leurs données ;
 * - demandes annulées depuis plus de RETENTION.cancelledRequestMonths mois : supprimées ;
 * - compteurs de limitation expirés : supprimés.
 *
 * À lancer chaque jour (cron ou timer systemd sur le VPS, voir DEPLOIEMENT.md) : `npm run db:purge`.
 */
async function main() {
  const { and, eq, inArray, lt, or, isNull, sql } = await import('drizzle-orm');
  const { db, client, schema } = await import('../src/db');
  const { deleteAccountData } = await import('../src/lib/account');
  const { RETENTION } = await import('../src/lib/legal');
  const { users, requests, bookings, conversations, messages, reviews, reviewPhotos, rateLimits } = schema;

  const now = Date.now();
  const accountLimit = new Date(now - RETENTION.inactiveAccountYears * 365 * 86_400_000);
  const inactive = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(or(lt(users.lastLoginAt, accountLimit), and(isNull(users.lastLoginAt), lt(users.createdAt, accountLimit))));
  for (const user of inactive) await deleteAccountData(user.id, user.email);

  const requestLimit = new Date(now - RETENTION.cancelledRequestMonths * 30 * 86_400_000);
  const oldRequests = (
    await db
      .select({ id: requests.id })
      .from(requests)
      .where(and(eq(requests.status, 'cancelled'), lt(requests.createdAt, requestLimit)))
  ).map((r) => r.id);
  if (oldRequests.length) {
    await db.transaction(async (tx) => {
      const bookingIds = (await tx.select({ id: bookings.id }).from(bookings).where(inArray(bookings.requestId, oldRequests))).map((b) => b.id);
      if (bookingIds.length) {
        const reviewIds = (await tx.select({ id: reviews.id }).from(reviews).where(inArray(reviews.bookingId, bookingIds))).map((r) => r.id);
        if (reviewIds.length) {
          await tx.delete(reviewPhotos).where(inArray(reviewPhotos.reviewId, reviewIds));
          await tx.delete(reviews).where(inArray(reviews.id, reviewIds));
        }
        await tx.delete(bookings).where(inArray(bookings.id, bookingIds));
      }
      const conversationIds = (
        await tx.select({ id: conversations.id }).from(conversations).where(inArray(conversations.requestId, oldRequests))
      ).map((c) => c.id);
      if (conversationIds.length) {
        await tx.delete(messages).where(inArray(messages.conversationId, conversationIds));
        await tx.delete(conversations).where(inArray(conversations.id, conversationIds));
      }
      await tx.delete(requests).where(inArray(requests.id, oldRequests));
    });
  }

  await db.delete(rateLimits).where(sql`${rateLimits.resetAt} < ${now}`);
  client.close();
  console.log(`✔ Purge terminée : ${inactive.length} compte(s) inactif(s), ${oldRequests.length} demande(s) annulée(s) supprimés.`);
}

main().catch((error) => {
  console.error('✖ Échec de la purge :', error);
  process.exit(1);
});
