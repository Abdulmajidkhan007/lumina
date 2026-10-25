# Lumina — reja

> Tuzilgan: 2026-10-09. Real foydalanuvchilar bor — avval xavfsizlik va
> barqarorlik, keyin yangi funksiya.

## 1. Hozir (kod)

| # | Ish | Nega |
|---|---|---|
| 1 | ✅ Hisoblagichlarni ±1 bilan cheklash (rules) | Bajarildi 2026-10-25: har yozuvda ±1 (egasi/muallif ham), yangi hujjat 0 dan; emulyatorda 9 ta yangi test (56/56). Jonli bazada deploy'dan keyin sinalmagan. Qolgan zaiflik: ±1 ni takror-takror yozish mumkin — to'liq yechim Function (Blaze) |
| 2 | ✅ Veb'ni o'zbekcha qilish (uz/en/ru, tanlov saqlanadi) | Bajarildi 2026-10-11 |
| 3 | ✅ Admin: shikoyatni ko'rib chiqish oqimi, foydalanuvchini bloklash (`userBans`), rollar | Bajarildi 2026-10-11/12 (veb va ilova) |
| 4 | ✅ Admin → hamma foydalanuvchiga e'lon (in-app) | Bajarildi 2026-10-12; FCM push (`onBroadcastCreated`) kodi bor, Functions deploy (Blaze) kutadi |
| 5 | Shikoyat tushganda egasiga Telegram xabar | atoyo'dagi buyurtma xabari kabi; Blaze (Functions) kerak |

## 2. Egasi qiladigan ishlar

- [x] GitHub → Settings → Default branch → `main` (2026-10-21 tekshirildi)
- [ ] Play Store qarori: developer akkaunt ($25 bir marta). 2023-11 dan keyin
      ochilgan shaxsiy akkauntga production'dan oldin 12 testerli, 14 kunlik
      yopiq test talab qilinadi. Hozircha APK GitHub Releases orqali tarqaladi.
- [ ] Upload keystore yaratib `LUMINA_*` secret'larini qo'shish (Play Store va
      barqaror imzo uchun). Yaratishni Claude GitHub Actions orqali qila oladi.
- [ ] Firebase'da APK imzosining SHA-1 qo'shilganini tekshirish (Google bilan
      kirish ilovada ishlashi uchun).
- [ ] CI uchun `FIREBASE_TOKEN` secret yoki SA'ga "Firebase Rules Admin" roli
      (Storage qoidalari va indekslar deploy bo'lishi uchun).
- [ ] Ilovada Google bilan kirish va Admin → Landing skrinshot yuklashni sinash.

*Oxirgi yangilanish: 2026-10-25*
