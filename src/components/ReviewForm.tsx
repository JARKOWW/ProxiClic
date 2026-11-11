'use client';

import { useActionState, useState } from 'react';
import { createReview } from '@/actions/reviews';
import { SubmitButton } from './SubmitButton';
import { Notice } from './ui';

const LABELS = ['Très décevant', 'Décevant', 'Correct', 'Très bien', 'Excellent'];

export function ReviewForm({ bookingId, helperName }: { bookingId: number; helperName: string }) {
  const [state, action] = useActionState(createReview.bind(null, bookingId), undefined);
  const [rating, setRating] = useState(Number(state?.values?.rating ?? 0));
  const group = `note-${bookingId}`;

  if (state?.success) return <Notice>{state.success}</Notice>;

  return (
    <form action={action} className="bg-brand-50 space-y-4 rounded-xl p-4">
      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <fieldset>
        <legend className="label">Comment s’est passée l’aide de {helperName} ?</legend>
        <div className="flex flex-wrap items-center gap-1">
          {LABELS.map((label, index) => {
            const value = index + 1;
            return (
              <label
                key={value}
                className="has-focus-visible:outline-ink flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg has-focus-visible:outline-3"
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="sr-only"
                />
                <span aria-hidden="true" className={`text-4xl leading-none ${value <= rating ? 'text-brand-700' : 'text-line-strong'}`}>
                  {value <= rating ? '★' : '☆'}
                </span>
                <span className="sr-only">
                  {value} {value > 1 ? 'étoiles' : 'étoile'} sur 5 — {label}
                </span>
              </label>
            );
          })}
          <span className="ml-2 font-bold" aria-hidden="true">
            {rating > 0 ? LABELS[rating - 1] : 'Choisissez une note'}
          </span>
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${group}-commentaire`} className="label">
          Votre commentaire <span className="text-ink-soft font-normal">(facultatif)</span>
        </label>
        <textarea
          id={`${group}-commentaire`}
          name="comment"
          rows={3}
          maxLength={600}
          className="input"
          placeholder="Quelques mots pour remercier votre voisin et aider les autres à choisir…"
          defaultValue={state?.values?.comment}
        />
      </div>

      <SubmitButton pendingLabel="Envoi…">Publier mon avis</SubmitButton>
    </form>
  );
}
