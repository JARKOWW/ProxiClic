'use server';

import { and, eq, inArray, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { bookings, messages, requests } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { getOrCreateConversation } from '@/lib/conversations';
import { formatDateTime, formatDuration, parisToDate } from '@/lib/format';
import { bookingSchema, fieldErrors, formValues, idSchema, type FormState } from '@/lib/validation';

const MAX_DAYS_AHEAD = 60;

/** Un aidant propose un créneau pour une demande ouverte. */
export async function createBooking(requestId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(formData);
  if (user.role !== 'helper') {
    return { error: 'Seuls les aidants peuvent proposer un rendez-vous.', values };
  }

  const id = idSchema.safeParse(requestId);
  const parsed = bookingSchema.safeParse(values);
  if (!id.success) return { error: 'Cette demande est introuvable.', values };
  if (!parsed.success) {
    return { error: 'Veuillez choisir un jour et une heure.', fieldErrors: fieldErrors(parsed.error), values };
  }

  const { date, time, durationMin, message } = parsed.data;
  const scheduledAt = parisToDate(date, time);
  const now = Date.now();
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= now) {
    return { error: 'Le rendez-vous doit être fixé à une date à venir.', values };
  }
  if (scheduledAt.getTime() > now + MAX_DAYS_AHEAD * 86_400_000) {
    return { error: `Le rendez-vous doit avoir lieu dans les ${MAX_DAYS_AHEAD} prochains jours.`, values };
  }

  const request = await db.query.requests.findFirst({ where: eq(requests.id, id.data) });
  if (!request || request.status !== 'open') {
    return { error: 'Cette demande n’est plus disponible.', values };
  }

  const existing = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.requestId, request.id),
      eq(bookings.helperId, user.id),
      inArray(bookings.status, ['pending', 'confirmed']),
    ),
    columns: { id: true },
  });
  if (existing) {
    return { error: 'Vous avez déjà proposé un rendez-vous pour cette demande.', values };
  }

  await db.insert(bookings).values({
    requestId: request.id,
    helperId: user.id,
    scheduledAt,
    durationMin,
    note: message,
  });

  // La proposition ouvre (ou alimente) la conversation avec le demandeur.
  const conversationId = await getOrCreateConversation(request.id, request.clientId, user.id);
  const summary = `📅 Proposition de rendez-vous : ${formatDateTime(scheduledAt)} (${formatDuration(durationMin)}).`;
  await db.insert(messages).values({
    conversationId,
    senderId: user.id,
    body: message ? `${summary}\n\n${message}` : summary,
  });

  revalidatePath('/', 'layout');
  redirect('/rendez-vous?ok=proposition');
}

/** Charge un rendez-vous avec sa demande, ou null si l'identifiant est invalide. */
async function loadBooking(bookingId: number) {
  const id = idSchema.safeParse(bookingId);
  if (!id.success) return null;
  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, id.data), with: { request: true } });
  return booking ?? null;
}

/** Le demandeur accepte une proposition : elle est confirmée, les autres sont refusées. */
export async function acceptBooking(bookingId: number): Promise<void> {
  const user = await requireUser();
  const booking = await loadBooking(bookingId);
  if (!booking || booking.request.clientId !== user.id) return;
  if (booking.status !== 'pending' || booking.request.status !== 'open') return;

  await db.transaction(async (tx) => {
    await tx.update(bookings).set({ status: 'confirmed' }).where(eq(bookings.id, booking.id));
    await tx
      .update(bookings)
      .set({ status: 'declined' })
      .where(and(eq(bookings.requestId, booking.requestId), eq(bookings.status, 'pending'), ne(bookings.id, booking.id)));
    await tx.update(requests).set({ status: 'booked' }).where(eq(requests.id, booking.requestId));
  });

  const conversationId = await getOrCreateConversation(booking.requestId, user.id, booking.helperId);
  await db.insert(messages).values({
    conversationId,
    senderId: user.id,
    body: `✅ Rendez-vous confirmé : ${formatDateTime(booking.scheduledAt)}.`,
  });

  revalidatePath('/', 'layout');
  redirect('/rendez-vous?ok=confirme');
}

/** Le demandeur refuse une proposition en attente. */
export async function declineBooking(bookingId: number): Promise<void> {
  const user = await requireUser();
  const booking = await loadBooking(bookingId);
  if (!booking || booking.request.clientId !== user.id || booking.status !== 'pending') return;

  await db.update(bookings).set({ status: 'declined' }).where(eq(bookings.id, booking.id));
  revalidatePath('/', 'layout');
}

/** L'aidant retire sa proposition, ou l'un des deux participants annule un rendez-vous confirmé. */
export async function cancelBooking(bookingId: number): Promise<void> {
  const user = await requireUser();
  const booking = await loadBooking(bookingId);
  if (!booking) return;

  const isHelper = booking.helperId === user.id;
  const isClient = booking.request.clientId === user.id;
  const allowed =
    (booking.status === 'pending' && isHelper) || (booking.status === 'confirmed' && (isHelper || isClient));
  if (!allowed) return;

  await db.transaction(async (tx) => {
    await tx.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, booking.id));
    if (booking.status === 'confirmed') {
      // La demande redevient visible pour les autres aidants.
      await tx.update(requests).set({ status: 'open' }).where(eq(requests.id, booking.requestId));
    }
  });

  if (booking.status === 'confirmed') {
    const conversationId = await getOrCreateConversation(booking.requestId, booking.request.clientId, booking.helperId);
    await db.insert(messages).values({
      conversationId,
      senderId: user.id,
      body: `❌ Rendez-vous du ${formatDateTime(booking.scheduledAt)} annulé.`,
    });
  }

  revalidatePath('/', 'layout');
  redirect('/rendez-vous?ok=annule');
}

/** L'un des deux participants indique que l'intervention a eu lieu. */
export async function completeBooking(bookingId: number): Promise<void> {
  const user = await requireUser();
  const booking = await loadBooking(bookingId);
  if (!booking || booking.status !== 'confirmed') return;
  if (booking.helperId !== user.id && booking.request.clientId !== user.id) return;
  if (booking.scheduledAt.getTime() > Date.now()) return;

  await db.transaction(async (tx) => {
    await tx.update(bookings).set({ status: 'completed' }).where(eq(bookings.id, booking.id));
    await tx.update(requests).set({ status: 'done' }).where(eq(requests.id, booking.requestId));
  });

  revalidatePath('/', 'layout');
  redirect('/rendez-vous?ok=termine');
}
