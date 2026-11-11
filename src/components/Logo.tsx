import Link from 'next/link';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

/**
 * Emblème Proxi'Tech : une maison dont le curseur de souris franchit le seuil.
 * Version vectorielle du logo officiel (public/logo.png), lisible en petite taille.
 */
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="11" fill="#FADADD" />
      {/* Maison : contour ouvert en bas à droite, cheminée à droite du toit */}
      <path
        d="M19.5 37.5h-4.5a4 4 0 0 1-4-4V21.2a4 4 0 0 1 1.4-3L22 9.6a3 3 0 0 1 4 0l9.6 8.6a4 4 0 0 1 1.4 3V27"
        fill="none"
        stroke="#8B0000"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32.8 10.5v5.5" fill="none" stroke="#8B0000" strokeWidth="4.2" strokeLinecap="round" />
      {/* Curseur */}
      <path
        d="M22.6 19.6v17.2l4.4-4 3.3 6.6 3.4-1.7-3.3-6.5h6z"
        fill="#8B0000"
        stroke="#8B0000"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 no-underline" aria-label={`${APP_NAME} — accueil`}>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="text-brand-700 font-display text-2xl font-extrabold tracking-tight">{APP_NAME}</span>
        <span className="text-brand-700 hidden text-sm sm:block">{APP_TAGLINE}</span>
      </span>
    </Link>
  );
}
