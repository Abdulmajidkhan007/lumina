# Lumina — reja

> Tuzilgan: 2026-10-09. Real foydalanuvchilar bor — avval xavfsizlik va
> barqarorlik, keyin yangi funksiya.

## 1. Hozir (kod)

| # | Ish | Nega |
|---|---|---|
| 1 | Hisoblagichlarni ±1 bilan cheklash (rules) | Soxta follower/post soni yozib bo'lmasin |
| 2 | Veb'ni o'zbekcha qilish (uz/en, tanlov saqlanadi) | Foydalanuvchilar o'zbek |
| 3 | Admin: shikoyat qilingan postni yashirish / foydalanuvchini bloklash | Hozir faqat ko'rish bor |
| 4 | Admin → hamma foydalanuvchiga e'lon (in-app bildirishnoma) | atoyo'dagi broadcast kabi |
| 5 | Shikoyat tushganda egasiga Telegram xabar | atoyo'dagi buyurtma xabari kabi; Blaze (Functions) kerak |

## 2. Egasi qiladigan ishlar

- [ ] GitHub → Settings → Default branch → `main`
- [ ] Play Store qarori: developer akkaunt ($25 bir marta). 2023-11 dan keyin
      ochilgan shaxsiy akkauntga production'dan oldin 12 testerli, 14 kunlik
      yopiq test talab qilinadi. Hozircha APK GitHub Releases orqali tarqaladi.
- [ ] Upload keystore yaratib `LUMINA_*` secret'larini qo'shish (Play Store va
      barqaror imzo uchun). Yaratishni Claude GitHub Actions orqali qila oladi.
- [ ] Firebase'da APK imzosining SHA-1 qo'shilganini tekshirish (Google bilan
      kirish ilovada ishlashi uchun).
