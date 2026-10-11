# Lumina — loyiha haqida

> Instagram uslubidagi ijtimoiy tarmoq: Android ilova (bare React Native) va veb.
> Veb: https://lumina-007app.web.app · APK: https://github.com/Abdulmajidkhan007/lumina/releases/latest/download/lumina.apk
> Oxirgi tekshiruv: 2026-10-11 (koddan).

## Nima uchun

Social ilovaning eng og'ir qismlarini — lenta, media yuklash, stories, reels,
real-time xabarlar, moderatsiya — real foydalanuvchilar bilan sinash. Veb
versiyada odamlar allaqachon post joylayapti.

## Hozir nima ishlaydi

| Qism | Mobil | Veb | Izoh |
|---|---|---|---|
| Ro'yxatdan o'tish, kirish (email, Google) | ✅ | ✅ | |
| Lenta, post (rasm/video), like, izoh, saqlash | ✅ | ✅ | Rasm yuklashdan oldin kichraytiriladi |
| Video post → Reels | ✅ | ✅ | Bitta videoli post `reels/{postId}` ga ham yoziladi (2026-10-11 gacha reels'ni hech narsa yozmagan); vebda muqova kadri brauzerda olinadi, 50 MB gacha |
| Stories, highlights, reels | ✅ | ✅ | |
| Direct xabarlar (real-time), notes | ✅ | ✅ | |
| Explore / qidiruv, profil, follow, block | ✅ | ✅ | |
| Close friends, arxiv, professional rejim | ✅ | — | |
| Shikoyat qilish | ✅ | ✅ | |
| Aloqa formasi (landing) | — | ✅ | `contactMessages`; admin → Messages. Avval `mailto:` edi — admin panelga hech narsa kelmasdi |
| Uch til (uz/en/ru) | ✅ | ✅ | Vebda butun sayt (landing, ilova, admin); tanlov qurilmada saqlanadi |
| Landing skrinshotlari | — | ✅ | Admin → Landing'dan yuklanadi (Storage `landing/`, ochiq o'qish); "Feed" bosh sahifadagi telefonda chiqadi |
| Admin: umumiy, shikoyatlar (moderatsiya), foydalanuvchilar, faollik | ✅ | ✅ (+ xabarlar, landing) | Ilovada Sozlamalar → Admin; vebda `/admin`; faqat egasi (Google, tasdiqlangan email) |
| "Ma'lumotlarimni yuklab olish" | ✅ | — | |
| APK yuklab olish | ✅ | — | Har `main` push'da GitHub Release (`apk-release.yml`); versionCode = run raqami, yangilanish sifatida o'rnatiladi |
| Play Store | 🚧 | — | AAB workflow va rasmlar tayyor; akkaunt/test kerak |

## Arxitektura — asosiy qarorlar va nega

1. **Bare React Native (Expo emas).** New Architecture, `@react-native-firebase`
   native modullari. Nega: push, media va Firebase native SDK'lari to'liq
   nazorat bilan; Expo'ning cheklovlari yo'q.
2. **RNFirebase'ning namespaced API'si (`firestore()`, `auth()`).** Modular API
   release Hermes build'da "Cannot read property 'call' of undefined" bilan
   yiqilgan (`src/lib/firebase.ts`). Nega: release'da barqaror ishlaydigani.
3. **TanStack Query + AsyncStorage persister.** Lenta oflaynda ham ochiladi.
   Zustand — faqat mijoz holati (UI, draft).
4. **Xavfsizlik — Firestore qoidalarida.** Har kolleksiya alohida: egasi
   yozadi, boshqalar faqat hisoblagichlarni oshiradi; shikoyatlar faqat
   qo'shiladi (append-only), moderator qarori alohida audit izi.
   2026-10-09: admin tekshiruvi `email_verified` talab qiladi, `activityLogs`
   ga anonim yozish yopildi (emulyatorda 9 holat sinaldi).
5. **Veb — alohida Vite ilova (`web/`), bir xil Firestore.** Nega: React Native
   Web'ga moslash o'rniga veb uchun yengil, tez ochiladigan sahifa.

## Deploy

- Veb + qoidalar: `web-deploy.yml` — `main` ga push (web/, rules) →
  Firebase Hosting `lumina-007app`. Secret: `FIREBASE_SERVICE_ACCOUNT`.
- APK: `apk-release.yml` — GitHub Release `latest`, fayl `lumina.apk`.
  `LUMINA_*` secret'lari bo'lsa upload key bilan, bo'lmasa debug kalit bilan
  imzolanadi (sideload uchun yetarli, Play Store uchun emas).
- Play Store AAB: `release.yml` (qo'lda).

## Ma'lum kamchiliklar

- Hisoblagichlar (`followerCount`...) qoidada faqat maydon nomi bilan
  cheklangan, qiymat oralig'i tekshirilmaydi — kirgan foydalanuvchi soxta
  son yozishi mumkin. Tuzatish: ±1 o'zgarishni talab qilish yoki Function.
- Veb'dan parol tiklash logi endi yozilmaydi (anonim log yopilgani uchun).
- Veb sahifalar inglizcha; o'zbekcha tarjima yo'q.

## 2026-10-11 — o'zgarishlar

- **Ilovada Google bilan kirish `DEVELOPER_ERROR` bergan.** APK upload key bilan
  imzolanadi, Firebase'da esa faqat debug kalitning SHA-1 si bor edi. Endi
  `apk-release.yml` har build'da imzo kalitining SHA-1/SHA-256 ini Firebase
  Android ilovasiga qo'shadi (bor bo'lsa — o'tkazib yuboradi). Play Store'ga
  chiqqanda Play App Signing kaliti SHA-1 ini ham qo'shish kerak bo'ladi.
- **Reels bo'sh edi** — `reels/` kolleksiyasini hech qaysi kod yozmagan. Endi
  bitta videoli post (ilova va vebdan) reel ham bo'ladi; post o'chsa reel ham.
  Vebda video yuklash qo'shildi (avval faqat rasm).
- **Shikoyatlar (Reports)** — foydalanuvchilar ilovada "Shikoyat qilish" bilan
  yuborgan narsalar; aloqa formasi bilan aloqasi yo'q. Admin sahifasida shu
  izoh yozildi.
- Qoidalar emulyatorda sinaldi: `contactMessages`, `siteContent`, Storage
  `landing/`, reel yaratish/o'chirish — 26 holat.

