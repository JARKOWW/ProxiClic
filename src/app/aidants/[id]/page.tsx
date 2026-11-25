import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer, Header } from '@/components/Header';
import { PhotoGallery } from '@/components/PhotoGallery';
import { CategoryBadge, EmptyState, formatRating, GradeBadge, ReviewReply, ReviewTags, Stars } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';
import { REVIEW_TAG_KEYS } from '@/lib/constants';
import { displayName, formatDate, formatRelative } from '@/lib/format';
import { gradeFor } from '@/lib/grades';
import { helperProfile } from '@/lib/stats';
import { idSchema } from '@/lib/validation';

// Les avis et les chiffres viennent de la base : la page est toujours rendue à la demande.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

async function load(params: Props['params']) {
  const id = idSchema.safeParse((await params).id);
  return id.success ? helperProfile(id.data) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await load(params);
  return { title: profile ? `${displayName(profile.helper)}, aidant à ${profile.helper.neighborhood}` : 'Aidant introuvable' };
}

export default async function HelperProfilePage({ params }: Props) {
  const [user, profile] = await Promise.all([getCurrentUser(), load(params)]);
  if (!profile) notFound();

  const { helper, stats, reviews, distribution, tagCounts } = profile;
  const name = displayName(helper);
  const grade = gradeFor(stats.completed);
  const isMe = user?.id === helper.id;
  // Compliments du plus reçu au moins reçu.
  const topTags = REVIEW_TAG_KEYS.filter((tag) => tagCounts.has(tag)).sort(
    (a, b) => (tagCounts.get(b) ?? 0) - (tagCounts.get(a) ?? 0),
  );
  const gallery = reviews.flatMap((review) =>
    review.photos.map((photo) => ({
      id: photo.id,
      caption: `${review.booking.request.title} — avis de ${displayName(review.author)}`,
    })),
  );

  return (
    <>
      <Header user={user} />
      <main id="contenu" className="container-page flex-1 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl">
          {isMe && (
            <p className="mb-4">
              <Link href="/profil" className="link">
                ← Modifier mon profil
              </Link>
            </p>
          )}

          <section className="bg-brand-700 shadow-pop rounded-3xl p-6 text-white sm:p-8" aria-labelledby="aidant">
            <div className="flex flex-wrap items-center gap-5">
              <span
                aria-hidden="true"
                className="font-display text-brand-700 bg-brand-100 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white text-4xl font-extrabold"
              >
                {helper.firstName.charAt(0)}
              </span>
              <div>
                <h1 id="aidant" className="text-4xl sm:text-5xl">
                  {name}
                </h1>
                <p className="text-brand-100 mt-1 text-lg">
                  {helper.neighborhood}, {helper.city} · membre depuis le {formatDate(helper.createdAt)}
                </p>
              </div>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-3">
              <span className="badge text-brand-900 bg-white">
                <span aria-hidden="true">{grade.icon}</span>
                {grade.name}
              </span>
              <span>
                <strong>{stats.completed}</strong> {stats.completed > 1 ? 'interventions effectuées' : 'intervention effectuée'}
              </span>
            </p>
            {helper.bio && <p className="mt-5 text-lg">{helper.bio}</p>}
            {helper.skills && (
              <p className="text-brand-100 mt-3">
                <strong className="text-white">Compétences :</strong> {helper.skills}
              </p>
            )}
          </section>

          {stats.average !== null && (
            <section className="card mt-6" aria-labelledby="notes">
              <h2 id="notes" className="text-2xl">
                Notes des voisins
              </h2>
              <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
                <p className="text-center">
                  <span className="font-display block text-6xl leading-none font-extrabold">{formatRating(stats.average)}</span>
                  <Stars value={stats.average} size="text-2xl" />
                  <span className="text-ink-soft block">
                    {stats.reviewCount} avis
                  </span>
                </p>
                <ul className="space-y-1.5" aria-label="Répartition des notes">
                  {distribution.map(({ stars, count }) => (
                    <li key={stars} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 font-bold">
                        {stars} <span aria-hidden="true">★</span>
                        <span className="sr-only">{stars > 1 ? 'étoiles' : 'étoile'} :</span>
                      </span>
                      <span className="bg-mute-bg h-3 flex-1 overflow-hidden rounded-full" aria-hidden="true">
                        <span
                          className="bg-brand-700 block h-full rounded-full"
                          style={{ width: `${(count / stats.reviewCount) * 100}%` }}
                        />
                      </span>
                      <span className="text-ink-soft w-16 shrink-0 text-right text-sm">
                        {count} <span className="sr-only">avis</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {topTags.length > 0 && (
                <div className="border-line mt-6 border-t pt-5">
                  <h3 className="mb-3 text-lg">Ce que les voisins ont apprécié</h3>
                  <ReviewTags tags={topTags.join(',')} counts={tagCounts} />
                </div>
              )}
            </section>
          )}

          {gallery.length > 0 && (
            <section className="card mt-6" aria-labelledby="photos">
              <h2 id="photos" className="text-2xl">
                Photos des interventions
              </h2>
              <p className="text-ink-soft mt-1 mb-4">Partagées par les voisins dans leurs avis.</p>
              <PhotoGallery photos={gallery} label={`Photos des interventions de ${name}`} size="lg" />
            </section>
          )}

          <section className="mt-8" aria-labelledby="avis">
            <h2 id="avis" className="text-2xl">
              {reviews.length > 0 ? `Tous les avis (${reviews.length})` : 'Avis'}
            </h2>
            {reviews.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="Pas encore d’avis">
                  <p>
                    Les avis apparaissent ici après chaque intervention effectuée. {helper.firstName} débute peut-être
                    sur Proxi’Clic !
                  </p>
                </EmptyState>
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="card">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Stars value={review.rating} />
                      <CategoryBadge category={review.booking.request.category} />
                    </div>
                    <p className="mt-3">
                      <strong>{displayName(review.author)}</strong>
                      <span className="text-ink-soft">
                        {' '}
                        · {review.author.neighborhood} · {formatRelative(review.createdAt)}
                      </span>
                    </p>
                    <p className="text-ink-soft text-sm">Pour : {review.booking.request.title}</p>
                    {review.comment && <blockquote className="mt-3 text-lg">« {review.comment} »</blockquote>}
                    {review.tags && (
                      <div className="mt-3">
                        <ReviewTags tags={review.tags} />
                      </div>
                    )}
                    {review.photos.length > 0 && (
                      <div className="mt-4">
                        <PhotoGallery photos={review.photos} label={`Photos de l’avis de ${displayName(review.author)}`} />
                      </div>
                    )}
                    {review.reply && (
                      <ReviewReply
                        title={`Réponse de ${helper.firstName}`}
                        reply={review.reply}
                        repliedAt={review.repliedAt}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!user && (
            <section className="bg-brand-100 mt-8 rounded-3xl p-6 text-center sm:p-8">
              <h2 className="text-2xl">Besoin d’un coup de main ?</h2>
              <p className="mx-auto mt-2 max-w-md">
                Créez un compte gratuit, publiez votre demande et recevez des propositions d’aidants de votre quartier.
              </p>
              <Link href="/inscription?role=client" className="btn btn-primary btn-lg mt-5">
                J’ai besoin d’aide <span aria-hidden="true">→</span>
              </Link>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
