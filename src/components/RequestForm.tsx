'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createRequest } from '@/actions/requests';
import { CATEGORIES, CATEGORY_KEYS } from '@/lib/constants';
import { SubmitButton } from './SubmitButton';
import { Field, FieldErrors, Notice } from './ui';

export function RequestForm() {
  const [state, action] = useActionState(createRequest, undefined);
  const values = state?.values ?? {};
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <fieldset>
        <legend className="label">De quoi s’agit-il ?</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORY_KEYS.map((key) => (
            <label
              key={key}
              className="border-line-strong has-checked:border-brand-700 has-checked:bg-brand-100 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-3 py-2 font-bold"
            >
              <input
                type="radio"
                name="category"
                value={key}
                defaultChecked={values.category === key}
                required
                className="accent-brand-700 h-5 w-5 shrink-0"
              />
              <span aria-hidden="true" className="text-xl">
                {CATEGORIES[key].icon}
              </span>
              <span>{CATEGORIES[key].label}</span>
            </label>
          ))}
        </div>
        <FieldErrors errors={errors.category} />
      </fieldset>

      <Field
        label="Titre de votre demande"
        name="title"
        required
        maxLength={100}
        hint="En une phrase. Par exemple : « Installer ma nouvelle imprimante »."
        defaultValue={values.title}
        errors={errors.title}
      />

      <Field
        label="Décrivez votre besoin"
        name="description"
        multiline
        required
        maxLength={1500}
        hint="Quel appareil ? Que se passe-t-il ? Plus vous donnez de détails, plus l’aidant pourra se préparer."
        defaultValue={values.description}
        errors={errors.description}
      />

      <Field
        label="Vos disponibilités"
        name="availability"
        optional
        maxLength={200}
        hint="Par exemple : « en semaine, l’après-midi »."
        defaultValue={values.availability}
        errors={errors.availability}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton className="btn btn-primary btn-lg" pendingLabel="Publication…">
          Publier ma demande
        </SubmitButton>
        <Link href="/mes-demandes" className="btn btn-quiet btn-lg">
          Annuler
        </Link>
      </div>
    </form>
  );
}
