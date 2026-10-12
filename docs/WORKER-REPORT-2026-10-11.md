# Ishchi hisoboti — 2026-10-11 (UX to'lqini)

Shoxcha: `claude/lumina-ux-2026-10-11` (main `0c5a10e` dan). PR ochilmagan.

Har band tugagach shular o'tkazildi: `npm run typecheck` (0 xato), `npm run lint`
(exit 0), `npm test` (oxirida 104/104, 20 suite), veb o'zgarganda
`cd web && npm run build`, qoidalar o'zgarganda emulyator testlari
(`rules-tests/`, oxirida 14/14). Metro release bundle (`react-native bundle
--platform android --dev false`) ham o'tdi. Lokal `./gradlew assembleRelease`
**sinalmadi** — konteynerda Android SDK yo'q; APK CI'dagi `android-apk` job'ida
quriladi.

## Yangi umumiy narsalar

- `rules-tests/` — Firestore qoidalari uchun emulyator testlari (node:test +
  `@firebase/rules-unit-testing`). Ishga tushirish: `cd rules-tests && npm ci && npm test`
  (Java kerak). Fayllar ketma-ket ishlaydi (`--test-concurrency=1`) — parallel
  ishlaganda bir-birining emulyator ma'lumotini tozalab yuborardi.
- CI (`.github/workflows/ci.yml`) ga ikki job qo'shildi: `firestore-rules`
  (emulyatorda qoidalar testi) va `web` (`npm ci && npm run build`).

## 1. Story ko'rganlar + viewer

**Qilindi.** `stories/{id}/views/{viewerUid}` = `{uid, viewer, viewedAt}`.
Qoidalar: ko'ruvchi faqat o'z uid'i bilan yozadi, o'z story'sida yozolmaydi
(o'z ko'rishi hisoblanmaydi), ro'yxatni faqat story egasi o'qiydi, o'chirib
bo'lmaydi. O'z story'ingda pastda "Ko'rganlar: N" → bottom sheet (yuklanish /
bo'sh / xato + qayta urinish), bosilsa profilga o'tadi.

Topilgan eski xato: `markSeen` story hujjatiga `seenByUids` arrayUnion yozardi,
lekin qoidalar story'ni faqat egasiga yangilashga ruxsat beradi — ko'ruvchilar
uchun bu yozuv doim rad etilgan, ya'ni "ko'rilgan" halqa hech qachon ishlamagan.
Endi ko'rilganlik shaxsiy `users/{uid}/seenStories/{storyId}` belgisida (eski
`seenByUids` ham o'qiladi).

Viewer: tepada segmentli progress; chap 1/3 bosish — oldingi, qolgani — keyingi;
ushlab turish — pauza (UI yashirinadi); pastga surish — yopish. Rasmni
xiralashtirgan 45% qora blok olib tashlandi — faqat tepada yengil gradient.
Portret media ekranni to'ldiradi (cover), landshaft/kvadrat to'liq ko'rinadi
(contain) — haqiqiy o'lcham `onLoad`dan olinadi (eski story'larda o'lcham
1080×1920 deb soxta yozilgan edi). Story tanlashda sifat 0.9, 1920 px gacha va
haqiqiy width/height saqlanadi.

Veb: xuddi shu viewer (progress, bosish zonalari, ushlab pauza, klaviatura,
ko'rganlar ro'yxati, ko'rilgan halqa).

Fayllar: `src/features/stories/components/{StoryViewer,StoryViewersSheet}.tsx`,
`src/features/stories/utils/storyMedia.ts`, `src/data/api/firebase/stories.firebase.ts`,
`src/data/query/hooks/useStoryViewers.ts`, `firestore.rules`,
`rules-tests/test/stories.test.js`, `web/src/components/{StoryViewer,StoriesStrip}.tsx`,
`web/src/lib/content.ts`.

Sinov: unit (`storyMedia.test.ts`), qoidalar 7 ta holat (emulyator).
**Sinalmagan:** qurilmada qo'l bilan (gestlar, sheet, video story).

## 2. Reels boshqaruvi

**Qilindi.** Bosish — pauza/davom (markazda ikonka), uzoq bosish — 2x
(qo'yganda 1x, "2x" belgisi), ikki marta bosish — like + yurak animatsiyasi.
Gestlar `Exclusive(longPress, doubleTap, singleTap)` — ikki marta bosish pauzani
ham bosib yubormaydi. Ovoz tugmasi global, saqlanadigan `videoMuted`
(preferences store, MMKV). Progress chizig'i. Reels tab'dan chiqqanda yoki
ilova fonga o'tganda pauza (`usePlaybackAllowed`: fokus + AppState).
Topilgan xato: mute tugmasi va pastki UI suzuvchi tab bar ostida qolgan edi —
endi tab bar balandligi hisobga olinadi; mute tugmasi tepa-o'ngda.

Veb: `SmartVideo` — bosish pauza, ikki marta bosish like, ushlab 2x, global mute
(localStorage), progress; Reels'da like qo'shildi.

Fayllar: `src/features/reels/components/{ReelItem,ReelsPager}.tsx`,
`src/components/video/*`, `src/components/VideoPlayer.tsx` (`rate`),
`src/stores/preferences.store.ts`, `web/src/components/SmartVideo.tsx`,
`web/src/lib/videoPrefs.ts`, `web/src/pages/app/Reels.tsx`.

Sinov: unit (`videoProgress.test.ts`, mute store testi). **Sinalmagan:**
qurilmada gestlar va 2x tezlik (react-native-video `rate`).

## 3. Like sinxroni

**Qilindi.** Sabab: Reels `reels/{id}/likes`, post `posts/{id}/likes` — ikki
alohida tizim va ikki alohida kesh edi. `reels/{postId}` — bitta videoli
postning egizagi (bir xil id) ekani tekshirildi (`createPost` shunday yozadi).
Endi `Reel.postId`: egizak reel like holati va sonlarini POSTdan o'qiydi, like
post'ga yoziladi. Yagona manba — TanStack Query keshi: `useOptimisticLike`
postId bo'yicha barcha keshlardagi nusxani (feed, profil, saqlanganlar,
hashtag, explore, post detail, reels) bir vaqtda, idempotent yangilaydi va
xatoda hammasini qaytaradi. Veb: sessiya bo'yicha umumiy like store.

Fayllar: `src/data/query/cache/{likeCache,useOptimisticLike}.ts`,
`src/data/query/hooks/{useLikePost,useLikeReel}.ts`, `src/schemas/reel.schema.ts`,
`src/data/api/firebase/reels.firebase.ts`, `web/src/lib/likeStore.ts`.

Sinov: unit — patcher (10) va hook testi (Reels → feed sinxroni, xatoda rollback).
**Qolgan:** egizak bo'lmagan eski reel'larda o'z like'lari qoladi; egizak
reel'ga avval `reels/{id}/likes` ga yozilgan like'lar endi hisobga olinmaydi
(reels 2026-10-11 gacha bo'sh bo'lgani uchun bunday ma'lumot deyarli yo'q).
Save (saqlash) sinxronlanmagan — vazifada so'ralmagan.

## 4. Feed video

**Qilindi.** Sabab: `muted` qattiq yozilgan, boshqaruv yo'q edi. Endi faqat eng
ko'rinadigan post o'ynaydi (viewability; ≥60% ko'rinadigani yo'q bo'lsa — hech
biri), ekrandan chiqqanda / boshqa ekranga o'tganda / fon rejimida pauza; bosish
— pauza (ikki marta bosish — like, bir-biriga xalaqit bermaydi); Reels bilan bir
xil global ovoz tugmasi (gest maydonidan tashqarida); progress. Standart: ovoz
yoqiq (avval eshitib bo'lmasdi), bir bosishda hamma joyda o'chadi va eslab
qolinadi. Post detail'da ham xuddi shu.

Fayllar: `src/features/feed/components/{PostMediaPager,FeedList}.tsx`,
`web/src/pages/app/{Feed,PostDetail}.tsx`.

**Sinalmagan:** qurilmada qo'l bilan.

## 5. Profil avatar halqasi

**Qilindi.** Sabab: `ProfileHeader` oddiy `Avatar` chizardi — story haqida
bilmasdi va bosish ishlovchisi yo'q edi, shuning uchun hech narsa ochilmasdi.
Endi story tray'dan foydalanuvchining 24 soat ichidagi story'si topiladi
(eskirgan keshdagi reel e'tiborga olinmaydi), gradient halqa (ko'rilgan bo'lsa
xira), bosilganda Story viewer — o'z profilida ham, boshqasida ham. Veb profilda
ham shunday.

Fayllar: `src/features/profile/components/ProfileHeader.tsx`,
`src/design-system/primitives/Avatar.tsx` (`ringSeen`), `storyMedia.ts`
(`findActiveStoryReel`), `web/src/pages/app/Profile.tsx`. Sinov: unit.

## 6. Highlights

**Qilindi.** "New" → bitta ekran: arxivdan story'lar (tartib raqami bilan) →
nom → muqova (tanlanganlardan biri) → Saqlash. Arxiv = o'z story'laring
(faol + eskirgan, `getStoryArchive`). Media qayta yuklanmaydi. Yuklanish / bo'sh /
xato holatlari, inline validatsiya. Viewer'da (o'z story'ingda) "Highlight"
tugmasi → sheet: mavjud highlight'ga qo'shish (allaqachon borlari belgilangan)
yoki shu story bilan yangisini yaratish; ochiq turganda story pauzada.

Fayllar: `src/features/profile/components/{HighlightsRow,HighlightComposer}.tsx`,
`src/features/stories/components/AddToHighlightButton.tsx`,
`src/features/stories/utils/highlightDraft.ts`,
`src/data/query/hooks/{useStoryArchive,useAddToHighlight}.ts`, stories API.

Sinov: unit (`highlightDraft.test.ts`). Vebda highlights umuman yo'q — paritet
qilinmadi. **Qolgan:** arxiv 200 ta story bilan cheklangan.

## 7. Collab tasdig'i

**Qilindi.** Model: `post.collab = {uid, status: 'pending'|'accepted'|'declined', user}`.
Post darhol faqat muallif nomidan chiqadi; ikkinchi profilga `collab_invite`
bildirishnomasi (Qabul / Rad). "A and B" sarlavhasi (feed, post detail) va
ikkinchi profil gridi — faqat `accepted`. Rad etilsa — oddiy post. Eski
ma'lumot: status yo'q / buzuq `collab` va eski `collaborators` massivi (roziliksiz
yozilgan) — oddiy post deb ko'rsatiladi. Bitta hammuallif, o'zingni tanlab
bo'lmaydi.

Qoidalar: muallif taklifni faqat `pending` va boshqa uid uchun yarata oladi,
keyin `collab`ni o'zgartira olmaydi (o'zi "qabul" qila olmaydi); faqat taklif
qilingan uid `pending → accepted/declined` qiladi va boshqa maydonga
tegolmaydi; uchinchi shaxs javob berolmaydi.

Profil gridi `getFeed(userId)` orqali ishlar ekan — collab'lar shu yo'lga
qo'shildi (ikki tenglik filtri, indekssiz) va sanasi bo'yicha sahifalarga
qo'shiladi. `getUserPosts` (insights, eksport) faqat o'z postlari.

Veb: sarlavha, profil gridi, Bildirishnomalarda Qabul/Rad.

Fayllar: `src/utils/collab.ts`, `src/data/api/firebase/{posts,notifications}.firebase.ts`,
`src/schemas/notification.schema.ts`, `src/data/query/hooks/useRespondToCollab.ts`,
`src/features/notifications/components/NotificationItem.tsx`,
`src/features/feed/components/PostCard.tsx`, `src/features/post/components/PostDetail.tsx`,
`src/screens/create/CreatePostScreen.tsx`, `src/components/UserMultiSelectModal.tsx`,
`firestore.rules`, `rules-tests/test/collab.test.js`, `web/src/lib/collab.ts`,
`web/src/pages/app/{Notifications,Feed,PostDetail}.tsx`, `web/src/lib/posts.ts`.

Sinov: unit (`collab.test.ts`), qoidalar 7 holat (emulyator).
**Qolgan / bilib qo'ying:** eski APK versiyalari hali `collaborators`
massivini yozadi va o'zlari ko'rsatadi — buni yangi qoidalar to'xtatmaydi
(eski ilovalar post yaratolmay qolmasligi uchun). Bildirishnomalarni ilova
boshqa turlar (like/comment) uchun hali ham yozmaydi — faqat collab taklifi
yoziladi. Push xabar yuborilmaydi (Functions yo'q).

## CI

- Run #80 (`e224b24`, 1–5-bandlar): quality, firestore-rules, web,
  **android-apk** — hammasi yashil.
- Run #86 (`70229ca`, 1–7-bandlar + hisobot): quality, firestore-rules, web,
  **android-apk** — hammasi yashil (APK artefakti `lumina-apk`).
- #77, #82, #85 — keyingi push sabab bekor qilingan (concurrency), xato emas.

## Deploy haqida

`firestore.rules` o'zgardi — `main`ga birlashtirilgach `web-deploy.yml` qoidalarni
chiqaradi. Qoidalar chiqmaguncha yangi ilova: ko'rganlar yozuvi va collab javobi
rad etiladi (ilova yiqilmaydi, faqat ishlamaydi). Ma'lum muammo: CI service
account ba'zan qoidalarni deploy qila olmaydi (LOYIHA-HAQIDA'da yozilgan) —
deploy log'ini tekshirish kerak.

## Agentlar haqida

CLAUDE.md ixtisoslashgan agentlarga yo'naltirishni so'raydi; bu sessiyada ish
bog'liq fayllar bo'ylab ketma-ket bo'lgani uchun bevosita bajarildi.
