import { and, asc, eq, gt } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { findConversationFor, markConversationRead } from '@/lib/conversations';
import { idSchema } from '@/lib/validation';

/** Nouveaux messages d'une conversation (interrogé régulièrement par la fenêtre de discussion). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const id = idSchema.safeParse((await params).id);
  const after = Number(request.nextUrl.searchParams.get('after') ?? 0);
  if (!id.success || !Number.isInteger(after) || after < 0) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const conversation = await findConversationFor(id.data, user.id);
  if (!conversation) return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });

  const rows = await db
    .select({ id: messages.id, senderId: messages.senderId, body: messages.body, createdAt: messages.createdAt })
    .from(messages)
    .where(and(eq(messages.conversationId, conversation.id), gt(messages.id, after)))
    .orderBy(asc(messages.id));

  if (rows.some((m) => m.senderId !== user.id)) await markConversationRead(conversation.id, user.id);

  return NextResponse.json(
    { messages: rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
