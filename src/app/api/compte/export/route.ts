import { NextResponse } from 'next/server';
import { exportAccountData } from '@/lib/account';
import { getCurrentUser } from '@/lib/auth';

/** Export de toutes les données du compte connecté, en JSON (RGPD art. 15 et 20). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const data = await exportAccountData(user.id);
  if (!data) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="proxiclic-mes-donnees-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
