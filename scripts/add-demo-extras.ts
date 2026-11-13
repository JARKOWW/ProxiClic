import './load-env';
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { reviewExtras } from './review-extras';

const HOUR = 3_600_000;

/**
 * Ajoute compliments, réponses et photos de démonstration aux avis déjà présents, sans rien effacer.
 * Peut être relancé sans risque : seuls les avis qui n'en ont pas encore sont complétés.
 */
async function main() {
  const { db, client, schema } = await import('../src/db');
  const { requests, reviews, reviewPhotos } = schema;
  let updated = 0;
  let photos = 0;

  for (const [title, extras] of Object.entries(reviewExtras)) {
    const request = await db.query.requests.findFirst({
      where: eq(requests.title, title),
      with: { bookings: { columns: { id: true } } },
    });
    for (const booking of request?.bookings ?? []) {
      const review = await db.query.reviews.findFirst({
        where: eq(reviews.bookingId, booking.id),
        with: { photos: { columns: { id: true } } },
      });
      if (!review) continue;

      const changes: Partial<typeof reviews.$inferInsert> = {};
      if (!review.tags && extras.tags) changes.tags = extras.tags;
      if (!review.reply && extras.reply) {
        changes.reply = extras.reply;
        changes.repliedAt = new Date(review.createdAt.getTime() + 5 * HOUR);
      }
      if (Object.keys(changes).length > 0) {
        await db.update(reviews).set(changes).where(eq(reviews.id, review.id));
        updated += 1;
      }
      if (review.photos.length === 0) {
        for (const name of extras.photos ?? []) {
          await db.insert(reviewPhotos).values({
            reviewId: review.id,
            mime: 'image/jpeg',
            data: readFileSync(new URL(`./seed-photos/${name}.jpg`, import.meta.url)),
            createdAt: review.createdAt,
          });
          photos += 1;
        }
      }
    }
  }

  client.close();
  console.log(`✔ Avis de démonstration complétés : ${updated} avis mis à jour, ${photos} photos ajoutées.`);
}

main().catch((error) => {
  console.error('✖ Échec :', error);
  process.exit(1);
});
