import type { Metadata } from 'next';
import { RegisterForm } from '@/components/AuthForms';
import { ROLES, type Role } from '@/lib/constants';

export const metadata: Metadata = { title: 'Créer un compte' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const defaultRole = (ROLES as readonly string[]).includes(role ?? '') ? (role as Role) : undefined;

  return (
    <>
      <h1 className="page-title">Créer un compte</h1>
      <p className="page-lead">L’inscription est gratuite et ne prend que quelques minutes.</p>
      <div className="card mt-8">
        <RegisterForm defaultRole={defaultRole} />
      </div>
    </>
  );
}
