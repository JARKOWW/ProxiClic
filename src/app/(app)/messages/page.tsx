import type { Metadata } from 'next';
import Link from 'next/link';
import { ConversationList } from '@/components/ConversationList';
import { requireUser } from '@/lib/auth';
import { listConversations } from '@/lib/conversations';

export const metadata: Metadata = { title: 'Messages' };

export default async function ConversationsPage() {
  const user = await requireUser();
  const conversations = await listConversations(user.id);
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread, 0);
  const isHelper = user.role === 'helper';

  return (
    <>
      <p className="eyebrow">
        <span aria-hidden="true">💬</span> Messagerie
      </p>
      <h1 className="page-title mt-4">Messages</h1>
      <p className="page-lead">
        {unreadTotal > 0
          ? `Vous avez ${unreadTotal} ${unreadTotal > 1 ? 'nouveaux messages' : 'nouveau message'}.`
          : 'Vos échanges avec vos voisins à propos des demandes d’aide.'}
      </p>

      {conversations.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center px-6 py-14 text-center">
          <span aria-hidden="true" className="bg-brand-100 flex h-24 w-24 items-center justify-center rounded-full text-5xl">
            💬
          </span>
          <h2 className="mt-6 text-2xl">Aucune conversation pour l’instant</h2>
          <p className="text-ink-soft mt-2 max-w-md">
            {isHelper
              ? 'Répondez à une demande pour démarrer une conversation avec un voisin.'
              : 'Lorsqu’un aidant répondra à l’une de vos demandes, vos échanges apparaîtront ici.'}
          </p>
          <Link href={isHelper ? '/demandes' : '/demandes/nouvelle'} className="btn btn-primary mt-6">
            {isHelper ? 'Voir les demandes' : 'Demander de l’aide'}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="card min-w-0 self-start p-2 sm:p-2">
            <ConversationList conversations={conversations} currentUserId={user.id} />
          </div>

          {/* Sur grand écran, la colonne de droite invite à ouvrir une conversation. */}
          <div className="border-line-strong bg-brand-50 hidden min-h-[28rem] flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center lg:flex">
            <span aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-5xl shadow-sm">
              👈
            </span>
            <h2 className="mt-6 text-2xl">Choisissez une conversation</h2>
            <p className="text-ink-soft mt-2 max-w-sm">
              Cliquez sur un voisin dans la liste pour lire ses messages et lui répondre.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
