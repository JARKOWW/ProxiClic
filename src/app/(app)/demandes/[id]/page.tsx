import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { acceptBooking, cancelBooking, declineBooking } from '@/actions/bookings';
import { startConversation } from '@/actions/messages';
import { cancelRequest } from '@/actions/requests';
import { BookingModal } from '@/components/BookingModal';
import { Flash } from '@/components/Flash';
import { SubmitButton } from '@/components/SubmitButton';
import {
  BookingStatusBadge,
  CategoryBadge,
  EmptyState,
  formatRating,
  GradeBadge,
  Notice,
  RequestStatusBadge,
  Stars,
} from '@/components/ui';
import { db } from '@/db';
import { bookings, conversations, requests } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { displayName, formatDateTime, formatDuration, formatRelative } from '@/lib/format';
import { gradeFor } from '@/lib/grades';
import { allHelperStats } from '@/lib/stats';
import { idSchema } from '@/lib/validation';

export const metadata: Metadata = { title: 'Détail de la demande' };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> };

export default async function RequestDetailPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, id.data),
    with: {
      client: true,
      bookings: { with: { helper: true }, orderBy: desc(bookings.createdAt) },
    },
  });
  if (!request) notFound();

  const isOwner = request.clientId === user.id;
  const myBookings = request.bookings.filter((b) => b.helperId === user.id);
  // Visible par son auteur, par les aidants tant qu'elle est ouverte, puis par les aidants qui y ont répondu.
  const canView = isOwner || (user.role === 'helper' && (request.status === 'open' || myBookings.length > 0));
  if (!canView) notFound();

  const threads = await db.query.conversations.findMany({
    where: eq(conversations.requestId, request.id),
    columns: { id: true, helperId: true },
  });
  const threadByHelper = new Map(threads.map((t) => [t.helperId, t.id]));

  // Réputation des aidants, pour aider le demandeur à choisir.
  const stats = isOwner && request.bookings.length > 0 ? await allHelperStats() : new Map();

  const myActive = myBookings.find((b) => b.status === 'pending' || b.status === 'confirmed');
  const clientName = displayName(request.client);
  const { ok } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl">
      <Flash code={ok} />
      <p>
        <Link href={isOwner ? '/mes-demandes' : '/demandes'} className="link">
          ← {isOwner ? 'Mes demandes' : 'Toutes les demandes'}
        </Link>
      </p>

      <article className="card mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={request.category} />
          <RequestStatusBadge status={request.status} />
        </div>
        <h1 className="mt-4 text-3xl">{request.title}</h1>
        <p className="text-ink-soft mt-2">
          {isOwner ? 'Vous' : clientName} · {request.neighborhood}, {request.city} · publiée{' '}
          {formatRelative(request.createdAt)}
        </p>
        <p className="mt-5 text-lg whitespace-pre-wrap">{request.description}</p>
        {request.availability && (
          <p className="bg-brand-50 mt-5 rounded-xl p-4">
            <strong>Disponibilités :</strong> {request.availability}
          </p>
        )}

        {isOwner && (request.status === 'open' || request.status === 'booked') && (
          <form action={cancelRequest.bind(null, request.id)} className="border-line mt-6 border-t pt-5">
            <SubmitButton
              className="btn btn-quiet"
              confirm="Voulez-vous vraiment annuler cette demande ? Les rendez-vous associés seront annulés."
            >
              Annuler ma demande
            </SubmitButton>
          </form>
        )}
      </article>

      {/* Vue de l'aidant */}
      {!isOwner && (
        <section className="mt-6" aria-labelledby="repondre">
          <h2 id="repondre" className="sr-only">
            Répondre à cette demande
          </h2>
          {myActive ? (
            <div className="card space-y-4">
              <Notice tone="info">
                {myActive.status === 'confirmed' ? 'Rendez-vous confirmé' : 'Vous avez proposé un rendez-vous'} :{' '}
                {formatDateTime(myActive.scheduledAt)} ({formatDuration(myActive.durationMin)}).
              </Notice>
              <div className="flex flex-wrap gap-3">
                {threadByHelper.has(user.id) && (
                  <Link href={`/messages/${threadByHelper.get(user.id)}`} className="btn btn-primary">
                    Ouvrir la conversation
                  </Link>
                )}
                <Link href="/rendez-vous" className="btn btn-secondary">
                  Voir mes rendez-vous
                </Link>
              </div>
            </div>
          ) : request.status === 'open' ? (
            <div className="card">
              <p className="text-lg">
                Vous pouvez aider {clientName} ? Proposez-lui un créneau, ou posez-lui d’abord une question.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <BookingModal
                  requestId={request.id}
                  requestTitle={request.title}
                  clientName={clientName}
                  availability={request.availability}
                />
                <form action={startConversation.bind(null, request.id)}>
                  <SubmitButton className="btn btn-secondary btn-lg w-full" pendingLabel="Ouverture…">
                    <span aria-hidden="true">💬</span> Envoyer un message
                  </SubmitButton>
                </form>
              </div>
            </div>
          ) : (
            <Notice tone="info">Cette demande n’est plus ouverte aux propositions.</Notice>
          )}
        </section>
      )}

      {/* Vue du demandeur */}
      {isOwner && (
        <section className="mt-8" aria-labelledby="propositions">
          <h2 id="propositions" className="text-2xl">
            Propositions reçues
          </h2>
          {request.bookings.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Pas encore de proposition">
                <p>Dès qu’un aidant vous proposera un rendez-vous, il apparaîtra ici.</p>
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {request.bookings.map((booking) => {
                const helperStats = stats.get(booking.helperId) ?? { completed: 0, reviewCount: 0, average: null };
                return (
                <li key={booking.id} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl">{displayName(booking.helper)}</h3>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <GradeBadge grade={gradeFor(helperStats.completed)} />
                    {helperStats.average !== null ? (
                      <span className="flex items-center gap-2">
                        <Stars value={helperStats.average} />
                        <strong>{formatRating(helperStats.average)}</strong>
                        <span className="text-ink-soft">({helperStats.reviewCount} avis)</span>
                      </span>
                    ) : (
                      <span className="text-ink-soft">Pas encore d’avis</span>
                    )}
                  </p>
                  <p className="text-ink-soft mt-2">
                    {booking.helper.neighborhood}, {booking.helper.city}
                    {booking.helper.skills && ` · ${booking.helper.skills}`}
                  </p>
                  {booking.helper.bio && <p className="mt-3">{booking.helper.bio}</p>}
                  <p className="bg-brand-50 mt-4 rounded-xl p-4 text-lg">
                    <span aria-hidden="true">📅 </span>
                    <strong className="capitalize">{formatDateTime(booking.scheduledAt)}</strong> ·{' '}
                    {formatDuration(booking.durationMin)}
                  </p>
                  {booking.note && <p className="mt-3 whitespace-pre-wrap italic">« {booking.note} »</p>}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {booking.status === 'pending' && request.status === 'open' && (
                      <>
                        <form action={acceptBooking.bind(null, booking.id)}>
                          <SubmitButton>Accepter ce rendez-vous</SubmitButton>
                        </form>
                        <form action={declineBooking.bind(null, booking.id)}>
                          <SubmitButton className="btn btn-quiet">Refuser</SubmitButton>
                        </form>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <form action={cancelBooking.bind(null, booking.id)}>
                        <SubmitButton className="btn btn-quiet" confirm="Voulez-vous vraiment annuler ce rendez-vous ?">
                          Annuler le rendez-vous
                        </SubmitButton>
                      </form>
                    )}
                    {threadByHelper.has(booking.helperId) && (
                      <Link href={`/messages/${threadByHelper.get(booking.helperId)}`} className="btn btn-secondary">
                        <span aria-hidden="true">💬</span> Écrire à {booking.helper.firstName}
                      </Link>
                    )}
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
