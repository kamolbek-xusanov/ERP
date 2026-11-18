export enum Role {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export enum Day {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

export enum HomeworkStatus {
  NOT_DONE = 'NOT_DONE',
  PENDING = 'PENDING',
  RETURNED = 'RETURNED',
  DONE = 'DONE',
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export const DAYS: Day[] = [Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI, Day.SAT, Day.SUN];

export const DAY_UZ: Record<Day, string> = {
  MON: 'dushanba',
  TUE: 'seshanba',
  WED: 'chorshanba',
  THU: 'payshanba',
  FRI: 'juma',
  SAT: 'shanba',
  SUN: 'yakshanba',
};

export const MONTHS_UZ = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];
