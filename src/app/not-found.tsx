import Link from 'next/link';
import { LogoMark } from '@/components/Logo';

export default function NotFound() {
  return (
    <main id="contenu" className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center">
      <LogoMark size={64} />
      <h1 className="page-title mt-6">Page introuvable</h1>
      <p className="page-lead">Cette page n’existe pas ou n’est plus disponible.</p>
      <Link href="/" className="btn btn-primary btn-lg mt-8">
        Retour à l’accueil
      </Link>
    </main>
  );
}
