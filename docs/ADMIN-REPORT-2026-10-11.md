# Admin panel — hisobot (2026-10-11)

Shoxcha: `claude/lumina-admin-2026-10-11`. `main`ga merge qilinmagan, PR ochilmagan.
Qoidalar va veb faqat `main`ga push bo'lganda deploy bo'ladi — shungacha ilova va
vebdagi yangi admin funksiyalari ishlab turgan Firebase'da **ishlamaydi**
(qoidalar eski).

## Nima qilindi

| Band | Veb (`/admin`) | Ilova (Sozlamalar → Admin) |
|---|---|---|
| 1. Overview | DAU, yangi userlar, postlar — kunlik grafik (14/30 kun, UTC), ochiq shikoyatlar, jadval ko'rinishi | Xuddi shu (grafik View'lardan, bosib qiymat ko'rinadi) |
| 2. Users | Server-side qidiruv (username, ism, email), bloklash/ochish (sabab bilan), rol tanlash | Xuddi shu |
| 3. Reports | open → reviewing → resolved/dismissed, izoh, postni yashirish, muallif/userni bloklash, audit izi | Xuddi shu; planshetda ro'yxat + tafsilot yonma-yon |
| 4. Activity | Admin amallari jurnali (`adminLogs`) + user hodisalari, tur va matn filtri | Xuddi shu |
| 5. Broadcast | Yozish, ko'rib chiqish, yuborish, o'chirish | Xuddi shu (RHF + Zod) |
| Notifications | E'lonlar bildirishnomalar bilan createdAt bo'yicha aralash, o'qilmagan nuqta | Xuddi shu, ekran ochilganda o'qilgan |

Moderator: Overview, Users, Reports, Activity. Admin: + Broadcast, Messages, Landing.
Admin paneli mavzusi: Avto / Yorug' / Qorong'i (veb sayt qolgan qismi avvalgidek faqat qorong'i).

## Ma'lumot modeli va qarorlar

- **Rollar** — `staffRoles/{uid}` `{role: moderator|admin}`. Hujjat yo'q = oddiy user.
  Faqat admin o'zgartiradi, o'zinikini hech qachon (pastlatish ham, ko'tarish ham).
  Egasi (`santexnika.atoyo@gmail.com`, tasdiqlangan email) hujjatsiz admin va uni
  bloklab/pastlatib bo'lmaydi. Rol uchun `email_verified` majburiy.
- **Bloklash** — `userBans/{uid}`. `signedIn()` ichida `request.method` tekshiriladi:
  o'qish o'zgarmaydi (qo'shimcha o'qish narxi yo'q), har qanday yozish bloklangan
  user uchun rad etiladi (post, izoh, like, follow, xabar, profil). Moderator
  staff'ni bloklay olmaydi.
- **Shikoyat** — hujjatning o'zi o'zgarmaydi; staff faqat `status`ni o'zgartiradi,
  o'tishlar qoidada tekshiriladi. Har qadam `reports/{id}/resolutions`ga (audit izi)
  va `adminLogs`ga yoziladi. `status`siz eski shikoyatlar ochiq hisoblanadi; eski
  `outcome` yozuvi bo'lsa, Reports sahifasi birinchi ochilganda holatni yozib qo'yadi.
- **Postni yashirish** — `posts/{id}.hidden` (faqat staff; muallif yashira ham, ocha
  ham olmaydi). Lentalar yashirilgan postni ko'rsatmaydi. Reel nusxasi o'chiriladi —
  qayta ochishda reel qaytmaydi. Qayta ochish UI'da yo'q (konsolda `hidden`ni olib tashlash).
- **DAU** — `activeDays/{YYYY-MM-DD}/users/{uid}`, kuniga bir marta (qurilmada belgi),
  qoidada faqat bugungi UTC kun. Shu bilan `users/{uid}.lastActiveAt` va
  `privateProfiles/{uid}` (email, qidiruv uchun; ommaviy profilda email yo'q) yoziladi:
  vebda — kirganda (`AuthContext`), ilovada — sessiya boshida (`RootNavigator`).
  Grafiklar `count()` bilan: har kun uchun 3 so'rov (30 kunda ~90 o'qish).
- **Broadcast** — bitta `broadcasts/{id}` hujjati, fan-out yo'q. Faqat admin yozadi,
  shakl qoidada tekshiriladi (sarlavha ≤120, matn ≤2000, havola faqat http/https).
  Kirgan har kim o'qiydi. **Ro'yxatdan o'tgandan keyingilar** ko'rsatiladi: e'lonlar
  vaqtga bog'liq, yangi userga oylar oldingi xabarlarni "o'qilmagan" qilib ko'rsatish
  shovqin. O'qilgan holati — `broadcastReads/{uid}.readAt` (bitta belgi).

## Tekshiruv

- `npm run typecheck` 0, `npm run lint` 0, `npm test` 82 ta test (yangi: `src/utils/__tests__/admin.test.ts`).
- `web`: `npm run build` ✓, `npm test` 17 ta (vitest: kunlar, holat o'tishlari, broadcast validatsiyasi).
- `rules-tests`: emulyatorda 33 ta holat (bloklangan user yozolmaydi, oddiy user rol bera
  olmaydi, admin o'z rolini o'zgartira olmaydi, faqat admin broadcast yozadi, javascript:
  havola rad etiladi, shikoyat o'tishlari va h.k.). Qoidani ataylab buzib tekshirildi —
  testlar yiqildi. CI'da `firestore-rules`, `web`, `functions` joblari qo'shildi.
- Metro bundle (android) ✓. Grafik/kartochkalar brauzerda dark/light, 390 px va 1280 px
  da ko'rib chiqildi. Admin sahifalarining o'zi haqiqiy akkaunt bilan sinalmagan
  (sessiyada login yo'q) — `main`ga chiqqach egasi qo'lda tekshirishi kerak.

## Egasi qilishi kerak

1. **Push (ixtiyoriy).** `functions/` tayyor (`onBroadcastCreated` → FCM topic `all`;
   ilova har sessiyada shu topicga obuna bo'ladi va Android 13+ da bildirishnoma
   ruxsatini so'raydi). Kerak: Firebase **Blaze** tarifi, so'ng
   `cd functions && npm ci && npx firebase-tools deploy --only functions --project lumina-007app`.
   Kalit/token repoga yozilmagan; funksiya loyiha service account'i bilan ishlaydi.
   Push vebga kelmaydi (veb faqat Notifications ro'yxatida ko'rsatadi).
2. **Indekslar.** Yangi so'rovlar faqat bitta maydon bo'yicha — kompozit indeks kerak emas.
3. **Moderator tayinlash.** Users → rol. Moderator email'ini tasdiqlagan bo'lishi kerak
   (Google bilan kirganlar avtomatik).

## Ma'lum cheklovlar / xavflar

- Kunlar UTC (Toshkentda kun 05:00 da almashadi).
- `lastActiveAt` va DAU kuniga bir marta yoziladi — kun ichidagi faollik ko'rinmaydi.
  Bloklangan userlar DAU'ga tushmaydi (yozish rad etiladi).
- Ism bo'yicha qidiruv faqat prefiks va katta-kichik harfga sezgir (kiritilgan va bosh harfi
  katta varianti qidiriladi). Email bo'yicha qidiruv faqat yangi kodda kirganlar uchun ishlaydi.
- Izohga (comment) shikoyatda postni topib bo'lmaydi — faqat holat va izoh.
- Parallel shoxcha (`claude/lumina-ux-2026-10-11`) bilan konflikt ehtimoli: `firestore.rules`
  (`signedIn()`, posts bloki), `web/src/pages/app/Notifications.tsx`,
  `src/features/notifications/components/NotificationList.tsx`. Yangi kolleksiyalar faylning
  oxirida alohida blokda; tarjimalar alohida fayllarda (`admin.*.json`, `web/src/i18n/admin.*.ts`).
