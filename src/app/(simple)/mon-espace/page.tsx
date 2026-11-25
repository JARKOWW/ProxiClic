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
import { displayName, formatDateTime, formatDuration, formatShort } from '@/lib/format';
import { allHelperStats } from '@/lib/stats';

export const metadata: Metadata = { title: 'Mon espace' };

const MESSAGES_SHOWN = 4;

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/**
 * Affichage simplifié du demandeur : tout ce dont il a besoin, sur une seule page, dans l'ordre
 * des choses à faire. Aucune information n'est donnée par la couleur seule, chaque bouton dit
 * exactement ce qu'il fait, et chaque section est accessible depuis le sommaire.
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

  const confirmed = allBookings
    .filter((b) => b.status === 'confirmed')
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const proposals = allBookings
    .filter((b) => b.status === 'pending' && b.request.status === 'open')
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
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
        request: { columns: { title: true, status: true } },
        messages: { orderBy: desc(messages.id), limit: MESSAGES_SHOWN },
      },
      orderBy: asc(conversations.id),
    }),
  ]);

  const reviewedIds = new Set(reviewed.map((r) => r.bookingId));
  const toReview = completed.filter((b) => !reviewedIds.has(b.id));

  // Seules les discussions liées à une demande en cours sont affichées, la plus récente en premier.
  const activeThreads = threads
    .filter((t) => t.request.status === 'open' || t.request.status === 'booked')
    .map((t) => ({ ...t, messages: [...t.messages].reverse(), unread: unread.get(t.id) ?? 0 }))
    .sort((a, b) => (b.messages.at(-1)?.id ?? 0) - (a.messages.at(-1)?.id ?? 0));
  const unreadTotal = activeThreads.reduce((sum, t) => sum + t.unread, 0);
  const threadFor = (requestId: number, helperId: number) =>
    threads.find((t) => t.requestId === requestId && t.helperId === helperId)?.id;

  // Les messages affichés sur cette page sont considérés comme lus.
  await Promise.all(activeThreads.filter((t) => t.unread > 0).map((t) => markConversationRead(t.id, user.id)));

  const now = Date.now();

  const summary = [
    { id: 'rendez-vous', label: 'Vos rendez-vous', detail: confirmed.length ? plural(confirmed.length, 'prévu', 'prévus') : 'aucun' },
    {
      id: 'propositions',
      label: 'Propositions à examiner',
      detail: proposals.length ? plural(proposals.length, 'à examiner', 'à examiner') : 'aucune',
    },
    {
      id: 'messages',
      label: 'Vos messages',
      detail: unreadTotal ? plural(unreadTotal, 'nouveau', 'nouveaux') : 'pas de nouveau message',
    },
    ...(toReview.length ? [{ id: 'avis', label: 'Donner votre avis', detail: plural(toReview.length, 'visite', 'visites') }] : []),
    { id: 'demander', label: 'Demander de l’aide', detail: 'nouvelle demande' },
    {
      id: 'mes-demandes',
      label: 'Vos demandes en cours',
      detail: activeRequests.length ? String(activeRequests.length) : 'aucune',
    },
  ];

  return (
    <>
      <Flash code={ok} />

      <h1 className="text-4xl sm:text-5xl">Bonjour {user.firstName}</h1>
      <p className="mt-3 text-xl">
        Tout se trouve sur cette page. Faites-la défiler vers le bas, ou choisissez une rubrique ci-dessous.
      </p>

      <nav aria-labelledby="sommaire" className="simple-section mt-8">
        <h2 id="sommaire" className="text-2xl">
          Sur cette page
        </h2>
        <ul className="mt-4 grid gap-3">
          {summary.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="border-line-strong hover:bg-brand-50 flex min-h-14 flex-wrap items-center justify-between gap-2 rounded-2xl border-2 px-5 py-3 text-lg font-bold no-underline"
              >
                <span className="text-brand-700 underline underline-offset-4">{item.label}</span>
                <span className="text-ink-soft font-normal">{item.detail}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 space-y-8">
        {/* 1. Rendez-vous confirmés */}
        <section id="rendez-vous" aria-labelledby="rendez-vous-titre" className="simple-section">
          <h2 id="rendez-vous-titre">
            <span aria-hidden="true">📅</span> Vos rendez-vous
          </h2>
          {confirmed.length === 0 ? (
            <p className="mt-4 text-lg">
              Vous n’avez pas de rendez-vous prévu pour le moment.
              {proposals.length > 0 && ' Un voisin vous a fait une proposition : regardez la rubrique suivante.'}
            </p>
          ) : (
            <ul className="mt-5 space-y-6">
              {confirmed.map((booking) => {
                const helper = booking.helper;
                const started = booking.scheduledAt.getTime() <= now;
                return (
                  <li key={booking.id} className="border-line space-y-4 border-t-2 pt-5 first:border-t-0 first:pt-0">
                    <p className="simple-highlight">
                      <strong className="block capitalize">{formatDateTime(booking.scheduledAt)}</strong>
                      Durée prévue : {formatDuration(booking.durationMin)}
                    </p>
                    <p className="text-lg">
                      <strong>{displayName(helper)}</strong> vient chez vous pour :{' '}
                      <span className="italic">{booking.request.title}</span>
                    </p>
                    {helper.phone ? (
                      <p>
                        <a href={`tel:${helper.phone.replace(/[^\d+]/g, '')}`} className="btn btn-secondary btn-lg">
                          <span aria-hidden="true">📞</span> Appeler {helper.firstName} au {helper.phone}
                        </a>
                      </p>
                    ) : (
                      <p className="text-lg">
                        {helper.firstName} n’a pas donné de numéro de téléphone. Vous pouvez lui écrire dans la
                        rubrique « Vos messages ».
                      </p>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {started && (
                        <form action={completeBooking.bind(null, booking.id)}>
                          <SubmitButton className="btn btn-primary btn-lg w-full">
                            La visite a eu lieu : c’est terminé
                          </SubmitButton>
                        </form>
                      )}
                      <form action={cancelBooking.bind(null, booking.id)}>
                        <SubmitButton
                          className="btn btn-quiet btn-lg w-full"
                          confirm={`Voulez-vous vraiment annuler le rendez-vous avec ${helper.firstName} ?`}
                        >
                          Annuler ce rendez-vous
                        </SubmitButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 2. Propositions à accepter ou refuser */}
        <section id="propositions" aria-labelledby="propositions-titre" className="simple-section">
          <h2 id="propositions-titre">
            <span aria-hidden="true">🤝</span> Propositions à examiner
          </h2>
          {proposals.length === 0 ? (
            <p className="mt-4 text-lg">
              Aucune proposition à examiner. Quand un voisin proposera de venir vous aider, elle s’affichera ici.
            </p>
          ) : (
            <>
              <p className="mt-4 text-lg">
                Si vous acceptez une proposition, les autres propositions pour la même demande seront refusées.
              </p>
              <ul className="mt-5 space-y-6">
                {proposals.map((booking) => {
                  const helper = booking.helper;
                  const helperStats = stats.get(booking.helperId);
                  return (
                    <li key={booking.id} className="border-line space-y-4 border-t-2 pt-5 first:border-t-0 first:pt-0">
                      <h3 className="text-2xl">{displayName(helper)} propose de venir</h3>
                      <p className="simple-highlight">
                        <strong className="block capitalize">{formatDateTime(booking.scheduledAt)}</strong>
                        Durée prévue : {formatDuration(booking.durationMin)}
                      </p>
                      <p className="text-lg">
                        Pour votre demande : <span className="italic">{booking.request.title}</span>
                      </p>
                      <ul className="list-disc space-y-1 pl-6 text-lg">
                        <li>
                          {helperStats?.completed
                            ? `A déjà aidé ${plural(helperStats.completed, 'voisin', 'voisins')}.`
                            : 'C’est sa première visite sur Proxi’Tech.'}
                        </li>
                        <li>
                          {helperStats?.average != null
                            ? `Note moyenne : ${formatRating(helperStats.average)} sur 5 (${plural(helperStats.reviewCount, 'avis', 'avis')}).`
                            : 'Pas encore d’avis.'}
                        </li>
                        <li>
                          Habite à {helper.neighborhood}, {helper.city}.
                        </li>
                      </ul>
                      {booking.note && (
                        <blockquote className="border-brand-200 border-l-4 pl-4 text-lg italic">
                          <p className="whitespace-pre-wrap">« {booking.note} »</p>
                        </blockquote>
                      )}
                      <p>
                        <Link href={`/aidants/${helper.id}`} className="link text-lg">
                          Voir le profil et les avis de {helper.firstName}
                        </Link>
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <form action={acceptBooking.bind(null, booking.id)}>
                          <SubmitButton className="btn btn-primary btn-lg w-full">
                            Oui, j’accepte que {helper.firstName} vienne
                          </SubmitButton>
                        </form>
                        <form action={declineBooking.bind(null, booking.id)}>
                          <SubmitButton
                            className="btn btn-quiet btn-lg w-full"
                            confirm={`Voulez-vous vraiment refuser la proposition de ${helper.firstName} ?`}
                          >
                            Non, je refuse
                          </SubmitButton>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        {/* 3. Messages */}
        <section id="messages" aria-labelledby="messages-titre" className="simple-section">
          <h2 id="messages-titre">
            <span aria-hidden="true">💬</span> Vos messages
          </h2>
          {activeThreads.length === 0 ? (
            <p className="mt-4 text-lg">
              Vous n’avez pas de message. Les voisins qui répondent à vos demandes pourront vous écrire ici.
            </p>
          ) : (
            <ul className="mt-5 space-y-8">
              {activeThreads.map((thread) => (
                <li key={thread.id} className="border-line space-y-4 border-t-2 pt-5 first:border-t-0 first:pt-0">
                  <h3 className="text-2xl">
                    Avec {displayName(thread.helper)}
                    {thread.unread > 0 && (
                      <span className="bg-brand-700 ml-3 inline-block rounded-full px-3 py-1 align-middle text-base text-white">
                        {plural(thread.unread, 'nouveau message', 'nouveaux messages')}
                      </span>
                    )}
                  </h3>
                  <p className="text-ink-soft">À propos de : {thread.request.title}</p>
                  {thread.messages.length === 0 ? (
                    <p className="text-lg">Aucun message pour l’instant.</p>
                  ) : (
                    <ol className="space-y-3" aria-label={`Derniers messages avec ${thread.helper.firstName}`}>
                      {thread.messages.map((message) => {
                        const mine = message.senderId === user.id;
                        return (
                          <li
                            key={message.id}
                            className={`rounded-2xl p-4 text-lg ${mine ? 'bg-mute-bg ml-6 sm:ml-16' : 'bg-brand-50 mr-6 sm:mr-16'}`}
                          >
                            <p className="text-base font-bold">
                              {mine ? 'Vous avez écrit' : `${thread.helper.firstName} a écrit`}
                              <span className="text-ink-soft font-normal">, le {formatShort(message.createdAt)}</span> :
                            </p>
                            <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  <SimpleMessageForm conversationId={thread.id} otherName={thread.helper.firstName} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4. Avis à donner (uniquement s'il y en a) */}
        {toReview.length > 0 && (
          <section id="avis" aria-labelledby="avis-titre" className="simple-section">
            <h2 id="avis-titre">
              <span aria-hidden="true">⭐</span> Donner votre avis
            </h2>
            <p className="mt-4 text-lg">Votre avis aide les autres voisins à choisir. Cela prend une minute.</p>
            <ul className="mt-5 space-y-8">
              {toReview.map((booking) => (
                <li key={booking.id} className="border-line space-y-4 border-t-2 pt-5 first:border-t-0 first:pt-0">
                  <h3 className="text-2xl">Visite de {displayName(booking.helper)}</h3>
                  <p className="text-lg">
                    Le <span>{formatDateTime(booking.scheduledAt)}</span>, pour : {booking.request.title}
                  </p>
                  <SimpleReviewForm bookingId={booking.id} helperName={booking.helper.firstName} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 5. Nouvelle demande */}
        <section id="demander" aria-labelledby="demander-titre" className="simple-section">
          <h2 id="demander-titre">
            <span aria-hidden="true">🙋</span> Demander de l’aide
          </h2>
          <p className="mt-4 text-lg">
            Répondez à ces trois questions. Un voisin de {user.neighborhood} vous proposera ensuite de venir chez vous.
          </p>
          <div className="mt-6">
            <SimpleRequestForm />
          </div>
        </section>

        {/* 6. Demandes en cours */}
        <section id="mes-demandes" aria-labelledby="mes-demandes-titre" className="simple-section">
          <h2 id="mes-demandes-titre">
            <span aria-hidden="true">📋</span> Vos demandes en cours
          </h2>
          {activeRequests.length === 0 ? (
            <p className="mt-4 text-lg">Vous n’avez pas de demande en cours.</p>
          ) : (
            <ul className="mt-5 space-y-6">
              {activeRequests.map((request) => {
                const pending = request.bookings.filter((b) => b.status === 'pending').length;
                const booked = request.bookings.find((b) => b.status === 'confirmed');
                return (
                  <li key={request.id} className="border-line space-y-3 border-t-2 pt-5 first:border-t-0 first:pt-0">
                    <h3 className="text-2xl">
                      <span aria-hidden="true">{CATEGORIES[request.category].icon} </span>
                      {request.title}
                    </h3>
                    <p className="text-lg">
                      <strong>Où en est-elle ? </strong>
                      {booked
                        ? `Rendez-vous fixé avec ${booked.helper.firstName}, le ${formatDateTime(booked.scheduledAt)}.`
                        : pending > 0
                          ? `${plural(pending, 'proposition reçue', 'propositions reçues')} : voir la rubrique « Propositions à examiner ».`
                          : 'En attente : aucun voisin n’a encore répondu.'}
                    </p>
                    <form action={cancelRequest.bind(null, request.id)}>
                      <SubmitButton
                        className="btn btn-quiet"
                        confirm="Voulez-vous vraiment annuler cette demande ? Les rendez-vous associés seront annulés."
                      >
                        Annuler cette demande<span className="sr-only"> : {request.title}</span>
                      </SubmitButton>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Changer d'affichage */}
        <section aria-labelledby="affichage-titre" className="border-line-strong rounded-3xl border-2 border-dashed p-5 sm:p-8">
          <h2 id="affichage-titre" className="text-2xl">
            Changer d’affichage
          </h2>
          <p className="mt-3 text-lg">
            L’affichage complet répartit les informations sur plusieurs pages et donne accès à votre profil et à
            l’historique. Vous pourrez revenir ici quand vous voudrez.
          </p>
          <form action={setSimpleView.bind(null, false)} className="mt-4">
            <SubmitButton className="btn btn-secondary btn-lg">Passer à l’affichage complet</SubmitButton>
          </form>
        </section>
      </div>
    </>
  );
}
