'use client';

import { useActionState, useState } from 'react';
import { replyToReview } from '@/actions/reviews';
import { SubmitButton } from './SubmitButton';
import { Notice } from './ui';

/** Réponse publique de l'aidant à un avis reçu (une seule réponse par avis). */
export function ReplyForm({ reviewId, authorName }: { reviewId: number; authorName: string }) {
  const [state, action] = useActionState(replyToReview.bind(null, reviewId), undefined);
  const [open, setOpen] = useState(false);
  const field = `reponse-${reviewId}`;

  if (state?.success) return <Notice>{state.success}</Notice>;

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
        <span aria-hidden="true">↩</span> Répondre à {authorName}
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <div>
        <label htmlFor={field} className="label">
          Votre réponse à {authorName}
        </label>
        <span className="hint" id={`${field}-aide`}>
          Elle sera visible par tous sous l’avis et ne pourra plus être modifiée.
        </span>
        <textarea
          id={field}
          name="reply"
          rows={3}
          required
          minLength={2}
          maxLength={600}
          autoFocus
          aria-describedby={`${field}-aide`}
          className="input"
          placeholder="Merci pour votre accueil…"
          defaultValue={state?.values?.reply}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel="Envoi…">Publier ma réponse</SubmitButton>
        <button type="button" className="btn btn-quiet" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
