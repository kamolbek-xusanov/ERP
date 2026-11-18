# Skills Up frontend

React + TypeScript frontend. Backend (`skillsup-backend`) bilan REST orqali ishlaydi.
Hozir sahifalar to'liq ishlaydi, lekin dizayn sodda holatda. Dizayn keyin qo'yiladi.

## Ishga tushirish

1. Backendni ishga tushiring (`http://localhost:3000`), `npm run seed` bilan demo ma'lumot qo'ying.
2. `npm install`
3. `cp .env.example .env` (kerak bo'lsa `VITE_API_URL` ni o'zgartiring)
4. `npm run dev`
5. Brauzerda http://localhost:5173 ni oching.

Backend `.env` ida `CORS_ORIGINS` ichida `http://localhost:5173` bo'lishi kerak (standart holatda bor).

Demo hisoblar: `admin / admin123`, `dilnoza.rahimova / ustoz123`, `bekzod.rahimov / oquvchi123`.

Buyruqlar: `npm run dev`, `npm run build`, `npm run preview`, `npm run typecheck`.

## Stack

- React 18, TypeScript, Vite
- react-router-dom 6 (yo'nalishlar va rol himoyasi)
- @tanstack/react-query 5 (so'rovlar va kesh)
- Tashqi UI kutubxonasi yo'q. Hamma stil `src/styles` ichida.

## Tuzilma

```
src/
  main.tsx                 kirish nuqtasi, provayderlar, tema
  App.tsx                  hamma yo'nalishlar
  api/
    client.ts              fetch, token, avtomatik refresh, xato, fayl yuklash
    types.ts               API javob turlari
  auth/
    AuthContext.tsx        login, logout, joriy foydalanuvchi
    Guards.tsx             rol himoyasi (RequireRole, GuestOnly)
  hooks/                   useGet, useAction, useBlobUrl
  components/              ui.tsx (Button, Card, Table, Field...), GroupPicker, FileUpload, VideoPlayer, DownloadLink
  layouts/AppShell.tsx     yon menyu, tepa panel, bildirishnomalar
  pages/
    LoginPage.tsx
    shared/SettingsPage.tsx
    student/               10 ta sahifa
    teacher/               8 ta sahifa
    admin/                 8 ta sahifa
  styles/
    tokens.css             ranglar, masofalar, shriftlar (tema o'zgaruvchilari)
  utils/                   format.ts (sana, pul, status matnlari), theme.ts
```

## Qanday ishlaydi

- Login: `POST /auth/login`, token va refreshToken `localStorage` ga saqlanadi.
- Har so'rovga `Authorization: Bearer` avtomatik qo'shiladi.
- 401 kelsa bir marta refresh qilib so'rov takrorlanadi. Refresh ham o'tmasa foydalanuvchi `/login` ga qaytadi.
- Rol himoyasi: kirmagan odam `/login` ga, boshqa rol sahifasiga kirsa o'z bosh sahifasiga yo'naltiriladi.
- Xatolar: `error.message` yuqorida, `error.fields` mos input tagida ko'rsatiladi.
- Video: tashqi havola bo'lsa `<video>` yoki havola, fayl bo'lsa token bilan Blob qilib olinadi. Progress faqat o'ynatib ko'rilganda oshadi va har 8 soniyada serverga yuboriladi.
- Fayl yuklash: `FileUpload` komponenti `POST /files?purpose=...` ni chaqiradi va `id` larni qaytaradi.

## Sahifalar

O'quvchi: `/` bosh sahifa, `/groups`, `/lessons`, `/lessons/:id`, `/leaderboard`, `/calendar`, `/analytics`, `/payments`, `/career`, `/guides`, `/settings`

Ustoz: `/teacher`, `/teacher/groups`, `/teacher/lessons`, `/teacher/lessons/new`, `/teacher/lessons/:id`, `/teacher/exams/:id`, `/teacher/journal`, `/teacher/review`, `/teacher/settings`

Admin: `/admin`, `/admin/students`, `/admin/teachers`, `/admin/groups`, `/admin/rooms`, `/admin/payments`, `/admin/audit`, `/admin/settings`

## Dizaynni almashtirish

Mantiq va ko'rinish alohida, shuning uchun dizayn qo'yish oson:

- Ranglar, burchak radiusi, masofalar: `src/styles/tokens.css` (qorong'i va yorug' tema)
- Umumiy stillar: `src/styles/base.css`
- Tayyor bloklar: `src/components/ui.tsx` (Button, Card, Stat, Badge, Table, Field...). Bu fayl o'zgarsa hamma sahifa o'zgaradi.
- Joylashuv: `src/layouts/AppShell.tsx`
- Alohida sahifa ko'rinishi: `src/pages/...`

Sahifalardagi mantiqqa (so'rovlar, formalar) tegmasdan faqat ko'rinishni o'zgartirish mumkin.
