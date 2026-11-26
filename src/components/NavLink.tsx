'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Émis par la fenêtre de discussion quand des messages viennent d'être lus. */
export const MESSAGES_READ_EVENT = 'proxiclic:messages-read';
const REFRESH_INTERVAL_MS = 10_000;

type Props = {
  href: string;
  /** Valeur initiale de la pastille, calculée par le serveur. */
  badge?: number;
  /** Si vrai, la pastille se met à jour toute seule (messages non lus). */
  live?: boolean;
  children: React.ReactNode;
};

export function NavLink({ href, badge = 0, live = false, children }: Props) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const [count, setCount] = useState(badge);

  // Le menu n'est pas recalculé par le serveur à chaque changement de page :
  // on redemande donc le compteur à chaque navigation, régulièrement, et dès qu'une conversation est lue.
  useEffect(() => {
    if (!live) return;
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch('/api/unread', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data: { count: number } = await res.json();
        if (!cancelled) setCount(data.count);
      } catch {
        // Coupure réseau passagère : on réessaiera au prochain tour.
      }
    }

    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, REFRESH_INTERVAL_MS);
    window.addEventListener(MESSAGES_READ_EVENT, refresh);
    window.addEventListener('focus', refresh);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(MESSAGES_READ_EVENT, refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [live, pathname]);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-12 items-center gap-2 rounded-full px-4 font-bold no-underline transition-colors ${
        active ? 'bg-brand-700 text-white' : 'text-ink hover:bg-brand-100'
      }`}
    >
      {children}
      {count > 0 && (
        <span
          className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm ${
            active ? 'text-brand-700 bg-white' : 'bg-brand-700 text-white'
          }`}
        >
          {count}
          <span className="sr-only"> {count > 1 ? 'messages non lus' : 'message non lu'}</span>
        </span>
      )}
    </Link>
  );
}
