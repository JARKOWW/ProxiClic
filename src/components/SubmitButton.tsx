'use client';

import { useFormStatus } from 'react-dom';

type Props = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  /** Si renseigné, une confirmation est demandée avant l'envoi. */
  confirm?: string;
};

export function SubmitButton({ children, pendingLabel = 'Veuillez patienter…', className = 'btn btn-primary', confirm }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
