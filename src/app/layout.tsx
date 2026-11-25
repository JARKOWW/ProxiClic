import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from 'next/font/google';
import { getCurrentUser, usesSimpleView } from '@/lib/auth';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import './globals.css';

// Police conçue par le Braille Institute pour une lisibilité maximale.
const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-atkinson',
  display: 'swap',
});

// Police de titres, plus expressive.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — ${APP_TAGLINE}`, template: `%s — ${APP_NAME}` },
  description:
    "Proxi'Tech met en relation des voisins : des jeunes à l'aise avec le numérique aident les seniors pour l'imprimante, le Wi-Fi, le smartphone et bien plus, directement à domicile.",
};

export const viewport: Viewport = { themeColor: '#8B0000' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Le rôle détermine la taille du texte (voir globals.css).
  const user = await getCurrentUser();

  return (
    <html
      lang="fr"
      data-role={user?.role}
      data-view={user && usesSimpleView(user) ? 'simple' : undefined}
      className={`${atkinson.variable} ${bricolage.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <a
          href="#contenu"
          className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
