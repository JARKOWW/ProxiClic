'use client';

import { useActionState } from 'react';
import { changePassword, deleteAccount } from '@/actions/account';
import { SubmitButton } from './SubmitButton';
import { Field, Notice } from './ui';

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  const errors = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.success && <Notice>{state.success}</Notice>}
      <Field label="Mot de passe actuel" name="currentPassword" type="password" autoComplete="current-password" required errors={errors.currentPassword} />
      <Field
        label="Nouveau mot de passe"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        hint="Au moins 12 caractères, dont une lettre et un chiffre."
        errors={errors.newPassword}
      />
      <Field label="Nouveau mot de passe, une deuxième fois" name="confirmPassword" type="password" autoComplete="new-password" required errors={errors.confirmPassword} />
      <SubmitButton className="btn btn-secondary" pendingLabel="Enregistrement…">
        Changer mon mot de passe
      </SubmitButton>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <Field
        label="Votre mot de passe, pour confirmer"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state?.fieldErrors?.password}
      />
      <SubmitButton
        className="btn btn-quiet"
        pendingLabel="Suppression…"
        confirm="Voulez-vous vraiment supprimer votre compte ? Toutes vos données seront effacées définitivement."
      >
        Supprimer définitivement mon compte
      </SubmitButton>
    </form>
  );
}
