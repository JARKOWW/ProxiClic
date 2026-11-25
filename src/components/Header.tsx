import Link from 'next/link';
import { logout } from '@/actions/auth';
import { setSimpleView } from '@/actions/profile';
import { SIMPLE_HOME, usesSimpleView, type SessionUser } from '@/lib/auth';
import { Logo, LogoMark } from './Logo';
import { NavLink } from './NavLink';
import { RoleSync } from './RoleSync';

type NavItem = { href: string; label: string; badge?: number; live?: boolean };

export function Header({ user, unread = 0 }: { user: SessionUser | null; unread?: number }) {
  const simple = user ? usesSimpleView(user) : false;
  const links: NavItem[] = !user
    ? []
    : simple
      ? [] // Affichage simplifié : tout est sur une page, le logo y ramène.
      : [
        user.role === 'helper'
          ? { href: '/demandes', label: 'Demandes' }
          : { href: '/mes-demandes', label: 'Mes demandes' },
        { href: '/rendez-vous', label: 'Rendez-vous' },
        { href: '/messages', label: 'Messages', badge: unread, live: true },
        { href: '/profil', label: 'Mon profil' },
      ];

  return (
    <header className="top-0 z-40 px-3 pt-3 sm:px-4 lg:sticky">
      <RoleSync role={user?.role ?? null} simple={simple} />
      <div className="border-line shadow-soft mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[2rem] border bg-white/95 px-4 py-2.5 backdrop-blur sm:px-5">
        <Logo href={simple ? SIMPLE_HOME : undefined} />

        {links.length > 0 ? (
          <nav aria-label="Navigation principale" className="order-3 w-full lg:order-none lg:w-auto">
            <ul className="flex flex-wrap gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <NavLink href={link.href} badge={link.badge} live={link.live}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {user ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-ink-soft hidden 2xl:inline">Bonjour, {user.firstName}</span>
            {user.role === 'client' && !simple && (
              <form action={setSimpleView.bind(null, true)}>
                <button type="submit" className="btn btn-secondary px-4 sm:px-6">
                  Affichage simplifié
                </button>
              </form>
            )}
            <form action={logout}>
              <button type="submit" className="btn btn-quiet px-4 sm:px-6">
                <span className="sm:hidden">Quitter</span>
                <span className="hidden sm:inline">Se déconnecter</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/connexion" className="btn btn-secondary">
              Se connecter
            </Link>
            <Link href="/inscription" className="btn btn-primary hidden sm:inline-flex">
              Créer un compte
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 px-3 pb-24 sm:px-4">
      <div className="bg-brand-900 text-brand-100 mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[2rem] px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <LogoMark size={44} />
          <p className="leading-tight">
            <strong className="font-display block text-xl text-white">Proxi&apos;Tech</strong>
            L&apos;informatique à domicile
          </p>
        </div>
        <div className="space-y-2 sm:text-right">
          <p>L&apos;entraide numérique entre voisins, tout simplement.</p>
          <p>
            <Link href="/accessibilite" className="font-bold text-white underline underline-offset-4">
              Accessibilité : non conforme
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
