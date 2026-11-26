import { asc, desc, eq, inArray } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { acceptBooking, cancelBooking, completeBooking, declineBooking } from '@/actions/bookings';
import { setSimpleView } from '@/actions/profile';
import { cancelRequest } from '@/actions/requests';
import { Flash } from '@/components/Flash';
import { SimpleMessageForm, SimpleRequestForm, SimpleReviewForm } from '@/components/SimpleForms';
import { SubmitButton } from '@/components/SubmitButton';
import { formatRating } from '@/components/ui';
import { db } from '@/db';
import { conversations, messages, requests, reviews } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { CATEGORIES } from '@/lib/constants';
import { markConversationRead, unreadByConversation } from '@/lib/conversations';
import { displayName, formatDay, formatDuration, formatShort, formatTime } from '@/lib/format';
import { allHelperStats } from '@/lib/stats';

export const metadata: Metadata = { title: 'Mon espace' };

const MESSAGES_SHOWN = 3;

/** « 14 h 00 » */
const hour = (d: Date) => formatTime(d).replace(':', ' h ');
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/**
 * Affichage simplifié du demandeur : une seule page courte. En haut, seulement ce qui demande
 * une action (rendez-vous, propositions, messages, avis) ; le reste est replié derrière un bouton.
 */
export default async function SimpleHomePage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const user = await requireUser();
  const { ok } = await searchParams;

  const myRequests = await db.query.requests.findMany({
    where: eq(requests.clientId, user.id),
    with: { bookings: { with: { helper: true } } },
    orderBy: desc(requests.createdAt),
  });
  const allBookings = myRequests.flatMap((request) => request.bookings.map((booking) => ({ ...booking, request })));
  const byDate = (a: { scheduledAt: Date }, b: { scheduledAt: Date }) => a.scheduledAt.getTime() - b.scheduledAt.getTime();

  const confirmed = allBookings.filter((b) => b.status === 'confirmed').sort(byDate);
  const proposals = allBookings.filter((b) => b.status === 'pending' && b.request.status === 'open').sort(byDate);
  const completed = allBookings.filter((b) => b.status === 'completed');
  const activeRequests = myRequests.filter((r) => r.status === 'open' || r.status === 'booked');

  const [stats, reviewed, unread, threads] = await Promise.all([
    proposals.length ? allHelperStats() : Promise.resolve(new Map()),
    completed.length
      ? db.query.reviews.findMany({
          where: inArray(reviews.bookingId, completed.map((b) => b.id)),
          columns: { bookingId: true },
        })
      : Promise.resolve([]),
    unreadByConversation(user.id),
    db.query.conversations.findMany({
      where: eq(conversations.clientId, user.id),
      with: {
        helper: true,
        request: { columns: { status: true } },
        messages: { orderBy: desc(messages.id), limit: MESSAGES_SHOWN },
      },
      orderBy: asc(conversations.id),
    }),
  ]);

  const reviewedIds = new Set(reviewed.map((r) => r.bookingId));
  const toReview = completed.filter((b) => !reviewedIds.has(b.id));

  // Discussions des demandes en cours, la plus récente en premier.
  const activeThreads = threads
    .filter((t) => (t.request.status === 'open' || t.request.status === 'booked') && t.messages.length > 0)
    .map((t) => ({ ...t, messages: [...t.messages].reverse(), unread: unread.get(t.id) ?? 0 }))
    .sort((a, b) => b.messages.at(-1)!.id - a.messages.at(-1)!.id);

  // Les messages affichés sur cette page sont considérés comme lus.
  await Promise.all(activeThreads.filter((t) => t.unread > 0).map((t) => markConversationRead(t.id, user.id)));

  const now = Date.now();
  const nothingToDo = confirmed.length === 0 && proposals.length === 0 && toReview.length === 0;

  return (
    <div className="space-y-10">
      <Flash code={ok} />

      <div>
        <h1 className="text-4xl">Bonjour {user.firstName}</h1>
        <p className="text-ink-soft mt-2 text-lg">
          {nothingToDo ? 'Rien à faire pour le moment.' : 'Voici ce qui vous attend.'}
        </p>
      </div>

      {/* Rendez-vous confirmés */}
      {confirmed.length > 0 && (
        <section aria-labelledby="rdv-titre">
          <h2 id="rdv-titre" className="simple-label">
            {confirmed.length > 1 ? 'Vos rendez-vous' : 'Votre rendez-vous'}
          </h2>
          <ul className="space-y-4">
            {confirmed.map((booking) => (
              <li key={booking.id} className="bg-brand-700 shadow-pop rounded-3xl p-6 text-white">
                <p className="font-display text-3xl font-bold">{formatDay(booking.scheduledAt)}</p>
                <p className="mt-1 text-xl">
                  à {hour(booking.scheduledAt)} · {formatDuration(booking.durationMin)}
                </p>
                <p className="text-brand-100 mt-4">
                  <strong className="text-white">{displayName(booking.helper)}</strong> vient chez vous
                  <span className="block">{booking.request.title}</span>
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {booking.helper.phone && (
                    <a
                      href={`tel:${booking.helper.phone.replace(/[^\d+]/g, '')}`}
                      className="btn text-brand-800 hover:bg-brand-50 flex-1 bg-white"
                    >
                      <span aria-hidden="true">📞</span> Appeler {booking.helper.firstName}
                      <span className="sr-only"> au {booking.helper.phone}</span>
                    </a>
                  )}
                  {booking.scheduledAt.getTime() <= now && (
                    <form action={completeBooking.bind(null, booking.id)} className="flex-1">
                      <SubmitButton className="btn hover:bg-brand-800 w-full border-white text-white">
                        La visite est faite
                      </SubmitButton>
                    </form>
                  )}
                </div>
                <form action={cancelBooking.bind(null, booking.id)} className="mt-3 text-center">
                  <SubmitButton
                    className="text-brand-100 min-h-12 cursor-pointer px-2 underline underline-offset-4 hover:text-white"
                    confirm={`Voulez-vous vraiment annuler le rendez-vous avec ${booking.helper.firstName} ?`}
                  >
                    Annuler ce rendez-vous
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Propositions à accepter ou refuser */}
      {proposals.length > 0 && (
        <section aria-labelledby="propositions-titre">
          <h2 id="propositions-titre" className="simple-label">
            {proposals.length > 1 ? 'Des voisins proposent de venir' : 'Un voisin propose de venir'}
          </h2>
          <ul className="space-y-4">
            {proposals.map((booking) => {
              const helperStats = stats.get(booking.helperId);
              return (
                <li key={booking.id} className="card border-brand-200 border-2">
                  <p className="text-xl">
                    <strong>{displayName(booking.helper)}</strong> peut venir le
                  </p>
                  <p className="font-display text-brand-700 mt-1 text-2xl font-bold">
                    {formatDay(booking.scheduledAt)} à {hour(booking.scheduledAt)}
                  </p>
                  <p className="text-ink-soft mt-2">Pour : {booking.request.title}</p>
                  <p className="mt-3">
                    {helperStats?.average != null ? (
                      <>
                        <span aria-hidden="true" className="text-brand-700">
                          ★{' '}
                        </span>
                        Noté {formatRating(helperStats.average)} sur 5 ·{' '}
                      </>
                    ) : null}
                    {helperStats?.completed
                      ? `a déjà aidé ${plural(helperStats.completed, 'voisin', 'voisins')}`
                      : 'nouveau sur Proxi’Clic'}
                    {' · '}
                    <Link href={`/aidants/${booking.helperId}`} className="link">
                      Voir son profil<span className="sr-only"> ({displayName(booking.helper)})</span>
                    </Link>
                  </p>
                  {booking.note && <p className="bg-brand-50 mt-4 rounded-2xl p-4 italic">« {booking.note} »</p>}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <form action={acceptBooking.bind(null, booking.id)}>
                      <SubmitButton className="btn btn-primary w-full">Accepter</SubmitButton>
                    </form>
                    <form action={declineBooking.bind(null, booking.id)}>
                      <SubmitButton
                        className="btn btn-quiet w-full"
                        confirm={`Voulez-vous vraiment refuser la proposition de ${booking.helper.firstName} ?`}
                      >
                        Refuser
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Avis à donner */}
      {toReview.length > 0 && (
        <section aria-labelledby="avis-titre">
          <h2 id="avis-titre" className="simple-label">
            Votre avis
          </h2>
          <ul className="space-y-4">
            {toReview.map((booking) => (
              <li key={booking.id} className="card">
                <p className="mb-4 text-lg">
                  Comment s’est passée la visite de <strong>{displayName(booking.helper)}</strong> ?
                </p>
                <SimpleReviewForm bookingId={booking.id} helperName={booking.helper.firstName} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Messages : le dernier message est visible, la discussion se déplie */}
      {activeThreads.length > 0 && (
        <section aria-labelledby="messages-titre">
          <h2 id="messages-titre" className="simple-label">
            Messages
          </h2>
          <ul className="card divide-line divide-y p-0 sm:p-0">
            {activeThreads.map((thread) => {
              const last = thread.messages.at(-1)!;
              const lastFromMe = last.senderId === user.id;
              return (
                <li key={thread.id} className="p-5 sm:px-7">
                  <details className="simple-fold">
                    <summary>
                      <span className="flex min-w-0 items-center gap-4">
                        <span
                          aria-hidden="true"
                          className="bg-brand-100 text-brand-800 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
                        >
                          {thread.helper.firstName.charAt(0)}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            {displayName(thread.helper)}
                            {thread.unread > 0 && (
                              <span className="bg-brand-700 rounded-full px-2.5 py-0.5 text-sm text-white">Nouveau</span>
                            )}
                          </span>
                          <span className="text-ink-soft line-clamp-1 font-normal">
                            {lastFromMe ? 'Vous : ' : ''}
                            {last.body}
                          </span>
                        </span>
                      </span>
                    </summary>
                    <ol className="mt-4 space-y-2" aria-label={`Derniers messages avec ${thread.helper.firstName}`}>
                      {thread.messages.map((message) => {
                        const mine = message.senderId === user.id;
                        return (
                          <li
                            key={message.id}
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? 'bg-mute-bg ml-auto' : 'bg-brand-50'}`}
                          >
                            <p className="text-ink-soft text-sm">
                              {mine ? 'Vous' : thread.helper.firstName}, {formatShort(message.createdAt)}
                            </p>
                            <p className="whitespace-pre-wrap">{message.body}</p>
                          </li>
                        );
                      })}
                    </ol>
                    <div className="mt-4">
                      <SimpleMessageForm conversationId={thread.id} otherName={thread.helper.firstName} />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Nouvelle demande */}
      <section aria-labelledby="demander-titre" className="card">
        <details className="simple-fold" open={nothingToDo && activeRequests.length === 0}>
          <summary>
            <span id="demander-titre" className="flex items-center gap-4 text-xl">
              <span
                aria-hidden="true"
                className="bg-brand-700 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl text-white"
              >
                +
              </span>
              Demander de l’aide
            </span>
          </summary>
          <div className="mt-5">
            <SimpleRequestForm />
          </div>
        </details>
      </section>

      {/* Demandes en cours */}
      {activeRequests.length > 0 && (
        <section aria-labelledby="demandes-titre">
          <h2 id="demandes-titre" className="simple-label">
            Vos demandes
          </h2>
          <ul className="card divide-line divide-y p-0 sm:p-0">
            {activeRequests.map((request) => {
              const pending = request.bookings.filter((b) => b.status === 'pending').length;
              const booked = request.bookings.some((b) => b.status === 'confirmed');
              return (
                <li key={request.id} className="flex items-center gap-4 p-5 sm:px-7">
                  <span aria-hidden="true" className="text-2xl">
                    {CATEGORIES[request.category].icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{request.title}</p>
                    <p className="text-ink-soft text-sm">
                      {booked
                        ? 'Rendez-vous fixé'
                        : pending > 0
                          ? plural(pending, 'proposition reçue', 'propositions reçues')
                          : 'En attente d’un voisin'}
                    </p>
                  </div>
                  <form action={cancelRequest.bind(null, request.id)}>
                    <SubmitButton
                      className="text-ink-soft hover:text-ink min-h-12 cursor-pointer px-2 text-sm underline underline-offset-4"
                      confirm="Voulez-vous vraiment annuler cette demande ? Les rendez-vous associés seront annulés."
                    >
                      Annuler<span className="sr-only"> la demande : {request.title}</span>
                    </SubmitButton>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="text-center">
        <Link href="/mon-compte" className="link">
          Mon mot de passe, mes données, supprimer mon compte
        </Link>
      </p>

      <form action={setSimpleView.bind(null, false)} className="text-center">
        <SubmitButton className="text-ink-soft hover:text-ink min-h-12 cursor-pointer px-2 underline underline-offset-4">
          Passer à l’affichage complet
        </SubmitButton>
      </form>
    </div>
  );
}
