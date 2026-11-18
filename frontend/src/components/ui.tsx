import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ApiError } from '../api/client';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { Icon, IconName } from './icons';

export const Loader = () => (
  <div className="loader" role="status" aria-live="polite">
    <span className="spinner" aria-hidden="true" />
    Yuklanmoqda...
  </div>
);

export const Empty = ({ children = "Ma'lumot yo'q." }: { children?: ReactNode }) => (
  <div className="empty">
    <Icon name="inbox" size={26} />
    <span>{children}</span>
  </div>
);

export function ErrorBox({ error }: { error?: Error | null }) {
  if (!error) return null;
  return (
    <div className="error-box" role="alert">
      {error.message}
    </div>
  );
}

export function Query<T>({
  q,
  children,
}: {
  q: { data?: T; isLoading: boolean; error: Error | null };
  children: (data: T) => ReactNode;
}) {
  if (q.isLoading) return <Loader />;
  if (q.error) return <ErrorBox error={q.error} />;
  if (q.data === undefined) return null;
  return <>{children(q.data)}</>;
}

export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) => (
  <div className="page-header">
    <div className="page-title">
      <h1>{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </div>
);

export const Card = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={`card ${className}`.trim()}>
    {(title || actions) && (
      <header className="card-head">
        <div>
          {title && <h2>{title}</h2>}
          {subtitle && <p className="card-sub">{subtitle}</p>}
        </div>
        {actions && <div className="card-actions">{actions}</div>}
      </header>
    )}
    {children}
  </section>
);

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet';

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = 'primary',
  delta,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: IconName;
  tone?: Tone;
  delta?: { value: number; suffix?: string; label?: string };
}) {
  const up = delta ? delta.value >= 0 : true;
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-top">
        {icon && (
          <span className="stat-icon">
            <Icon name={icon} size={18} />
          </span>
        )}
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
      </div>
      {(hint || delta) && (
        <div className="stat-foot">
          {delta && (
            <span className={`delta ${up ? 'delta-up' : 'delta-down'}`}>
              <Icon name={up ? 'trendUp' : 'trendDown'} size={14} />
              {up ? '+' : ''}
              {delta.value}
              {delta.suffix ?? '%'}
            </span>
          )}
          {delta?.label && <span className="stat-hint">{delta.label}</span>}
          {hint && <div className="stat-hint">{hint}</div>}
        </div>
      )}
    </div>
  );
}

export const Badge = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) => (
  <span className={`badge badge-${tone}`}>{children}</span>
);

export const Progress = ({ value }: { value: number }) => (
  <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
    <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export function Button({
  variant = 'primary',
  loading,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; loading?: boolean }) {
  return (
    <button {...rest} type={type} className={`btn btn-${variant} ${loading ? 'is-loading' : ''} ${className}`.trim()} disabled={loading || rest.disabled}>
      {loading && <span className="spinner spinner-sm" aria-hidden="true" />}
      {loading ? 'Kuting...' : children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button {...rest} type={type} className={`icon-btn ${className}`.trim()} aria-label={label} title={label}>
      <Icon name={icon} size={19} />
    </button>
  );
}

export function Avatar({ name, fileId, size = 38, className = '' }: { name?: string | null; fileId?: string | null; size?: number; className?: string }) {
  const { url } = useBlobUrl(fileId);
  const initial = (name?.trim()[0] ?? 'U').toUpperCase();
  return (
    <span className={`avatar ${className}`.trim()} style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>
      {url ? <img src={url} alt="" draggable={false} /> : initial}
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  // onClose har renderda yangi funksiya bo'lishi mumkin; effekt faqat bir marta ishlashi kerak,
  // aks holda har harf yozilganda fokus oynaga qaytib, input "uzilib" qoladi.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);
  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal glass" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={box}>
        <header className="modal-head">
          <h2>{title}</h2>
          <IconButton icon="close" label="Yopish" onClick={onClose} />
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

const fieldMessage = (error: Error | null | undefined, name?: string) =>
  name && error instanceof ApiError ? error.fields?.[name] : undefined;

export function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name?: string;
  error?: Error | null;
  children: ReactNode;
}) {
  const message = fieldMessage(error, name);
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {message && <span className="field-error">{message}</span>}
    </label>
  );
}

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => <input className="input" {...props} />;
export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className="input" rows={4} {...props} />;
export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => <select className="input select" {...props} />;

export function FormError({ error }: { error?: Error | null }) {
  if (!error) return null;
  const fields = error instanceof ApiError ? error.fields : undefined;
  if (fields && Object.keys(fields).length) return null;
  return (
    <div className="error-box" role="alert">
      {error.message}
    </div>
  );
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Sahifalash tugmalari (Oldingi / Keyingi). Karta ichida jadvaldan keyin joylashadi. */
export function Pager({ page, onPage, hasNext }: { page: number; onPage: (p: number) => void; hasNext: boolean }) {
  return (
    <div className="pager">
      <Button variant="secondary" className="btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <Icon name="arrowLeft" size={16} /> Oldingi
      </Button>
      <span className="pager-info">{page}-sahifa</span>
      <Button variant="secondary" className="btn-sm" disabled={!hasNext} onClick={() => onPage(page + 1)}>
        Keyingi <Icon name="arrowRight" size={16} />
      </Button>
    </div>
  );
}
