/** [o'zbekcha, ruscha, inglizcha]. Matn aynan mos kelsa almashtiriladi. */
export const WORDS: [string, string, string][] = [
  // Menyu va umumiy
  ['Bosh sahifa', 'Главная', 'Home'], ['Guruhlarim', 'Мои группы', 'My groups'], ['Darslar', 'Уроки', 'Lessons'], ['Reyting', 'Рейтинг', 'Leaderboard'],
  ['Kalendar', 'Календарь', 'Calendar'], ['Tahlil', 'Аналитика', 'Analytics'], ["To'lovlar", 'Платежи', 'Payments'], ['Karyera', 'Карьера', 'Career'],
  ["Qo'llanma", 'Руководство', 'Guides'], ['Sozlamalar', 'Настройки', 'Settings'], ['Guruhlar', 'Группы', 'Groups'], ['Dars boshlash', 'Начать урок', 'Start lesson'],
  ['Jurnal', 'Журнал', 'Journal'], ['Tekshirish', 'Проверка', 'Review'], ["O'quvchilar", 'Ученики', 'Students'], ['Ustozlar', 'Преподаватели', 'Teachers'],
  ['Xonalar', 'Кабинеты', 'Rooms'], ['Yordam', 'Помощь', 'Help'], ['Chiqish', 'Выйти', 'Log out'], ['ASOSIY MENYU', 'ГЛАВНОЕ МЕНЮ', 'MAIN MENU'],
  ['Asosiy menyu', 'Главное меню', 'Main menu'], ["Asosiy bo'limlar", 'Основные разделы', 'Main sections'], ['Yon panel', 'Боковая панель', 'Side panel'],
  ['Menyu', 'Меню', 'Menu'], ['Menyuni ochish', 'Открыть меню', 'Open menu'], ['Menyuni yopish', 'Закрыть меню', 'Close menu'], ['EDUCATION PLATFORM', 'ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА', 'EDUCATION PLATFORM'],
  ['Orqaga', 'Назад', 'Back'], ['Tahrirlash', 'Редактировать', 'Edit'], ["Ma'lumotlar o'zgartirildi", 'Данные изменены', 'Details changed'], ["Faqat o'zgartirmoqchi bo'lgan maydonlarni to'ldiring.", 'Заполните только те поля, которые хотите изменить.', 'Fill in only the fields you want to change.'],
  ['Profil', 'Профиль', 'Profile'], ['Profil va surat', 'Профиль и фото', 'Profile & photo'], ['Profil surati', 'Фото профиля', 'Profile photo'],
  ["Qorong'i", 'Тёмная', 'Dark'], ["Yorug'", 'Светлая', 'Light'], ["Qorong'i rejim", 'Тёмный режим', 'Dark mode'], ["Yorug' rejim", 'Светлый режим', 'Light mode'], ['Tizim', 'Система', 'System'],
  ['Til', 'Язык', 'Language'], ['Mavzu', 'Тема', 'Theme'], ['Qidirish', 'Поиск', 'Search'], ['Qidirish...', 'Поиск...', 'Search...'], ['Tozalash', 'Очистить', 'Clear'],
  ["Tezkor o'tish", 'Быстрый переход', 'Quick links'], ['Bildirishnomalar', 'Уведомления', 'Notifications'], ["Bildirishnoma yo'q.", 'Уведомлений нет.', 'No notifications.'],
  ["So'nggi xabarlar", 'Последние сообщения', 'Latest messages'], ["Hammasini o'qildi", 'Прочитать все', 'Mark all as read'], ['Tezkor yordam', 'Быстрая помощь', 'Quick help'],
  ['Qidirishni ochish', 'Открыть поиск', 'Open search'], ['Qidiruv natijasini tanlash', 'Выбрать результат', 'Pick a result'], ['Oynani yopish', 'Закрыть окно', 'Close window'],
  ['Yuklanmoqda...', 'Загрузка...', 'Loading...'], ['Kuting...', 'Подождите...', 'Please wait...'], ['Yopish', 'Закрыть', 'Close'], ['Keyinroq', 'Позже', 'Later'],
  ["Ma'lumot yo'q.", 'Нет данных.', 'No data.'], ['Ruxsat berilgan', 'Разрешено', 'Allowed'],
  // Umumiy tugmalar
  ["Qo'shish", 'Добавить', 'Add'], ['Saqlash', 'Сохранить', 'Save'], ['Bekor qilish', 'Отмена', 'Cancel'], ["O'zgartirish", 'Изменить', 'Change'], ['Olib tashlash', 'Убрать', 'Remove'],
  ['Oldingi', 'Назад', 'Previous'], ['Keyingi', 'Далее', 'Next'], ["Ko'rish", 'Смотреть', 'View'], ['Nusxa olish', 'Копировать', 'Copy'], ["Ko'rsatish", 'Показать', 'Show'], ['Yashirish', 'Скрыть', 'Hide'],
  ['Yuklab olish (CSV)', 'Скачать (CSV)', 'Download (CSV)'], ['Fayl tanlash', 'Выбрать файл', 'Choose file'], ['Topshirish', 'Отправить', 'Submit'], ['Baholash', 'Оценить', 'Rate'],
  ['Kirish →', 'Войти →', 'Sign in →'], ['Kirish', 'Войти', 'Sign in'], ['Yozish', 'Записать', 'Record'], ['Yuborish', 'Отправить', 'Send'], ['Ochish', 'Открыть', 'Open'],
  // Kirish sahifasi
  ['Xush kelibsiz', 'Добро пожаловать', 'Welcome'], ['Login', 'Логин', 'Login'], ['Parol', 'Пароль', 'Password'], ['Loginni kiriting', 'Введите логин', 'Enter login'], ['Parolingizni kiriting', 'Введите пароль', 'Enter password'],
  ['O‘qishni davom ettirish uchun hisobingizga kiring.', 'Войдите, чтобы продолжить обучение.', 'Sign in to continue learning.'], ['Eduvia · Learning management platform', 'Eduvia · Платформа управления обучением', 'Eduvia · Learning management platform'],
  // Dashboard
  ['Kumush', 'Серебро', 'Silver'], ['Bosqich', 'Уровень', 'Level'], ['Kunlik seriya', 'Серия дней', 'Daily streak'], ["Umumiy o'rin", 'Общее место', 'Overall rank'], ['Bosqich progressi', 'Прогресс уровня', 'Level progress'],
  ["Guruhlardagi o'rin", 'Место в группах', 'Rank in groups'], ['Yaqin hodisalar', 'Ближайшие события', 'Upcoming events'], ["So'nggi faoliyat", 'Последняя активность', 'Recent activity'],
  ["Bugungi o'qish holatingiz va natijalaringiz", 'Ваше обучение и результаты на сегодня', "Today's learning progress and results"], ["Yaqin hodisa yo'q.", 'Ближайших событий нет.', 'No upcoming events.'], ["Faoliyat yo'q.", 'Активности нет.', 'No activity.'],
  ["Guruh yo'q.", 'Групп нет.', 'No groups.'], ['Guruhlaringiz va tekshirilishi kerak bo\'lgan ishlar', 'Ваши группы и работы на проверку', 'Your groups and work to review'], ["O'quv markazining bugungi holati", 'Состояние центра на сегодня', "Today's status of the center"],
  ["O'tilgan darslar", 'Проведённые уроки', 'Lessons held'], ['Tekshirishni kutayotgan', 'Ожидают проверки', 'Awaiting review'], ['Yaqin darslar', 'Ближайшие уроки', 'Upcoming lessons'], ["Yaqin dars yo'q.", 'Ближайших уроков нет.', 'No upcoming lessons.'],
  ["Guruh biriktirilmagan.", 'Группа не назначена.', 'No group assigned.'], ["Bugun bo'sh kataklar", 'Свободные слоты сегодня', 'Free slots today'], ["Yaqin to'lovlar", 'Ближайшие платежи', 'Upcoming payments'], ["Yaqin to'lov yo'q.", 'Ближайших платежей нет.', 'No upcoming payments.'],
  ["So'nggi eslatmalar", 'Последние напоминания', 'Recent reminders'], ['Eslatma yuborilmagan.', 'Напоминания не отправлялись.', 'No reminders sent.'], ['Yuborilgan eslatmalar', 'Отправленные напоминания', 'Sent reminders'],
  ['Yuborilgan', 'Отправлено', 'Sent'], ['Qabul qiluvchi', 'Получатель', 'Recipient'], ['Qoldi', 'Осталось', 'Left'], ['Sana', 'Дата', 'Date'], ['Summa', 'Сумма', 'Amount'], ['Vaqt', 'Время', 'Time'],
  // Guruh / dars
  ['Guruh', 'Группа', 'Group'], ['Guruh nomi', 'Название группы', 'Group name'], ["Yo'nalish", 'Направление', 'Course'], ['Ustoz', 'Преподаватель', 'Teacher'], ["O'quvchi", 'Ученик', 'Student'], ['Xona', 'Кабинет', 'Room'],
  ['Dars', 'Урок', 'Lesson'], ['Dars nomi', 'Название урока', 'Lesson title'], ["Dars ma'lumotlari", 'Данные урока', 'Lesson details'], ['Video', 'Видео', 'Video'], ['Video havola', 'Ссылка на видео', 'Video link'],
  ["Video hali qo'shilmagan.", 'Видео ещё не добавлено.', 'No video yet.'], ["Videoni yuklab bo'lmadi.", 'Не удалось загрузить видео.', 'Could not load video.'], ['Videoni ochish', 'Открыть видео', 'Open video'],
  ['Uyga vazifa', 'Домашнее задание', 'Homework'], ['Vazifa', 'Задание', 'Task'], ['Vazifalar', 'Задания', 'Tasks'], ['Imtihon', 'Экзамен', 'Exam'], ['Imtihonlar', 'Экзамены', 'Exams'], ['Imtihon natijalari', 'Результаты экзаменов', 'Exam results'],
  ['Davomat', 'Посещаемость', 'Attendance'], ['Keldi', 'Пришёл', 'Present'], ['Kelmadi', 'Не пришёл', 'Absent'], ['Ketdi', 'Ушёл', 'Left'], ['Hammasi keldi', 'Все пришли', 'All present'], ['Davomatni saqlash', 'Сохранить посещаемость', 'Save attendance'],
  ['Saqlangan (qulflangan)', 'Сохранено (заблокировано)', 'Saved (locked)'], ["Davomat saqlangan va qulflangan, o'zgartirib bo'lmaydi.", 'Посещаемость сохранена и заблокирована, изменить нельзя.', 'Attendance is saved and locked; it cannot be changed.'],
  ["Saqlangandan keyin davomatni o'zgartirib bo'lmaydi.", 'После сохранения посещаемость изменить нельзя.', 'Attendance cannot be changed after saving.'],
  ['Dars baholari', 'Оценки урока', 'Lesson ratings'], ["O'quvchilar uyga vazifadan oldin darsni baholaydi", 'Ученики оценивают урок перед домашним заданием', 'Students rate the lesson before the homework'], ["Hali baho qo'yilmagan.", 'Оценок пока нет.', 'No ratings yet.'],
  ['Darsni baholang', 'Оцените урок', 'Rate the lesson'], ['Bugungi darsni baholang. Bu ustozga darsni yaxshilashga yordam beradi.', 'Оцените урок. Это поможет преподавателю улучшить занятия.', 'Rate the lesson. It helps the teacher improve.'],
  ['Uyga vazifani topshirishdan oldin bugungi darsni baholang. Bu ustozga darsni yaxshilashga yordam beradi.', 'Перед отправкой домашнего задания оцените сегодняшний урок. Это поможет преподавателю улучшить занятия.', "Please rate today's lesson before submitting your homework. It helps the teacher improve."],
  ['Izoh (ixtiyoriy)', 'Комментарий (необязательно)', 'Comment (optional)'], ['Vazifani topshirish uchun avval darsni baholang.', 'Чтобы отправить задание, сначала оцените урок.', 'Rate the lesson before submitting the homework.'],
  ['Siz darsni baholadingiz:', 'Вы оценили урок:', 'You rated the lesson:'], ['Shu guruhning boshqa darslari', 'Другие уроки этой группы', 'Other lessons in this group'], ['Mukofot', 'Награда', 'Reward'], ['Keyingi dars', 'Следующий урок', 'Next lesson'],
  ['Bu darsga vazifa berilmagan.', 'К этому уроку нет задания.', 'No homework for this lesson.'], ['Bu dars imtihon', 'Этот урок — экзамен', 'This lesson is an exam'], ['Dars topilmadi.', 'Урок не найден.', 'Lesson not found.'], ['Darsni boshlash', 'Начать урок', 'Start lesson'],
  ['Sizning javobingiz', 'Ваш ответ', 'Your answer'], ['Topshirilgan', 'Отправлено', 'Submitted'], ['Topshirgan', 'Сдал', 'Submitted'], ['Kechikkan', 'С опозданием', 'Late'], ['Qaytarilgan', 'Возвращено', 'Returned'], ['Bajarilgan', 'Выполнено', 'Done'],
  ['Bajarilmagan', 'Не выполнено', 'Not done'], ['Berilmagan', 'Не назначено', 'Not assigned'], ['Kutilmoqda', 'Ожидает', 'Pending'], ['Baholangan', 'Оценено', 'Graded'], ['Berilgan vazifa', 'Выдано заданий', 'Assigned'], ['Jarayonda', 'В процессе', 'In progress'],
  ['Tugatilgan', 'Завершено', 'Completed'], ['Holat', 'Статус', 'Status'], ['Ball', 'Балл', 'Score'], ["O'rtacha ball", 'Средний балл', 'Average score'], ['Qatnashgan', 'Посетил', 'Attended'], ['Matn yo\'q.', 'Текста нет.', 'No text.'],
  ['Uyga vazifalarni tekshirish', 'Проверка домашних заданий', 'Homework review'], ["Topshirilgan ishlarni shu yerda ko'ring, baholang yoki qaytaring", 'Смотрите, оценивайте или возвращайте работы здесь', 'View, grade or return submitted work here'],
  ["Tekshiriladigan ish yo'q. Hammasi baholangan.", 'Нет работ на проверку. Всё оценено.', 'Nothing to review. All graded.'], ['Chapdan tekshiriladigan ishni tanlang.', 'Выберите работу слева.', 'Pick a submission on the left.'], ['Hamma guruh', 'Все группы', 'All groups'],
  ['Qaytarish izohi', 'Комментарий к возврату', 'Return comment'], ['Qaytarish (+24 soat)', 'Вернуть (+24 часа)', 'Return (+24 hours)'], ['Oldingi izoh:', 'Прошлый комментарий:', 'Previous comment:'],
  // Tahlil / to'lov / reyting
  ['Tahlil', 'Аналитика', 'Analytics'], ["O'qish jarayoningiz statistikasi", 'Статистика вашего обучения', 'Your learning statistics'], ['Tugatilgan darslar', 'Завершённые уроки', 'Completed lessons'], ['Jami soat', 'Всего часов', 'Total hours'],
  ['Tugatilgan darslar soni', 'Количество завершённых уроков', 'Completed lessons count'], ["Shu hafta o'qish soatlari", 'Часы учёбы за неделю', 'Study hours this week'], ['Haftalik XP', 'XP по неделям', 'Weekly XP'], ["Yo'nalishlar bo'yicha progress", 'Прогресс по направлениям', 'Progress by course'],
  ['Kun', 'День', 'Day'], ['Soat', 'Часы', 'Hours'], ['Hafta', 'Неделя', 'Week'], ["To'lovlarim", 'Мои платежи', 'My payments'], ["Jami to'langan", 'Всего оплачено', 'Total paid'], ["To'lovlar soni", 'Количество платежей', 'Payments count'],
  ["Oxirgi to'lov", 'Последний платёж', 'Last payment'], ["Keyingi to'lovlar", 'Следующие платежи', 'Next payments'], ["To'lov tarixi bo'sh.", 'История платежей пуста.', 'Payment history is empty.'], ["To'lovlar tarixi", 'История платежей', 'Payment history'], ['Usul', 'Способ', 'Method'], ['Izoh', 'Комментарий', 'Note'],
  ["Eng yaxshi o'quvchilar (XP)", 'Лучшие ученики (XP)', 'Top students (XP)'], ["To'liq reyting", 'Полный рейтинг', 'Full leaderboard'], ["O'rin", 'Место', 'Rank'], ['Ism', 'Имя', 'Name'], ["O'zgarish", 'Изменение', 'Change'],
  ['Jadval', 'Расписание', 'Schedule'], ["Bu oyda hodisa yo'q.", 'В этом месяце событий нет.', 'No events this month.'],
  // Karyera / qo'llanma
  ['Karyera videolari', 'Карьерные видео', 'Career videos'], ["Ko'p so'raladigan savollar", 'Частые вопросы', 'FAQ'], ["To'liq o'qish", 'Читать полностью', 'Read more'], ["To'liq qo'llanmani ochish →", 'Открыть полное руководство →', 'Open full guide →'],
  // Admin
  ["O'quvchi qo'shish", 'Добавить ученика', 'Add student'], ["Ustoz qo'shish", 'Добавить преподавателя', 'Add teacher'], ['Guruh ochish', 'Создать группу', 'Create group'], ['Xona qo\'shish', 'Добавить кабинет', 'Add room'], ["Ro'yxat", 'Список', 'List'],
  ["Guruhlar ro'yxati", 'Список групп', 'Group list'], ['Xonalar jadvali', 'Расписание кабинетов', 'Room schedule'], ["Guruhlar to'lov rejasi", 'План платежей групп', 'Group payment plans'], ["To'lovni yozish", 'Записать платёж', 'Record payment'],
  ["To'lov yozildi.", 'Платёж записан.', 'Payment recorded.'], ['Telefon', 'Телефон', 'Phone'], ['Email', 'Email', 'Email'], ['Ism va familiya', 'Имя и фамилия', 'Full name'], ['Logini', 'Логин', 'Login'], ['Login/parol', 'Логин/пароль', 'Login/password'],
  ["O'zgartirgan", 'Изменён', 'Changed'], ["O'quvchilari", 'Ученики', 'Students'], ["Ustozlar, ularning o'quvchilari, login va parollari", 'Преподаватели, их ученики, логины и пароли', 'Teachers, their students, logins and passwords'], ['Guruhlar', 'Группы', 'Groups'],
  ["O'quvchi topilmadi.", 'Ученик не найден.', 'Student not found.'], ['Ustoz topilmadi.', 'Преподаватель не найден.', 'Teacher not found.'], ['Guruh topilmadi.', 'Группа не найдена.', 'Group not found.'], ["Bu ustozda hali o'quvchi yo'q.", 'У этого преподавателя пока нет учеников.', 'This teacher has no students yet.'],
  ['Qidirish: ism, login, telefon', 'Поиск: имя, логин, телефон', 'Search: name, login, phone'], ["Qidirish: guruh, yo'nalish, ustoz", 'Поиск: группа, направление, преподаватель', 'Search: group, course, teacher'], ['Bloklangan', 'Заблокирован', 'Blocked'], ['Yangi', 'Новый', 'New'],
  ['Harakatlar jurnali', 'Журнал действий', 'Activity log'], ["Admin panelda bajarilgan barcha o'zgarishlar", 'Все изменения в панели администратора', 'All changes made in the admin panel'], ['Harakat', 'Действие', 'Action'], ['Kim', 'Кто', 'Who'], ['Kimga / nimaga', 'Кому / чему', 'Target'], ["Ma'lumot", 'Данные', 'Details'],
  ['Hozircha harakat yo\'q.', 'Пока действий нет.', 'No activity yet.'], ["O'quvchi qo'shildi", 'Ученик добавлен', 'Student added'], ["Ustoz qo'shildi", 'Преподаватель добавлен', 'Teacher added'], ["Login/parol o'zgartirildi", 'Логин/пароль изменён', 'Login/password changed'],
  ["O'quvchi guruhga qo'shildi", 'Ученик добавлен в группу', 'Student added to group'], ["O'quvchi guruhdan chiqarildi", 'Ученик удалён из группы', 'Student removed from group'], ['Guruh yaratildi', 'Группа создана', 'Group created'], ["To'lov yozildi", 'Платёж записан', 'Payment recorded'],
  ["To'lov eslatmasi yuborildi", 'Напоминание об оплате отправлено', 'Payment reminder sent'], ['Foydalanuvchi bloklandi', 'Пользователь заблокирован', 'User blocked'], ['Foydalanuvchi faollashtirildi', 'Пользователь активирован', 'User activated'], ['Tizim', 'Система', 'System'],
  // Sozlamalar / profil
  ['Parolni o\'zgartirish', 'Сменить пароль', 'Change password'], ['Joriy parol', 'Текущий пароль', 'Current password'], ['Yangi parol', 'Новый пароль', 'New password'], ['Yangi login', 'Новый логин', 'New login'], ["Parol o'zgartirildi.", 'Пароль изменён.', 'Password changed.'],
  ['Email orqali bildirishnoma', 'Уведомления по email', 'Email notifications'], ['Push bildirishnoma', 'Push-уведомления', 'Push notifications'], ['Eslatmalar', 'Напоминания', 'Reminders'], ['Surat tanlash', 'Выбрать фото', 'Choose photo'], ['Suratni almashtirish', 'Сменить фото', 'Change photo'],
  ["Suratni o'zgartirish", 'Изменить фото', 'Change photo'], ["Surat va shaxsiy ma'lumotlaringiz", 'Фото и личные данные', 'Your photo and personal details'], ["Rasmni shu yerga tashlang yoki bosing", 'Перетащите фото сюда или нажмите', 'Drop a photo here or click'],
  ["JPG, PNG yoki WEBP. Rasm avtomatik kvadrat qilib kesiladi.", 'JPG, PNG или WEBP. Фото автоматически обрезается до квадрата.', 'JPG, PNG or WEBP. The photo is cropped to a square automatically.'], ["Eng ko'pi bilan 12 MB", 'Не более 12 МБ', 'Up to 12 MB'],
  ['Profil surati yangilandi.', 'Фото профиля обновлено.', 'Profile photo updated.'], ['Profil surati olib tashlandi.', 'Фото профиля удалено.', 'Profile photo removed.'], ['Yuklanmoqda', 'Загрузка', 'Uploading'],
  ['Qidiruv bazasi yuklanmoqda...', 'Загрузка поисковой базы...', 'Loading search index...'], ['Yana natijalar yuklanmoqda...', 'Загружаются ещё результаты...', 'Loading more results...'], ['Fayllar', 'Файлы', 'Files'], ['Javob (2000 belgigacha)', 'Ответ (до 2000 символов)', 'Answer (up to 2000 characters)'],
  ['Fayllar (3 tagacha, har biri 25 MB gacha)', 'Файлы (до 3, каждый до 25 МБ)', 'Files (up to 3, 25 MB each)'], ['Ball (1-100)', 'Балл (1-100)', 'Score (1-100)'], ['Hamma holat', 'Все статусы', 'All statuses'], ['Hamma vazifa', 'Все задания', 'All tasks'],
  ['Yangilari avval', 'Сначала новые', 'Newest first'], ['Eskilari avval', 'Сначала старые', 'Oldest first'], ['Tanlang', 'Выберите', 'Select'], ['Guruh tanlang', 'Выберите группу', 'Select group'], ['Kunlar', 'Дни', 'Days'], ['Muddat', 'Срок', 'Deadline'], ['Nom', 'Название', 'Name'],
  ["A'zolar", 'Участники', 'Members'], ['Foiz', 'Процент', 'Percent'], ['Xonalar', 'Кабинеты', 'Rooms'], ['Ruxsat', 'Разрешено', 'Allowed'], ['Dushanba', 'Понедельник', 'Monday'], ['Seshanba', 'Вторник', 'Tuesday'], ['Chorshanba', 'Среда', 'Wednesday'],
  ['Payshanba', 'Четверг', 'Thursday'], ['Juma', 'Пятница', 'Friday'], ['Shanba', 'Суббота', 'Saturday'], ['Yakshanba', 'Воскресенье', 'Sunday'], ['Du', 'Пн', 'Mo'], ['Se', 'Вт', 'Tu'], ['Ch', 'Ср', 'We'], ['Pa', 'Чт', 'Th'], ['Ju', 'Пт', 'Fr'], ['Sh', 'Сб', 'Sa'], ['Ya', 'Вс', 'Su'],
  ['Siz hali guruhga qo\'shilmagansiz.', 'Вы ещё не добавлены в группу.', 'You are not in a group yet.'], ['Sizga guruh biriktirilmagan.', 'Вам не назначена группа.', 'No group assigned to you.'], ['Asosiy', 'Основное', 'Main'],
];

const MONTHS_UZ = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
export const MONTHS = {
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
export { MONTHS_UZ };

export const GREETINGS: Record<string, [string, string]> = {
  'Xayrli tong': ['Доброе утро', 'Good morning'],
  'Xayrli kun': ['Добрый день', 'Good afternoon'],
  'Xayrli kech': ['Добрый вечер', 'Good evening'],
  'Xayrli tun': ['Доброй ночи', 'Good night'],
};
