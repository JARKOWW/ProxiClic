import Link from 'next/link';
import type { listConversations } from '@/lib/conversations';
import { displayName, excerpt, formatRelative } from '@/lib/format';

type Conversations = Awaited<ReturnType<typeof listConversations>>;

const AVATAR_TONES = ['bg-brand-700 text-white', 'bg-brand-200 text-brand-900', 'bg-ink text-white'];

/** Pastille ronde avec l'initiale d'un membre ; la couleur dépend de son identifiant. */
export function Avatar({ user, size = 'h-14 w-14 text-xl' }: { user: { id: number; firstName: string }; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`font-display flex shrink-0 items-center justify-center rounded-full font-extrabold ${size} ${AVATAR_TONES[user.id % AVATAR_TONES.length]}`}
    >
      {user.firstName.charAt(0)}
    </span>
  );
}

type Props = { conversations: Conversations; currentUserId: number; activeId?: number };

/** Liste des conversations : page « Messages » sur mobile, colonne de gauche sur grand écran. */
export function ConversationList({ conversations, currentUserId, activeId }: Props) {
  return (
    <nav aria-label="Vos conversations">
      <ul className="space-y-1.5">
        {conversations.map((conversation) => {
          const active = conversation.id === activeId;
          const unread = conversation.unread > 0 && !active;
          return (
            <li key={conversation.id}>
              <Link
                href={`/messages/${conversation.id}`}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-3xl p-3 no-underline transition-colors ${
                  active ? 'bg-brand-700 shadow-pop text-white' : unread ? 'bg-brand-100 hover:bg-brand-200' : 'hover:bg-brand-50'
                }`}
              >
                <span className="relative">
                  <Avatar user={conversation.other} />
                  {unread && (
                    <span className="bg-brand-700 absolute -top-1 -right-1 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white px-1 text-sm font-bold text-white">
                      {conversation.unread}
                      <span className="sr-only"> {conversation.unread > 1 ? 'messages non lus' : 'message non lu'}</span>
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-lg font-bold">{displayName(conversation.other)}</span>
                    {conversation.last && (
                      <span className={`shrink-0 text-sm ${active ? 'text-brand-100' : 'text-ink-soft'}`}>
                        {formatRelative(conversation.last.createdAt).replace('il y a ', '')}
                      </span>
                    )}
                  </span>
                  <span className={`block truncate text-sm font-bold ${active ? 'text-brand-100' : 'text-brand-700'}`}>
                    {conversation.requestTitle}
                  </span>
                  <span className={`block truncate ${active ? 'text-white' : unread ? 'text-ink font-bold' : 'text-ink-soft'}`}>
                    {conversation.last
                      ? `${conversation.last.senderId === currentUserId ? 'Vous : ' : ''}${excerpt(conversation.last.body.replace(/\s+/g, ' '), 70)}`
                      : 'Nouvelle conversation'}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
