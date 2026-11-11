import { asc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChatWindow } from '@/components/ChatWindow';
import { Avatar, ConversationList } from '@/components/ConversationList';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { ROLE_NAMES } from '@/lib/constants';
import { findConversationFor, listConversations, markConversationRead } from '@/lib/conversations';
import { displayName } from '@/lib/format';
import { idSchema } from '@/lib/validation';

export const metadata: Metadata = { title: 'Conversation' };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();

  const conversation = await findConversationFor(id.data, user.id);
  if (!conversation) notFound();

  const rows = await db
    .select({ id: messages.id, senderId: messages.senderId, body: messages.body, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(asc(messages.id));
  await markConversationRead(conversation.id, user.id);
  // Chargée après le marquage, pour que la liste n'affiche plus cette conversation comme non lue.
  const conversations = await listConversations(user.id);

  const other = conversation.clientId === user.id ? conversation.helper : conversation.client;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
      {/* Liste des conversations : visible uniquement sur grand écran */}
      <aside className="hidden min-w-0 self-start lg:block">
        <h2 className="font-display mb-3 px-2 text-2xl">Messages</h2>
        <div className="card p-2 sm:p-2">
          <ConversationList conversations={conversations} currentUserId={user.id} activeId={conversation.id} />
        </div>
      </aside>

      <section aria-labelledby="interlocuteur" className="min-w-0">
        <div className="border-line shadow-soft overflow-hidden rounded-3xl border bg-white">
          {/* En-tête de la discussion */}
          <header className="border-line border-b">
            <div className="flex items-center gap-3 p-4 sm:gap-4 sm:px-6">
            <Link
              href="/messages"
              className="btn btn-quiet min-h-12 px-4 lg:hidden"
              aria-label="Retour à la liste des conversations"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <Avatar user={other} />
            <div className="min-w-0 flex-1">
              <h1 id="interlocuteur" className="truncate text-2xl">
                {displayName(other)}
              </h1>
              <p className="text-ink-soft">
                {ROLE_NAMES[other.role]} · {other.neighborhood}, {other.city}
              </p>
            </div>
            </div>
            <Link
              href={`/demandes/${conversation.requestId}`}
              className="bg-brand-100 text-brand-900 hover:bg-brand-200 flex min-h-12 items-center gap-3 px-4 py-2 no-underline transition-colors sm:px-6"
            >
              <span aria-hidden="true">📌</span>
              <span className="min-w-0 flex-1 truncate">
                <span className="hidden text-sm sm:inline">À propos de : </span>
                <strong>{conversation.request.title}</strong>
              </span>
              <span className="shrink-0 text-sm font-bold underline underline-offset-4">
                <span className="hidden sm:inline">Voir la demande</span>
                <span className="sm:hidden">Voir</span>
              </span>
            </Link>
          </header>

          <ChatWindow
            conversationId={conversation.id}
            currentUserId={user.id}
            other={{ id: other.id, firstName: other.firstName }}
            initialMessages={rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
          />
        </div>

        <p className="text-ink-soft mt-3 flex items-start gap-2 px-2 text-sm">
          <span aria-hidden="true">🔒</span>
          Ne communiquez jamais vos mots de passe ni vos codes bancaires, même à un aidant.
        </p>
      </section>
    </div>
  );
}
