'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { bookings, reviewPhotos, reviews } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { readPhotos } from '@/lib/photos';
import { fieldErrors, formValues, idSchema, replySchema, reviewSchema, type FormState } from '@/lib/validation';

/** Le demandeur note l'aidant une fois l'intervention effectuée (un seul avis par rendez-vous). */
export async function createReview(bookingId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const tags = formData.getAll('tags').filter((value): value is string => typeof value === 'string');
  const values = { ...formValues(formData), tags: tags.join(',') };
  const id = idSchema.safeParse(bookingId);
  if (!id.success) return { error: 'Ce rendez-vous est introuvable.', values };

  const parsed = reviewSchema.safeParse({ ...values, tags });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { error: errors.rating?.[0] ?? 'Certains champs sont à corriger.', fieldErrors: errors, values };
  }

  const uploaded = await readPhotos(formData);
  if ('error' in uploaded) return { error: uploaded.error, values };

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, id.data), with: { request: true } });
  if (!booking || booking.request.clientId !== user.id) {
    return { error: 'Ce rendez-vous est introuvable.', values };
  }
  if (booking.status !== 'completed') {
    return { error: 'Vous pourrez laisser un avis une fois l’intervention effectuée.', values };
  }

  // L'avis et ses photos sont enregistrés ensemble, ou pas du tout.
  const created = await db.transaction(async (tx) => {
    const [review] = await tx
      .insert(reviews)
      .values({ bookingId: booking.id, authorId: user.id, helperId: booking.helperId, ...parsed.data })
      .onConflictDoNothing()
      .returning({ id: reviews.id });
    if (!review) return false;
    if (uploaded.photos.length > 0) {
      await tx.insert(reviewPhotos).values(uploaded.photos.map((photo) => ({ reviewId: review.id, ...photo })));
    }
    return true;
  });
  if (!created) {
    return { error: 'Vous avez déjà laissé un avis pour ce rendez-vous.', values };
  }

  revalidatePath('/', 'layout');
  return { success: 'Merci pour votre avis !' };
}

/** L'aidant répond une fois, publiquement, à un avis reçu. */
export async function replyToReview(reviewId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(formData);
  const id = idSchema.safeParse(reviewId);
  if (!id.success) return { error: 'Cet avis est introuvable.', values };

  const parsed = replySchema.safeParse(values);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { error: errors.reply?.[0] ?? 'Votre réponse est à corriger.', fieldErrors: errors, values };
  }

  const updated = await db
    .update(reviews)
    .set({ reply: parsed.data.reply, repliedAt: new Date() })
    .where(and(eq(reviews.id, id.data), eq(reviews.helperId, user.id), isNull(reviews.reply)))
    .returning({ id: reviews.id });
  if (updated.length === 0) {
    return { error: 'Cet avis est introuvable ou vous y avez déjà répondu.', values };
  }

  revalidatePath('/', 'layout');
  return { success: 'Votre réponse est publiée.' };
}
