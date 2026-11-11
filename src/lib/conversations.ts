import { and, desc, eq, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { conversations, messages } from '@/db/schema';

/** Renvoie l'identifiant de la conversation entre un aidant et le demandeur d'une annonce, en la créant si besoin. */
export async function getOrCreateConversation(requestId: number, clientId: number, helperId: number): Promise<number> {
  await db.insert(conversations).values({ requestId, clientId, helperId }).onConflictDoNothing();
  const row = await db.query.conversations.findFirst({
    where: and(eq(conversations.requestId, requestId), eq(conversations.helperId, helperId)),
    columns: { id: true },
  });
  return row!.id;
}

/** Conversation dont l'utilisateur est l'un des deux participants, sinon undefined. */
export function findConversationFor(conversationId: number, userId: number) {
  return db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      or(eq(conversations.clientId, userId), eq(conversations.helperId, userId)),
    ),
    with: { client: true, helper: true, request: true },
  });
}

export async function markConversationRead(conversationId: number, userId: number): Promise<void> {
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId), isNull(messages.readAt)));
}

/** Nombre de messages non lus par conversation pour un utilisateur. */
export async function unreadByConversation(userId: number): Promise<Map<number, number>> {
  const rows = await db
    .select({ conversationId: messages.conversationId, count: sql<number>`count(*)` })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(
      and(
        or(eq(conversations.clientId, userId), eq(conversations.helperId, userId)),
        ne(messages.senderId, userId),
        isNull(messages.readAt),
      ),
    )
    .groupBy(messages.conversationId);
  return new Map(rows.map((r) => [r.conversationId, Number(r.count)]));
}

/** Conversations d'un utilisateur, la plus récente en premier, avec dernier message et nombre de non lus. */
export async function listConversations(userId: number) {
  const [rows, unread] = await Promise.all([
    db.query.conversations.findMany({
      where: or(eq(conversations.clientId, userId), eq(conversations.helperId, userId)),
      with: {
        client: true,
        helper: true,
        request: { columns: { title: true } },
        messages: { orderBy: desc(messages.id), limit: 1 },
      },
    }),
    unreadByConversation(userId),
  ]);

  return rows
    .map((conversation) => {
      const last = conversation.messages[0];
      return {
        id: conversation.id,
        other: conversation.clientId === userId ? conversation.helper : conversation.client,
        requestTitle: conversation.request.title,
        last,
        lastAt: (last?.createdAt ?? conversation.createdAt).getTime(),
        unread: unread.get(conversation.id) ?? 0,
      };
    })
    .sort((a, b) => b.lastAt - a.lastAt);
}
