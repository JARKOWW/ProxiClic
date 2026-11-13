import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { reviewPhotos } from '@/db/schema';
import { idSchema } from '@/lib/validation';

/** Sert une photo d'avis. Les avis étant publics, leurs photos le sont aussi. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return new Response(null, { status: 404 });

  const photo = await db.query.reviewPhotos.findFirst({
    where: eq(reviewPhotos.id, id.data),
    columns: { mime: true, data: true },
  });
  if (!photo) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(photo.data), {
    headers: {
      'Content-Type': photo.mime,
      'Content-Length': String(photo.data.byteLength),
      // Une photo ne change jamais : le navigateur peut la garder indéfiniment.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
