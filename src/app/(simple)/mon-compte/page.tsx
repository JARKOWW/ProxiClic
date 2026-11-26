import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountSections } from '@/components/AccountSections';
import { SIMPLE_HOME } from '@/lib/auth';

export const metadata: Metadata = { title: 'Mon compte' };

/** Gestion du compte en affichage simplifié (l'affichage complet l'a dans « Mon profil »). */
export default function SimpleAccountPage() {
  return (
    <div className="space-y-2">
      <p>
        <Link href={SIMPLE_HOME} className="link">
          ← Retour à mon espace
        </Link>
      </p>
      <h1 className="page-title">Mon compte</h1>
      <AccountSections />
    </div>
  );
}
