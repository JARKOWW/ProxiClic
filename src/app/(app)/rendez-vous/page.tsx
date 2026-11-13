import { asc, eq, inArray, or } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { acceptBooking, cancelBooking, completeBooking, declineBooking } from '@/actions/bookings';
import { Flash } from '@/components/Flash';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ReplyForm } from '@/components/ReplyForm';
import { ReviewForm } from '@/components/ReviewForm';
import { SubmitButton } from '@/components/SubmitButton';
import { BookingStatusBadge, CategoryBadge, EmptyState, ReviewReply, ReviewTags, Stars } from '@/components/ui';
import { db } from '@/db';
import { bookings, conversations, requests, reviews } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { displayName, formatDateTime, formatDuration } from '@/lib/format';

export const metadata: Metadata = { title: 'Mes rendez-vous' };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const user = await requireUser();
  const isHelper = user.role === 'helper';

  const rows = await db.query.bookings.findMany({
    where: isHelper
      ? eq(bookings.helperId, user.id)
      : inArray(
          bookings.requestId,
          db.select({ id: requests.id }).from(requests).where(eq(requests.clientId, user.id)),
        ),
    with: { helper: true, request: { with: { client: true } } },
    orderBy: asc(bookings.scheduledAt),
  });

  const threads = await db.query.conversations.findMany({
    where: or(eq(conversations.clientId, user.id), eq(conversations.helperId, user.id)),
    columns: { id: true, requestId: true, helperId: true },
  });
  const threadId = (requestId: number, helperId: number) =>
    threads.find((t) => t.requestId === requestId && t.helperId === helperId)?.id;

  const reviewRows = rows.length
    ? await db.query.reviews.findMany({
        where: inArray(reviews.bookingId, rows.map((b) => b.id)),
        // Jamais le contenu des images ici : seulement leurs identifiants.
        with: { photos: { columns: { id: true } } },
      })
    : [];
  const reviewByBooking = new Map(reviewRows.map((review) => [review.bookingId, review]));

  const upcoming = rows.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const past = rows.filter((b) => !upcoming.includes(b)).reverse();
  const now = Date.now();
  const { ok } = await searchParams;

  const renderBooking = (booking: (typeof rows)[number]) => {
    const other = isHelper ? booking.request.client : booking.helper;
    const conversation = threadId(booking.requestId, booking.helperId);
    const started = booking.scheduledAt.getTime() <= now;
    const review = reviewByBooking.get(booking.id);

    return (
      <li key={booking.id} className="card">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <CategoryBadge category={booking.request.category} />
        </div>
        <p className="mt-3 text-2xl font-bold capitalize">{formatDateTime(booking.scheduledAt)}</p>
        <p className="text-ink-soft">Durée estimée : {formatDuration(booking.durationMin)}</p>
        <h3 className="mt-3 text-lg">
          <Link href={`/demandes/${booking.requestId}`} className="link">
            {booking.request.title}
          </Link>
        </h3>
        <p className="mt-1">
          {isHelper ? (
            <>
              Chez <strong>{displayName(other)}</strong>
            </>
          ) : (
            <>
              Avec{' '}
              <Link href={`/aidants/${other.id}`} className="link">
                {displayName(other)}
              </Link>
            </>
          )}{' '}
          · {booking.request.neighborhood}, {booking.request.city}
        </p>
        {booking.status === 'confirmed' && other.phone && (
          <p className="mt-1">
            Téléphone :{' '}
            <a href={`tel:${other.phone.replace(/[^\d+]/g, '')}`} className="link">
              {other.phone}
            </a>
          </p>
        )}

        {booking.status === 'completed' &&
          (review ? (
            <div className="bg-brand-50 mt-4 rounded-xl p-4">
              <p className="flex flex-wrap items-center gap-2 font-bold">
                <Stars value={review.rating} /> {isHelper ? `Avis de ${other.firstName}` : 'Votre avis'}
              </p>
              {review.comment && <p className="mt-2 italic">« {review.comment} »</p>}
              {review.tags && (
                <div className="mt-3">
                  <ReviewTags tags={review.tags} />
                </div>
              )}
              {review.photos.length > 0 && (
                <div className="mt-3">
                  <PhotoGallery
                    photos={review.photos}
                    label={isHelper ? `Photos de l’avis de ${other.firstName}` : 'Photos de votre avis'}
                  />
                </div>
              )}
              {review.reply ? (
                <ReviewReply
                  title={isHelper ? 'Votre réponse' : `Réponse de ${booking.helper.firstName}`}
                  reply={review.reply}
                  repliedAt={review.repliedAt}
                />
              ) : (
                isHelper && (
                  <div className="mt-4">
                    <ReplyForm reviewId={review.id} authorName={other.firstName} />
                  </div>
                )
              )}
            </div>
          ) : isHelper ? (
            <p className="text-ink-soft mt-4">{other.firstName} n’a pas encore laissé d’avis.</p>
          ) : (
            <div className="mt-4">
              <ReviewForm bookingId={booking.id} helperName={other.firstName} />
            </div>
          ))}

        <div className="mt-5 flex flex-wrap gap-3">
          {booking.status === 'pending' && !isHelper && (
            <>
              <form action={acceptBooking.bind(null, booking.id)}>
                <SubmitButton>Accepter</SubmitButton>
              </form>
              <form action={declineBooking.bind(null, booking.id)}>
                <SubmitButton className="btn btn-quiet">Refuser</SubmitButton>
              </form>
            </>
          )}
          {booking.status === 'confirmed' && started && (
            <form action={completeBooking.bind(null, booking.id)}>
              <SubmitButton>Marquer comme effectué</SubmitButton>
            </form>
          )}
          {conversation && (
            <Link href={`/messages/${conversation}`} className="btn btn-secondary">
              <span aria-hidden="true">💬</span> Écrire à {other.firstName}
            </Link>
          )}
          {(booking.status === 'confirmed' || (booking.status === 'pending' && isHelper)) && (
            <form action={cancelBooking.bind(null, booking.id)}>
              <SubmitButton
                className="btn btn-quiet"
                confirm={
                  booking.status === 'pending'
                    ? 'Voulez-vous vraiment retirer votre proposition ?'
                    : 'Voulez-vous vraiment annuler ce rendez-vous ?'
                }
              >
                {booking.status === 'pending' ? 'Retirer ma proposition' : 'Annuler le rendez-vous'}
              </SubmitButton>
            </form>
          )}
        </div>
      </li>
    );
  };

  return (
    <>
      <Flash code={ok} />
      <h1 className="page-title">Mes rendez-vous</h1>
      <p className="page-lead">
        {isHelper
          ? 'Vos propositions en attente et vos interventions prévues chez vos voisins.'
          : 'Les créneaux proposés par vos voisins et vos rendez-vous confirmés.'}
      </p>

      <section className="mt-8" aria-labelledby="a-venir">
        <h2 id="a-venir" className="text-2xl">
          À venir
        </h2>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Aucun rendez-vous à venir">
              {isHelper ? (
                <>
                  <p>Consultez les demandes de votre quartier pour proposer votre aide.</p>
                  <Link href="/demandes" className="btn btn-primary mt-5">
                    Voir les demandes
                  </Link>
                </>
              ) : (
                <>
                  <p>Publiez une demande pour recevoir des propositions de vos voisins.</p>
                  <Link href="/demandes/nouvelle" className="btn btn-primary mt-5">
                    Demander de l’aide
                  </Link>
                </>
              )}
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">{upcoming.map(renderBooking)}</ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10" aria-labelledby="historique">
          <h2 id="historique" className="text-2xl">
            Historique
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">{past.map(renderBooking)}</ul>
        </section>
      )}
    </>
  );
}
