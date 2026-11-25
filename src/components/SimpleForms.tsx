'use client';

import { useActionState } from 'react';
import { sendMessageForm } from '@/actions/messages';
import { createSimpleRequest } from '@/actions/requests';
import { createReview } from '@/actions/reviews';
import { CATEGORIES, CATEGORY_KEYS } from '@/lib/constants';
import { SubmitButton } from './SubmitButton';
import { Field, FieldErrors, Notice } from './ui';

/** Formulaires de l'affichage simplifié : le strict nécessaire, des consignes courtes et claires. */

export function SimpleRequestForm() {
  const [state, action] = useActionState(createSimpleRequest, undefined);
  const values = state?.values ?? {};
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <fieldset aria-describedby={errors.category ? 'category-erreur' : undefined}>
        <legend className="label">Pour quel appareil ?</legend>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORY_KEYS.map((key) => (
            <label key={key} className="simple-choice min-h-20 flex-col justify-center gap-1 text-center">
              <input
                type="radio"
                name="category"
                value={key}
                defaultChecked={values.category === key}
                required
                className="sr-only"
              />
              <span aria-hidden="true" className="text-2xl leading-none">
                {CATEGORIES[key].icon}
              </span>
              <span className="text-base leading-tight">{CATEGORIES[key].label}</span>
            </label>
          ))}
        </div>
        <FieldErrors id="category-erreur" errors={errors.category} />
      </fieldset>

      <Field
        label="Que se passe-t-il ?"
        name="description"
        multiline
        rows={3}
        required
        maxLength={1500}
        placeholder="Par exemple : mon imprimante n’imprime plus."
        defaultValue={values.description}
        errors={errors.description}
      />

      <SubmitButton className="btn btn-primary btn-lg w-full" pendingLabel="Envoi en cours…">
        Envoyer ma demande
      </SubmitButton>
    </form>
  );
}

const RATINGS = [
  { value: 1, label: 'Pas du tout satisfait' },
  { value: 2, label: 'Peu satisfait' },
  { value: 3, label: 'Moyennement satisfait' },
  { value: 4, label: 'Satisfait' },
  { value: 5, label: 'Très satisfait' },
];

export function SimpleReviewForm({ bookingId, helperName }: { bookingId: number; helperName: string }) {
  const [state, action] = useActionState(createReview.bind(null, bookingId), undefined);
  const values = state?.values ?? {};
  const errors = state?.fieldErrors ?? {};
  const prefix = `avis-${bookingId}`;

  if (state?.success) return <Notice>{state.success}</Notice>;

  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <fieldset aria-describedby={errors.rating ? `${prefix}-note-erreur` : undefined}>
        <legend className="label">Combien d’étoiles donnez-vous à {helperName} ?</legend>
        <div className="flex gap-2">
          {RATINGS.map((rating) => (
            <label key={rating.value} className="simple-choice flex-1 flex-col justify-center gap-0 px-1 text-center">
              <input
                type="radio"
                name="rating"
                value={rating.value}
                defaultChecked={values.rating === String(rating.value)}
                required
                className="sr-only"
              />
              <span aria-hidden="true" className="text-brand-700 text-2xl leading-none">
                ★
              </span>
              <span aria-hidden="true" className="text-lg">
                {rating.value}
              </span>
              <span className="sr-only">
                {rating.value} sur 5 : {rating.label}
              </span>
            </label>
          ))}
        </div>
        <p className="text-ink-soft mt-2 flex justify-between text-sm" aria-hidden="true">
          <span>Pas satisfait</span>
          <span>Très satisfait</span>
        </p>
        <FieldErrors id={`${prefix}-note-erreur`} errors={errors.rating} />
      </fieldset>

      <Field
        label="Un petit mot"
        name="comment"
        id={`${prefix}-commentaire`}
        multiline
        rows={2}
        optional
        maxLength={600}
        defaultValue={values.comment}
        errors={errors.comment}
      />

      <SubmitButton className="btn btn-primary w-full" pendingLabel="Envoi en cours…">
        Envoyer mon avis
      </SubmitButton>
    </form>
  );
}

export function SimpleMessageForm({ conversationId, otherName }: { conversationId: number; otherName: string }) {
  const [state, action] = useActionState(sendMessageForm.bind(null, conversationId), undefined);

  return (
    <form action={action} className="space-y-3" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.success && <Notice>{state.success}</Notice>}
      <Field
        label={`Votre réponse à ${otherName}`}
        name="body"
        id={`message-${conversationId}`}
        multiline
        rows={2}
        required
        maxLength={2000}
        defaultValue={state?.error ? state.values?.body : undefined}
      />
      <SubmitButton className="btn btn-primary w-full" pendingLabel="Envoi en cours…">
        Envoyer
      </SubmitButton>
    </form>
  );
}
