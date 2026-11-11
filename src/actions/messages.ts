'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { messages, requests } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { findConversationFor, getOrCreateConversation } from '@/lib/conversations';
import { rateLimit } from '@/lib/rate-limit';
import { idSchema, messageSchema } from '@/lib/validation';

export type ChatMessage = { id: number; senderId: number; body: string; createdAt: string };

export type SendResult = { ok: true; message: ChatMessage } | { ok: false; error: string };

export async function sendMessage(conversationId: number, body: string): Promise<SendResult> {
  const user = await requireUser();
  const id = idSchema.safeParse(conversationId);
  const parsed = messageSchema.safeParse({ body });
  if (!id.success) return { ok: false, error: 'Conversation introuvable.' };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Message invalide.' };

  if (!rateLimit(`message:${user.id}`, 30, 60_000).allowed) {
    return { ok: false, error: 'Vous envoyez des messages trop rapidement. Patientez un instant.' };
  }

  const conversation = await findConversationFor(id.data, user.id);
  if (!conversation) return { ok: false, error: 'Conversation introuvable.' };

  const [created] = await db
    .insert(messages)
    .values({ conversationId: conversation.id, senderId: user.id, body: parsed.data.body })
    .returning();

  return {
    ok: true,
    message: {
      id: created.id,
      senderId: created.senderId,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
    },
  };
}

/** Un aidant ouvre la discussion avec l'auteur d'une demande. */
export async function startConversation(requestId: number): Promise<void> {
  const user = await requireUser();
  const id = idSchema.safeParse(requestId);
  if (!id.success || user.role !== 'helper') return;

  const request = await db.query.requests.findFirst({ where: eq(requests.id, id.data) });
  if (!request || request.status !== 'open') return;

  const conversationId = await getOrCreateConversation(request.id, request.clientId, user.id);
  redirect(`/messages/${conversationId}`);
}
