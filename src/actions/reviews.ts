'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { bookings, reviews } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { fieldErrors, formValues, idSchema, reviewSchema, type FormState } from '@/lib/validation';

/** Le demandeur note l'aidant une fois l'intervention effectuée (un seul avis par rendez-vous). */
export async function createReview(bookingId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(formData);
  const id = idSchema.safeParse(bookingId);
  if (!id.success) return { error: 'Ce rendez-vous est introuvable.', values };

  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { error: errors.rating?.[0] ?? 'Certains champs sont à corriger.', fieldErrors: errors, values };
  }

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, id.data), with: { request: true } });
  if (!booking || booking.request.clientId !== user.id) {
    return { error: 'Ce rendez-vous est introuvable.', values };
  }
  if (booking.status !== 'completed') {
    return { error: 'Vous pourrez laisser un avis une fois l’intervention effectuée.', values };
  }

  const inserted = await db
    .insert(reviews)
    .values({ bookingId: booking.id, authorId: user.id, helperId: booking.helperId, ...parsed.data })
    .onConflictDoNothing()
    .returning({ id: reviews.id });
  if (inserted.length === 0) {
    return { error: 'Vous avez déjà laissé un avis pour ce rendez-vous.', values };
  }

  revalidatePath('/', 'layout');
  return { success: 'Merci pour votre avis !' };
}
