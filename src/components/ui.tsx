import {
  BOOKING_STATUS_LABELS,
  CATEGORIES,
  REQUEST_STATUS_LABELS,
  type BookingStatus,
  type Category,
  type RequestStatus,
} from '@/lib/constants';

const TONES = {
  ok: 'bg-ok-bg text-ok-ink',
  warn: 'bg-warn-bg text-warn-ink',
  mute: 'bg-mute-bg text-mute-ink',
  brand: 'bg-brand-100 text-brand-900',
} as const;

const REQUEST_TONE: Record<RequestStatus, keyof typeof TONES> = {
  open: 'warn',
  booked: 'ok',
  done: 'mute',
  cancelled: 'mute',
};

const BOOKING_TONE: Record<BookingStatus, keyof typeof TONES> = {
  pending: 'warn',
  confirmed: 'ok',
  completed: 'mute',
  declined: 'mute',
  cancelled: 'mute',
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`badge ${TONES[REQUEST_TONE[status]]}`}>{REQUEST_STATUS_LABELS[status]}</span>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge ${TONES[BOOKING_TONE[status]]}`}>{BOOKING_STATUS_LABELS[status]}</span>;
}

export function CategoryBadge({ category }: { category: Category }) {
  const { label, icon } = CATEGORIES[category];
  return (
    <span className={`badge ${TONES.brand}`}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

const oneDecimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const formatRating = (value: number) => oneDecimal.format(value);

/** Note sur 5 sous forme d'étoiles, avec un équivalent textuel pour les lecteurs d'écran. */
export function Stars({ value, size = 'text-xl' }: { value: number; size?: string }) {
  const filled = Math.round(value);
  return (
    <span className={`inline-flex ${size} leading-none`} role="img" aria-label={`Note : ${formatRating(value)} sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} aria-hidden="true" className={star <= filled ? 'text-brand-700' : 'text-line-strong'}>
          {star <= filled ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

/** Grade d'un aidant (voir lib/grades.ts). */
export function GradeBadge({ grade }: { grade: { name: string; icon: string } }) {
  return (
    <span className={`badge ${TONES.brand}`}>
      <span aria-hidden="true">{grade.icon}</span>
      {grade.name}
    </span>
  );
}

/** Bandeau de confirmation ou d'erreur, annoncé par les lecteurs d'écran. */
export function Notice({ tone = 'ok', children }: { tone?: 'ok' | 'error' | 'info'; children: React.ReactNode }) {
  const styles = {
    ok: 'border-ok-ink bg-ok-bg text-ok-ink',
    error: 'border-brand-700 bg-brand-50 text-brand-900',
    info: 'border-brand-200 bg-brand-100 text-brand-900',
  }[tone];
  const icon = { ok: '✓', error: '!', info: 'i' }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border-l-8 p-4 font-bold ${styles}`}>
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-base"
      >
        {icon}
      </span>
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border-line-strong bg-brand-50 rounded-2xl border-2 border-dashed p-8 text-center">
      <h2 className="text-xl">{title}</h2>
      {children && <div className="text-ink-soft mx-auto mt-2 max-w-md">{children}</div>}
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  hint?: string;
  errors?: string[];
  optional?: boolean;
  multiline?: boolean;
  rows?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>;

/** Champ de formulaire accessible : libellé, aide et erreurs reliés au champ. */
export function Field({ label, name, hint, errors, optional, multiline, rows = 5, ...props }: FieldProps) {
  const hintId = hint ? `${name}-aide` : undefined;
  const errorId = errors?.length ? `${name}-erreur` : undefined;
  const shared = {
    id: name,
    name,
    className: 'input',
    'aria-invalid': errors?.length ? true : undefined,
    'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
  };

  return (
    <div>
      <label htmlFor={name} className="label">
        {label} {optional && <span className="text-ink-soft font-normal">(facultatif)</span>}
      </label>
      {hint && (
        <span id={hintId} className="hint">
          {hint}
        </span>
      )}
      {multiline ? (
        <textarea
          {...shared}
          rows={rows}
          required={props.required}
          maxLength={props.maxLength}
          placeholder={props.placeholder}
          defaultValue={props.defaultValue}
        />
      ) : (
        <input {...props} {...shared} />
      )}
      <FieldErrors id={errorId} errors={errors} />
    </div>
  );
}

export function FieldErrors({ id, errors }: { id?: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="field-error">
      <span aria-hidden="true">⚠</span>
      <span>{errors.join(' ')}</span>
    </p>
  );
}
