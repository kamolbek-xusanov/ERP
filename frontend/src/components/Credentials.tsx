import { useState } from 'react';
import { Icon } from './icons';

/** Login va parolni ko'rsatadi; parol yashirin, ko'z tugmasi bilan ochiladi, nusxa olish mumkin. */
export function Credential({ value, secret = false, empty }: { value?: string | null; secret?: boolean; empty?: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="muted">{empty ?? '-'}</span>;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* brauzer ruxsat bermadi */
    }
  };
  return (
    <span className="cred">
      <code>{secret && !shown ? '••••••••' : value}</code>
      {secret && (
        <button type="button" className="cred-btn" aria-label={shown ? 'Yashirish' : "Ko'rsatish"} title={shown ? 'Yashirish' : "Ko'rsatish"} onClick={() => setShown(!shown)}>
          <Icon name={shown ? 'eyeOff' : 'eye'} size={16} />
        </button>
      )}
      <button type="button" className="cred-btn" aria-label="Nusxa olish" title="Nusxa olish" onClick={copy}>
        <Icon name={copied ? 'check' : 'copy'} size={16} />
      </button>
    </span>
  );
}

export const csvEscape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function downloadCsv(name: string, rows: (string | number | null | undefined)[][]) {
  const text = '\ufeff' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
