import { UnprocessableEntityException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DAYS, Day, MONTHS_UZ } from './enums';

const OFFSET_MS = 5 * 3600000;

export const LOGIN_RE = /^[a-z0-9._-]{4,30}$/;
export const PHONE_RE = /^\+998[ -]?\d{2}[ -]?\d{3}[ -]?\d{2}[ -]?\d{2}$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const URL_RE = /^https?:\/\/\S+$/;

const shift = (d: Date) => new Date(d.getTime() + OFFSET_MS);

export const dateKey = (d: Date): string => shift(d).toISOString().slice(0, 10);
export const timeKey = (d: Date): string => shift(d).toISOString().slice(11, 16);
export const todayKey = (): string => dateKey(new Date());
export const dayOf = (d: Date): Day => DAYS[(shift(d).getUTCDay() + 6) % 7];
export const atTashkent = (key: string, time = '00:00'): Date => new Date(`${key}T${time}:00+05:00`);
export const addHours = (d: Date, hours: number): Date => new Date(d.getTime() + hours * 3600000);
export const addDays = (key: string, n: number): string => dateKey(new Date(atTashkent(key).getTime() + n * 86400000));
export const diffDays = (from: string, to: string): number =>
  Math.round((atTashkent(to).getTime() - atTashkent(from).getTime()) / 86400000);
export const mondayKey = (d: Date): string => addDays(dateKey(d), -DAYS.indexOf(dayOf(d)));
export const endTime = (start: string, hours = 2): string => {
  const h = Number(start.slice(0, 2)) + hours;
  return `${String(h).padStart(2, '0')}:${start.slice(3, 5)}`;
};

export const fieldError = (field: string, message: string) =>
  new UnprocessableEntityException({ message, fields: { [field]: message } });

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, 12);
export const verifyPassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash);

export const normalizePhone = (raw: string): string | null => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!/^998\d{9}$/.test(digits)) return null;
  return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
};

export const isValidFullName = (name: string): boolean => {
  const clean = (name || '').trim();
  return clean.length >= 5 && clean.split(/\s+/).length >= 2;
};

export const formatMoney = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const dueLabel = (key: string): string => {
  const [, m, d] = key.split('-');
  return `${Number(d)}-${MONTHS_UZ[Number(m) - 1]}`;
};

export const average = (values: number[]): number | null =>
  values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;

export const parsePage = (page?: string, limit?: string) => {
  const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const l = Math.min(1000, Math.max(1, parseInt(limit ?? '50', 10) || 50));
  return { page: p, limit: l, skip: (p - 1) * l };
};

export const monthRange = (month?: string) => {
  const valid = month && /^\d{4}-\d{2}$/.test(month) ? month : todayKey().slice(0, 7);
  const [y, m] = valid.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return {
    month: valid,
    from: atTashkent(`${valid}-01`),
    to: atTashkent(`${next}-01`),
    daysInMonth: diffDays(`${valid}-01`, `${next}-01`),
  };
};
