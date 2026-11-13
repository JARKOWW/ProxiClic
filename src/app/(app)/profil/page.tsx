import type { Metadata } from 'next';
import Link from 'next/link';
import { ProfileForm } from '@/components/ProfileForm';
import { formatRating, Stars } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { ROLE_NAMES } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { gradeFor, nextGrade } from '@/lib/grades';
import { helperStats } from '@/lib/stats';

export const metadata: Metadata = { title: 'Mon profil' };

export default async function ProfilePage() {
  const user = await requireUser();
  const stats = user.role === 'helper' ? await helperStats(user.id) : null;
  const grade = stats ? gradeFor(stats.completed) : null;
  const next = stats ? nextGrade(stats.completed) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="page-title">Mon profil</h1>
      <p className="page-lead">
        Les autres membres voient uniquement votre prénom, l’initiale de votre nom, votre quartier et votre
        présentation.
      </p>

      <dl className="bg-brand-100 mt-6 grid gap-x-6 gap-y-2 rounded-2xl p-5 sm:grid-cols-3">
        <div>
          <dt className="text-ink-soft text-sm">Type de compte</dt>
          <dd className="font-bold">{ROLE_NAMES[user.role]}</dd>
        </div>
        <div>
          <dt className="text-ink-soft text-sm">Adresse e-mail</dt>
          <dd className="font-bold break-all">{user.email}</dd>
        </div>
        <div>
          <dt className="text-ink-soft text-sm">Membre depuis le</dt>
          <dd className="font-bold">{formatDate(user.createdAt)}</dd>
        </div>
      </dl>

      {stats && grade && (
        <section className="card mt-6" aria-labelledby="grade">
          <h2 id="grade" className="text-xl">
            Votre grade
          </h2>
          <p className="mt-3 flex items-center gap-3 text-2xl font-bold">
            <span aria-hidden="true" className="text-4xl">
              {grade.icon}
            </span>
            {grade.name}
          </p>
          <p className="mt-3">
            <strong>{stats.completed}</strong> {stats.completed > 1 ? 'interventions effectuées' : 'intervention effectuée'}
            {stats.average !== null && (
              <>
                {' · '}
                <Stars value={stats.average} /> <strong>{formatRating(stats.average)}</strong> ({stats.reviewCount} avis)
              </>
            )}
          </p>
          <p className="text-ink-soft mt-2">
            {next
              ? `Encore ${next.remaining} ${next.remaining > 1 ? 'interventions' : 'intervention'} pour devenir « ${next.grade.name} » ${next.grade.icon}`
              : 'Vous avez atteint le plus haut grade. Bravo et merci !'}
          </p>
          <p className="mt-4">
            <Link href={`/aidants/${user.id}`} className="btn btn-secondary">
              Voir mon profil public et mes avis
            </Link>
          </p>
        </section>
      )}

      <div className="card mt-6">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
