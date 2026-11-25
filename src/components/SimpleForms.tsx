'use client';

import { useActionState } from 'react';
import { sendMessageForm } from '@/actions/messages';
import { createSimpleRequest } from '@/actions/requests';
import { createReview } from '@/actions/reviews';
import { CATEGORIES, CATEGORY_KEYS } from '@/lib/constants';
import { SubmitButton } from './SubmitButton';
import { Field, FieldErrors, Notice } from './ui';

/**
 * Formulaires de l'affichage simplifié : peu de champs, des consignes écrites en clair,
 * de très grandes zones cliquables et des messages d'erreur qui disent quoi faire.
 */

export function SimpleRequestForm() {
  const [state, action] = useActionState(createSimpleRequest, undefined);
  const values = state?.values ?? {};
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-8" noValidate>
      {state?.error && <Notice tone="error">{state.error} Les zones à compléter sont signalées ci-dessous.</Notice>}

      <fieldset aria-describedby={errors.category ? 'category-erreur' : undefined}>
        <legend className="label text-xl">
          <span className="simple-step" aria-hidden="true">1</span> Avec quel appareil avez-vous besoin d’aide ?
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {CATEGORY_KEYS.map((key) => (
            <label key={key} className="simple-choice">
              <input
                type="radio"
                name="category"
                value={key}
                defaultChecked={values.category === key}
                required
                className="accent-brand-700 h-7 w-7 shrink-0"
              />
              <span aria-hidden="true" className="text-2xl">
                {CATEGORIES[key].icon}
              </span>
              <span>{CATEGORIES[key].label}</span>
            </label>
          ))}
        </div>
        <FieldErrors id="category-erreur" errors={errors.category} />
      </fieldset>

      <div className="simple-step-field">
        <Field
          label={
            <>
              <span className="simple-step" aria-hidden="true">2</span> Expliquez le problème avec vos mots
            </>
          }
          name="description"
          multiline
          rows={4}
          required
          maxLength={1500}
          hint="Par exemple : « Mon imprimante n’imprime plus depuis hier. »"
          defaultValue={values.description}
          errors={errors.description}
        />
      </div>

      <div className="simple-step-field">
        <Field
          label={
            <>
              <span className="simple-step" aria-hidden="true">3</span> Quand êtes-vous disponible ?
            </>
          }
          name="availability"
          optional
          maxLength={200}
          hint="Par exemple : « le mardi après-midi »."
          defaultValue={values.availability}
          errors={errors.availability}
        />
      </div>

      <SubmitButton className="btn btn-primary btn-lg w-full" pendingLabel="Envoi en cours…">
        Envoyer ma demande d’aide
      </SubmitButton>
    </form>
  );
}

const RATINGS = [
  { value: 5, label: 'Très satisfait' },
  { value: 4, label: 'Satisfait' },
  { value: 3, label: 'Moyennement satisfait' },
  { value: 2, label: 'Peu satisfait' },
  { value: 1, label: 'Pas du tout satisfait' },
];

export function SimpleReviewForm({ bookingId, helperName }: { bookingId: number; helperName: string }) {
  const [state, action] = useActionState(createReview.bind(null, bookingId), undefined);
  const values = state?.values ?? {};
  const errors = state?.fieldErrors ?? {};
  const prefix = `avis-${bookingId}`;

  if (state?.success) return <Notice>{state.success}</Notice>;

  return (
    <form action={action} className="space-y-6" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <fieldset aria-describedby={errors.rating ? `${prefix}-note-erreur` : undefined}>
        <legend className="label">Êtes-vous satisfait de l’aide de {helperName} ?</legend>
        <div className="mt-2 grid gap-3">
          {RATINGS.map((rating) => (
            <label key={rating.value} className="simple-choice">
              <input
                type="radio"
                name="rating"
                value={rating.value}
                defaultChecked={values.rating === String(rating.value)}
                required
                className="accent-brand-700 h-7 w-7 shrink-0"
              />
              <span aria-hidden="true" className="text-brand-700 tracking-wider">
                {'★'.repeat(rating.value)}
                <span className="text-line-strong">{'☆'.repeat(5 - rating.value)}</span>
              </span>
              <span>{rating.label}</span>
            </label>
          ))}
        </div>
        <FieldErrors id={`${prefix}-note-erreur`} errors={errors.rating} />
      </fieldset>

      <Field
        label="Un petit mot pour les autres voisins"
        name="comment"
        id={`${prefix}-commentaire`}
        multiline
        rows={3}
        optional
        maxLength={600}
        defaultValue={values.comment}
        errors={errors.comment}
      />

      <SubmitButton className="btn btn-primary btn-lg w-full" pendingLabel="Envoi en cours…">
        Envoyer mon avis
      </SubmitButton>
    </form>
  );
}

export function SimpleMessageForm({ conversationId, otherName }: { conversationId: number; otherName: string }) {
  const [state, action] = useActionState(sendMessageForm.bind(null, conversationId), undefined);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.success && <Notice>{state.success}</Notice>}
      <Field
        label={`Écrire à ${otherName}`}
        name="body"
        id={`message-${conversationId}`}
        multiline
        rows={3}
        required
        maxLength={2000}
        defaultValue={state?.error ? state.values?.body : undefined}
      />
      <SubmitButton className="btn btn-primary btn-lg w-full sm:w-auto" pendingLabel="Envoi en cours…">
        Envoyer le message
      </SubmitButton>
    </form>
  );
}
