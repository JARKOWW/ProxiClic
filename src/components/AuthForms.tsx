'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { login, register } from '@/actions/auth';
import { ROLES, ROLE_LABELS, type Role } from '@/lib/constants';
import { SubmitButton } from './SubmitButton';
import { Field, FieldErrors, Notice } from './ui';

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  client: 'Je cherche un voisin pour m’aider avec mon ordinateur, mon téléphone, ma box…',
  helper: 'Je suis à l’aise avec le numérique et je veux aider les habitants de mon quartier.',
};

const AGE_CHOICES = [
  {
    value: 'moins-45',
    label: 'Moins de 45 ans',
    description: 'Affichage complet : vos demandes, rendez-vous et messages sur des pages séparées.',
  },
  {
    value: '45-et-plus',
    label: '45 ans ou plus',
    description: 'Affichage simplifié : tout sur une seule page, avec de très grands caractères.',
  },
];

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.fieldErrors?.email}
      />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state?.fieldErrors?.password}
      />
      <SubmitButton className="btn btn-primary btn-lg w-full" pendingLabel="Connexion en cours…">
        Se connecter
      </SubmitButton>
      <p className="text-center">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="link">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ defaultRole }: { defaultRole?: Role }) {
  const [state, action] = useActionState(register, undefined);
  const values = state?.values ?? {};
  const errors = state?.fieldErrors ?? {};
  const [role, setRole] = useState<string | undefined>(values.role ?? defaultRole);

  return (
    <form action={action} className="space-y-6" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <fieldset>
        <legend className="label">Vous êtes…</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((option) => (
            <label
              key={option}
              className="border-line-strong has-checked:border-brand-700 has-checked:bg-brand-100 flex cursor-pointer gap-3 rounded-xl border-2 bg-white p-4"
            >
              <input
                type="radio"
                name="role"
                value={option}
                checked={role === option}
                onChange={() => setRole(option)}
                required
                className="accent-brand-700 mt-1 h-6 w-6 shrink-0"
              />
              <span>
                <span className="block font-bold">{ROLE_LABELS[option]}</span>
                <span className="text-ink-soft block text-sm">{ROLE_DESCRIPTIONS[option]}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldErrors errors={errors.role} />
      </fieldset>

      {role === 'client' && (
        <fieldset aria-describedby={`age-aide${errors.ageGroup ? ' ageGroup-erreur' : ''}`}>
          <legend className="label">Quel âge avez-vous ?</legend>
          <p id="age-aide" className="hint">
            Cela nous permet de vous proposer l’affichage le plus confortable. Votre âge n’est pas enregistré ni
            montré aux autres membres, et vous pourrez changer d’affichage à tout moment.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {AGE_CHOICES.map((choice) => (
              <label
                key={choice.value}
                className="border-line-strong has-checked:border-brand-700 has-checked:bg-brand-100 flex cursor-pointer gap-3 rounded-xl border-2 bg-white p-4"
              >
                <input
                  type="radio"
                  name="ageGroup"
                  value={choice.value}
                  defaultChecked={values.ageGroup === choice.value}
                  required
                  className="accent-brand-700 mt-1 h-6 w-6 shrink-0"
                />
                <span>
                  <span className="block font-bold">{choice.label}</span>
                  <span className="text-ink-soft block text-sm">{choice.description}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldErrors id="ageGroup-erreur" errors={errors.ageGroup} />
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" autoComplete="given-name" required defaultValue={values.firstName} errors={errors.firstName} />
        <Field label="Nom" name="lastName" autoComplete="family-name" required defaultValue={values.lastName} errors={errors.lastName} />
      </div>

      <Field label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={values.email} errors={errors.email} />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="Au moins 8 caractères, dont une lettre et un chiffre."
        errors={errors.password}
      />

      <fieldset className="space-y-5">
        <legend className="text-xl font-bold">Où habitez-vous ?</legend>
        <p className="text-ink-soft -mt-3">
          Seuls votre quartier et votre ville sont visibles des autres membres, jamais votre adresse.
        </p>
        <Field
          label="Quartier"
          name="neighborhood"
          required
          hint="Par exemple : Croix-Rousse, Centre-ville, Les Chartreux…"
          defaultValue={values.neighborhood}
          errors={errors.neighborhood}
        />
        <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
          <Field label="Ville" name="city" autoComplete="address-level2" required defaultValue={values.city} errors={errors.city} />
          <Field
            label="Code postal"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            required
            defaultValue={values.postalCode}
            errors={errors.postalCode}
          />
        </div>
      </fieldset>

      <SubmitButton className="btn btn-primary btn-lg w-full" pendingLabel="Création du compte…">
        Créer mon compte
      </SubmitButton>
      <p className="text-center">
        Vous avez déjà un compte ?{' '}
        <Link href="/connexion" className="link">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
