'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { users } from '@/db/schema';
import { redirect } from 'next/navigation';
import { homeFor, requireUser } from '@/lib/auth';
import { fieldErrors, formValues, profileSchema, type FormState } from '@/lib/validation';

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(formData);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Certains champs sont à corriger.', fieldErrors: fieldErrors(parsed.error), values };
  }

  const { skills, ...data } = parsed.data;
  await db
    .update(users)
    .set({ ...data, skills: user.role === 'helper' ? skills : null })
    .where(eq(users.id, user.id));

  revalidatePath('/', 'layout');
  return { success: 'Votre profil a bien été enregistré.' };
}

/** Le demandeur passe de l'affichage complet à l'affichage simplifié, ou l'inverse. */
export async function setSimpleView(enabled: boolean): Promise<void> {
  const user = await requireUser();
  if (user.role !== 'client') return;

  const simpleView = enabled === true;
  await db.update(users).set({ simpleView }).where(eq(users.id, user.id));
  revalidatePath('/', 'layout');
  redirect(`${homeFor({ role: user.role, simpleView })}?ok=${simpleView ? 'vue-simple' : 'vue-complete'}`);
}
