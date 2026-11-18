import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Day, HomeworkStatus, Role } from '../common/enums';
import { sealPassword } from '../common/credentials';
import { addDays, addHours, hashPassword, todayKey } from '../common/utils';
import { seedDemo } from './seed-demo';
import {
  Activity,
  Attendance,
  CareerVideo,
  ExamResult,
  Faq,
  Group,
  GroupMember,
  GroupSchedule,
  Guide,
  Homework,
  Lesson,
  LessonProgress,
  Notification,
  Payment,
  PaymentPlan,
  Room,
  Student,
  StudentHomework,
  Submission,
  Teacher,
  User,
  UserSettings,
} from './entities';

const DAY_MS = 86400000;

async function seed() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
    console.log('Production muhitida seed ishlamaydi. SEED_FORCE=true bilan majburlash mumkin.');
    return;
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const ds = app.get(DataSource);
  const em = ds.manager;
  if ((await em.count(User)) > 0) {
    console.log("Bazada ma'lumot bor. Seed o'tkazib yuborildi.");
    await app.close();
    return;
  }

  const makeUser = async (role: Role, login: string, fullName: string, password: string, phone: string) => {
    const user = await em.save(
      em.create(User, { role, login, fullName, phone, passwordHash: await hashPassword(password), credentialEnc: sealPassword(password), email: `${login}@skillsup.uz` }),
    );
    if (role === Role.STUDENT) await em.insert(Student, { userId: user.id });
    if (role === Role.TEACHER) await em.insert(Teacher, { userId: user.id });
    await em.insert(UserSettings, { userId: user.id });
    return user;
  };

  const admin = await makeUser(Role.ADMIN, 'admin', 'Bosh Administrator', 'admin123', '+998 90 000 00 01');
  const t1 = await makeUser(Role.TEACHER, 'dilnoza.rahimova', 'Dilnoza Rahimova', 'ustoz123', '+998 90 111 11 11');
  const t2 = await makeUser(Role.TEACHER, 'gulnora.saidova', 'Gulnora Saidova', 'ustoz123', '+998 90 222 22 22');
  await makeUser(Role.TEACHER, 'jasur.karimov', 'Jasur Karimov', 'ustoz123', '+998 90 333 33 33');

  const names: [string, string][] = [
    ['bekzod.rahimov', 'Bekzod Rahimov'],
    ['aziza.karimova', 'Aziza Karimova'],
    ['sardor.aliyev', 'Sardor Aliyev'],
    ['malika.yusupova', 'Malika Yusupova'],
    ['javohir.tursunov', 'Javohir Tursunov'],
    ['nodira.ergasheva', 'Nodira Ergasheva'],
  ];
  const students: User[] = [];
  for (const [i, [login, name]] of names.entries()) {
    students.push(await makeUser(Role.STUDENT, login, name, 'oquvchi123', `+998 91 ${100 + i} 00 0${i}`));
  }
  const [bekzod, aziza, sardor, malika, javohir, nodira] = students;

  const rooms = new Map<string, Room>();
  for (const [name, capacity] of [['A xona', 12], ['B xona', 12], ['C xona', 10], ['Dizayn studiyasi', 10]] as [string, number][]) {
    rooms.set(name, await em.save(em.create(Room, { name, nameKey: name.toLowerCase(), capacity })));
  }

  const makeGroup = async (
    name: string,
    course: string,
    teacher: User,
    slots: { day: Day; start: string; end: string; room?: string }[],
    amount: number,
    due: string,
  ) => {
    const group = await em.save(em.create(Group, { name, course, teacherId: teacher.id }));
    for (const s of slots) {
      await em.insert(GroupSchedule, {
        groupId: group.id,
        day: s.day,
        startTime: s.start,
        endTime: s.end,
        roomId: s.room ? rooms.get(s.room).id : null,
      });
    }
    await em.insert(PaymentPlan, { groupId: group.id, amount, dueDate: due });
    return group;
  };

  const today = todayKey();
  const gr1 = await makeGroup('Fullstack dasturlash', 'Frontend va backend asoslari', t1, [
    { day: Day.MON, start: '18:00', end: '20:00', room: 'A xona' },
    { day: Day.WED, start: '18:00', end: '20:00', room: 'A xona' },
    { day: Day.FRI, start: '16:00', end: '18:00' },
  ], 500000, addDays(today, 20));
  const gr2 = await makeGroup('UI/UX dizayn', 'Interfeys va foydalanuvchi tajribasi', t2, [
    { day: Day.TUE, start: '18:00', end: '20:00', room: 'Dizayn studiyasi' },
    { day: Day.THU, start: '18:00', end: '20:00', room: 'Dizayn studiyasi' },
  ], 400000, addDays(today, 22));
  const gr3 = await makeGroup('Backend asoslari', 'Node.js va ma\'lumotlar bazasi', t1, [
    { day: Day.TUE, start: '18:00', end: '20:00', room: 'B xona' },
    { day: Day.SAT, start: '10:00', end: '12:00', room: 'B xona' },
  ], 450000, addDays(today, 25));

  const join = (g: Group, list: User[]) => em.insert(GroupMember, list.map((u) => ({ groupId: g.id, studentId: u.id })));
  await join(gr1, [bekzod, aziza, sardor, malika]);
  await join(gr2, [aziza, malika, nodira]);
  await join(gr3, [bekzod, javohir, malika]);

  const now = Date.now();
  const makeLesson = (g: Group, title: string, daysAgo: number, isExam = false, teacher = t1) =>
    em.save(
      em.create(Lesson, {
        groupId: g.id,
        title,
        description: isExam ? '' : `${title} bo'yicha asosiy tushunchalar va amaliy mashqlar.`,
        startsAt: new Date(now - daysAgo * DAY_MS),
        durationMin: 45,
        videoUrl: 'https://example.com/video/' + encodeURIComponent(title),
        isExam,
        attendanceSaved: daysAgo > 14,
        createdBy: teacher.id,
      }),
    );

  const l1 = await makeLesson(gr1, 'HTML va CSS asoslari', 28);
  const l2 = await makeLesson(gr1, 'JavaScript o\'zgaruvchilar va funksiyalar', 21);
  const l3 = await makeLesson(gr1, 'DOM bilan ishlash', 14);
  const exam1 = await makeLesson(gr1, '1-imtihon', 10, true);
  const l4 = await makeLesson(gr1, 'React komponentlari', 3);

  const homework = async (lesson: Lesson, task: string, hours: number, daysAgo: number) => {
    const assigned = new Date(now - daysAgo * DAY_MS);
    return em.save(
      em.create(Homework, {
        lessonId: lesson.id,
        task,
        steps: ['Mavzuni takrorlang', 'Vazifani bajaring', 'Natijani yuboring'],
        assignedAt: assigned,
        dueAt: addHours(assigned, hours),
        timeLimitHours: hours,
      }),
    );
  };
  const hw1 = await homework(l1, 'Shaxsiy sahifa uchun HTML va CSS yozing.', 168, 28);
  const hw2 = await homework(l2, 'Oddiy kalkulyator funksiyalarini yozing.', 168, 21);
  const hw3 = await homework(l3, "Ro'yxat bilan ishlaydigan kichik ilova yarating.", 168, 14);

  const work = async (
    hw: Homework,
    student: User,
    status: HomeworkStatus,
    opts: { grade?: number; late?: boolean; feedback?: string; dueOffsetDays?: number } = {},
  ) => {
    await em.insert(StudentHomework, {
      homeworkId: hw.id,
      studentId: student.id,
      status,
      assignedAt: hw.assignedAt,
      dueAt: hw.dueAt,
      grade: status === HomeworkStatus.DONE ? opts.grade ?? 80 : null,
      feedback: opts.feedback ?? null,
      gradedAt: status === HomeworkStatus.DONE ? new Date() : null,
      gradedBy: status === HomeworkStatus.DONE ? t1.id : null,
    });
    if (status !== HomeworkStatus.NOT_DONE) {
      await em.insert(Submission, {
        homeworkId: hw.id,
        studentId: student.id,
        text: 'Vazifa bajarildi.',
        isLate: !!opts.late,
        submittedAt: new Date(hw.dueAt.getTime() + (opts.late ? 3600000 : -3600000)),
      });
    }
  };

  await work(hw1, bekzod, HomeworkStatus.DONE, { grade: 90 });
  await work(hw1, aziza, HomeworkStatus.DONE, { grade: 95 });
  await work(hw1, sardor, HomeworkStatus.DONE, { grade: 70 });
  await work(hw1, malika, HomeworkStatus.DONE, { grade: 85 });
  await work(hw2, bekzod, HomeworkStatus.DONE, { grade: 85, late: true });
  await work(hw2, aziza, HomeworkStatus.NOT_DONE);
  await work(hw2, sardor, HomeworkStatus.DONE, { grade: 75 });
  await work(hw2, malika, HomeworkStatus.DONE, { grade: 88 });
  await work(hw3, bekzod, HomeworkStatus.PENDING);
  await work(hw3, aziza, HomeworkStatus.RETURNED, { feedback: "Kodni qayta ko'rib chiqing va sharhlar qo'shing." });
  await work(hw3, sardor, HomeworkStatus.NOT_DONE);
  await work(hw3, malika, HomeworkStatus.PENDING);

  for (const [lesson, present] of [
    [l1, [bekzod, aziza, sardor, malika]],
    [l2, [bekzod, sardor, malika]],
    [l3, [bekzod, aziza, malika]],
  ] as [Lesson, User[]][]) {
    for (const s of [bekzod, aziza, sardor, malika]) {
      await em.insert(Attendance, { lessonId: lesson.id, studentId: s.id, present: present.includes(s), markedBy: t1.id });
    }
  }
  for (const [lesson, s, percent] of [
    [l4, bekzod, 100],
    [l4, aziza, 60],
    [l3, bekzod, 100],
    [l2, bekzod, 100],
  ] as [Lesson, User, number][]) {
    await em.insert(LessonProgress, {
      lessonId: lesson.id,
      studentId: s.id,
      percent,
      completedAt: percent >= 100 ? new Date() : null,
    });
  }
  await em.insert(ExamResult, { lessonId: exam1.id, studentId: bekzod.id, ball: 88, enteredBy: t1.id });
  await em.insert(ExamResult, { lessonId: exam1.id, studentId: malika.id, ball: 92, enteredBy: t1.id });

  const g3l1 = await makeLesson(gr3, 'Express va REST asoslari', 6);
  await em.insert(LessonProgress, { lessonId: g3l1.id, studentId: bekzod.id, percent: 100, completedAt: new Date() });
  const g2l1 = await makeLesson(gr2, 'Rang nazariyasi', 5, false, t2);
  await em.insert(LessonProgress, { lessonId: g2l1.id, studentId: aziza.id, percent: 40 });

  const payment = (s: User, g: Group, amount: number, daysAgo: number, method: string, description: string) =>
    em.insert(Payment, {
      studentId: s.id,
      groupId: g.id,
      amount,
      paidAt: addDays(today, -daysAgo),
      method,
      description,
    });
  await payment(bekzod, gr1, 500000, 35, 'Uzcard •• 8600', "Standart to'lov - oldingi oy");
  await payment(bekzod, gr3, 450000, 33, 'Humo •• 9860', "Standart to'lov - oldingi oy");
  await payment(aziza, gr1, 500000, 31, 'Humo •• 9860', "Standart to'lov - oldingi oy");

  await em.insert(Notification, [
    { userId: bekzod.id, type: 'new_lesson', title: 'Yangi dars boshlandi: React komponentlari', link: `/lessons/${l4.id}` },
    { userId: bekzod.id, type: 'payment_notice', title: "To'lov eslatmasi: keyingi to'lov 500 000 so'm", link: '/payments' },
  ]);
  await em.insert(Activity, [
    { studentId: bekzod.id, type: 'lesson', text: '“HTML va CSS asoslari” vazifasi baholandi: 90 ball', xp: 90 },
    { studentId: bekzod.id, type: 'group', text: '“Fullstack dasturlash” guruhiga qo\'shildingiz', xp: null },
  ]);

  await em.insert(CareerVideo, [
    { title: 'Frontend dasturchi yo\'li', topic: 'Karyera', durationMin: 18, description: 'Frontend dasturchi bo\'lish uchun yo\'l xaritasi.', videoUrl: 'https://example.com/career/frontend' },
    { title: 'Intervyuga tayyorgarlik', topic: 'Intervyu', durationMin: 25, description: "Texnik intervyudan o'tish bo'yicha maslahatlar.", videoUrl: 'https://example.com/career/interview' },
  ]);
  await em.insert(Guide, [
    { title: 'Platformadan foydalanish', category: 'Boshlash', readMin: 4, summary: 'Darslar, vazifalar va reyting haqida.', body: "Darsni oching, videoni oxirigacha ko'ring va vazifani muddatida topshiring." },
    { title: 'Vazifa topshirish qoidalari', category: 'Vazifalar', readMin: 3, summary: 'Fayl va matn talablari.', body: 'Matn 2000 belgigacha, 3 tagacha fayl, har biri 25 MB gacha.' },
  ]);
  await em.insert(Faq, [
    { question: 'Kechikib topshirsam nima bo\'ladi?', answer: 'Ishingiz qabul qilinadi, lekin balldan 10 ball ayiriladi.' },
    { question: 'Imtihonga kirish sharti nima?', answer: "Imtihon qamrab olgan darslarning muddati o'tgan vazifalari topshirilgan bo'lishi kerak." },
  ]);

  await seedDemo(em);
  console.log('Seed tayyor.');
  console.log('  admin / admin123');
  console.log('  dilnoza.rahimova / ustoz123  (ustoz)');
  console.log('  bekzod.rahimov / oquvchi123  (o\'quvchi)');
  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
