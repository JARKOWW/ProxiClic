import { reportHref } from '@/lib/legal';

/** Lien « Signaler » par e-mail (avis, profil…). N'apparaît que si LEGAL_CONTACT_EMAIL est configuré. */
export function ReportLink({ subject, label = 'Signaler', className = '' }: { subject: string; label?: string; className?: string }) {
  const href = reportHref(subject);
  if (!href) return null;
  return (
    <a href={href} className={`text-sm underline underline-offset-4 ${className}`}>
      <span aria-hidden="true">⚑ </span>
      {label}
    </a>
  );
}
