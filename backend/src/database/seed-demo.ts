import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource, EntityManager } from 'typeorm';
import { AppModule } from '../app.module';
import { sealPassword } from '../common/credentials';
import { Day, HomeworkStatus, Role } from '../common/enums';
import { addDays, addHours, hashPassword, todayKey } from '../common/utils';
import {
  Attendance,
  Group,
  GroupMember,
  GroupSchedule,
  Homework,
  Lesson,
  LessonProgress,
  LessonRating,
  Payment,
  PaymentPlan,
  Student,
  StudentHomework,
  Submission,
  Teacher,
  User,
  UserSettings,
} from './entities';

const DAY_MS = 86400000;
const TEACHER_TARGET = 15;
const TEACHER_PASSWORD = 'ustoz123';
const STUDENT_PASSWORD = 'oquvchi123';

const MALE = ['Aziz', 'Bekzod', 'Davron', 'Eldor', 'Farhod', 'Gayrat', 'Hasan', 'Islom', 'Jasur', 'Komil', 'Lochin', 'Mirzo', 'Nodir', 'Otabek', 'Pulat', 'Rustam', 'Sanjar', 'Timur', 'Umid', 'Valijon', 'Xurshid', 'Yusuf', 'Zafar', 'Akmal', 'Bobur', 'Dilshod', 'Husan', 'Ilyos', 'Jahongir', 'Shohruh'];
const FEMALE = ['Aziza', 'Barno', 'Dilnoza', 'Feruza', 'Gulnora', 'Hilola', 'Iroda', 'Madina', 'Nigora', 'Oydin', 'Robiya', 'Sevara', 'Tamara', 'Umida', 'Zarina', 'Kamola', 'Lola', 'Malika', 'Nodira', 'Shahlo', 'Dildora', 'Gulbahor', 'Ma\'mura', 'Sabina', 'Zulfiya', 'Mohira', 'Nafisa', 'Sitora', 'Laylo', 'Yulduz'];
const LAST = ['Karimov', 'Rahimov', 'Aliyev', 'Yusupov', 'Tursunov', 'Ergashev', 'Saidov', 'Abdullayev', 'Normatov', 'Qodirov', 'Ismoilov', 'Hamidov', 'Mirzayev', 'Sobirov', 'Xolmatov', 'Nazarov', 'Umarov', 'Jurayev', 'Rasulov', 'Ortiqov', 'Botirov', 'Omonov', 'Toshpulatov', 'Sultonov', 'Zokirov', 'Mamatov', 'Olimov', 'Qosimov', 'Raximov', 'Berdiyev'];
const COURSES = [
  ['Frontend (React)', 'HTML, CSS, JavaScript va React'],
  ['Backend (Node.js)', 'Node.js, NestJS va ma\'lumotlar bazasi'],
  ['Python dasturlash', 'Python asoslaridan loyihalargacha'],
  ['UI/UX dizayn', 'Figma va foydalanuvchi tajribasi'],
  ['Mobil ilovalar', 'React Native bilan mobil ilovalar'],
  ['Ma\'lumotlar tahlili', 'SQL, Excel va Power BI'],
  ['Kiberxavfsizlik', 'Tarmoq va ilovalar xavfsizligi asoslari'],
  ['Grafik dizayn', 'Photoshop va Illustrator'],
  ['Java dasturlash', 'Java va OOP asoslari'],
  ['IELTS tayyorlov', 'Ingliz tili va IELTS strategiyalari'],
  ['Matematika (DTM)', 'DTM uchun matematika'],
  ['Robototexnika', 'Arduino va robotlar'],
  ['SMM va marketing', 'Ijtimoiy tarmoqlarda marketing'],
  ['Video montaj', 'Premiere Pro va After Effects'],
  ['QA testlash', 'Qo\'lda va avtomatik testlash'],
];
const LESSON_TITLES = ['Kirish va asosiy tushunchalar', 'Amaliy mashg\'ulot', 'Loyiha ustida ishlash', 'Takrorlash va savol-javob'];

/** Bir xil natija beradigan oddiy tasodifiy son generatori (har safar bir xil demo ma'lumot). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ascii = (s: string) => s.toLowerCase().replace(/['`ʻʼ’]/g, '').replace(/[^a-z0-9]/g, '');
const chunk = <T>(list: T[], size = 250): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

export async function seedDemo(em: EntityManager) {
  const rand = rng(20261116);
  const hashes = new Map<string, string>();
  const hashOf = async (plain: string) => {
    if (!hashes.has(plain)) hashes.set(plain, await hashPassword(plain));
    return hashes.get(plain) as string;
  };
  const usedLogins = new Set((await em.find(User, { select: { login: true } })).map((u) => u.login));
  const unique = (base: string) => {
    let login = base;
    let n = 1;
    while (usedLogins.has(login)) login = `${base}${++n}`;
    usedLogins.add(login);
    return login;
  };
  let phoneCounter = 1000;
  const phone = () => {
    phoneCounter += 1;
    return `+998 9${phoneCounter % 10} ${String(100 + (phoneCounter % 900)).padStart(3, '0')} ${String(10 + (phoneCounter % 90))} ${String(10 + ((phoneCounter * 7) % 90))}`;
  };
  const person = (i: number) => {
    const female = i % 2 === 1;
    const first = (female ? FEMALE : MALE)[Math.floor(rand() * 30)];
    const lastBase = LAST[Math.floor(rand() * 30)];
    return { first, last: female ? `${lastBase.replace(/ov$/, 'ova').replace(/ev$/, 'eva')}` : lastBase };
  };

  const createUsers = async (role: Role, count: number, plain: string) => {
    const rows: User[] = [];
    const sealed = sealPassword(plain);
    const hash = await hashOf(plain);
    for (let i = 0; i < count; i += 1) {
      const p = person(i);
      const login = unique(`${ascii(p.first)}.${ascii(p.last)}`);
      rows.push(em.create(User, { role, login, fullName: `${p.first} ${p.last}`, phone: phone(), email: `${login}@skillsup.uz`, passwordHash: hash, credentialEnc: sealed }));
    }
    const saved: User[] = [];
    for (const part of chunk(rows, 100)) saved.push(...(await em.save(part)));
    if (role === Role.STUDENT) for (const part of chunk(saved)) await em.insert(Student, part.map((u) => ({ userId: u.id })));
    if (role === Role.TEACHER) await em.insert(Teacher, saved.map((u) => ({ userId: u.id })));
    for (const part of chunk(saved)) await em.insert(UserSettings, part.map((u) => ({ userId: u.id })));
    return saved;
  };

  // 1) Ustozlar: jami 15 tagacha
  const teachers = await em.find(User, { where: { role: Role.TEACHER }, order: { createdAt: 'ASC' } });
  if (teachers.length < TEACHER_TARGET) teachers.push(...(await createUsers(Role.TEACHER, TEACHER_TARGET - teachers.length, TEACHER_PASSWORD)));

  // 2) Har bir ustozda 10-15 ta o'quvchi bo'lsin
  const today = todayKey();
  const slotTimes = ['08:00', '10:00', '12:00', '14:00', '16:00'];
  const dayPairs: Day[][] = [[Day.MON, Day.WED], [Day.TUE, Day.THU], [Day.WED, Day.FRI], [Day.MON, Day.THU], [Day.TUE, Day.SAT]];
  const summary = { teachers: teachers.length, newStudents: 0, newGroups: 0 };

  for (const [ti, teacher] of teachers.entries()) {
    const groups = await em.find(Group, { where: { teacherId: teacher.id } });
    const memberRows = groups.length ? await em.createQueryBuilder(GroupMember, 'gm').where('gm.groupId IN (:...ids)', { ids: groups.map((g) => g.id) }).getMany() : [];
    const have = new Set(memberRows.map((m) => m.studentId));
    const target = 10 + ((ti * 7) % 6); // 10..15
    if (have.size >= target) continue;

    const [courseName, courseDesc] = COURSES[ti % COURSES.length];
    const group = await em.save(em.create(Group, { name: `${courseName} - ${ti + 1}-guruh`, course: courseDesc, teacherId: teacher.id }));
    summary.newGroups += 1;
    const days = dayPairs[ti % dayPairs.length];
    const start = slotTimes[ti % slotTimes.length];
    const end = `${String(Number(start.slice(0, 2)) + 2).padStart(2, '0')}:00`;
    await em.insert(GroupSchedule, days.map((day) => ({ groupId: group.id, day, startTime: start, endTime: end, roomId: null })));
    await em.insert(PaymentPlan, { groupId: group.id, amount: 350000 + (ti % 5) * 50000, dueDate: addDays(today, 5 + ((ti * 3) % 25)) });

    const need = target - have.size;
    const students = await createUsers(Role.STUDENT, need, STUDENT_PASSWORD);
    summary.newStudents += students.length;
    await em.insert(GroupMember, students.map((s) => ({ groupId: group.id, studentId: s.id })));

    // 3) Darslar, vazifalar, davomat, baholar
    const now = Date.now();
    const lessons: Lesson[] = [];
    for (const [li, daysAgo] of [21, 14, 7, 2].entries()) {
      lessons.push(
        await em.save(
          em.create(Lesson, {
            groupId: group.id,
            title: LESSON_TITLES[li],
            description: `${courseName}: ${LESSON_TITLES[li].toLowerCase()}.`,
            startsAt: new Date(now - daysAgo * DAY_MS),
            durationMin: 90,
            videoUrl: `https://example.com/video/${ti + 1}-${li + 1}`,
            attendanceSaved: daysAgo > 3,
            createdBy: teacher.id,
          }),
        ),
      );
    }
    const homeworks: Homework[] = [];
    for (const lesson of lessons.slice(0, 3)) {
      const assigned = new Date(lesson.startsAt.getTime());
      homeworks.push(
        await em.save(
          em.create(Homework, {
            lessonId: lesson.id,
            task: `“${lesson.title}” bo'yicha amaliy topshiriqni bajaring.`,
            steps: ['Mavzuni takrorlang', 'Topshiriqni bajaring', 'Natijani yuboring'],
            assignedAt: assigned,
            dueAt: addHours(assigned, 168),
            timeLimitHours: 168,
          }),
        ),
      );
    }

    const shRows: Partial<StudentHomework>[] = [];
    const subRows: Partial<Submission>[] = [];
    const attRows: Partial<Attendance>[] = [];
    const progRows: Partial<LessonProgress>[] = [];
    const rateRows: Partial<LessonRating>[] = [];
    for (const [hi, hw] of homeworks.entries()) {
      for (const s of students) {
        const r = rand();
        const status = r < 0.62 ? HomeworkStatus.DONE : r < 0.74 ? HomeworkStatus.PENDING : r < 0.79 ? HomeworkStatus.RETURNED : HomeworkStatus.NOT_DONE;
        const done = status === HomeworkStatus.DONE;
        shRows.push({
          homeworkId: hw.id,
          studentId: s.id,
          status,
          assignedAt: hw.assignedAt,
          dueAt: hw.dueAt,
          grade: done ? 60 + Math.floor(rand() * 41) : null,
          feedback: status === HomeworkStatus.RETURNED ? 'Kodni qayta ko\'rib chiqing va izohlar qo\'shing.' : null,
          gradedAt: done ? new Date() : null,
          gradedBy: done ? teacher.id : null,
        });
        if (status !== HomeworkStatus.NOT_DONE) {
          subRows.push({ homeworkId: hw.id, studentId: s.id, text: 'Vazifa bajarildi.', isLate: rand() < 0.12, submittedAt: new Date(hw.dueAt.getTime() - 3600000 * (2 + Math.floor(rand() * 48))) });
        }
        if (rand() < 0.75) rateRows.push({ lessonId: lessons[hi].id, studentId: s.id, stars: 3 + Math.floor(rand() * 3), comment: '' });
      }
    }
    for (const [li, lesson] of lessons.entries()) {
      for (const s of students) {
        const present = rand() < 0.86;
        const arrived = new Date(lesson.startsAt.getTime() + Math.floor(rand() * 12) * 60000);
        attRows.push({
          lessonId: lesson.id,
          studentId: s.id,
          present,
          markedBy: teacher.id,
          arrivedAt: present ? arrived : null,
          leftAt: present && rand() < 0.25 ? new Date(arrived.getTime() + 75 * 60000) : null,
        });
        progRows.push({ lessonId: lesson.id, studentId: s.id, percent: present ? 100 : Math.floor(rand() * 60), completedAt: present ? new Date() : null });
        void li;
      }
    }
    for (const part of chunk(shRows)) await em.insert(StudentHomework, part as StudentHomework[]);
    for (const part of chunk(subRows)) await em.insert(Submission, part as Submission[]);
    for (const part of chunk(attRows)) await em.insert(Attendance, part as Attendance[]);
    for (const part of chunk(progRows)) await em.insert(LessonProgress, part as LessonProgress[]);
    for (const part of chunk(rateRows)) await em.insert(LessonRating, part as LessonRating[]);

    const payers = students.filter(() => rand() < 0.65);
    if (payers.length) {
      await em.insert(
        Payment,
        payers.map((s) => ({ studentId: s.id, groupId: group.id, amount: 350000 + (ti % 5) * 50000, paidAt: addDays(today, -(3 + Math.floor(rand() * 25))), method: rand() < 0.5 ? 'Uzcard •• 8600' : 'Humo •• 9860', description: "Standart to'lov" })),
      );
    }
  }
  return summary;
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
    console.log('Production muhitida seed ishlamaydi. SEED_FORCE=true bilan majburlash mumkin.');
    return;
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const summary = await seedDemo(app.get(DataSource).manager);
  console.log("Demo ma'lumotlar qo'shildi:", summary);
  console.log(`  ustozlar: parol ${TEACHER_PASSWORD}, o'quvchilar: parol ${STUDENT_PASSWORD} (admin panelda login va parol ko'rinadi)`);
  await app.close();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
