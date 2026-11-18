const TZ = 'Asia/Tashkent';

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

/** Toshkent vaqti bo'yicha sana qismlari (brauzer tiliga bog'liq bo'lmagan, doim o'zbekcha oy nomlari). */
function parts(value: string) {
  const out: Record<string, string> = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date(value))
    .forEach((p) => {
      out[p.type] = p.value;
    });
  return { day: out.day, month: MONTHS[Number(out.month) - 1], year: out.year, hour: out.hour === '24' ? '00' : out.hour, minute: out.minute };
}

export const fmtDate = (value?: string | null) => {
  if (!value) return '';
  const p = parts(value);
  return `${p.day} ${p.month} ${p.year}`;
};

export const fmtDateTime = (value?: string | null) => {
  if (!value) return '';
  const p = parts(value);
  return `${p.day} ${p.month}, ${p.hour}:${p.minute}`;
};

export const fmtMoney = (value: number) => `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;

export const fmtSize = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export const HW_LABEL: Record<string, string> = {
  done: 'Bajarilgan',
  pending: 'Kutilmoqda',
  returned: 'Qaytarilgan',
  'not-done': 'Bajarilmagan',
  'not-assigned': 'Berilmagan',
};

export const EXAM_LABEL: Record<string, string> = {
  done: 'Topshirilgan',
  ready: 'Ruxsat bor',
  blocked: 'Ruxsat yo\'q',
};

export const DAY_LABEL: Record<string, string> = {
  MON: 'Dushanba',
  TUE: 'Seshanba',
  WED: 'Chorshanba',
  THU: 'Payshanba',
  FRI: 'Juma',
  SAT: 'Shanba',
  SUN: 'Yakshanba',
};

export const DAY_SHORT: Record<string, string> = {
  MON: 'Du',
  TUE: 'Se',
  WED: 'Ch',
  THU: 'Pa',
  FRI: 'Ju',
  SAT: 'Sh',
  SUN: 'Ya',
};

export const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const scheduleText = (schedule: { day: string; start: string; end: string; room?: string | null; roomName?: string | null }[]) =>
  schedule.map((s) => `${DAY_SHORT[s.day]} ${s.start}-${s.end} ${s.room ?? s.roomName ?? 'onlayn'}`).join(', ');

export const formValues = (form: HTMLFormElement): Record<string, string> => {
  const out: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    if (typeof v === 'string') out[k] = v;
  });
  return out;
};

/** Toshkent vaqti bo'yicha salomlashish. */
export function greeting(fullName?: string | null, now: Date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(now)) % 24;
  const word = hour < 5 ? 'Xayrli tun' : hour < 12 ? 'Xayrli tong' : hour < 18 ? 'Xayrli kun' : 'Xayrli kech';
  const first = fullName?.trim().split(/\s+/)[0];
  return first ? `${word}, ${first}` : word;
}

export const fmtShortDate = (value?: string | null) => {
  if (!value) return '';
  const p = parts(value);
  return `${Number(p.day)} ${p.month}`;
};

export const fmtMonth = (value?: string | null) => (value ? parts(value).month : '');
