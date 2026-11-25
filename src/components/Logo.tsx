import Link from 'next/link';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

/**
 * Emblème Proxi'Clic : une maison dont le curseur de souris franchit le seuil.
 * Version vectorielle du logo officiel (public/logo-proxiclic.png), lisible en petite taille.
 */
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="11" fill="#FDC1C1" />
      {/* Cheminée, dessinée sous le toit */}
      <rect x="32.2" y="10.6" width="5.5" height="9" rx="0.9" fill="#970C12" />
      {/* Maison : contour ouvert en bas, mur droit coupé net */}
      <path
        d="M18.3 37.9H14a4.5 4.5 0 0 1-4.5-4.5V22.4L24 9.7l14.5 12.5v9.4"
        fill="none"
        stroke="#970C12"
        strokeWidth="4.9"
        strokeLinejoin="round"
      />
      {/* Curseur */}
      <path
        d="M20.2 19.7l13.6 10-3.9 1.9 2.6 6.7-4.9 2.8-2.8-5.9-4.6 2.2z"
        fill="#970C12"
        stroke="#970C12"
        strokeWidth="1.4"
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
