'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { bookings, requests } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { fieldErrors, formValues, idSchema, requestSchema, type FormState } from '@/lib/validation';

export async function createRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(formData);
  if (user.role !== 'client') {
    return { error: 'Seuls les demandeurs peuvent publier une demande.', values };
  }

  const parsed = requestSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Certains champs sont à corriger.', fieldErrors: fieldErrors(parsed.error), values };
  }

  const [created] = await db
    .insert(requests)
    .values({ ...parsed.data, clientId: user.id, neighborhood: user.neighborhood, city: user.city })
    .returning({ id: requests.id });

  revalidatePath('/demandes');
  redirect(`/demandes/${created.id}?ok=publiee`);
}

/** Le demandeur annule sa demande : les propositions et rendez-vous en cours sont annulés. */
export async function cancelRequest(requestId: number): Promise<void> {
  const user = await requireUser();
  const id = idSchema.safeParse(requestId);
  if (!id.success) return;

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(requests)
      .set({ status: 'cancelled' })
      .where(
        and(eq(requests.id, id.data), eq(requests.clientId, user.id), inArray(requests.status, ['open', 'booked'])),
      )
      .returning({ id: requests.id });
    if (updated.length === 0) return;

    await tx
      .update(bookings)
      .set({ status: 'cancelled' })
      .where(and(eq(bookings.requestId, id.data), inArray(bookings.status, ['pending', 'confirmed'])));
  });

  revalidatePath('/', 'layout');
  redirect('/mes-demandes?ok=annulee');
}
