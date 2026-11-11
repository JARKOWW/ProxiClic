import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { unreadByConversation } from '@/lib/conversations';

/** Nombre total de messages non lus (interrogé par la pastille du menu). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const count = [...(await unreadByConversation(user.id)).values()].reduce((sum, n) => sum + n, 0);
  return NextResponse.json({ count }, { headers: { 'Cache-Control': 'no-store' } });
}
