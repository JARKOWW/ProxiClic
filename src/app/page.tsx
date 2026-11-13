import Image from 'next/image';
import Link from 'next/link';
import { Footer, Header } from '@/components/Header';
import { PhotoGallery } from '@/components/PhotoGallery';
import { formatRating, ReviewTags, Stars } from '@/components/ui';
import { getCurrentUser, homeFor } from '@/lib/auth';
import { CATEGORIES, CATEGORY_KEYS } from '@/lib/constants';
import { displayName, formatRelative } from '@/lib/format';
import { GRADES, gradeFor } from '@/lib/grades';
import { communityStats, latestOpenRequests, latestReviews, topHelpers } from '@/lib/stats';

// Les chiffres, avis et classements viennent de la base : la page est toujours rendue à la demande.
export const dynamic = 'force-dynamic';

const STEPS = [
  {
    title: 'Décrivez votre besoin',
    text: 'Imprimante à installer, Wi-Fi capricieux, téléphone à apprivoiser… Publiez votre demande en deux minutes.',
  },
  {
    title: 'Un voisin vous répond',
    text: 'Un aidant de votre quartier vous propose un créneau. Vous échangez par messages pour préciser les détails.',
  },
  {
    title: 'Il vient chez vous',
    text: 'Au jour convenu, votre voisin passe à domicile et prend le temps de tout vous expliquer.',
  },
];

const FAQ = [
  {
    question: 'Faut-il être à l’aise avec l’informatique pour s’inscrire ?',
    answer:
      'Non. Le site est écrit en gros caractères, avec de grands boutons et des explications simples. Si vous savez lire un e-mail, vous saurez publier une demande. Un proche peut aussi vous aider à créer votre compte.',
  },
  {
    question: 'Qui sont les aidants ?',
    answer:
      'Des habitants de votre ville : lycéens, étudiants, jeunes actifs… Chacun a un profil avec son quartier, ses compétences, son grade et les avis laissés par les voisins qu’il a déjà aidés.',
  },
  {
    question: 'Mes informations personnelles sont-elles protégées ?',
    answer:
      'Oui. Les autres membres ne voient que votre prénom, l’initiale de votre nom et votre quartier. Votre numéro de téléphone n’est communiqué qu’à la personne avec qui un rendez-vous est confirmé, et votre adresse n’est jamais affichée.',
  },
  {
    question: 'Comment choisir entre plusieurs propositions ?',
    answer:
      'Pour chaque proposition, vous voyez le créneau proposé, la présentation de l’aidant, son grade et sa note moyenne. Vous pouvez lui écrire avant d’accepter. Les autres propositions sont alors refusées automatiquement.',
  },
  {
    question: 'Que se passe-t-il après la visite ?',
    answer:
      'Vous indiquez que l’intervention a eu lieu, puis vous pouvez laisser une note de 1 à 5 étoiles et un petit mot. Vos avis aident les autres voisins à choisir et font progresser l’aidant dans les grades.',
  },
];

const SAFETY_TIPS = [
  'Ne communiquez jamais vos mots de passe ni vos codes bancaires, même à un aidant.',
  'Restez à côté de l’aidant pendant l’intervention : c’est aussi le meilleur moyen d’apprendre.',
  'Échangez d’abord par la messagerie du site pour faire connaissance.',
  'En cas de doute, demandez à un proche d’être présent lors de la première visite.',
];

export default async function HomePage() {
  const [user, stats, helpers, reviews, openRequests] = await Promise.all([
    getCurrentUser(),
    communityStats(),
    topHelpers(3),
    latestReviews(6),
    latestOpenRequests(3),
  ]);

  const figures = [
    { value: String(stats.members), label: stats.members > 1 ? 'voisins inscrits' : 'voisin inscrit' },
    { value: String(stats.completed), label: stats.completed > 1 ? 'coups de main réalisés' : 'coup de main réalisé' },
    {
      value: stats.average === null ? '—' : `${formatRating(stats.average)} / 5`,
      label: stats.reviewCount > 0 ? `note moyenne sur ${stats.reviewCount} avis` : 'note moyenne',
    },
    { value: String(stats.neighborhoods), label: stats.neighborhoods > 1 ? 'quartiers couverts' : 'quartier couvert' },
  ];

  const topHelper = helpers[0];
  const figureStyles = [
    'bg-brand-700 text-white',
    'bg-brand-100 text-brand-900',
    'bg-ink text-white',
    'border-line border bg-white text-ink',
  ];

  return (
    <>
      <Header user={user} />
      <main id="contenu" className="flex-1 overflow-x-clip">
        {/* Accroche */}
        <section className="container-page grid items-center gap-12 pt-12 pb-16 md:grid-cols-[11fr_9fr] md:pt-16 md:pb-20">
          <div>
            <p className="eyebrow">
              <span aria-hidden="true">👋</span> L’informatique à domicile
            </p>
            <h1 className="mt-5 text-5xl font-extrabold sm:text-6xl">
              Un <span className="marker">voisin</span> vient vous aider avec vos{' '}
              <span className="text-brand-700">appareils</span>.
            </h1>
            <p className="text-ink-soft mt-6 max-w-xl text-xl">
              Proxi’Tech met en relation les habitants d’un même quartier : des jeunes à l’aise avec le numérique donnent
              un coup de main à ceux qui en ont besoin, directement à la maison.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Link href={homeFor(user.role)} className="btn btn-primary btn-lg">
                  Accéder à mon espace <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <>
                  <Link href="/inscription?role=client" className="btn btn-primary btn-lg">
                    J’ai besoin d’aide <span aria-hidden="true">→</span>
                  </Link>
                  <Link href="/inscription?role=helper" className="btn btn-secondary btn-lg">
                    Je propose mon aide
                  </Link>
                </>
              )}
            </div>
            {stats.average !== null && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex -space-x-3" aria-hidden="true">
                  {helpers.map((helper, index) => (
                    <span
                      key={helper.id}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-lg font-bold ${
                        ['bg-brand-700 text-white', 'bg-brand-200 text-brand-900', 'bg-ink text-white'][index % 3]
                      }`}
                    >
                      {helper.firstName.charAt(0)}
                    </span>
                  ))}
                </div>
                <p className="leading-snug">
                  <span className="flex items-center gap-2">
                    <Stars value={stats.average} />
                    <strong>{formatRating(stats.average)} sur 5</strong>
                  </span>
                  <span className="text-ink-soft">d’après {stats.reviewCount} avis de voisins</span>
                </p>
              </div>
            )}
          </div>

          {/* Visuel : logo encadré et pastilles flottantes (données réelles) */}
          <div className="relative mx-auto w-full max-w-md px-4 pt-4 pb-10 md:px-0">
            <div aria-hidden="true" className="bg-brand-700 absolute inset-x-8 top-10 bottom-4 rotate-6 rounded-[3rem]" />
            <div aria-hidden="true" className="bg-brand-200 absolute -top-2 -right-2 h-24 w-24 rounded-full" />
            <Image
              src="/logo.png"
              alt=""
              width={512}
              height={512}
              priority
              className="shadow-soft relative w-full -rotate-2 rounded-[3rem] border-8 border-white"
            />
            {stats.completed > 0 && (
              <p className="sticker absolute top-10 -left-2 -rotate-3 md:-left-10">
                <span aria-hidden="true" className="bg-ok-bg flex h-11 w-11 items-center justify-center rounded-full text-xl">
                  ✓
                </span>
                <span className="leading-tight">
                  <span className="font-display block text-2xl">{stats.completed}</span>
                  <span className="text-ink-soft text-sm font-normal">coups de main réalisés</span>
                </span>
              </p>
            )}
            {topHelper && (
              <p className="sticker absolute right-0 bottom-0 rotate-2 md:-right-6">
                <span aria-hidden="true" className="bg-brand-100 flex h-11 w-11 items-center justify-center rounded-full text-xl">
                  {gradeFor(topHelper.stats.completed).icon}
                </span>
                <span className="leading-tight">
                  <span className="block">{displayName(topHelper)}</span>
                  <span className="text-ink-soft text-sm font-normal">{gradeFor(topHelper.stats.completed).name}</span>
                </span>
              </p>
            )}
          </div>
        </section>

        {/* Chiffres clés */}
        <section aria-labelledby="chiffres" className="container-page">
          <h2 id="chiffres" className="sr-only">
            Proxi’Tech en chiffres
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {figures.map((figure, index) => (
              <div key={figure.label} className={`lift flex flex-col-reverse rounded-3xl p-5 sm:p-6 ${figureStyles[index % 4]}`}>
                <dt className="mt-1 opacity-90">{figure.label}</dt>
                <dd className="font-display text-4xl font-extrabold sm:text-5xl">{figure.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Sujets */}
        <section className="container-page py-20 text-center" aria-labelledby="sujets">
          <p className="eyebrow">Les sujets</p>
          <h2 id="sujets" className="section-title">
            Pour quoi peut-on <span className="marker">demander de l’aide</span> ?
          </h2>
          <p className="page-lead mx-auto">Tous les petits tracas numériques du quotidien, sans jargon.</p>
          <ul className="mt-10 flex flex-wrap justify-center gap-3">
            {CATEGORY_KEYS.map((key, index) => (
              <li
                key={key}
                className={`lift shadow-soft flex min-h-14 items-center gap-3 rounded-full py-2 pr-6 pl-2 text-lg font-bold ${
                  index % 3 === 0 ? 'bg-brand-700 text-white' : index % 3 === 1 ? 'bg-white' : 'bg-brand-100 text-brand-900'
                }`}
              >
                <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl">
                  {CATEGORIES[key].icon}
                </span>
                {CATEGORIES[key].label}
              </li>
            ))}
          </ul>
        </section>

        {/* Étapes */}
        <section className="px-3 sm:px-4" aria-labelledby="etapes">
          <div className="bg-brand-100 mx-auto max-w-6xl rounded-[2.5rem] px-4 py-16 sm:px-10">
            <div className="mx-auto max-w-5xl">
              <p className="eyebrow bg-white">En 3 étapes</p>
              <h2 id="etapes" className="section-title">
                Comment ça marche ?
              </h2>
              <ol className="mt-10 grid gap-5 md:grid-cols-3">
                {STEPS.map((step, index) => (
                  <li key={step.title} className={`lift card border-0 ${index === 1 ? 'md:translate-y-6' : ''}`}>
                    <span aria-hidden="true" className="font-display text-brand-200 text-7xl leading-none font-extrabold">
                      0{index + 1}
                    </span>
                    <h3 className="mt-3 text-2xl">{step.title}</h3>
                    <p className="text-ink-soft mt-2">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Aidants à l'honneur */}
        {helpers.length > 0 && (
          <section className="container-page py-20" aria-labelledby="aidants">
            <p className="eyebrow">
              <span aria-hidden="true">🏅</span> Le podium
            </p>
            <h2 id="aidants" className="section-title">
              Les aidants <span className="marker">à l’honneur</span>
            </h2>
            <p className="page-lead">Ceux qui ont rendu le plus de services à leurs voisins.</p>
            <ol className="mt-12 grid gap-x-5 gap-y-14 md:grid-cols-3">
              {helpers.map((helper, index) => (
                <li
                  key={helper.id}
                  className={`lift relative flex flex-col rounded-3xl p-6 pt-14 ${
                    index === 0 ? 'bg-brand-700 shadow-pop text-white' : 'border-line shadow-soft border bg-white'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`font-display absolute -top-10 left-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-3xl font-extrabold ${
                      index === 0 ? 'text-brand-700 bg-brand-100' : 'bg-brand-700 text-white'
                    }`}
                  >
                    {helper.firstName.charAt(0)}
                  </span>
                  <span
                    className={`font-display absolute top-4 right-5 text-5xl leading-none font-extrabold ${
                      index === 0 ? 'text-brand-200' : 'text-brand-200'
                    }`}
                  >
                    <span className="sr-only">Numéro </span>#{index + 1}
                  </span>
                  <h3 className="text-2xl">{displayName(helper)}</h3>
                  <p className={index === 0 ? 'text-brand-100' : 'text-ink-soft'}>
                    {helper.neighborhood}, {helper.city}
                  </p>
                  <p className="mt-4">
                    <span className={`badge ${index === 0 ? 'text-brand-900 bg-white' : 'bg-brand-100 text-brand-900'}`}>
                      <span aria-hidden="true">{gradeFor(helper.stats.completed).icon}</span>
                      {gradeFor(helper.stats.completed).name}
                    </span>
                  </p>
                  <p className="mt-3 flex flex-wrap items-center gap-2">
                    {helper.stats.average !== null && (
                      <span
                        className={`badge ${index === 0 ? 'bg-brand-900 text-white' : 'bg-warn-bg text-warn-ink'}`}
                        role="img"
                        aria-label={`Note : ${formatRating(helper.stats.average)} sur 5`}
                      >
                        ★ {formatRating(helper.stats.average)}
                      </span>
                    )}
                    <span>
                      <strong>{helper.stats.completed}</strong>{' '}
                      {helper.stats.completed > 1 ? 'interventions' : 'intervention'}
                    </span>
                  </p>
                  {helper.bio && <p className="mt-4 flex-1">{helper.bio}</p>}
                  {helper.skills && (
                    <p className={`mt-4 text-sm ${index === 0 ? 'text-brand-100' : 'text-ink-soft'}`}>{helper.skills}</p>
                  )}
                  <p className="mt-5">
                    <Link
                      href={`/aidants/${helper.id}`}
                      className={`font-bold underline underline-offset-4 ${index === 0 ? 'text-white' : 'text-brand-700 hover:text-brand-900'}`}
                    >
                      Voir le profil et les avis<span className="sr-only"> de {displayName(helper)}</span>{' '}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Grades */}
        <section className="px-3 sm:px-4" aria-labelledby="grades">
          <div className="bg-ink mx-auto max-w-6xl rounded-[2.5rem] px-4 py-16 text-white sm:px-10">
            <div className="mx-auto max-w-5xl">
              <p className="eyebrow">Progression</p>
              <h2 id="grades" className="section-title">
                Les grades Proxi’Tech
              </h2>
              <p className="text-brand-100 mt-2 max-w-2xl text-lg">
                Chaque coup de main compte : plus un aidant rend service, plus il monte en grade.
              </p>
              <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {GRADES.map((grade, index) => (
                  <li
                    key={grade.name}
                    className={`lift flex flex-col rounded-3xl p-5 ${
                      index === GRADES.length - 1 ? 'bg-brand-700 text-white' : 'text-ink bg-white'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span aria-hidden="true" className="text-5xl">
                        {grade.icon}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`font-display text-3xl font-extrabold ${index === GRADES.length - 1 ? 'text-brand-200' : 'text-brand-200'}`}
                      >
                        {index + 1}
                      </span>
                    </span>
                    <h3 className="mt-4 text-xl">{grade.name}</h3>
                    <p className={`mt-1 text-sm ${index === GRADES.length - 1 ? 'text-brand-100' : 'text-ink-soft'}`}>
                      {grade.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Avis */}
        {reviews.length > 0 && (
          <section className="container-page py-20" aria-labelledby="avis">
            <p className="eyebrow">
              <span aria-hidden="true">💬</span> Avis
            </p>
            <h2 id="avis" className="section-title">
              Ce que disent <span className="marker">les voisins</span>
            </h2>
            <p className="page-lead">Les avis sont laissés par les demandeurs après chaque intervention.</p>
            <ul className="mt-10 gap-5 space-y-5 md:columns-2 lg:columns-3">
              {reviews.map((review, index) => {
                const featured = index === 0;
                return (
                  <li
                    key={review.id}
                    className={`lift relative break-inside-avoid rounded-3xl p-6 ${
                      featured ? 'bg-brand-700 shadow-pop text-white' : 'border-line shadow-soft border bg-white'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`font-display absolute top-2 right-5 text-8xl leading-none ${featured ? 'text-brand-600' : 'text-brand-100'}`}
                    >
                      ”
                    </span>
                    <span
                      className={`badge relative ${featured ? 'text-brand-900 bg-white' : 'bg-warn-bg text-warn-ink'}`}
                      role="img"
                      aria-label={`Note : ${review.rating} sur 5`}
                    >
                      {'★'.repeat(review.rating)}
                      <span className="opacity-40">{'★'.repeat(5 - review.rating)}</span>
                    </span>
                    <blockquote className="relative mt-4 text-lg">{review.comment}</blockquote>
                    {review.tags && (
                      <div className="relative mt-4">
                        <ReviewTags tags={review.tags} onDark={featured} />
                      </div>
                    )}
                    {review.photos.length > 0 && (
                      <div className="relative mt-4">
                        <PhotoGallery photos={review.photos} label={`Photos de l’avis de ${displayName(review.author)}`} />
                      </div>
                    )}
                    <div className="mt-5 flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                          featured ? 'text-brand-700 bg-white' : 'bg-brand-100 text-brand-700'
                        }`}
                      >
                        {review.author.firstName.charAt(0)}
                      </span>
                      <p className="leading-snug">
                        <strong>{displayName(review.author)}</strong>
                        <span className={featured ? 'text-brand-100' : 'text-ink-soft'}> · {review.author.neighborhood}</span>
                        <span className={`block text-sm ${featured ? 'text-brand-100' : 'text-ink-soft'}`}>
                          Aidé(e) par{' '}
                          <Link href={`/aidants/${review.helper.id}`} className="font-bold underline underline-offset-4">
                            {displayName(review.helper)}
                          </Link>
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Demandes récentes */}
        {openRequests.length > 0 && (
          <section className="px-3 sm:px-4" aria-labelledby="recentes">
            <div className="bg-brand-100 mx-auto max-w-6xl rounded-[2.5rem] px-4 py-16 sm:px-10">
              <div className="mx-auto max-w-5xl">
                <p className="eyebrow bg-white">
                  <span aria-hidden="true" className="bg-brand-700 h-2.5 w-2.5 rounded-full" /> En direct
                </p>
                <h2 id="recentes" className="section-title">
                  En ce moment dans les quartiers
                </h2>
                <p className="page-lead text-ink">Des voisins attendent un coup de main. Et si c’était vous ?</p>
                <ul className="mt-10 grid gap-5 md:grid-cols-3">
                  {openRequests.map((request) => (
                    <li key={request.id} className="lift card flex flex-col border-0">
                      <span aria-hidden="true" className="bg-brand-100 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl">
                        {CATEGORIES[request.category].icon}
                      </span>
                      <p className="text-brand-700 mt-4 text-sm font-bold tracking-wide uppercase">
                        {CATEGORIES[request.category].label}
                      </p>
                      <h3 className="mt-1 flex-1 text-xl">{request.title}</h3>
                      <p className="text-ink-soft border-line mt-4 border-t pt-3">
                        <span aria-hidden="true">📍 </span>
                        {request.neighborhood}, {request.city} · {formatRelative(request.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
                {(!user || user.role === 'helper') && (
                  <Link href={user ? '/demandes' : '/inscription?role=helper'} className="btn btn-primary btn-lg mt-10">
                    {user ? 'Voir toutes les demandes' : 'Devenir aidant pour y répondre'} <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Questions fréquentes et conseils */}
        <section className="container-page grid gap-10 py-20 lg:grid-cols-[3fr_2fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="section-title">Questions fréquentes</h2>
            <div className="mt-8 space-y-3">
              {FAQ.map((item) => (
                <details key={item.question} className="group border-line shadow-soft open:border-brand-700 rounded-3xl border bg-white">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-6 py-3 text-lg font-bold [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="bg-brand-100 text-brand-700 group-open:bg-brand-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none transition-transform group-open:rotate-45 group-open:text-white"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-ink-soft px-6 pb-6">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <aside aria-labelledby="conseils" className="bg-brand-700 shadow-pop self-start rounded-3xl p-7 text-white lg:mt-24 lg:rotate-1">
            <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl">
              🔒
            </span>
            <h2 id="conseils" className="mt-4 text-3xl">
              Nos conseils de prudence
            </h2>
            <ul className="mt-5 space-y-4">
              {SAFETY_TIPS.map((tip) => (
                <li key={tip} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="text-brand-700 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-bold"
                  >
                    ✓
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {/* Appel à l'action */}
        {!user && (
          <section className="px-3 sm:px-4" aria-labelledby="rejoindre">
            <div className="bg-brand-700 relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center text-white sm:px-10">
              <div aria-hidden="true" className="bg-brand-600 absolute -top-16 -left-16 h-56 w-56 rounded-full" />
              <div aria-hidden="true" className="bg-brand-800 absolute -right-10 -bottom-20 h-64 w-64 rounded-full" />
              <div className="relative">
                <h2 id="rejoindre" className="mx-auto max-w-3xl text-4xl font-extrabold sm:text-5xl">
                  Rejoignez l’entraide numérique de votre quartier
                </h2>
                <p className="text-brand-100 mx-auto mt-4 max-w-2xl text-lg">
                  Que vous ayez besoin d’un coup de main ou envie d’en donner un, l’inscription ne prend que quelques
                  minutes.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/inscription?role=client" className="btn btn-lg text-brand-700 hover:bg-brand-100 bg-white">
                    J’ai besoin d’aide <span aria-hidden="true">→</span>
                  </Link>
                  <Link href="/inscription?role=helper" className="btn btn-lg hover:text-brand-700 border-white text-white hover:bg-white">
                    Je propose mon aide
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
