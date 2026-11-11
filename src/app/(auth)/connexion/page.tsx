import type { Metadata } from 'next';
import { LoginForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Connexion' };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="page-title">Connexion</h1>
      <p className="page-lead">Heureux de vous revoir ! Saisissez vos identifiants pour retrouver votre espace.</p>
      <div className="card mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
