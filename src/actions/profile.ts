'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { users } from '@/db/schema';
import { redirect } from 'next/navigation';
import { ageFrom, HELPER_MIN_AGE, simpleViewForAge } from '@/lib/age';
import { homeFor, requireUser } from '@/lib/auth';
import { fieldErrorsWithBirthDate, formValues, helperAgeError, profileSchema, type FormState } from '@/lib/validation';

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(formData);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: 'Certains champs sont à corriger.',
      fieldErrors: fieldErrorsWithBirthDate(parsed.error, values, !user.birthDate),
      values,
    };
  }

  const { skills, birthDate, ...data } = parsed.data;
  // Une date de naissance déjà enregistrée ne peut pas être effacée, seulement corrigée.
  const nextBirthDate = birthDate ?? user.birthDate;
  if (user.role === 'helper' && nextBirthDate && ageFrom(nextBirthDate) < HELPER_MIN_AGE) {
    return { error: 'Certains champs sont à corriger.', fieldErrors: { birthDate: [helperAgeError] }, values };
  }
  // Nouvelle date de naissance : l'affichage est de nouveau attribué selon l'âge.
  const birthDateChanged = nextBirthDate !== null && nextBirthDate !== user.birthDate;
  const simpleView = birthDateChanged ? simpleViewForAge(user.role, nextBirthDate) : user.simpleView;

  await db
    .update(users)
    .set({ ...data, birthDate: nextBirthDate, simpleView, skills: user.role === 'helper' ? skills : null })
    .where(eq(users.id, user.id));

  revalidatePath('/', 'layout');
  if (simpleView !== user.simpleView) {
    redirect(`${homeFor({ role: user.role, simpleView })}?ok=${simpleView ? 'vue-simple' : 'vue-complete'}`);
  }
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
