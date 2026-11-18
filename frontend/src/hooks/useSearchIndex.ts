import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '../api/client';
import {
  AdminGroup,
  AdminPayments,
  AdminStudent,
  CareerVideo,
  Faq,
  GroupCard,
  GroupLessons,
  Guide,
  ReviewItem,
  Role,
  Room,
  StudentStat,
  TeacherGroupLessons,
} from '../api/types';
import { IconName } from '../components/icons';
import { NAV, PROFILE_PATH } from '../layouts/nav';
import { fmtDate, fmtDateTime, fmtMoney, HW_LABEL, scheduleText } from '../utils/format';

export type SearchKind = 'page' | 'group' | 'lesson' | 'exam' | 'student' | 'teacher' | 'room' | 'payment' | 'video' | 'guide' | 'faq' | 'review';

export interface SearchItem {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  to: string;
  icon: IconName;
  titleN: string;
  haystack: string;
}

export const KIND_LABEL: Record<SearchKind, string> = {
  page: 'Sahifalar',
  group: 'Guruhlar',
  lesson: 'Darslar',
  exam: 'Imtihonlar',
  student: "O'quvchilar",
  teacher: 'Ustozlar',
  room: 'Xonalar',
  payment: "To'lovlar",
  video: 'Karyera videolari',
  guide: "Qo'llanmalar",
  faq: "Ko'p so'raladigan savollar",
  review: 'Tekshirish kutilmoqda',
};

const KIND_ICON: Record<SearchKind, IconName> = {
  page: 'arrowRight',
  group: 'groups',
  lesson: 'lessons',
  exam: 'review',
  student: 'student',
  teacher: 'teacher',
  room: 'door',
  payment: 'receipt',
  video: 'video',
  guide: 'book',
  faq: 'help',
  review: 'review',
};

export const KIND_ORDER: SearchKind[] = ['page', 'group', 'lesson', 'exam', 'student', 'teacher', 'room', 'payment', 'review', 'video', 'guide', 'faq'];

/** Qidiruv uchun matnni tekislash: kichik harf, apostrof va aksentlarsiz ("o'quvchi" = "oquvchi"). */
export const norm = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ʻʼ`´‘’'"“”]/g, '')
    .replace(/[^\p{L}\p{N}+ ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const digits = (value: string) => value.replace(/\D/g, '');

function make(kind: SearchKind, id: string, title: string, to: string, subtitle: string | undefined, extra: (string | null | undefined)[] = []): SearchItem {
  const text = [title, subtitle, ...extra].filter(Boolean).join(' ');
  return { id: `${kind}:${id}`, kind, title, subtitle, to, icon: KIND_ICON[kind], titleN: norm(title), haystack: `${norm(text)} ${digits(text)}` };
}

const asList = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function useSearchIndex(role: Role | undefined, enabled: boolean) {
  const active = enabled && !!role;
  const basePaths =
    role === 'STUDENT'
      ? ['/student/groups', '/career-videos', '/guides', '/faqs']
      : role === 'TEACHER'
        ? ['/teacher/groups', '/teacher/review']
        : role === 'ADMIN'
          ? ['/admin/students?limit=1000', '/admin/teachers', '/admin/groups', '/admin/rooms', '/admin/payments']
          : [];

  const base = useQueries({
    queries: basePaths.map((path) => ({ queryKey: [path], queryFn: () => api.get<unknown>(path), enabled: active, staleTime: 60_000 })),
  });

  const groups = role === 'STUDENT' || role === 'TEACHER' ? asList<GroupCard>(base[0]?.data) : [];
  const groupPaths =
    role === 'STUDENT'
      ? groups.map((g) => `/student/groups/${g.id}/lessons`)
      : role === 'TEACHER'
        ? groups.flatMap((g) => [`/teacher/groups/${g.id}/lessons`, `/teacher/groups/${g.id}/students`])
        : [];

  const perGroup = useQueries({
    queries: groupPaths.map((path) => ({ queryKey: [path], queryFn: () => api.get<unknown>(path), enabled: active, staleTime: 60_000 })),
  });

  const signature = [...base, ...perGroup].map((q) => q.dataUpdatedAt).join(',');
  const loading = active && [...base, ...perGroup].some((q) => q.isLoading);

  const items = useMemo(() => {
    if (!role) return [];
    const out: SearchItem[] = [];
    NAV[role].forEach((n) => out.push({ ...make('page', n.to, n.label, n.to, 'Sahifa'), icon: n.icon }));
    out.push({ ...make('page', 'profile', 'Profil', PROFILE_PATH[role], 'Profil surati va ma\'lumotlar', ['rasm', 'surat', 'avatar']), icon: 'user' });

    if (role === 'STUDENT') {
      groups.forEach((g) => out.push(make('group', g.id, g.name, `/lessons?group=${g.id}`, `${g.course} · ${g.teacher.fullName}`, [scheduleText(g.schedule)])));
      groupPaths.forEach((path, i) => {
        const gl = perGroup[i]?.data as GroupLessons | undefined;
        if (!gl?.lessons) return;
        gl.lessons.forEach((l) =>
          out.push(make('lesson', l.id, l.title, `/lessons/${l.id}`, `${gl.group.name} · ${fmtDate(l.startsAt)}`, [HW_LABEL[l.homework.status], l.status === 'completed' ? 'tugatilgan' : 'jarayonda'])),
        );
        gl.exams.forEach((e) => out.push(make('exam', e.id, e.title || `${e.number}-imtihon`, `/lessons?group=${gl.group.id}`, `${gl.group.name} · ${fmtDate(`${e.date}T00:00:00+05:00`)}`)));
      });
      asList<CareerVideo>(base[1]?.data).forEach((v) => out.push(make('video', v.id, v.title, '/career', `${v.topic} · ${v.durationMin} daqiqa`, [v.description])));
      asList<Guide>(base[2]?.data).forEach((g) => out.push(make('guide', g.id, g.title, '/guides', g.category, [g.summary, g.body])));
      asList<Faq>(base[3]?.data).forEach((f) => out.push(make('faq', f.id, f.question, '/guides', 'Savol-javob', [f.answer])));
    }

    if (role === 'TEACHER') {
      const nameOf = new Map(groups.map((g) => [g.id, g.name]));
      groups.forEach((g) => out.push(make('group', g.id, g.name, `/teacher/lessons?group=${g.id}`, `${g.course} · ${g.members} o'quvchi`, [scheduleText(g.schedule)])));
      groups.forEach((g, gi) => {
        const lessons = perGroup[gi * 2]?.data as TeacherGroupLessons | undefined;
        lessons?.lessons?.forEach((l) => out.push(make('lesson', l.id, l.title, `/teacher/lessons/${l.id}`, `${g.name} · ${fmtDateTime(l.startsAt)}`)));
        lessons?.exams?.forEach((e) => out.push(make('exam', e.id, e.title || `${e.number}-imtihon`, `/teacher/exams/${e.id}`, `${g.name} · ${fmtDate(`${e.date}T00:00:00+05:00`)}`)));
        asList<StudentStat>(perGroup[gi * 2 + 1]?.data).forEach((s) => out.push(make('student', `${g.id}:${s.studentId}`, s.name, `/teacher/groups?open=${g.id}`, `${nameOf.get(g.id) ?? ''} · ${s.xp} XP`)));
      });
      asList<ReviewItem>(base[1]?.data).forEach((r) =>
        out.push(make('review', `${r.lessonId}:${r.studentId}`, r.studentName, `/teacher/lessons/${r.lessonId}`, `${r.groupName} · ${r.lessonTitle}`, ['tekshirish', 'vazifa'])),
      );
    }

    if (role === 'ADMIN') {
      asList<AdminStudent>(base[0]?.data).forEach((s) =>
        out.push(make('student', s.id, s.fullName, `/admin/students?q=${encodeURIComponent(s.fullName)}`, `${s.login}${s.phone ? ` · ${s.phone}` : ''}`, [s.login, s.phone, ...s.groups.map((g) => g.name)])),
      );
      asList<AdminStudent>(base[1]?.data).forEach((t) =>
        out.push(make('teacher', t.id, t.fullName, `/admin/teachers?q=${encodeURIComponent(t.fullName)}`, `${t.login}${t.phone ? ` · ${t.phone}` : ''}`, [t.login, t.phone, ...t.groups.map((g) => g.name)])),
      );
      asList<AdminGroup>(base[2]?.data).forEach((g) =>
        out.push(make('group', g.id, g.name, `/admin/groups?q=${encodeURIComponent(g.name)}`, `${g.course} · ${g.teacher.fullName}`, [scheduleText(g.schedule)])),
      );
      asList<Room>(base[3]?.data).forEach((r) => out.push(make('room', r.id, r.name, '/admin/rooms', `${r.capacity} o'rinli xona`)));
      asList<AdminPayments['groups'][number]>((base[4]?.data as AdminPayments | undefined)?.groups).forEach((g) =>
        out.push(make('payment', g.groupId, `${g.name} — to'lov`, '/admin/payments', `${fmtMoney(g.plan.amount)} · ${fmtDate(`${g.plan.dueDate}T00:00:00+05:00`)}`)),
      );
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, signature]);

  return { items, loading };
}

export interface SearchGroup {
  kind: SearchKind;
  label: string;
  items: SearchItem[];
}

/** Hamma so'zlar mos kelishi kerak (AND). Sarlavhaga mos kelganlar yuqoriga chiqadi. */
export function runSearch(items: SearchItem[], query: string, perKind = 5): SearchGroup[] {
  const q = norm(query);
  if (!q) {
    const pages = items.filter((i) => i.kind === 'page').slice(0, 8);
    return pages.length ? [{ kind: 'page', label: 'Tezkor o\'tish', items: pages }] : [];
  }
  const tokens = q.split(' ');
  const qDigits = digits(query);
  const scored: { item: SearchItem; score: number }[] = [];
  for (const item of items) {
    let total = 0;
    let ok = true;
    for (const t of tokens) {
      if (item.titleN.startsWith(t)) total += 6;
      else if (item.titleN.split(' ').some((w) => w.startsWith(t))) total += 4;
      else if (item.titleN.includes(t)) total += 3;
      else if (item.haystack.includes(t)) total += 1;
      else if (qDigits.length >= 3 && tokens.length === 1 && item.haystack.includes(qDigits)) total += 1;
      else {
        ok = false;
        break;
      }
    }
    if (ok) scored.push({ item, score: total });
  }
  scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  const groups = new Map<SearchKind, SearchItem[]>();
  for (const { item } of scored) {
    const list = groups.get(item.kind) ?? [];
    if (list.length < perKind) list.push(item);
    groups.set(item.kind, list);
  }
  return KIND_ORDER.filter((k) => groups.has(k)).map((k) => ({ kind: k, label: KIND_LABEL[k], items: groups.get(k) as SearchItem[] }));
}
