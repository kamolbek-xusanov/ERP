# Skills Up backend

O'quv markazi platformasi uchun REST API. NestJS, TypeScript, PostgreSQL, TypeORM.
Hamma qoida va raqam `backend_structure.pdf` hujjatidan olingan.

## Tez ishga tushirish

Talab: Node.js 20+, PostgreSQL 14+ (yoki Docker).

1. Bazani ko'taring:
   `docker compose up -d db`
2. Paketlarni o'rnating:
   `npm install`
3. Sozlamalar fayli:
   `cp .env.example .env`
   JWT_ACCESS_SECRET va JWT_REFRESH_SECRET qiymatlarini o'zgartiring.
4. Demo ma'lumot (faqat development):
   `npm run seed`
5. Ishga tushiring:
   `npm run start:dev`

Manzillar:
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs
- Health: http://localhost:3000/api/v1/health

Demo hisoblar:
- admin / admin123
- dilnoza.rahimova / ustoz123 (yana gulnora.saidova, jasur.karimov)
- bekzod.rahimov / oquvchi123 (yana aziza.karimova, sardor.aliyev, malika.yusupova, javohir.tursunov, nodira.ergasheva)

Docker bilan to'liq ishga tushirish: `docker compose up --build`, keyin `docker compose exec api node dist/database/seed.js`.

## Buyruqlar

- `npm run start:dev` ishlab chiqish rejimi
- `npm run build` va `npm run start:prod` production
- `npm run seed` demo ma'lumot
- `npm test` unit testlar
- `npm run migration:generate -- src/database/migrations/Init` migratsiya yaratish
- `npm run migration:run` migratsiyani bajarish

Production uchun `DB_SYNC=false` qo'ying va migratsiyadan foydalaning.

## Sozlamalar (.env)

- PORT: server porti
- DATABASE_URL: PostgreSQL manzili
- DB_SYNC: true bo'lsa jadvallar avtomatik yaratiladi (faqat development)
- DB_SSL: true bo'lsa SSL ulanish
- JWT_ACCESS_SECRET, JWT_REFRESH_SECRET: token kalitlari
- JWT_ACCESS_TTL_SECONDS (900), JWT_REFRESH_TTL_SECONDS (604800)
- CORS_ORIGINS: ruxsat etilgan frontend manzillari, vergul bilan
- UPLOAD_DIR: fayllar saqlanadigan papka
- LOGIN_MAX_FAILS, LOGIN_LOCK_MINUTES: ketma-ket xatodan keyin bloklash
- Ixtiyoriy: ATTENDANCE_XP, ATTENDANCE_GEMS, XP_PER_BALL, BALL_PER_GEM, LATE_PENALTY, XP_PER_LEVEL, RETURN_EXTENSION_H, DEFAULT_ONLINE_CAPACITY

Biznes qoidalari `src/config/rules.ts` faylida bitta joyda turadi.

## Swagger

Swagger ishlab chiqish rejimida avtomatik yoqiladi: http://localhost:3000/docs

- Hamma 68 ta endpoint rol bo'yicha guruhlangan: auth, me, student, teacher, admin-*, files, notifications, content
- So'rov body maydonlari DTO lardan avtomatik olinadi (`@nestjs/swagger` plugini, `nest-cli.json` da yoqilgan)
- JSON formatida olish: http://localhost:3000/docs-json. Uni Postman yoki Insomnia ga Import qilsa bo'ladi.
- Production da (`NODE_ENV=production`) Swagger o'chiriladi

Swaggerda ishlash:
1. `POST /auth/login` ni oching, Try it out bosing, login va parolni yozing, Execute bosing.
2. Javobdagi `token` ni nusxalang.
3. Sahifa tepasidagi Authorize tugmasini bosing, tokenni qo'ying.
4. Endi qulf belgili hamma endpointni sinab ko'rish mumkin.
5. Rolni almashtirish uchun Authorize > Logout qiling va boshqa login bilan qayta kiring.

## Autentifikatsiya

1. `POST /api/v1/auth/login` `{ login, password }` javobida `token`, `refreshToken`, `user`.
2. Keyingi so'rovlarda `Authorization: Bearer <token>` yuboriladi.
3. Token tugasa `POST /auth/refresh` `{ refreshToken }` yangi juftlik beradi.
4. `POST /auth/logout` hamma tokenlarni bekor qiladi (tokenVersion oshadi).

Rol token ichidan olinadi. `/student/*` faqat STUDENT, `/teacher/*` faqat TEACHER, `/admin/*` faqat ADMIN. Mos kelmasa 403. Token yaroqsiz bo'lsa 401.

## Xato formati

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Bunday login band.", "fields": { "login": "Bunday login band." } } }
```

Kodlar: 400, 401, 403, 404, 409, 413, 415, 422, 429.

## Fayl yuklash

`POST /api/v1/files?purpose=answer|material|video` (multipart, maydon nomi `file`).
- O'quvchi: faqat javob fayli (25 MB, ruxsat etilgan kengaytmalar ro'yxati)
- Ustoz: material (20 MB) yoki video (300 MB, `purpose=video`)
- Kengaytma, mime turi, hajm va fayl boshidagi imzo (pdf, png, jpg, zip) tekshiriladi
- Javob: `{ id, name, size, mime }`. Shu `id` vazifa, javob yoki dars so'rovida beriladi.

`GET /api/v1/files/:id` fayl egasi, admin yoki shu guruhning ustozi va o'quvchilariga ochiq. Video uchun Range so'rovi (206) qo'llab-quvvatlanadi.

## Papka tuzilmasi

```
src/
  main.ts                 ValidationPipe, /api/v1 prefiks, CORS, helmet, Swagger
  app.module.ts           modullar va global guardlar
  config/rules.ts         XP, ball, jarima, fayl qoidalari
  common/                 enums, guardlar, dekoratorlar, xato filtri, yordamchi funksiyalar
  database/               entitylar, seed, data-source (migratsiya uchun)
  auth/                   login, refresh, logout, JWT strategiya, urinishlarni cheklash
  users/                  /me, parol, sozlamalar, akkaunt yaratish va o'zgartirish
  files/                  yuklash, tekshirish, Range bilan yuklab olish
  groups/                 guruh, a'zolik, sig'im, jadval, xona va ustoz to'qnashuvi
  rooms/                  xona qo'shish va o'zgartirish
  lessons/                dars, video progress, davomat
  homework/               vazifa berish, topshirish, baholash, qaytarish
  exams/                  imtihon qamrovi, ruxsat, ball kiritish
  rewards/                XP, kumush, bosqich, reyting, haftalik snapshot
  payments/               to'lov rejasi, eslatma, to'lov yozish
  notifications/          bildirishnomalar va so'nggi faoliyat
  content/                karyera videolari, qo'llanma, FAQ
  audit/                  admin harakatlari jurnali
  student/ teacher/ admin/   rol bo'yicha controllerlar
```

Controllerlar rol bo'yicha, biznes mantiq domen servislarida. Ko'p jadvalga yozadigan amallar (guruh ochish, to'lov eslatmasi, vazifa berish, davomatni saqlash) tranzaksiya ichida bajariladi.

## Frontend dasturchilar uchun

### Asosiy qoidalar

- Base URL: `http://localhost:3000/api/v1`
- Hamma javob JSON. Faqat `GET /files/:id` fayl qaytaradi.
- Login dan tashqari hamma so'rovda sarlavha kerak: `Authorization: Bearer <token>`
- Vaqt ISO 8601 (UTC) ko'rinishida keladi. Toshkent vaqtiga (UTC+5) o'zingiz o'giring. `date` maydonlari `2026-12-20` ko'rinishida.
- Pul butun son, so'mda (`500000`). Ko'rsatishda bo'shliq bilan yozing: `500 000`.
- Hamma matn va xato xabarlari o'zbekcha. Xabarni to'g'ridan-to'g'ri foydalanuvchiga ko'rsatsa bo'ladi.
- XP, kumush, bosqich, reyting bazada saqlanmaydi. Server hisoblab beradi. Frontendda qayta hisoblamang.

### Kirish oqimi

1. `POST /auth/login` `{ login, password }` javobi:
```json
{ "token": "...", "refreshToken": "...", "user": { "id": "...", "role": "STUDENT", "fullName": "Bekzod Rahimov" } }
```
2. `role` ga qarab yo'naltiring: STUDENT `/`, TEACHER `/teacher`, ADMIN `/admin`.
3. `token` va `refreshToken` ni saqlang. Sahifa yangilanganda `GET /me` ni chaqiring. 401 kelsa `/login` ga qaytaring.
4. Token 15 daqiqa yashaydi. 401 kelsa bir marta `POST /auth/refresh` `{ refreshToken }` ni chaqiring, yangi juftlikni saqlang va so'rovni takrorlang. Refresh ham 401 bersa `/login` ga qaytaring.
5. "Chiqish": `POST /auth/logout`, keyin tokenlarni o'chiring.
6. 403 kelsa foydalanuvchini o'z bosh sahifasiga qaytaring (rolga mos bo'lmagan sahifa).

O'quvchi endpointlarida o'quvchi id sini yubormang. Server uni tokendan oladi (`/student/...` har doim "men").

### Xato formati

Hamma xato bir xil:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Bunday login band.", "fields": { "login": "Bunday login band." } } }
```

- `message` ni umumiy xabar sifatida ko'rsating
- `fields` bo'lsa (422), har bir xabarni mos input tagida ko'rsating
- Kodlar: 400 noto'g'ri so'rov, 401 kirilmagan, 403 ruxsat yo'q, 404 topilmadi, 409 ziddiyat (davomat saqlangan, xona band, imtihon ruxsati yo'q, joy qolmagan), 413 fayl katta, 415 fayl turi mos emas, 422 validatsiya, 429 juda ko'p urinish

Login 1 daqiqada 10 martadan, ketma-ket 5 ta xato parolda 15 daqiqaga bloklanadi (429).

### Ro'yxatlar va sahifalash

`?page=1&limit=50` ishlaydigan joylar: `/notifications`, `/admin/students`, `/admin/audit-logs`. Javob massiv, jami son `X-Total-Count` sarlavhasida.

### Statuslar (aniq matnlar)

Vazifa holati (o'quvchi va ustoz ro'yxatlarida, kichik harfda):

- `done` Bajarilgan
- `pending` Kutilmoqda
- `returned` Qaytarilgan
- `not-done` Bajarilmagan
- `not-assigned` Berilmagan

Boshqa qiymatlar:
- Dars: `completed` yoki `in-progress`
- Davomat: `present`, `absent`, `null` (belgi yo'q). Jurnalda katak: `present`, `absent`, `upcoming`
- Imtihon: `done` (ball bor), `ready` (kirishga ruxsat bor), `blocked` (ruxsat yo'q, `missingLessons` ro'yxati bilan keladi)
- Kun: `MON TUE WED THU FRI SAT SUN`
- Kalendar turi: `lesson`, `exam`, `deadline`
- Rol: `STUDENT`, `TEACHER`, `ADMIN`

Kechikish: javobda `rawBall` (ustoz qo'ygan), `ball` (hisobga olingan) va `late` keladi. Interfeysda `85 - 10 = 75` ko'rinishida ko'rsating.

### Fayl yuklash

1. `POST /files?purpose=answer` (o'quvchi javobi), `material` (ustoz vazifa materiali) yoki `video` (faqat ustoz). Body `multipart/form-data`, maydon nomi `file`.
2. Javob: `{ id, name, size, mime }`.
3. `id` larni keyingi so'rovda yuboring:
   - javob topshirish: `fileIds: [...]` (3 tagacha, har biri 25 MB gacha)
   - vazifa materiali: `attachmentIds: [...]` (5 tagacha, 20 MB gacha)
   - dars videosi: `videoFileId` (1 ta, 300 MB gacha)
4. Faylni ochish: `GET /files/:id` (Authorization sarlavhasi bilan). Video uchun brauzer Range so'rovini o'zi yuboradi.

Video elementi sarlavha yubora olmaydi. Shuning uchun video faylni `fetch` bilan Blob qilib oling yoki backend jamoasi bilan cookie/qisqa muddatli havola kelishing. Dars `video_url` (tashqi havola) bo'lsa, to'g'ridan-to'g'ri `<video src>` yoki iframe ishlatiladi.

### Video progress

Video o'ynayotganda vaqti-vaqti bilan `PUT /student/lessons/:lessonId/progress` `{ percent }` yuboring (0 dan 100 gacha butun son). Server faqat oshishga ruxsat beradi, kamaytirmaydi. Javob: `{ progress, completed }`. 100 bo'lsa dars tugatilgan.

### Sahifalar va endpointlar

O'quvchi:
- `/` bosh sahifa: `GET /student/dashboard`
- `/groups`: `GET /student/groups`
- `/lessons`: `GET /student/groups/:groupId/lessons`
- `/lessons/:id`: `GET /student/lessons/:lessonId`, `PUT .../progress`, `POST .../homework`
- `/leaderboard`: `GET /student/groups/:groupId/leaderboard`
- `/payments`: `GET /student/payments`
- `/analytics`: `GET /student/analytics`
- kalendar: `GET /student/calendar?month=2026-11`
- `/career`, `/guides`: `GET /career-videos`, `GET /guides`, `GET /faqs`
- `/settings`: `GET` va `PUT /me/settings`, `POST /me/password`

Ustoz:
- `/teacher`: `GET /teacher/dashboard`
- `/teacher/groups`: `GET /teacher/groups`, `GET /teacher/groups/:id/students`
- `/teacher/lessons`: `GET /teacher/groups/:groupId/lessons`
- `/teacher/lessons/new`: `POST /teacher/lessons`
- `/teacher/lessons/:id`: `GET /teacher/lessons/:id`, `PUT .../info`, `PUT .../homework`, davomat endpointlari, `grade` va `return`
- `/teacher/journal`: `GET /teacher/groups/:groupId/journal`
- `/teacher/review`: `GET /teacher/review`
- imtihon: `GET /teacher/exams/:id`, `PUT /teacher/exams/:id/students/:studentId`

Admin:
- `/admin`: `GET /admin/dashboard`
- `/admin/students`: `GET`, `POST /admin/students`, `POST .../enrol`, `PUT .../account`
- `/admin/teachers`: `GET`, `POST /admin/teachers`, `PUT .../account`
- `/admin/rooms`: `GET`, `POST`, `PUT /admin/rooms`, `GET /admin/rooms/timetable?day=MON`, `GET /admin/rooms/free?days=MON,WED&start=18:00`
- `/admin/groups`: `GET`, `POST /admin/groups`
- `/admin/payments`: `GET /admin/payments`, `PUT /admin/groups/:id/payment-plan`, `POST /admin/payments`

Hamma endpointning aniq body va parametrlari Swagger da.

### Localstorage dan APIga o'tish

- `skillsup:session` o'rniga token va refreshToken
- `skillsup:preferences` o'rniga `GET` va `PUT /me/settings`
- `skillsup:lessons`, `skillsup:teacher`, `skillsup:exams`, `skillsup:admin` o'rniga yuqoridagi endpointlar
- Demo parol xeshini (SHA-256) frontenddan olib tashlang. Parol faqat serverga yuboriladi.

### Fetch uchun namuna

```ts
const BASE = 'http://localhost:3000/api/v1';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw data.error;
  return data as T;
}
```

Xatoni ushlaganda `error.message` va `error.fields` ni ishlating.

## Hujjatdan tashqari qo'shilgan funksiyalar

- Refresh token va logout (tokenVersion orqali hamma sessiyani bekor qilish)
- Login uchun IP bo'yicha vaqtincha bloklash va throttler
- Admin harakatlari jurnali: `GET /admin/audit-logs`
- Haftalik reyting snapshoti (har dushanba 00:00 Asia/Tashkent) va qo'lda: `POST /admin/rank-snapshots`. Shu orqali reytingdagi `delta` hisoblanadi.
- O'quvchini guruhdan chiqarish: `DELETE /admin/students/:id/groups/:groupId` (ma'lumotlar saqlanadi)
- Foydalanuvchini o'chirmasdan bloklash: `PUT /admin/users/:id/active`
- To'lov yozish: `POST /admin/payments`
- Admin uchun karyera video, qo'llanma va FAQ qo'shish/o'chirish: `/admin/content/*`
- Bildirishnoma: bitta o'qildi qilish va o'qilmaganlar soni
- Yangi dars, yangi vazifa, topshirilgan ish, imtihon bali uchun avtomatik bildirishnoma
- Ro'yxatlarda `?page=&limit=` va `X-Total-Count` sarlavhasi (bildirishnomalar, o'quvchilar, jurnal)
- Kalendar: haqiqiy darslar, vazifa muddatlari va guruh jadvalidan hisoblangan kelgusi mashg'ulotlar
- Fayl imzosini tekshirish va Range bilan video oqimi

## Qabul qilingan qarorlar (hujjatdagi ochiq savollar)

- Streak: bugun yoki kecha faol bo'lsa, shu kundan orqaga ketma-ket faol kunlar soni. Faollik: video progress, vazifa topshirish, davomat.
- Ko'nikmalar (skills): har guruh yo'nalishi bo'yicha tugatilgan darslar foizi. Darsga tag qo'shilsa o'zgartiriladi.
- Delta: oxirgi haftalik snapshotga nisbatan o'rin farqi. Snapshot yo'q bo'lsa 0.
- Guruhdan chiqarilgan o'quvchining tarixi saqlanadi.
- Dars vaqti kataklari `varchar` (HH:mm) ko'rinishida saqlanadi.
- Dars boshlangandan keyin qo'shilgan o'quvchi uchun vazifa muddati qo'shilgan paytdan hisoblanadi.
- Parolni admin o'zgartirsa, o'sha foydalanuvchining sessiyasi tugaydi.
- Seeddagi seshanba va payshanba kunlari hujjatdagi "Se/Pa" ga mos. "Ju 17:00" katakka tushmagani uchun juma 16:00 qo'yilgan.

## Tekshiruv natijasi

Unit testlar `npm test` bilan ishlaydi (kechikish jarimasi, kumush yaxlitlash, bosqich, imtihon bloklari). Lokal PostgreSQL bilan seed va asosiy oqimlar qo'lda sinab ko'rilgan: login, rol guard, davomat qulfi, imtihon bloki, xona va ustoz to'qnashuvi, fayl yuklash va Range, refresh, bloklash.
