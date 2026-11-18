import { IconName } from '../components/icons';
import { Role } from '../api/types';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  /** Yuqoridagi tablarda ko'rinadimi */
  tab?: boolean;
}

export const studentNav: NavItem[] = [
  { to: '/', label: 'Bosh sahifa', icon: 'home', end: true, tab: true },
  { to: '/groups', label: 'Guruhlarim', icon: 'groups' },
  { to: '/lessons', label: 'Darslar', icon: 'lessons', tab: true },
  { to: '/leaderboard', label: 'Reyting', icon: 'trophy', tab: true },
  { to: '/calendar', label: 'Kalendar', icon: 'calendar', tab: true },
  { to: '/analytics', label: 'Tahlil', icon: 'chart' },
  { to: '/payments', label: "To'lovlar", icon: 'wallet' },
  { to: '/career', label: 'Karyera', icon: 'briefcase' },
  { to: '/guides', label: "Qo'llanma", icon: 'book' },
  { to: '/settings', label: 'Sozlamalar', icon: 'settings' },
];

export const teacherNav: NavItem[] = [
  { to: '/teacher', label: 'Bosh sahifa', icon: 'home', end: true, tab: true },
  { to: '/teacher/groups', label: 'Guruhlar', icon: 'groups' },
  { to: '/teacher/lessons', label: 'Darslar', icon: 'lessons', tab: true },
  { to: '/teacher/lessons/new', label: 'Dars boshlash', icon: 'plus' },
  { to: '/teacher/journal', label: 'Jurnal', icon: 'journal', tab: true },
  { to: '/teacher/review', label: 'Tekshirish', icon: 'review', tab: true },
  { to: '/teacher/settings', label: 'Sozlamalar', icon: 'settings' },
];

export const adminNav: NavItem[] = [
  { to: '/admin', label: 'Bosh sahifa', icon: 'home', end: true, tab: true },
  { to: '/admin/students', label: "O'quvchilar", icon: 'student', tab: true },
  { to: '/admin/teachers', label: 'Ustozlar', icon: 'teacher' },
  { to: '/admin/groups', label: 'Guruhlar', icon: 'groups', tab: true },
  { to: '/admin/rooms', label: 'Xonalar', icon: 'door' },
  { to: '/admin/payments', label: "To'lovlar", icon: 'receipt', tab: true },
  { to: '/admin/audit', label: 'Jurnal', icon: 'shield' },
  { to: '/admin/settings', label: 'Sozlamalar', icon: 'settings' },
];

export const NAV: Record<Role, NavItem[]> = { STUDENT: studentNav, TEACHER: teacherNav, ADMIN: adminNav };
export const PROFILE_PATH: Record<Role, string> = { STUDENT: '/profile', TEACHER: '/teacher/profile', ADMIN: '/admin/profile' };
export const SETTINGS_PATH: Record<Role, string> = { STUDENT: '/settings', TEACHER: '/teacher/settings', ADMIN: '/admin/settings' };
export const ROLE_LABEL: Record<Role, string> = { STUDENT: "O'quvchi", TEACHER: 'Ustoz', ADMIN: 'Administrator' };

/** Joriy manzilga eng mos (eng uzun mos keladigan) menyu bandini topadi. */
export function activeItem(items: NavItem[], path: string): NavItem | undefined {
  let best: NavItem | undefined;
  for (const item of items) {
    const hit = item.end ? path === item.to : path === item.to || path.startsWith(`${item.to}/`);
    if (hit && (!best || item.to.length > best.to.length)) best = item;
  }
  return best;
}
