import { eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { bookings, conversations, messages, rateLimits, requests, reviewPhotos, reviews, users } from '@/db/schema';

/**
 * Supprime définitivement un compte et toutes les données qui s'y rattachent (RGPD art. 17) :
 * demandes, propositions et rendez-vous, conversations et messages, avis donnés et reçus avec leurs photos.
 * La suppression est explicite (sans compter sur les clés étrangères en cascade) et se fait en une transaction.
 */
export async function deleteAccountData(userId: number, email: string): Promise<void> {
  await db.transaction(async (tx) => {
    const ownRequests = await tx.select({ id: requests.id }).from(requests).where(eq(requests.clientId, userId));
    const requestIds = ownRequests.map((r) => r.id);

    const relatedBookings = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(requestIds.length ? or(eq(bookings.helperId, userId), inArray(bookings.requestId, requestIds)) : eq(bookings.helperId, userId));
    const bookingIds = relatedBookings.map((b) => b.id);

    const relatedReviews = await tx
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        bookingIds.length
          ? or(eq(reviews.authorId, userId), eq(reviews.helperId, userId), inArray(reviews.bookingId, bookingIds))
          : or(eq(reviews.authorId, userId), eq(reviews.helperId, userId)),
      );
    const reviewIds = relatedReviews.map((r) => r.id);

    const relatedConversations = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        requestIds.length
          ? or(eq(conversations.clientId, userId), eq(conversations.helperId, userId), inArray(conversations.requestId, requestIds))
          : or(eq(conversations.clientId, userId), eq(conversations.helperId, userId)),
      );
    const conversationIds = relatedConversations.map((c) => c.id);

    if (reviewIds.length) {
      await tx.delete(reviewPhotos).where(inArray(reviewPhotos.reviewId, reviewIds));
      await tx.delete(reviews).where(inArray(reviews.id, reviewIds));
    }
    if (conversationIds.length) {
      await tx.delete(messages).where(inArray(messages.conversationId, conversationIds));
      await tx.delete(conversations).where(inArray(conversations.id, conversationIds));
    }
    // Messages envoyés ailleurs (cas impossible aujourd'hui, mais on ne laisse rien derrière).
    await tx.delete(messages).where(eq(messages.senderId, userId));
    if (bookingIds.length) await tx.delete(bookings).where(inArray(bookings.id, bookingIds));
    if (requestIds.length) await tx.delete(requests).where(inArray(requests.id, requestIds));
    await tx.delete(rateLimits).where(sql`${rateLimits.key} like ${`%${email}%`}`);
    await tx.delete(users).where(eq(users.id, userId));
  });
}

/** Toutes les données d'un compte, dans un format lisible et réutilisable (RGPD art. 15 et 20). */
export async function exportAccountData(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { passwordHash: false, sessionVersion: false },
  });
  if (!user) return null;

  const [ownRequests, helperBookings, userConversations, reviewsWritten, reviewsReceived] = await Promise.all([
    db.query.requests.findMany({ where: eq(requests.clientId, userId), with: { bookings: true } }),
    db.query.bookings.findMany({ where: eq(bookings.helperId, userId), with: { request: { columns: { title: true } } } }),
    db.query.conversations.findMany({
      where: or(eq(conversations.clientId, userId), eq(conversations.helperId, userId)),
      columns: { id: true, requestId: true, createdAt: true },
      with: {
        request: { columns: { title: true } },
        messages: { columns: { senderId: true, body: true, createdAt: true, readAt: true } },
      },
    }),
    db.query.reviews.findMany({ where: eq(reviews.authorId, userId), with: { photos: { columns: { id: true } } } }),
    db.query.reviews.findMany({ where: eq(reviews.helperId, userId), columns: { rating: true, comment: true, tags: true, reply: true, createdAt: true } }),
  ]);

  return {
    exportéLe: new Date().toISOString(),
    service: "Proxi'Clic",
    compte: user,
    demandesPubliées: ownRequests,
    propositionsEnTantQuAidant: helperBookings,
    conversations: userConversations.map((c) => ({
      ...c,
      messages: c.messages.map((m) => ({ ...m, envoyéParMoi: m.senderId === userId })),
    })),
    avisRédigés: reviewsWritten,
    avisReçus: reviewsReceived,
  };
}
