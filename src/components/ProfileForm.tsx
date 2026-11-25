'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/actions/profile';
import type { SessionUser } from '@/lib/auth';
import { SubmitButton } from './SubmitButton';
import { BirthDateField, Field, Notice } from './ui';

export function ProfileForm({ user }: { user: SessionUser }) {
  const [state, action] = useActionState(updateProfile, undefined);
  const errors = state?.fieldErrors ?? {};
  const value = (key: 'firstName' | 'lastName' | 'neighborhood' | 'city' | 'postalCode' | 'phone' | 'bio' | 'skills') =>
    state?.values?.[key] ?? user[key] ?? '';

  return (
    <form action={action} className="space-y-6" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.success && <Notice>{state.success}</Notice>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" autoComplete="given-name" required defaultValue={value('firstName')} errors={errors.firstName} />
        <Field label="Nom" name="lastName" autoComplete="family-name" required defaultValue={value('lastName')} errors={errors.lastName} />
      </div>

      <Field
        label="Téléphone"
        name="phone"
        type="tel"
        autoComplete="tel"
        optional
        hint="Communiqué uniquement à la personne avec qui un rendez-vous est confirmé."
        defaultValue={value('phone')}
        errors={errors.phone}
      />

      <BirthDateField
        values={state?.values}
        saved={user.birthDate}
        errors={errors.birthDate}
        optional={!user.birthDate}
        hint={
          user.role === 'client'
            ? 'Jamais montrée aux autres membres. Si vous la modifiez, l’affichage est choisi de nouveau selon votre âge (affichage simplifié à partir de 45 ans).'
            : 'Jamais montrée aux autres membres.'
        }
      />

      <fieldset className="space-y-5">
        <legend className="text-xl font-bold">Votre quartier</legend>
        <Field label="Quartier" name="neighborhood" required defaultValue={value('neighborhood')} errors={errors.neighborhood} />
        <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
          <Field label="Ville" name="city" autoComplete="address-level2" required defaultValue={value('city')} errors={errors.city} />
          <Field
            label="Code postal"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            required
            defaultValue={value('postalCode')}
            errors={errors.postalCode}
          />
        </div>
      </fieldset>

      <Field
        label="Présentation"
        name="bio"
        multiline
        rows={4}
        optional
        maxLength={500}
        hint={
          user.role === 'helper'
            ? 'Quelques mots pour mettre en confiance les personnes que vous aiderez.'
            : 'Quelques mots sur vous et votre aisance avec le numérique.'
        }
        defaultValue={value('bio')}
        errors={errors.bio}
      />

      {user.role === 'helper' && (
        <Field
          label="Vos compétences"
          name="skills"
          optional
          maxLength={200}
          hint="Séparées par des virgules. Par exemple : imprimantes, Wi-Fi, smartphones Android."
          defaultValue={value('skills')}
          errors={errors.skills}
        />
      )}

      <SubmitButton className="btn btn-primary btn-lg" pendingLabel="Enregistrement…">
        Enregistrer mon profil
      </SubmitButton>
    </form>
  );
}
