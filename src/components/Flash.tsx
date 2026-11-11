import { Notice } from './ui';

/** Messages de confirmation affichés après une redirection (paramètre d'URL `?ok=`). */
const MESSAGES: Record<string, string> = {
  bienvenue: 'Bienvenue sur Proxi’Tech ! Votre compte a bien été créé.',
  publiee: 'Votre demande est publiée. Les aidants de votre quartier peuvent maintenant vous répondre.',
  annulee: 'Votre demande a été annulée.',
  proposition: 'Votre proposition a été envoyée. Vous serez prévenu dès qu’elle sera acceptée.',
  confirme: 'Le rendez-vous est confirmé. Vous pouvez échanger par messages pour préparer la visite.',
  annule: 'Le rendez-vous a été annulé.',
  termine: 'Merci ! L’intervention est marquée comme effectuée.',
};

export function Flash({ code }: { code?: string }) {
  const message = code ? MESSAGES[code] : undefined;
  if (!message) return null;
  return (
    <div className="mb-6">
      <Notice>{message}</Notice>
    </div>
  );
}
