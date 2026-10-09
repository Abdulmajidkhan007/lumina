# Lumina — loyiha haqida

> Instagram uslubidagi ijtimoiy tarmoq: Android ilova (bare React Native) va veb.
> Veb: https://lumina-007app.web.app · APK: https://github.com/Abdulmajidkhan007/lumina/releases/latest/download/lumina.apk
> Oxirgi tekshiruv: 2026-10-09 (koddan).

## Nima uchun

Social ilovaning eng og'ir qismlarini — lenta, media yuklash, stories, reels,
real-time xabarlar, moderatsiya — real foydalanuvchilar bilan sinash. Veb
versiyada odamlar allaqachon post joylayapti.

## Hozir nima ishlaydi

| Qism | Mobil | Veb | Izoh |
|---|---|---|---|
| Ro'yxatdan o'tish, kirish (email, Google) | ✅ | ✅ | |
| Lenta, post (rasm/video), like, izoh, saqlash | ✅ | ✅ | Rasm yuklashdan oldin kichraytiriladi |
| Stories, highlights, reels | ✅ | ✅ | |
| Direct xabarlar (real-time), notes | ✅ | ✅ | |
| Explore / qidiruv, profil, follow, block | ✅ | ✅ | |
| Close friends, arxiv, professional rejim | ✅ | — | |
| Shikoyat qilish | ✅ | ✅ | |
| Admin: umumiy, shikoyatlar (moderatsiya), foydalanuvchilar, faollik | ✅ | ✅ | Ilovada Sozlamalar → Admin; vebda `/admin`; faqat egasi (Google, tasdiqlangan email) |
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
