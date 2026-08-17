# سند اجرایی بازطراحی لغتنامه — Laravel API + Android Native

**Status:** Active — canonical source of truth

**Last updated:** 2026-08-17

**Current phase:** Phase 0 — environment and repository governance

**Next executable task:** `ARC-002` — user state and SRS data model (content model landed in `docs/architecture/content-model.md`, see `ARC-001`; `ENV-004`/`ENV-005` on the original Windows machine, §12, are still open)

این سند مرجع رسمی هدف محصول، مرز MVP، معماری، تصمیم‌ها، ترتیب اجرا و وضعیت کار است. هر AI یا توسعه‌دهنده باید پیش از تغییر فایل‌ها، ابتدا `AGENTS.md` و سپس تمام این سند را بخواند.

اگر این سند با اسناد قدیمی `docs/` تعارض داشت، برای پروژه جدید Laravel/Android این سند اولویت دارد. برای تشخیص رفتار واقعی نسخه فعلی، کد و داده موجود همچنان منبع حقیقت‌اند.

## 1. هدف محصول

بازطراحی محصول فعلی به یک اپلیکیشن Native اندروید برای فارسی‌زبانان، همراه با Laravel به‌عنوان API backend، مدیریت محتوا و همگام‌سازی پیشرفت.

نتیجه مطلوب:

- کاربر بدون اینترنت بتواند محتوای دانلودشده را بخواند و تمرین کند.
- قطع اینترنت هیچ پیشرفتی را از بین نبرد.
- پیشرفت پس از اتصال، به‌صورت امن و retry-safe با سرور همگام شود.
- محتوا بدون انتشار APK جدید قابل نسخه‌بندی و انتشار باشد.
- منطق آموزشی و داده ارزشمند نسخه فعلی حفظ و به مدل پایدار مهاجرت داده شود.
- توسعه به‌صورت vertical slice، تست‌پذیر و قابل تحویل مرحله‌ای انجام شود.

## 2. وضعیت موجود

نسخه فعلی یک وب‌اپ local-first و تک‌فایلی است و backend اختصاصی ندارد.

- 10,524 واژه به‌همراه معنی و مثال فارسی/انگلیسی
- مرور فاصله‌دار، درس روزانه، جست‌وجو، علاقه‌مندی و واژه شخصی
- گرامر، جمله‌سازی، collocation، listening، speaking، ضبط صدا و بازی‌ها
- ذخیره پیشرفت در چندین کلید `localStorage`
- پشتیبان اختیاری Google Drive
- TTS، Speech Recognition و ضبط صدا با APIهای مرورگر
- وابستگی شناسه‌های پیشرفت به word index و در برخی قسمت‌ها English headword

منابع اصلی مهاجرت:

- `data/words.json`
- `data/curricula/`
- `data/src/app.jsx`
- `data/src/template.html`
- `README.md`
- `docs/feature-map.md` و سایر اسناد UX/آموزشی، فقط به‌عنوان reference

## 3. ساختار Monorepo

Backend و Android در یک Git repository نگهداری می‌شوند، ولی پروژه، dependency، build و deployment مستقل دارند.

```text
/
├── backend/                    # Laravel REST API — پس از BE-001
├── android/                    # Kotlin + Jetpack Compose — پس از AND-001
├── data/                       # محتوای canonical فعلی و ورودی migration
├── tools/                      # ابزارهای legacy data/bundle
├── docs/
│   └── EXECUTION_PLAN.md       # همین سند؛ مرجع رسمی برنامه و وضعیت
├── AGENTS.md                   # قواعد مشترک تمام AIها
├── CLAUDE.md                   # entrypoint برای Claude
├── .github/
│   └── copilot-instructions.md # entrypoint برای Copilot
└── english-vocab-v1.html      # محصول legacy؛ فعلاً در محل فعلی می‌ماند
```

تا پیش از یک task مهاجرت اختصاصی، فایل‌های legacy به پوشه دیگری منتقل نمی‌شوند؛ چون ابزارها و مستندات فعلی به مسیرهای موجود وابسته‌اند.

## 4. اصول قطعی معماری

### 4.1 جریان اصلی

```text
Compose UI
   ↓
Android domain/use-cases
   ↓
Room (local source of truth)
   ↓                       ↑
Outbox + WorkManager  ←→  /api/v1  ←→  Laravel services  ←→  server database
```

### 4.2 مسئولیت Laravel

- API نسخه‌دار با prefix ثابت `/api/v1`
- احراز هویت first-party mobile با token امن؛ روش ورود نهایی هنوز تصمیم‌گیری نشده است
- نگهداری manifest و نسخه محتوای منتشرشده
- ارائه content pack و deltaهای معتبر با checksum
- دریافت batchهای idempotent پیشرفت کاربر
- نگهداری cursor/version برای pull تغییرات
- validation، authorization، rate limiting و audit لازم
- importer محتوای legacy با گزارش خطا و اجرای تکرارپذیر
- پنل مدیریت حداقلی فقط پس از پایدارشدن مدل محتوا

### 4.3 مسئولیت Android

- Kotlin + Jetpack Compose
- Room به‌عنوان local source of truth
- DataStore فقط برای تنظیمات کوچک، نه داده اصلی پیشرفت
- WorkManager برای sync قابل تکرار در پس‌زمینه
- اجرای تمرین، صف SRS، TTS و ثبت پاسخ بدون نیاز دائمی به شبکه
- outbox محلی با UUID/idempotency key
- نمایش وضعیت sync بدون ادعای موفقیت قبل از تأیید سرور
- پشتیبانی درست RTL فارسی و LTR انگلیسی

### 4.4 محتوا و شناسه‌ها

- `i` فعلی هر واژه تا پایان migration به‌عنوان `legacy_id` حفظ می‌شود.
- هیچ واژه منتشرشده‌ای بدون migration صریح reorder، delete یا rename نمی‌شود.
- شناسه canonical جدید باید پایدار و مستقل از ترتیب آرایه باشد.
- catalog content از user state جدا می‌ماند.
- هر content pack شامل `version`، `schema_version`، checksum، زمان انتشار و حداقل نسخه قابل‌پشتیبانی اپ است.
- دانلود هزاران واژه با درخواست‌های جدا ممنوع است؛ initial load از یک pack فشرده یا database seed کنترل‌شده انجام می‌شود.

### 4.5 همگام‌سازی

- هر write دارای شناسه یکتای عملیات است و retry نباید داده تکراری بسازد.
- Android ابتدا locally commit می‌کند و سپس outbox را push می‌کند.
- سرور نتیجه batch را به تفکیک operation برمی‌گرداند.
- pull با cursor انجام می‌شود، نه دانلود کامل در هر اجرا.
- conflict policy هر نوع داده باید پیش از پیاده‌سازی همان نوع ثبت شود.
- حذف داده کاربر، reset progress و merge چند دستگاه بدون acceptance criteria صریح پیاده‌سازی نمی‌شوند.

### 4.6 گراف اتصال اجزا

نمای کلی این‌که چطور تسک‌های فاز ۱ (بخش 7) و اجزای سیستم (بخش‌های 4.1 تا 4.5) به هم وصل‌اند — قبل از شروع `ARC-001`.

**۱) وابستگی تسک‌های Phase 1 به هم:**

```text
ARC-001 (مدل canonical محتوا + ERD)
   │
   ├──→ DATA-001 (migration شناسه‌های legacy)
   │        از ARC-001 استفاده می‌کند تا legacy_id → id جدید map شود
   │
   ├──→ ARC-002 (مدل user state و SRS)
   │        رکوردهای پیشرفت به entity واژه در ARC-001 اشاره می‌کنند
   │
   └──→ ARC-003 (قرارداد OpenAPI v1)
            schema محتوا و manifest از مدل ARC-001 می‌آید
            │
            └──→ ARC-004 (سیاست sync و conflict)
                     idempotency/cursor روی همان endpointهای ARC-003 تعریف می‌شود
                     و به entity‌های user state از ARC-002 وابسته است
```

**۲) اجزای سیستم که همین مدل‌ها را مصرف می‌کنند:**

```text
                         ┌─────────────────────────┐
                         │   ARC-001 content model  │
                         │ words / categories /     │
                         │ examples / curricula /    │
                         │ content versions          │
                         └────────────┬──────────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 ▼                    ▼                    ▼
        ┌─────────────────┐  ┌────────────────┐   ┌──────────────────┐
        │  Laravel DB      │  │ ARC-003 OpenAPI │   │ Android Room      │
        │  migrations      │  │ /api/v1 schema  │   │ schema (content)  │
        │  (BE-001)        │  │                  │   │ (AND-001)         │
        └────────┬─────────┘  └────────┬─────────┘   └─────────┬─────────┘
                 │                      │                       │
                 └──────────┬───────────┴───────────┬───────────┘
                            ▼                        ▼
                  ┌───────────────────┐   ┌─────────────────────────┐
                  │ ARC-002 user state │   │ ARC-004 sync/conflict    │
                  │ + SRS model        │──▶│ policy (idempotency،      │
                  │                    │   │ cursor، retry)            │
                  └─────────┬──────────┘   └────────────┬─────────────┘
                            │                            │
                            ▼                            ▼
                  Android Room (progress)      Outbox + WorkManager
                            │                            │
                            └──────────────┬─────────────┘
                                           ▼
                              اولین Vertical Slice (بخش 6)
```

خلاصه: `ARC-001` پایه‌ی همه چیز است — بدون مدل محتوای پایدار، نه migration (`DATA-001`)، نه schema اندروید/لاراول، و نه قرارداد API (`ARC-003`) قابل تعریف نیستند. `ARC-002` و `ARC-004` روی همین پایه سوار می‌شوند و در نهایت Vertical Slice بخش 6 را ممکن می‌کنند.

## 5. محدوده MVP

### داخل MVP

- ساخت حساب/ورود و خروج؛ روش دقیق ورود در `Q-002` تعیین می‌شود
- content manifest و دانلود آفلاین واژگان
- فهرست، جست‌وجو، دسته‌بندی و علاقه‌مندی واژگان
- flashcard، MCQ، تایپ و تمرین listening مبتنی بر TTS
- الگوریتم مرور فاصله‌دار و صف روزانه
- ثبت local-first پیشرفت در Room
- sync چنددستگاهی و retry پس از قطع شبکه
- تنظیمات پایه و نمایش وضعیت sync
- importer تکرارپذیر برای داده فعلی
- حداقل logging، تست API، تست دیتابیس و تست Android

### خارج از MVP اولیه

- پرداخت و اشتراک
- نقش مدرس، کلاس و دانش‌آموز
- شبکه اجتماعی، چت یا leaderboard آنلاین
- iOS
- امتیازدهی پیشرفته تلفظ یا AI speech scoring
- فایل صوتی انسانی و storage صوتی سرور
- پنل مدیریت حرفه‌ای
- انتقال کامل همه بازی‌ها و تمام فعالیت‌های grammar/speaking در یک release
- بازنویسی نسخه وب legacy

این موارد حذف نشده‌اند؛ فقط بعد از اثبات vertical slice و MVP زمان‌بندی می‌شوند.

## 6. اولین Vertical Slice

اولین مسیر کامل باید این سناریو را ثابت کند:

```text
ورود کاربر
→ دریافت content manifest و یک pack کوچک
→ ذخیره در Room
→ انجام یک تمرین در حالت آفلاین
→ ثبت عملیات در outbox
→ اتصال مجدد و sync با Laravel
→ pull همان پیشرفت در یک نصب/دستگاه دوم
```

معیار پذیرش:

1. backend با SQLite محلی و migration تمیز بالا بیاید.
2. endpoint سلامت `/api/v1/health` پاسخ نسخه‌دار بدهد.
3. Android بتواند API لوکال را صدا بزند و خطای شبکه را قابل‌فهم نمایش دهد.
4. حداقل یک واژه و یک پاسخ بدون شبکه در Room ذخیره شود.
5. retry یک عملیات، رکورد تکراری روی سرور نسازد.
6. تست خودکار happy path و duplicate retry پاس شود.
7. خاموش‌کردن شبکه یا بستن اپ باعث ازبین‌رفتن پاسخ نشود.

## 7. Task board

وضعیت‌های مجاز: `TODO`، `IN PROGRESS`، `BLOCKED`، `DONE`.

### Phase 0 — محیط و حاکمیت مخزن

| ID | Status | Task | Acceptance / evidence |
|---|---|---|---|
| `ENV-001` | DONE (Windows و macOS) | نصب backend toolchain | Windows: PHP 8.5.0، Composer 2.10.2، Laravel Installer 5.31.1. macOS (این نشست، از طریق Homebrew): PHP 8.5.9، Composer 2.10.2، Laravel Installer 5.31.1؛ همه از طریق `~/.zshrc` در PATH. |
| `ENV-002` | DONE | دریافت installer رسمی Android Studio | نسخه 2026.1.3.7؛ 1,508,410,976 bytes؛ SHA-256 مطابق winget؛ امضای `Google LLC` معتبر |
| `ENV-003` | DONE | نصب Android Studio | نصب در `C:\Program Files\Android\Android Studio`؛ build و JBR داخلی معتبر؛ Registry و winget نصب را تشخیص می‌دهند |
| `ENV-004` | DONE (روی macOS) | نصب Android SDK toolchain | روی دستگاه macOS این نشست انجام شد: platform-tools 37.0.1، build-tools;36.1.0، platforms;android-36، cmdline-tools;latest؛ `adb version` موفق. روی دستگاه Windows اصلی این سند هنوز انجام نشده. |
| `ENV-005` | BLOCKED (فقط روی Windows) | فعال‌سازی Virtualization برای Emulator | نیازمند اقدام دستی کاربر در BIOS/UEFI و سپس Windows Hypervisor Platform؛ تا آن زمان گوشی واقعی قابل استفاده است. روی macOS این محدودیت مصداق ندارد (Apple Hypervisor framework استفاده می‌شود)؛ هنوز روی macOS تست نشده. |
| `DOC-001` | DONE | ایجاد سند اجرایی canonical | این فایل ایجاد و از README قابل کشف است |
| `DOC-002` | DONE | افزودن entrypoint برای AIها | `AGENTS.md`، `CLAUDE.md` و Copilot instructions به سند canonical ارجاع می‌دهند |
| `DOC-003` | DONE | ساخت پرتال خوانای مستندات | ۲۲ سند در `docs/index.html` آفلاین و self-contained؛ ۱ سند canonical و ۲۱ legacy؛ جست‌وجو/ناوبری/RTL/LTR/چاپ؛ generator با `--check`/`--watch`؛ شش تست و CI پاس |

### Phase 1 — قراردادها و مدل داده

| ID | Status | Task | Acceptance / evidence |
|---|---|---|---|
| `ARC-001` | DONE | مدل canonical محتوا و ERD اولیه | `docs/architecture/content-model.md`: entities (Category، Word، Example، ContentVersion، CurriculumUnit، DiscussionMethod) با فیلد/نوع/constraint، ERD متنی، و یادداشت migration برای `DATA-001` |
| `ARC-002` | DONE | مدل user state و SRS | `docs/architecture/user-state-model.md`: شش entity (`UserProgress`, `Favorite`, `CustomWord`+`CustomCategory`+`CategoryOverride`, `UserSentence`, `DailyActivity`, `Outbox`) با فیلد/نوع/invariant، مشتق از خواندن مستقیم `data/src/app.jsx` (بعد از `node tools/unpack.js`) نه فرض؛ الگوریتم SRS واقعی (`srMark`/`srDue`/`srKnown`) مستند و حفظ شد؛ سه تصمیم محصولی این نشست (`D-011`–`D-013`) اعمال شد |
| `ARC-003` | TODO | قرارداد OpenAPI v1 | health/auth/manifest/content/sync schemas و error envelope تعریف شوند؛ برای مسیرهای ابزار نوشتاری از `docs/architecture/writing-tools-api-recommendation.md` پیروی شود |
| `ARC-004` | TODO | سیاست sync و conflict | idempotency، cursor، ordering و conflict policy هر نوع داده مستند شود |
| `DATA-001` | TODO | قرارداد migration شناسه‌های legacy | mapping برای word `i`/headword و import report تعریف شود |

### Phase 2 — Scaffold و Vertical Slice

| ID | Status | Task | Acceptance / evidence |
|---|---|---|---|
| `BE-001` | TODO | ایجاد Laravel API در `backend/` | fresh install، SQLite، test suite و `/api/v1/health` پاس شوند |
| `AND-001` | TODO | ایجاد Compose app در `android/` | Gradle wrapper و debug build پاس شوند؛ package ID ثبت شود |
| `VS-001` | TODO | اتصال Android به health API | emulator از `10.0.2.2` یا گوشی از endpoint توسعه پاسخ معتبر بگیرد |
| `VS-002` | TODO | content manifest و pack آزمایشی | checksum و import محلی تست شوند |
| `VS-003` | TODO | Room + outbox + push/pull آزمایشی | سناریوی کامل بخش 6 و duplicate retry tests پاس شوند |

### Phase 3 — MVP واژگان

| ID | Status | Task | Acceptance / evidence |
|---|---|---|---|
| `BE-010` | TODO | mobile authentication | token lifecycle، validation و tests پاس شوند |
| `BE-011` | TODO | importer کامل واژگان | تمام 10,524 واژه با ID پایدار و گزارش تطبیق وارد شوند |
| `BE-012` | TODO | content publication API | manifest/version/checksum/rollback حداقلی تست شود |
| `BE-013` | TODO | progress sync API | batch idempotency، cursor pull و authorization تست شوند |
| `AND-010` | TODO | onboarding/auth shell | offline/error/loading states و secure token storage تست شوند |
| `AND-011` | TODO | واژه‌نامه آفلاین | search/filter/favorite از Room کار کند |
| `AND-012` | TODO | study modes | flash/MCQ/type/listen با persistence محلی پیاده شود |
| `AND-013` | TODO | SRS و درس روزانه | scheduling deterministic و دارای unit test باشد |
| `AND-014` | TODO | production sync UX | pending/synced/error/conflict states و recovery تست شوند |

### Phase 4 — Hardening و گسترش

| ID | Status | Task | Acceptance / evidence |
|---|---|---|---|
| `QA-001` | TODO | تست RTL/LTR و accessibility | ماتریس دستگاه/فونت/جهت متن ثبت و پاس شود |
| `QA-002` | TODO | performance و حجم content pack | startup، query و import budget تعریف و اندازه‌گیری شود |
| `SEC-001` | TODO | security/privacy review | secrets، token storage، rate limits، logging و data deletion بررسی شوند |
| `REL-001` | TODO | beta release pipeline | signed build، environment config و rollback مستند شوند |
| `EXT-001` | TODO | grammar/sentence/collocations | scope و migration پس از MVP شکسته شود |
| `EXT-002` | TODO | listening/speaking/recording | permission، lifecycle، privacy و offline behavior تعریف شود |
| `EXT-003` | TODO | games/jobs/remaining parity | feature-by-feature acceptance criteria نوشته شود |

### Track موازی — نگهداری اپ فعلی (legacy، خارج از فازهای بالا)

این track مستقل از Phase 0–4 است: تغییر رفتار در محصول زنده‌ی فعلی (`english-vocab-v1.html`)، نه در بازطراحی Laravel/Android. طبق `D-008` مسیر فایل legacy عوض نمی‌شود، اما رفتار آن می‌تواند با درخواست صریح مالک محصول تغییر کند — دقیقاً همان چیزی که تصمیم‌های `D-011`–`D-013` (بخش ۸) از قبل برای اپ جدید ثبت کرده بودند.

| ID | Status | Task | Acceptance / evidence |
|---|---|---|---|
| `LEG-001` | DONE | اعمال `D-011` (بدون دکمهٔ خودارزیابی) روی اپ فعلی | حذف دکمهٔ «بلدم» (`toggleKnown`/`cardKnownGo` در `data/src/app.jsx`، markup در `data/src/template.html`) و حذف سه دکمهٔ رتبه‌بندی «آسان/خوب/سخت» بعد از جواب درست، جایگزین با یک دکمهٔ خنثی «ادامه» (rating=2 ثابت) + «دوباره» برای جواب غلط؛ متن راهنمای remnant («میزان یادآوری‌ات را انتخاب کن...») هم حذف شد. تست دستی با Playwright (headless) روی سه مسیر (flash، mcq درست، mcq غلط) با اسکرین‌شات تأیید شد؛ بدون console error. `node tools/validate.js` = `ok — 10524 entries valid`. داده‌ی تاریخی `manualKnown` (`r[8]`) عمداً دست‌نخورده باقی ماند (فقط مسیر نوشتن حذف شد) تا کاربرهای فعلی چیزی از دست ندهند. |
| `LEG-003` | DONE | فاز ۲ سند معماری جلسه: یادگیری اولیهٔ درهم‌تنیده در همان جلسه («معرفی و تمرین درهم») برای واژه‌های تازه، به‌جای «امروز فقط فلش‌کارت، فردا چهارگزینه‌ای، پس‌فردا تایپ» فعلی؛ هدف روزانهٔ نرم به‌جای پایان زودهنگام جلسه؛ حذف دکمهٔ «دوباره» فقط برای این سه نوبت جدید. مرور واژه‌های از‌قبل‌شناخته‌شده و ریاضیات `srMark`/`srDue` کاملاً دست‌نخورده. | در `data/src/app.jsx`: کلید جدید و مستقل `vocab_session_v1` (`ilLoad`/`ilSave`/`ilTurnFor`/`ilHasPending`/`ilSchedule`) برای وضعیت جلسه‌ایِ «یادگیری اولیه» هر واژه (`turn: 'A'|'B'|'C'|'done'|'unfinished'`, `fails`)، کاملاً جدا از `vocab_sr_v1` و `vocab_app_v1`. هر واژهٔ تازه‌ای که `chunkOrder()` انتخاب می‌کند بلافاصله رکورد `turn:'A'` می‌گیرد. `modeFor()` حالا اول `ilTurnFor(w.i)` را چک می‌کند: نوبت A → `flash` (با `prepare()` که `showBack` را از قبل `true` می‌کند تا معرفی یک‌مرحله‌ای و بدون دروازهٔ «نمایش معنی» باشد)، نوبت B → `mcq` موجود (بدون تغییر در ساخت گزینه‌ها)، نوبت C → حالت تازهٔ `fa2en` (چهارگزینه‌ای معکوس: پرامپت فارسی، گزینه‌های انگلیسی) که دقیقاً همان مسیر رندر mcq/`buildOptions()` را با یک `shown()`ی متفاوت هم‌استفاده می‌کند — هیچ markup جدیدی در `template.html` لازم نشد. زمان‌بندی نوبت بعدی با `ilSchedule()` انجام می‌شود: همان الگوی «صف را چند کارت جلوتر دوباره درج کن» که `advance()` از قبل برای جواب غلط داشت، با ثابت‌های نام‌گذاری‌شده (نه عدد جادویی) `IL_GAP_B_MIN/MAX=2/4`، `IL_GAP_C_MIN/MAX=4/7`، `IL_RETRY_GAP_MIN/MAX=3/5`، `IL_MAX_FAILS=3`. جواب غلط نوبت B/C هرگز `srMark`/`srIntroduce` را صدا نمی‌زند و هرگز دکمهٔ «دوباره» نشان نمی‌دهد (فقط یک «ادامه» خنثی که `ilAdvance()` را صدا می‌زند)؛ بعد از سه غلط همان نوبت در همان جلسه، واژه `unfinished` می‌شود و تا فردا (ریست `vocab_session_v1` با تغییر روز) دوباره امتحان نمی‌شود. واژه فقط با موفقیت واقعی نوبت C وارد `vocab_sr_v1` می‌شود: `srCompleteInitialLearning()` یک `srIntroduce(i,2)` و سپس دو بار `_srApplyOutcome(r,true,'mcq',2,day)` صدا می‌زند — `_srApplyOutcome` همان ریاضیات قبلی `srMark()` است که بدون کوچک‌ترین تغییر به یک متد جدا استخراج شد تا هم `srMark()` (با نگهبان «فقط اولین جواب هر روز» دست‌نخورده) و هم این مسیر جدید از یک منبع واحد استفاده کنند. `MAX_NEW` از ۵ به ۸ رسید (تصمیم از پیش گرفته‌شده، هم‌راستا با `LESSON_SIZE`). `chunkOrder(d, n)` حالا کل `d` می‌گیرد (نه فقط `d.round`) و واژه‌های تازه را از `lessonWordsOf(d.level, d.unit, d.lesson)` همان درس فعلی می‌کشد، نه کل باند سطح؛ منبع مرورهای موعددار کاملاً دست‌نخورده ماند. برای جلوگیری از انتخاب دوبارهٔ واژه‌ای که همین جلسه در حال «یادگیری اولیه» است (یا با سه غلط `unfinished` شده)، `isFresh()` داخل `chunkOrder` حالا `vocab_session_v1` را هم چک می‌کند. هدف روزانهٔ نرم: صفحهٔ پایان («صف فعلی تمام شد» / `kind:'round'`) به‌جای پایان زودهنگام، حالا آخرین خط دفاعی است — `afterCard()` (تابع مشترک جدید که هم `advance()` هم `ilAdvance()` در انتهای‌شان صدا می‌زنند) وقتی صف تمام شود ولی هدف روز نرسیده باشد، `extendQueue()` را صدا می‌زند که با همان منطق پیشروی درس `nextLesson()` (استخراج‌شده به `advanceLessonIfDone()` مشترک) مرورهای بیشتر/درس بعدی را به انتهای `d.order` **اضافه** می‌کند (نه جایگزین) تا هیچ نوبت B/Cِ از‌قبل‌زمان‌بندی‌شده گم نشود؛ صفحهٔ «هدف روزانه» هم تا وقتی `ilHasPending()` (واژه‌ای با نوبت فعال A/B/C) صادق است به تأخیر می‌افتد، حتی اگر همین باعث عبور از عدد هدف شود. Verification در بخش ۱۳. |
| `LEG-002` | DONE | فاز ۱ سند معماری جلسه/curriculum: جایگزینی شمارندهٔ تخت `d.round` با ساختار صریح Level → Unit → Lesson، با حفظ همان ریاضیات band-slicing فعلی (`LEVEL_SHARE`/`levelSpans()`) بدون تغییر. `lesson` دقیقاً ۸ واژهٔ تازه (تصمیم از پیش گرفته‌شده)؛ `unit` هر ۱۰ درس (۸۰ واژه) — انتخاب این تسک، مستدل در کد. | در `data/src/app.jsx` بدون افزودن فیلد به `data/words.json`: `LESSON_SIZE=8`، `UNIT_LESSONS=10`، و توابع خواندنی جدید (`roundForLevel`, `lessonsInLevel`, `unitsInLevel`, `lessonsInUnit`, `lessonWordsOf`, `wordPosition`, `lessonStats`) که فقط رتبهٔ موجود واژه در `VOCAB_ORDER`/`levelSpans()` را runtime گروه‌بندی می‌کنند — دقیقاً به سبک `chunkOrder()` فعلی. `blank()` اکنون `level/unit/lesson` دارد؛ `load()` یک migration افزایشی هم‌الگوی `srLoad()` برای کاربرهای قدیمی که فقط `d.round` دارند اضافه شد (`level` را از همان ریاضیات `band()`ی که `nextRound()`/`chunkOrder()` همیشه استفاده می‌کردند مشتق می‌کند، `unit=1,lesson=1` چون `round` قدیمی هرگز موقعیت زیرسطحی حمل نمی‌کرد، و بلافاصله `save()` می‌شود). `nextRound()` با `nextLesson()` جایگزین شد: همان تریگر «بدون واژهٔ تازه در صف فعلی» قبلی، اما به‌جای کل باند سطح، روی همان یک درس ۸ واژه‌ای اسکوپ شده؛ زنجیرهٔ درس→واحد→سطح دقیقاً مثل فهرست یک کتاب درسی پیش می‌رود. `d.round` به‌عنوان یک mirror سازگار همیشه از `level` بازمحاسبه می‌شود (`roundForLevel`) تا ده‌ها خوانندهٔ خارج‌از‌scope (`gramLevelUnlocked`, `sbLevelUnlocked`, `lsLevelUnlocked`, `dcLevelUnlocked`, نمایش خانه/آمار) بدون هیچ تغییری درست کار کنند — موتور جلسه/صف (`chunkOrder`, `MAX_NEW`, انتخاب واقعی کارت‌ها) عمداً دست‌نخورده ماند چون فاز ۲ به بعد است. `data/src/template.html` دست‌نخورده ماند (grep برای «round» چیزی برای تغییر متن UI پیدا نکرد). Verification در بخش ۱۳. |
| `LEG-004` | DONE | حذف دکمهٔ ویرایش معنی از کارت مطالعه («مداد کنار ترجمهٔ فارسی») طبق تصمیم قبلی این نشست (`word-session-scenario.md` بخش ۵، مورد ۵) — نه یک تصمیم تازه. | در `data/src/template.html`: بلاک `cardNotEditing`/`cardEditing` (دکمهٔ مداد + input درجا برای ویرایش) از کارت مطالعه حذف و با یک `<div>{{ card.fa }}</div>` ساده جایگزین شد. در `data/src/app.jsx`: props اختصاصی کارت که دیگر مصرف‌کننده نداشتند حذف شدند (`cardEditing`, `cardNotEditing`, `editStart` نسخهٔ مخصوص کارت، `editInputStyle`) — با grep روی هر دو فایل تأیید شد `editVal`/`onEditVal`/`editKey`/`editSave`/`editCancel` و متد `editStart()` هنوز توسط پنل «بیشتر» صفحهٔ واژه‌نامه (خط ~10319 در `template.html`) استفاده می‌شوند، پس دست‌نخورده ماندند — این ویژگی مدیریت محتوای دستی است، نه بخشی از سناریوی مطالعه، و خارج از scope همین تغییر. `node tools/repack.js` بدون خطا؛ `node tools/validate.js` = `ok — 10524 entries valid`. تست Playwright headless: بعد از ورود به کارت مطالعه (`file://.../english-vocab-v1.html`)، `button[title="ویرایش معنی"]` صفر نمونه داشت؛ بدون console error جز سه‌تای شناخته‌شدهٔ قبلی. |
| `LEG-005` | DONE | چهارگزینه‌ای‌های اپ (هم `mcq`/review-mode موجود، هم Turn B/C تازهٔ `LEG-003`) به‌جای انتخاب کاملاً تصادفی ۳ گزینهٔ غلط از کل ۱۰,۵۲۴ واژه، از یک استخر لایه‌بندی‌شدهٔ «حواس‌پرتی معقول» استفاده کنند: ۱) واژه‌های همین جلسه، ۲) واژه‌های همین درس یا ۱-۲ درس قبل از آن در همان واحد/سطح (`wordPosition`/`lessonWordsOf`، از `LEG-002`)، ۳) واژه‌هایی که یادگیرنده در آن‌ها ضعیف است (`!srKnown()` و `srRec()[0]` پایین)، ۴) واژه‌های همان دسته (`w.cat`)، و در نهایت ۵) همان رفتار تصادفی قبلی به‌عنوان fallback. فیلترهای کیفیت: بدون معنی فارسی تکراری/نزدیک‌تکراری با پاسخ درست (حتی درون یک لایهٔ «معقول»)، بدون تکرار همان واژه در یک سؤال، و بدون headword انگلیسی نزدیک‌تکراری مگر به‌عنوان آخرین راه‌حل. بدون embeddings/شباهت معنایی (زیرساختی برای آن در این اپ آفلاین وجود ندارد) و بدون حافظهٔ «جفت اشتباه‌گیری» بین‌جلسه‌ای — هر دو عمداً خارج از scope، طبق بریف محصول. | فقط `buildOptions()` در `data/src/app.jsx` (خط ~۱۶۹۶ پیش از تغییر) بازنویسی شد؛ امضا/محل صدازدن (`prepare()`، هر دو mode `mcq` و `fa2en`) دست‌نخورده ماند و `data/src/template.html` صفر تغییر (رندر گزینه‌ها از قبل کافی بود). منطق لایه‌ای دقیقاً به ترتیب بریف پیاده شد: لایهٔ ۱ از اجتماع `d.order.slice(0, d.pos)` (کارت‌های نشان‌داده‌شدهٔ همین جلسه) و کلیدهای `ilLoad().words` (واژه‌های لمس‌شده به‌دست Initial Learning امروز)؛ لایهٔ ۲ با `wordPosition(w.i)` موقعیت درس را پیدا می‌کند و `lessonWordsOf` را برای همان درس + تا دو درس قبل (با عبور از مرز واحد به کمک `lessonsInUnit`) صدا می‌زند؛ لایهٔ ۳ روی کلیدهای خودِ `srLoad()` (نه کل کاتالوگ) فیلتر می‌کند: `sr[k][4]` (معرفی‌شده) و `sr[k][0]<=1` (موفقیت کم) و `!srKnown(k)`؛ لایهٔ ۴ روی `w.cat` فیلتر می‌کند؛ لایهٔ ۵ همان حلقهٔ تصادفی قدیمی روی `sameCat.length>=6 ? sameCat : withFa` با همان `mulberry(w.i*7919+d.round)`. فیلترهای کیفیت در یک تابع مشترک `add()` اعمال می‌شوند: `faNear()` با `searchNorm` (شمول رشتهٔ نرمال‌شده در دو جهت) به‌عنوان قانون سخت در همهٔ لایه‌ها بدون استثنا؛ `enNear()` با `norm` (پیشوند مشترک با اختلاف طول ≤۳) به‌عنوان قانون نرم که فقط در یک پاس نهایی و جداگانه (بعد از لایهٔ ۵، اگر هنوز ۳ گزینه پر نشده) کنار گذاشته می‌شود تا هیچ سؤالی هرگز با کمتر از ۴ گزینه رندر نشود. `node --check` روی کپی `.js`، `node tools/repack.js` → `app.jsx spliced in (289227 -> 310143 chars)`، `node tools/validate.js` → `ok — 10524 entries valid`. Verification سه‌بخشی: (۱) Playwright headless (`leg005.js`، همان محیط/الگوی `LEG-001`–`LEG-004`) یک جلسهٔ کاملاً تازه را روی ۱۶ چهارگزینه‌ای واقعی (Turn B و C هر ۸ واژهٔ درس ۱) طی کرد؛ برای هر کدام، علاوه بر گزینه‌های واقعیِ رندرشده، یک اجرای مستقل و دست‌نخوردهٔ الگوریتم *قدیمی* (رونوشت وفادار از کد حذف‌شده، روی همان `window.VOCAB_WORDS`/seed) هم به‌عنوان مقایسهٔ before/after محاسبه شد — نمونه: واژهٔ «day» (روز) قبلاً `["دیر/متأخر","روز","سپیده/طلوع","برنامه‌ریزی شده"]` می‌گرفت (سه گزینهٔ کاملاً بی‌ربط)، حالا `["گرفتن/بردن","روز","آنجا","یک"]` می‌گیرد (هر سه گزینهٔ غلط از هم‌درسی‌های واقعی همین جلسه)؛ واژهٔ «every» (هر) قبلاً `["آلمانی (حرف‌تعریف)","فراتر از","هر","به نام‌های دیگر/یعنی"]`، حالا `["آنجا","روز","هر","دوام آوردن/طول کشیدن"]`. در هر ۱۶ مورد: دقیقاً ۴ گزینه، بدون گزینهٔ تکراری، پاسخ درست همیشه حاضر؛ صفر console error جز سه‌تای شناخته‌شدهٔ `net::ERR_FILE_NOT_FOUND`. (۲) یک harness مستقل Node (`harness.js`) که تابع واقعی `buildOptions()` را مستقیماً از متن فعلی `app.jsx` با regex استخراج و بدون تغییر روی `data/words.json` واقعی اجرا می‌کند (نه بازنویسی موازی)، با پیاده‌سازی‌های واقعی `wordPosition`/`lessonWordsOf`/`lessonsInUnit`/`levelSpans` (کپی از `LEG-002`) و mock های قابل‌کنترل برای `state.data`/`ilLoad`/`srLoad`: با خالی‌کردن عمدی لایه‌های زودتر، هر پنج لایه به‌تنهایی تأیید شد (لایهٔ ۱: هر ۳ گزینه از مجموعهٔ جلسهٔ ساختگی؛ لایهٔ ۲: از `lessonWordsOf` درس فعلی + درس(های) قبل؛ لایهٔ ۳: با `wordPosition` جعلی `null` و یک استخر ۵تایی «ضعیف» ساختگی در `srLoad`، هر ۳ گزینه از همان استخر ضعیف؛ لایهٔ ۴: با همان ترفند، هر ۳ گزینه هم‌دسته با پاسخ درست؛ حالت `fa2en` هم روی گزینه‌های انگلیسی درست کار کرد)، به‌علاوه یک تست فیلتر کیفیت: یک جفت واقعی از `data/words.json` با `fa` کاملاً یکسان پیدا شد، دومی عمداً در استخر جلسه قرار گرفت، و تأیید شد هرگز به‌عنوان گزینه نشت نکرد. نتیجهٔ harness: `ALL PASS` روی هر ۶ سناریو. (۳) رگرسیون صریح روی مسیر غیر-IL: واژهٔ index=0 با `vocab_sr_v1` seed‌شده به‌عنوان مرور موعددار دیروز، بعد از reload به‌عنوان اولین کارت با prompt «معنی درست را انتخاب کن» (نه flash) رندر شد، ۴ گزینه داشت، جواب عمداً غلط دکمهٔ «دوباره» را نشان داد (طبق `LEG-001` دست‌نخورده)، و کلیک «دوباره» واقعاً `vocab_sr_v1` را عوض کرد (`successes 1→0, ease 1→0.88`) — یعنی مسیر مرور معمولی و ریاضیات `srMark` کاملاً دست‌نخورده ماندند؛ اسکرین‌شات‌ها: `leg005-turnB-mcq.png`, `leg005-regular-review-mcq.png`. خارج از scope عمدی (طبق بریف): distractor بر اساس شباهت معنایی/embeddings؛ حافظهٔ «جفت اشتباه‌گیری» بین‌جلسه‌ای؛ هیچ تغییری در `data/words.json`، ریاضیات SRS، یا منطق نوبت‌بندی/زمان‌بندی `LEG-003`. |
| `LEG-006` | DONE | باقی‌ماندهٔ فاز ۳ (Global Review Integration): وقتی مرورهای موعددار بیشتر از ظرفیت جلسه (`MAX_REVIEWS=15`) باشند، واژه‌های ضعیف کاربر نسبت به واژه‌هایی که صرفاً دیرتر موعدشان رسیده اولویت بگیرند — بدون این‌که واژهٔ واقعاً خیلی عقب‌افتاده هرگز کنار گذاشته شود. منبع سطح دو (agent با `isolation: worktree`) یک fork قدیمی‌تر از repo داشت که فقط `LEG-001` را می‌دید؛ خودش این ناهماهنگی را تشخیص داد، هیچ ادعای تأییدنشده ننوشت، و فقط فرمول را با شبیه‌سازی جدا از اپ ثابت کرد — من فرمول را مستقیم روی فایل واقعی اعمال، repack و در مرورگر واقعی تأیید کردم. | در `chunkOrder()` (`data/src/app.jsx`، بلوک انتخاب `due`): کامپاراتور قبلی (`dueDay` صعودی خالص) با `duePriority(i) = (day - dueDay) + weaknessBonus(i)` جایگزین شد؛ `weaknessBonus = max(0,3-successes)*1.5 + max(0,1-ease)*5` (سقف ~۵.۷۵) — عمداً کوچک نسبت به یک backlog واقعی چند-هفته‌ای تا فقط واژه‌هایی با فاصلهٔ عقب‌افتادگی نزدیک به هم را دوباره مرتب کند، نه این‌که یک واژهٔ واقعاً کهنه را کنار بزند. `successes`/`ease`/`dueDay` فقط از طریق `srRec()` خوانده می‌شوند؛ `srMark`/نوشتن SRS دست‌نخورده. تأیید با Playwright واقعی (نه شبیه‌سازی): سه واژه seed شد — `city` (ضعیف: ۰ successes، ease=.75، ۳ روز عقب)، `especially` (قوی: ۶ successes، ease=۱.۶، ۵ روز عقب)، `index finger` (قوی، ۳۰ روز عقب). ترتیب واقعی رندرشده در اپ (با جواب‌دادن درست و پیشروی واقعی، نه فقط خواندن state): `index finger → city → especially` — دقیقاً طبق پیش‌بینی فرمول (duePriority = ۳۰ / ۸.۷۵ / ۵): واژهٔ خیلی عقب‌افتاده جلو ماند (starve نشد)، ولی بین دو واژهٔ نزدیک‌به‌هم، ضعیف‌تره جلوتر افتاد. `node tools/repack.js`، `node tools/validate.js` → `ok — 10524 entries valid`؛ بدون console error جز سه‌تای شناخته‌شدهٔ قبلی. خارج از scope: انتخاب واژهٔ تازه (`LEG-002`/`LEG-003`)، ساخت گزینه‌های چهارگزینه‌ای (`LEG-005`)، `MAX_REVIEWS` (هنوز ۱۵، فقط ترتیب انتخاب داخل همان ۱۵ عوض شد). |
| `LEG-007` | DONE | بخشی از فاز ۶ (Placement Redesign)، طبق `docs/placement-test-methodology.md` §۶.۱/§۸.۵: نتیجهٔ آزمون تعیین سطح دیگر یک عدد نیست که هم‌زمان روی واژه/گرامر/شنیداری/گفت‌وگو/مشاغل بشیند — سطح واژگان و سطح گرامر جدا محاسبه می‌شوند، شنیداری/گفت‌وگو/مشاغل/تمرین آزاد محافظه‌کارانه (`min` دوتا) تنظیم می‌شوند، و یک override دستیِ همیشه-نمایان روی صفحهٔ نتیجه اضافه شد. منبع سطح دو (agent با `isolation: worktree`) وسط اجرا با ریستارت سشن قطع شد؛ خودش پیش از قطع‌شدن با `diff -rq` تشخیص داده بود worktreeاش `LEG-001` تا `LEG-005` را نداشت، آن‌ها را با `cp` مستقیم (نه بازسازی) از working tree اصلی درون worktree خودش کپی کرده بود، و فقط تابع‌های مربوط به placement را ویرایش کرده بود — ولی این کپی قبل از رسیدن `LEG-006` اتفاق افتاده بود، پس worktree فاقد `LEG-006` بود. بعد از resume، همین را دقیق گزارش داد (بدون ادعای «کامل تأیید شد» روی کد mismatch) و توصیه کرد فقط diff منطقی placement از فایلش استخراج و روی فایل واقعی اعمال شود. من دقیقاً همین کار را کردم: کد placement (توابع + render props + markup) را از worktree خواندم و عیناً (بدون تغییر منطقی) روی `data/src/app.jsx`/`data/src/template.html` واقعی (که از قبل `LEG-001`–`LEG-006` را داشت) پورت کردم؛ `chunkOrder()`/`LEG-006` هرگز لمس نشد چون کد placement فقط `this.chunkOrder(d, n)` را با همان امضای فعلی صدا می‌زند. | در `data/src/app.jsx`: دو ثابت جدید `PLACEMENT_VOCAB_PASS=4/6`، `PLACEMENT_GRAM_PASS=2/3` (جدا از `PLACEMENT_PASS=6/9` ترکیبی که هنوز تصمیم می‌گیرد کدام سطح‌ها تست شوند). `placementPick` حالا علاوه بر `right` ترکیبی، `vocabRight`/`gramRight` را هم جدا از روی `q.kind` می‌شمارد. `placementAdvance` در پایان `finalVocabLevel`/`finalGramLevel` را جدا از `results` محاسبه می‌کند (بالاترین سطحی که آستانهٔ خودش را رد کرده) و `overrideLevel:null` را ریست می‌کند. `placementSetOverride(L)` تازه اضافه شد (toggle ساده، نه یک اندازه‌گیری دوم). `applyPlacement` طبق جدول §۸.۵: `d.level`/`d.round` ← `vocabLevel`، `gLv`/`sbLv` ← `structLevel`، `lsLv`/`dLv`/`jobLevel`/`practiceLv` ← `LEVELS[min(li(vocab), li(struct))]` — و اگر `overrideLevel` ست شده باشد همه‌جا همان را می‌گیرند. در `data/src/template.html`: دکمهٔ apply از برچسب ثابت به `{{ plApplyLabel }}` تغییر کرد؛ یک ردیف تازهٔ چیپ‌های سطح (`plOverrideChips`، شش دکمهٔ A1–C2) قبل از بخش «نتیجه به تفکیک سطح» اضافه شد؛ `plBreakdown` هر سطح را حالا با شکست واژگان/گرامر نشان می‌دهد نه فقط یک کسر ترکیبی. Build: `node tools/repack.js` → `app.jsx spliced in (289227 -> 317019 chars)`؛ `node tools/validate.js` → `ok — 10524 entries valid`. Verification دوبخشی روی فایل واقعی: (۱) تست منطق خالص (`leg007-logic-check.js`) با یک سناریوی ساختگیِ واقعاً ناهمسو (واژگان قوی تا B1، گرامر قوی فقط تا A2) — نتیجه دقیقاً `finalVocabLevel=B1`، `finalGramLevel=A2`، `conservLevel=A2`، و override با C1 هر سه را یکسان C1 کرد؛ (۲) اجرای زندهٔ Playwright روی `english-vocab-v1.html`: با جواب‌های واقعی (گزینهٔ اول هر سؤال) نتیجهٔ واقعی صفحه «نقطه‌ی شروع پیشنهادی — واژگان A1 · دستور A1» و ردیف تفکیک «A1 · واژگان ۳/۶ · دستور ۰/۳» را نشان داد؛ ۶ چیپ override رندر شد؛ کلیک روی چیپ C1 عنوان را زنده به «شروع از سطح C1 (انتخاب خودت)» تغییر داد؛ در یک اجرای جدا، انتخاب چیپ B2 و کلیک apply، `localStorage.vocab_app_v1` را دقیقاً با `level:"B2", round:16, unit:1, lesson:1` ذخیره کرد (`roundForLevel('B2')=16` درست است). بدون console error جز سه‌تای شناخته‌شدهٔ `net::ERR_FILE_NOT_FOUND`. worktree خالی‌شدهٔ agent (`agent-a8505978fff16b551`) با `git worktree remove --force` و `git branch -D` پاک شد. خارج از scope عمدی (طبق بریف): θ/SE ability-estimator کامل (§۸.۴)، آیتم‌های شنیداری در خود آزمون، ذخیرهٔ `vocab_place_v1`/retest بعد از ۱۴ روز (§۸.۶) — هرکدام جدا و بعداً. دو مشکل preexisting بی‌ربط که agent حین بررسی پیدا کرد ولی خارج از scope ماند: باز کردن هر شغلی `jobLevel` را به `'A1'` ریست می‌کند؛ میان‌بر «ادامهٔ درس بعدی» در کارت خانهٔ گرامر `gLv` را از باند واژه دوباره مشتق می‌کند نه از `state.gLv` — می‌تواند نتیجهٔ تازهٔ split این تسک را لحظهٔ کلیک از خانه پاک کند؛ هیچ‌کدام دست زده نشد. |
| `LEG-008` | DONE | رفع دو مشکلی که agent `LEG-007` حین کار پیدا کرد ولی خارج از scope گذاشت: (۱) باز کردن هر شغلی `jobLevel` را بی‌قیدوشرط به `'A1'` ریست می‌کرد، حتی اگر placement یا انتخاب دستی قبلی سطح دیگری تعیین کرده باشد؛ (۲) میان‌بر «ادامه» کارت گرامر روی صفحهٔ خانه، سطح پیشنهادی درس بعدی را از باند *واژگان* (`d.round`) می‌ساخت نه از `state.gLv` — یعنی درست لحظه‌ای که کاربر از خانه وارد گرامر می‌شد، می‌توانست نتیجهٔ split شدهٔ `LEG-007` را نادیده بگیرد و او را به درسی هم‌تراز واژگانش ببرد، نه گرامرش. | در `data/src/app.jsx`: خط `open: () => this.setState({ screen: 'jobdetail', job: j, jobLevel: 'A1' })` به `open: () => this.setState({ screen: 'jobdetail', job: j })` تغییر کرد — چون `jobLv = s.jobLevel \|\| 'A1'` (خط ~۴۳۲۱) از قبل fallback مناسب دارد، نیازی به ریست اجباری اینجا نبود. در `tracks()` (کارت‌های صفحهٔ خانه)، `const gBand = this.band((d && d.round) \|\| 1)` به `const gBand = Math.max(0, LEVELS.indexOf(this.state.gLv \|\| this.levelOf((d && d.round) \|\| 1)))` تغییر کرد — یعنی وقتی `gLv` واقعاً ست شده (از `LEG-007` یا انتخاب دستی قبلی)، همان مبنای انتخاب «درس بعدی» گرامر می‌شود؛ فقط برای کاربر کاملاً تازه‌ای که هنوز نه placement کرده و نه گرامر باز کرده (`gLv` واقعاً `undefined`)، به باند واژگان برمی‌گردد — دقیقاً همان رفتار قبلی برای آن حالت خاص. Build: `node tools/repack.js` → `app.jsx spliced in (289227 -> 317935 chars)`؛ `node tools/validate.js` → `ok — 10524 entries valid`. Verification با Playwright واقعی روی `english-vocab-v1.html`: (۱) یک جلسهٔ کامل placement با override دستی B2 اجرا و apply شد؛ رفتن به «شغل‌ها» و باز کردن اولین شغل (Doctor) صفحهٔ جزئیات را با «متن سطح‌بندی‌شده · B2» نشان داد — نه A1. (۲) با کاربر کاملاً تازه (بدون placement)، کارت گرامر خانه بدون خطا رندر شد (fallback به باند واژگان دست‌نخورده). سپس یک placement دیگر با override C1 اجرا و apply شد؛ روی صفحهٔ خانه کارت گرامر ظاهر شد، و کلیک روی آن مستقیماً «دستور زبان · سطح C1» را باز کرد — نه سطحی دیگر. بدون console error جز سه‌تای شناخته‌شدهٔ `net::ERR_FILE_NOT_FOUND`. محدودیت صادقانهٔ verification: چون override بر اساس طراحی `LEG-007` همهٔ ابعاد را یکسان تنظیم می‌کند، این تست ثابت می‌کند وقتی `gLv` ست است از آن استفاده می‌شود و چیزی نمی‌شکند، ولی یک سناریوی واقعاً *نامتقارن* (واژگان بالا، گرامر پایین، از دل خودِ آزمون تعیین سطح، نه override) به‌خاطر دشواری کنترل گزینه‌های درست چهارگزینه‌ای در کلیک کور، ساخته و زنده تست نشد؛ درستی منطق برای آن حالت از طریق خواندن مستقیم کد (`LEVELS.indexOf(gLv)` معادل دقیق `band`ی است که پیش‌تر از `d.round` مشتق می‌شد) تأیید شد، نه اجرای زنده. |

## 8. تصمیم‌های ثبت‌شده

| ID | Date | Status | Decision | Reason |
|---|---|---|---|---|
| `D-001` | 2026-08-16 | ACCEPTED | Laravel و Android در یک monorepo و دو پوشه مستقل باشند. | قراردادها و وضعیت مشترک؛ build/deploy مستقل |
| `D-002` | 2026-08-16 | ACCEPTED | backend به‌صورت Laravel REST API پیاده شود. | Android کلاینت اصلی است و Blade UI در MVP لازم نیست. |
| `D-003` | 2026-08-16 | ACCEPTED | Android Native با Kotlin و Jetpack Compose باشد. | محصول فعلاً فقط Android است. |
| `D-004` | 2026-08-16 | ACCEPTED | معماری Android offline-first باشد. | حفظ مزیت اصلی نسخه فعلی و جلوگیری از فقدان پیشرفت |
| `D-005` | 2026-08-16 | ACCEPTED | Room منبع حقیقت محلی و WorkManager مسئول sync باشد. | persistence و retry قابل‌کنترل |
| `D-006` | 2026-08-16 | ACCEPTED | توسعه محلی backend ابتدا با SQLite انجام شود. | حذف نصب زودهنگام DB server؛ تعویض production بعداً |
| `D-007` | 2026-08-16 | ACCEPTED | محتوا به‌صورت versioned pack منتشر شود، نه هزاران درخواست واژه. | سرعت، آفلاین و consistency |
| `D-008` | 2026-08-16 | ACCEPTED | legacy در مسیر فعلی باقی بماند تا migration وابستگی‌ها را مشخص کند. | جلوگیری از شکستن pipeline و تاریخچه موجود |
| `D-009` | 2026-08-16 | ACCEPTED | فایل‌های Markdown منبع اصلی مستندات بمانند و `docs/index.html` به‌صورت generated و self-contained از آن‌ها ساخته شود. | HTML ایستا نمی‌تواند از `file://` فایل‌های جدید پوشه را کشف کند؛ generated snapshot آفلاین، قابل‌اشتراک و قابل‌کنترل در Git است. |
| `D-010` | 2026-08-16 | ACCEPTED | فقط `EXECUTION_PLAN.md` مرجع زنده بازطراحی است؛ ۲۱ سند فعلی دیگر با برچسب legacy/reference نگهداری شوند و سند تازه خودکار legacy فرض نشود. | حفظ شواهد مهاجرت بدون اشتباه‌گرفتن پیشنهادها و auditهای نسخه قدیمی با تصمیم فعلی |
| `D-011` | 2026-08-17 | ACCEPTED | اپ جدید هیچ دکمهٔ خودارزیابی («بلدم»/«نمی‌دونم») ندارد؛ رفتار فعلی `toggleKnown`/`manualKnown` در `data/src/app.jsx` عمداً migrate نمی‌شود. سطح/mastery فقط از جواب درست/غلط واقعی در تمرین مشتق می‌شود. | خودارزیابی کاربر خوش‌بینانه و غیرقابل‌اعتماد است؛ مالک محصول این را صریحاً بعد از بررسی تبعاتش رد کرد (`docs/architecture/user-state-model.md` بخش ۳.۴) |
| `D-012` | 2026-08-17 | ACCEPTED | واژه‌های تسلط‌یافته هرگز به‌طور دائم از چرخهٔ مرور حذف نمی‌شوند؛ `UserProgress.due_date` همیشه معتبر است، فقط فاصله‌اش خیلی بلند می‌شود. | جلوگیری از فراموشی بلندمدت بعد از این‌که کاربر حس «بلدم» را از دست داد؛ با رفتار فعلی کد (پوش حداکثر ۶۰ روزه، نه حذف) هم‌راستاست |
| `D-013` | 2026-08-17 | ACCEPTED | جهت سوال (انگلیسی→فارسی یا فارسی→انگلیسی) فیلد جدا در `UserProgress` نیست؛ از `mode` مشتق می‌شود (`mcq`=recognition، `type`/`listen`/`cloze`=production)، طبق رفتار فعلی. | جلوگیری از duplicate بودن یک مفهوم که کد فعلی از قبل با mode پوشش می‌دهد |

تصمیم‌ها append-only هستند. تغییر یک تصمیم با ID جدید و ارجاع به تصمیم superseded ثبت می‌شود؛ سطر قبلی حذف نمی‌شود.

## 9. پرسش‌های باز محصول

این موارد قبل از task وابسته باید توسط مالک محصول تعیین شوند:

| ID | Needed before | Question |
|---|---|---|
| `Q-001` | `AND-001` | نام نهایی اپ و Android application ID چیست؟ |
| `Q-002` | `BE-010` | ورود با ایمیل، شماره موبایل، Google، guest یا ترکیبی از آن‌ها باشد؟ |
| `Q-003` | `REL-001` | انتشار در Google Play، کافه‌بازار، مایکت یا چند مارکت انجام می‌شود؟ |
| `Q-004` | `DATA-001` | آیا کاربر فعال و backup واقعی برای مهاجرت از Google Drive/localStorage وجود دارد؟ |
| `Q-005` | پیش از production sync | PostgreSQL یا MySQL و کدام hosting انتخاب می‌شود؟ |
| `Q-006` | `EXT-002` | ضبط کاربر فقط محلی بماند یا روی سرور نیز ذخیره شود؟ |

AI نباید پاسخ این پرسش‌ها را از خودش بسازد. کارهای مستقل می‌توانند ادامه پیدا کنند، اما task وابسته باید تا پاسخ معتبر متوقف بماند.

## 10. Definition of Done

یک task فقط وقتی `DONE` است که:

1. تمام acceptance criteria همان task برآورده شده باشد.
2. تست/build/lint/migration مرتبط اجرا و نتیجه ثبت شده باشد.
3. حالت خطا و در صورت ارتباط، رفتار آفلاین بررسی شده باشد.
4. هیچ secret، فایل local-only یا artifact غیرضروری commit نشده باشد.
5. API/schema change با contract یا migration سازگار باشد.
6. این سند در همان change به‌روزرسانی شده باشد.
7. Verification log شامل فرمان یا روش تست و نتیجه واقعی باشد.

وجود کد، generated file یا ادعای AI به‌تنهایی evidence محسوب نمی‌شود.

## 11. پروتکل اجباری کار AI

### پیش از کار

1. `AGENTS.md` و این سند را کامل بخوان.
2. `git status --short` را بررسی کن.
3. یک Task ID انتخاب کن و dependencies آن را کنترل کن.
4. اگر تغییر معماری یا scope لازم است، ابتدا decision/task را در همین سند اضافه کن.

### هنگام کار

- scope را به همان task محدود نگه دار.
- تغییرهای موجود کاربر را حفظ کن.
- legacy bundle را مستقیم ویرایش نکن.
- تست را هم‌زمان با implementation بساز.
- پس از هر تغییر در `docs/**/*.md`، فرمان `node tools/build-docs.js` را اجرا و `docs/index.html` را در همان change به‌روز کن.
- داده destructive یا migration برگشت‌ناپذیر را بدون مجوز صریح اجرا نکن.

### پایان کار

1. verification واقعی اجرا کن.
2. status و evidence task را اصلاح کن.
3. یک سطر به Verification log اضافه کن.
4. اگر کار ناقص است، آن را `DONE` نکن؛ remaining work یا blocker را دقیق ثبت کن.
5. کد و به‌روزرسانی سند باید در یک commit/change تحویل شوند.

## 12. وضعیت ابزارهای سیستم

Verified on 2026-08-16:

| Tool | State |
|---|---|
| Windows | Windows 11 Pro 64-bit, build 22631 |
| Hardware | Intel i5-8400, 16 GB RAM, بیش از 300 GB فضای خالی |
| Git | 2.52.0.windows.1 |
| Node / npm | 24.11.1 / 11.6.2 |
| PHP | 8.5.0؛ extensionهای لازم Laravel حاضر |
| Composer | 2.10.2؛ `composer diagnose` و vulnerability check پاس |
| Laravel Installer | 5.31.1 |
| Android Studio | نصب‌شده؛ build `AI-261.26222.65.2613.15948027`؛ امضای `studio64.exe` معتبر؛ JBR داخلی OpenJDK 25.0.2 |
| Android SDK / adb | نصب نشده |
| Virtualization | CPU پشتیبانی می‌کند ولی در BIOS/UEFI غیرفعال است |
| Docker/Redis/DB server | عمداً برای Phase 0 نصب نشده |

### 12.1 دستگاه دوم — macOS

این پروژه گاهی از یک دستگاه macOS جداگانه هم اجرا می‌شود (نه همان دستگاه Windows بالا). وضعیت toolchain روی آن مستقل ردیابی می‌شود:

Verified on 2026-08-16:

| Tool | State |
|---|---|
| macOS | Darwin 25.5.0 (arm64) |
| Package manager | Homebrew 6.0.12 |
| Node / npm | 20.19.0 / 11.5.2 (از پیش نصب بود؛ ارتقا نشد) |
| PHP | 8.5.9 (Homebrew)؛ در `~/.zshrc` به PATH اضافه شد |
| Composer | 2.10.2 (Homebrew) |
| Laravel Installer | 5.31.1 (`composer global require laravel/installer`) |
| JDK | Homebrew `openjdk@17` 17.0.20؛ `JAVA_HOME` در `~/.zshrc` تنظیم شد |
| Android SDK | ریشه: `/opt/homebrew/share/android-commandlinetools`؛ نصب‌شده: `platform-tools` 37.0.1، `build-tools;36.1.0`، `platforms;android-36`، `cmdline-tools;latest`؛ لایسنس‌ها پذیرفته شد |
| Android Studio (GUI) | نصب نشده — فقط command-line SDK؛ برای build/gradle headless لازم نیست، اما برای IDE باید جداگانه با `brew install --cask android-studio` نصب شود |
| Emulator / Virtualization | تست نشده |
| Docker/Redis/DB server | عمداً نصب نشده |

## 13. Verification and change log

این جدول append-only است.

| Date | Task | Actor | Verification / change |
|---|---|---|---|
| 2026-08-16 | `ENV-001` | Codex | `php -v` = 8.5.0؛ `composer --version` = 2.10.2؛ `laravel --version` = 5.31.1؛ تمام extensionهای الزامی حاضر؛ `composer diagnose` بدون vulnerability |
| 2026-08-16 | `ENV-002` | Codex | Android Studio 2026.1.3.7، size = 1,508,410,976 bytes، SHA-256 = `33c0da36175dbab84b16257e9709fce0ca9bdc533af92ed08d6634116f78bcdd`، Authenticode signer = Google LLC، status = Valid |
| 2026-08-16 | `DOC-001` | Codex | سند canonical شامل vision، scope، architecture، task board، decisions، DoD و AI protocol ایجاد شد. |
| 2026-08-16 | `DOC-002` | Codex | ورودی‌های `AGENTS.md`، `CLAUDE.md` و `.github/copilot-instructions.md` ایجاد شدند و همگی به سند canonical ارجاع می‌دهند. |
| 2026-08-16 | `ENV-003` | Codex | Android Studio در `C:\Program Files\Android\Android Studio` نصب شد؛ build = `AI-261.26222.65.2613.15948027`؛ Authenticode فایل `studio64.exe` معتبر و signer = Google LLC؛ JBR داخلی OpenJDK 25.0.2 با exit code صفر اجرا شد؛ Registry و `winget list` نصب را تشخیص دادند. |
| 2026-08-16 | `DOC-003` | Codex | `node --test tools/build-docs.test.js` = 6/6 pass؛ `node tools/build-docs.js --check` = current؛ `git diff --check` = pass؛ خروجی ۲۲ سند/۳۴۴ heading و بدون asset شبکه‌ای؛ Edge desktop render پاس؛ CDP در viewport واقعی 360px مقدار `scrollWidth = clientWidth = 360` را برای خانه/سند تأیید کرد و جست‌وجوی فارسی «همگام سازی» یک نتیجه برگرداند. |
| 2026-08-16 | `ENV-001` (macOS) | Claude | روی دستگاه macOS جداگانه (بخش 12.1): `brew install php composer openjdk@17 android-commandlinetools`؛ `php -v` = 8.5.9؛ `composer --version` = 2.10.2؛ `composer global require laravel/installer` → `laravel --version` = Laravel Installer 5.31.1. |
| 2026-08-16 | `ENV-004` (macOS) | Claude | روی همان دستگاه macOS: `JAVA_HOME` روی `openjdk@17` (17.0.20) تنظیم شد؛ `yes \| sdkmanager --licenses` همه لایسنس‌ها را پذیرفت؛ `sdkmanager "platform-tools" "build-tools;36.1.0" "platforms;android-36" "cmdline-tools;latest"` نصب شد؛ `sdkmanager --list_installed` هر سه پکیج را تأیید کرد؛ `adb version` = 1.0.41 (platform-tools 37.0.1-15733141) موفق. یک نسخهٔ تکراری `cmdline-tools/latest-2` (173MB) حذف شد. تمام PATH/`JAVA_HOME`/`ANDROID_HOME` در `~/.zshrc` پایدار شدند. Android Studio (GUI) نصب نشد — این کار برای هیچ build خط‌فرمانی لازم نبود؛ در صورت نیاز به IDE باید جداگانه درخواست شود. |
| 2026-08-16 | مستندسازی (بدون task ID) | Claude | بخش «۴.۶ گراف اتصال اجزا» اضافه شد: دو دیاگرام ASCII — وابستگی تسک‌های Phase 1 به هم (`ARC-001` → `DATA-001`/`ARC-002`/`ARC-003` → `ARC-004`) و نگاشت این تسک‌ها به اجزای واقعی سیستم (Laravel DB، OpenAPI، Room، Outbox/WorkManager) — پیش از شروع `ARC-001`. `node --test tools/build-docs.test.js` = 6/6 pass؛ `node tools/build-docs.js --check` = current. |
| 2026-08-16 | `ARC-001` | Claude | `docs/architecture/content-model.md` ایجاد شد: خواندن مستقیم `data/words.json` (۱۰,۵۲۴ رکورد)، `data/categories.json` (۲۹ دسته) و هر پنج فایل `data/curricula/*.js` (grammar، sentences، listening1/2، discussion، collocations)؛ شش entity با فیلد/نوع/constraint (`Category`, `Word`, `Example`, `ContentVersion`, `CurriculumUnit`, `DiscussionMethod`)، ERD متنی، و یادداشت migration برای `DATA-001`. طبق بخش ۵ (خارج از MVP: «انتقال کامل grammar/speaking در یک release»)، پنج curriculum غیرواژگانی عمداً به‌صورت polymorphic/JSON مدل شدند تا از over-engineering پیش از هر مصرف‌کننده‌ی واقعی جلوگیری شود. `node --test tools/build-docs.test.js` = 6/6 pass؛ `node tools/build-docs.js --check` = current. |
| 2026-08-17 | `ARC-002` | Claude | `docs/architecture/user-state-model.md` ایجاد شد. منبع: `node tools/unpack.js` روی `english-vocab-v1.html` برای خواندن `data/src/app.jsx` واقعی (نه فرض)؛ سپس `git checkout -- data/src/template.html` برای برگرداندن diff ناخواسته‌ی regenerate (خارج از scope همین task) — `app.jsx` بدون تغییر باقی ماند چون از قبل با نسخه‌ی committed یکی بود. شش entity مستند شد (`UserProgress` با الگوریتم واقعی `srMark`/`srDue`/`srKnown`، `Favorite`, `CustomWord`+`CustomCategory`+`CategoryOverride`, `UserSentence`, `DailyActivity`, `Outbox`)؛ یک تناقض داده‌ی فعلی (دو نمایش هم‌پوشان favorites) به‌عنوان open decision ثبت شد نه حدس زده شد. سه تصمیم محصولی این نشست به `D-011`–`D-013` اضافه شد. `node --test tools/build-docs.test.js` و `node tools/build-docs.js --check` پایین همین سطر. |
| 2026-08-17 | `LEG-001` | Claude | مالک محصول صریحاً خواست رفتار اپ فعلی هم عوض شود، نه فقط سند طراحی. `node tools/unpack.js` دوباره اجرا شد و معلوم شد `data/src/template.html` committed نسبت به bundle واقعی ۱۴۲۶ خط قدیمی‌تر بود (پیش از این نشست، بدون ربط به این تغییر) — بعد از unpack تازه، `data/src/app.jsx` ویرایش‌شده روی نسخه‌ی تازه بازیابی شد تا آن drift پیش‌موجود هم تصحیح شود. تغییرات: حذف `toggleKnown`/دکمهٔ «بلدم»، حذف سه دکمهٔ رتبه‌بندی «آسان/خوب/سخت» با یک دکمهٔ «ادامه»/«دوباره»، حذف متن راهنمای منسوخ. `node tools/repack.js` بدون خطا (round-trip check پاس)؛ `node tools/validate.js` = `ok — 10524 entries valid`؛ سه مسیر UI (flash، mcq درست، mcq غلط) با Playwright headless در `file://.../english-vocab-v1.html` تست و اسکرین‌شات شد، بدون console error، بدون بقایای دکمهٔ حذف‌شده. |
| 2026-08-17 | `LEG-002` | Claude | فقط `data/src/app.jsx` ویرایش شد (`git diff --stat` = یک فایل منطق + بازتولید `english-vocab-v1.html`؛ `data/src/template.html` صفر تغییر). پیش از شروع: `git status --short` در worktree تمیز بود. کد جدید: `LESSON_SIZE=8`، `UNIT_LESSONS=10` (مستدل در کامنت کد: ۸۰ واژه/واحد ≈ اندازهٔ یک واحد کتاب درسی چاپی، ۱۱ تا ۳۳ واحد در هر سطح)، `roundForLevel/lessonsInLevel/unitsInLevel/lessonsInUnit/lessonWordsOf/wordPosition/lessonStats`، migration افزایشی در `load()`، و `nextLesson()` به‌جای `nextRound()` (۴ call site به‌روزرسانی شد). Build/validate: `node tools/repack.js` → `app.jsx spliced in (289227 -> 293273 chars)`، `node tools/validate.js` → `ok — 10524 entries valid`؛ `node --check` روی کپی `app.jsx` پاس. Playwright (headless Chromium، نصب‌شده در `/private/tmp/.../scratchpad/pw-test`، همان محیطی که `LEG-001` استفاده کرد) چهار سناریو را روی `file://.../english-vocab-v1.html` تأیید کرد: (۱) کاربر تازه (`localStorage` خالی) → کلیک «واژه‌ها» → صفحهٔ study با «A1 · ۰ از ۸۴۲ آشناشده» نمایش داده شد؛ پس از یک تعامل واقعی (نمایش معنی + ادامه، چون بدون تعامل هیچ `save()`ای رخ نمی‌دهد) مقدار ذخیره‌شده دقیقاً `{level:"A1",unit:1,lesson:1,round:1}` و `order.length=5` بود، بدون console error (اسکرین‌شات `leg002-a-fresh-flash.png`, `leg002-a2-fresh-after-answer.png`). (۲) کاربر قدیمی شبیه‌سازی‌شده با `localStorage.vocab_app_v1={"round":15,...بقیهٔ فیلدهای blank()}` (بدون `level`) قبل از reload — بلافاصله بعد از reload (بدون هیچ تعاملی، چون migration اکنون eager-save می‌کند) مقدار ذخیره‌شده `{level:"B1",unit:1,lesson:1,round:11}` بود؛ `band(15)=2=band(11)` پس سطح واقعاً نپرید؛ صفحهٔ study بعدی «B1 · ۰ از ۱۵۷۹» را درست نشان داد؛ بدون console error (اسکرین‌شات `leg002-b1-existing-home.png`, `leg002-b2-existing-study.png`). (۳) تست مستقیم منطق `nextLesson()` با seed کردن `vocab_sr_v1` (۸ واژهٔ درس ۱ واحد ۱ A1 را introduced علامت زد) و `vocab_app_v1.pos>=order.length` برای فورس‌کردن trigger: نتیجه `unit:1→1, lesson:1→2` — فقط ترقی درس، بدون تغییر واحد/سطح. (۴) همان روش برای آخرین درس آخرین واحد A1 (`unit:11,lesson:6`, محاسبه‌شده از `lessonsInLevel=106, unitsInLevel=11`): نتیجهٔ زنجیرهٔ کامل `level:A1→A2, unit:11→1, lesson:6→1, round:1→6` بود و صفحهٔ study بعدی «A2 · ۰ از ۱۱۵۸» را نشان داد (اسکرین‌شات `leg002-c-before-cascade.png`, `leg002-c2-after-cascade.png`). در هر چهار سناریو `page.on('console','error')`/`pageerror` خالی بود به‌جز سه خطای بارگذاری منبع از‌پیش‌موجود و بی‌ربط به این تسک (`net::ERR_FILE_NOT_FOUND` برای `{{ exAudioUrl }}`/`{{ ltUrl }}`/`{{ dUrl }}` در markup تأییدنشدهٔ jobs/listening/discussion — این‌ها placeholder موستاش خام هستند که در `template.html` دست‌نخورده از قبل هم روی صفحهٔ خانه رخ می‌دهند، ربطی به منطق واژگان ندارند و `git diff` تأیید کرد `template.html` اصلاً تغییر نکرده). خارج از scope عمدی: `chunkOrder()`/موتور صف (`MAX_NEW=5`) دست‌نخورده ماند — کدام کارت واقعاً کِی نشان داده می‌شود، اسکوپ فاز ۲ (session engine) است؛ UI صفحهٔ study/`roundNum`/`roundInLevel` و بخش‌های grammar/sentence/listening/discussion/jobs لمس نشدند. |
| 2026-08-17 | `LEG-003` | Claude | پیش از شروع: `git status --short` نشان داد `data/src/app.jsx`/`docs/EXECUTION_PLAN.md`/`docs/index.html`/`english-vocab-v1.html`/`technical-docs.html` از `LEG-002` (تکمیل‌شده، هنوز commit نشده) dirty هستند — طبق دستور، دست‌نخورده نگه داشته و رویش کار شد؛ به‌علاوه یک فایل untracked `word-session-scenario.md` (پیش‌نویس خودِ مالک محصول که این task از آن استخراج شده) بدون تغییر باقی ماند. فقط `data/src/app.jsx` ویرایش شد؛ `data/src/template.html` صفر تغییر (grep تأیید کرد رندر mcq/گزینه‌ها/دکمه‌ها بدون markup جدید کافی بود). کد جدید به‌طور خلاصه (شرح کامل در ردیف جدول بالا): `IL_GAP_B_MIN/MAX`, `IL_GAP_C_MIN/MAX`, `IL_RETRY_GAP_MIN/MAX`, `IL_MAX_FAILS` (ثابت‌های نام‌گذاری‌شده)؛ `ilLoad/ilSave/ilTurnFor/ilHasPending/ilSchedule` روی کلید تازهٔ `vocab_session_v1`؛ `modeFor()`/`prepare()`/`buildOptions()`/`renderVals()` هر کدام یک شاخهٔ کوچک برای `ilTurnFor` گرفتند؛ حالت جدید `fa2en` به `MODES` اضافه شد؛ `_srApplyOutcome` از `srMark()` استخراج شد (ریاضی بدون تغییر) و `srCompleteInitialLearning()` را ممکن کرد؛ `chunkOrder(d,n)` امضایش عوض شد (قبلاً `chunkOrder(r,n)`) و ۵ call site (`blank`, دو جای `load`, `nextLesson`, `applyPlacement`) به‌روزرسانی شدند؛ `queueStats(d,n)` مشابه؛ `advanceLessonIfDone()`/`extendQueue()`/`afterCard()`/`ilAdvance()` تازه اضافه شدند. Build: `node --check` روی کپی `.js` از `app.jsx` پاس؛ `node tools/repack.js` → `app.jsx spliced in (289227 -> 305578 chars)`؛ `node tools/validate.js` → `ok — 10524 entries valid`. Verification با Playwright (Chromium headless، نصب تازه در `/private/tmp/.../scratchpad/pw-test`، همان الگوی `LEG-001`/`LEG-002`) روی `file://.../english-vocab-v1.html`، با `localStorage` خالی (کاربر کاملاً تازه): (۱) کارت اول جلسه = نوبت A واژهٔ «day» — کاملاً بازشده (واژهٔ انگلیسی + IPA در صورت وجود + صدا + معنی فارسی + جملهٔ نمونه + ترجمه)، فقط یک دکمهٔ «ادامه»، بدون «نمایش معنی» و بدون «دوباره» (اسکرین‌شات `leg003-turnA.png`). (۲) یک عبور کامل و تمیز (بدون هیچ خطای اسکریپت) روی هر ۸ واژهٔ درس ۱/واحد ۱/A1 با پاسخ‌های همیشه‌درست ثبت شد: هر ۸ واژه نوبت A→B→C را با فاصلهٔ واقعی طی کردند (نمونه: two: A=کارت۲, B=کارت۶ (فاصله ۴), C=کارت۱۰ (فاصله ۴)؛ every: A=۲۰, B=۲۲ (فاصله۲), C=۲۵ (فاصله۳)) — هیچ‌کدام هرگز بلافاصله یا حتی نزدیک به نوبت قبلی خودشان تکرار نشدند؛ نوبت B با «چهارگزینه‌ای انگلیسی→فارسی» (اسکرین‌شات `leg003-turnB-unanswered.png`) و نوبت C با گزینه‌های انگلیسی روی پرامپت فارسی (`leg003-turnC-unanswered.png`, `leg003-turnC-correct.png`) دقیقاً طبق spec رندر شدند. (۳) جواب عمداً غلط روی نوبت B واژهٔ اول («day»، کارت۵): گزینهٔ غلط قرمز و گزینهٔ درست سبز نشان داده شد، ولی تنها دکمهٔ روی صفحه «ادامه» بود — هیچ «دوباره»ای نبود (اسکرین‌شات `leg003-turnB-wrong-fullpage.png`)؛ `localStorage.vocab_sr_v1` بلافاصله قبل/بعد از این جواب غلط عیناً یکسان ماند (بایت‌به‌بایت مقایسه شد در اسکریپت)؛ همان نوبت B سه کارت بعد (کارت۸، فاصلهٔ retry=۳، داخل بازهٔ `IL_RETRY_GAP`) خودکار و بی‌صدا دوباره ظاهر شد. (۴) بعد از موفقیت واقعی نوبت C، `vocab_sr_v1` هر ۸ واژه رکورد یکسان و معقول گرفت: `[2, day, day, 9, 1, 3, day+3, 1.04]` یعنی `successes=2, introduced=1, phase=3 (نوبت بعدی واقعی=type), modeMask=9(flash|mcq), dueDay=۳ روز بعد, ease=1.04` — دقیقاً منطبق با محاسبهٔ دستی `_srApplyOutcome` دوبار پشت‌سرهم. (۵) هدف نرم روزانه: صفحهٔ «هدف روزانه» تا زمانی که واژه‌ای نوبت فعال داشت (`ilHasPending()`) ظاهر نشد؛ وقتی در طول همین اجرا ظاهر شد (بعد از این‌که همهٔ ۸ واژه به `done` رسیدند)، کلیک «۲۰ کارت دیگر» بدون هیچ صفحهٔ میانی «صف فعلی تمام شد» جلسه را با واژه‌های درس بعدی ادامه داد (`extendQueue`→`advanceLessonIfDone`). (۶) رگرسیون صریح روی مسیر غیر-IL: یک واژهٔ از‌قبل در `vocab_sr_v1` (phase=1/mcq، due=دیروز) seed شد؛ به‌عنوان مرور موعددار با prompt «معنی درست را انتخاب کن» ظاهر شد (نه flash)؛ جواب غلط دکمهٔ «دوباره» را طبق `LEG-001` نشان داد؛ کلیک «دوباره» واقعاً `srMark` را صدا زد و `vocab_sr_v1` را عوض کرد (`successes 1→0, ease 1→0.88, dueDay+1`) — یعنی مسیر مرورهای معمولی دقیقاً همان‌طور که `LEG-001` رهایش کرده بود دست‌نخورده ماند. در تمام سناریوها `page.on('console','error')`/`pageerror` فقط همان سه خطای شناخته‌شدهٔ از‌پیش‌موجود `net::ERR_FILE_NOT_FOUND` را داشت (در سناریوی رگرسیون با یک `reload()` اضافه، ۶ تا = ۲×۳)، هیچ خطای جدیدی نبود. خارج از scope عمدی: انتخاب گزینه‌های غلط چهارگزینه‌ای (distractor selection) هیچ تغییری نکرد — دقیقاً همان `buildOptions()` قبلی با یک `shown()` متفاوت برای نوبت C؛ حذف دکمهٔ ویرایش معنی (که در `word-session-scenario.md` بخش «تصمیم‌های قطعی‌شده» ردیف ۵ آمده) بخشی از این brief نبود و دست‌نخورده ماند؛ `srDue`/`srKnown`/جدول `base_gap`/`ease` عیناً حفظ شدند، فقط توالی صدازدن‌شان برای دو دادهٔ اول یک واژه تغییر کرد. |
| 2026-08-17 | `LEG-004` | Claude | پیش از grep: بررسی شد که `editVal`/`onEditVal`/`editKey`/`editSave`/`editCancel` و متد `editStart()` هم در بلاک کارت مطالعه (خط ~۹۹۳۲ سابق) و هم در پنل «بیشتر»ی صفحهٔ واژه‌نامه (خط ~۱۰۳۱۹) استفاده می‌شدند — یعنی حذف بی‌احتیاط props می‌توانست ویژگی مدیریت محتوای واژه‌نامه را هم بشکند. فقط بلاک اختصاصی کارت مطالعه (`cardEditing`/`cardNotEditing`/دکمهٔ مداد/input درجا) از `data/src/template.html` حذف شد؛ در `data/src/app.jsx` فقط props بی‌مصرف‌شدهٔ اختصاصی کارت (`cardEditing`, `cardNotEditing`, `editStart` نسخهٔ کارت, `editInputStyle`) حذف شدند، بقیه دست‌نخورده ماند. `node tools/repack.js` → بدون خطا؛ `node tools/validate.js` → `ok — 10524 entries valid`. Playwright headless روی `file://.../english-vocab-v1.html`: بعد از ورود به کارت مطالعه، `page.locator('button[title="ویرایش معنی"]').count()` = ۰؛ کارت نوبت A بدون مداد رندر شد (اسکرین‌شات `shot-edit-removed-study.png`)؛ `console`/`pageerror` فقط همان سه خطای شناخته‌شدهٔ قبلی. رگرسیون کامل روی خودِ پنل «بیشترِ» واژه‌نامه (کلیک و ویرایش واقعی) اجرا نشد — فقط با grep روی هر دو فایل تأیید شد که markup و props مصرف‌کنندهٔ آن هنوز دقیقاً سرجایشان‌اند؛ اگر لازم شد باید جداگانه با کلیک واقعی تأیید شود. |
| 2026-08-17 | `LEG-005` | Claude | پیش از شروع: `git status --short` نشان داد همان پنج فایل `LEG-001`–`LEG-004` (تکمیل‌شده، هنوز commit نشده) dirty بودند — دست‌نخورده نگه داشته و رویش کار شد. فقط `buildOptions()` در `data/src/app.jsx` بازنویسی شد (شرح کامل ترتیب لایه‌ها/فیلترها در ردیف جدول بالا)؛ `data/src/template.html` صفر تغییر. Build: `node --check` روی کپی `.js` پاس؛ `node tools/repack.js` → `app.jsx spliced in (289227 -> 310143 chars)`؛ `node tools/validate.js` → `ok — 10524 entries valid`. Verification سه‌بخشی (همان محیط Playwright در `/private/tmp/.../scratchpad/pw-test` که `LEG-001`–`LEG-004` استفاده کردند، به‌علاوه یک harness جدید در `/private/tmp/.../scratchpad/harness.js`): (۱) `leg005.js` یک جلسهٔ کاملاً تازه (`localStorage` خالی) را روی درس ۱/واحد۱/A1 طی کرد و ۱۶ چهارگزینه‌ای واقعی (Turn B/C هر ۸ واژه) را ثبت کرد؛ هر ۱۶ مورد دقیقاً ۴ گزینه داشتند، بدون گزینهٔ تکراری، پاسخ درست همیشه حاضر. برای مقایسه، همان اسکریپت الگوریتم *قدیمی* را (رونوشت وفادار از کد حذف‌شده) روی همان `window.VOCAB_WORDS`/seed مستقل اجرا کرد — نمونهٔ واقعی: «day» قدیم=`["دیر/متأخر","روز","سپیده/طلوع","برنامه‌ریزی شده"]` (بی‌ربط) در برابر جدید=`["گرفتن/بردن","روز","آنجا","یک"]` (هم‌درسی‌های واقعی همین جلسه)؛ «every» قدیم=`["آلمانی (حرف‌تعریف)","فراتر از","هر","به نام‌های دیگر/یعنی"]` در برابر جدید=`["آنجا","روز","هر","دوام آوردن/طول کشیدن"]`. صفر console error جز سه‌تای شناخته‌شدهٔ `net::ERR_FILE_NOT_FOUND`. (۲) `harness.js`: تابع واقعی `buildOptions()` مستقیماً با regex از متن فعلی `app.jsx` استخراج و بدون هیچ بازنویسی موازی، روی `data/words.json` واقعی با mock های کنترل‌شده برای `state.data`/`ilLoad`/`srLoad`/`wordPosition` اجرا شد؛ با خالی‌کردن عمدی لایه‌های زودتر، هر پنج لایه جدا تأیید شد (لایهٔ۱: استخر جلسهٔ ساختگی → هر ۳ گزینه از همان استخر؛ لایهٔ۲: `lessonWordsOf` درس فعلی + ۱-۲ درس قبل؛ لایهٔ۳ با `wordPosition` جعلی `null` + استخر ۵تایی «ضعیف» ساختگی در `srLoad` → هر ۳ گزینه از استخر ضعیف؛ لایهٔ۴ با همان ترفند → هر ۳ گزینه هم‌دسته؛ `fa2en` هم روی گزینه‌های انگلیسی درست کار کرد)؛ به‌علاوه یک تست فیلتر کیفیت: جفت واقعی از `data/words.json` با `fa` کاملاً یکسان پیدا شد، دومی عمداً در استخر جلسه قرار گرفت، هرگز نشت نکرد. خروجی: `ALL PASS` روی هر ۶ سناریو. (۳) رگرسیون: واژهٔ index=0 با `vocab_sr_v1` seed‌شده به‌عنوان مرور موعددار دیروز، بعد از reload به‌عنوان اولین کارت با prompt «معنی درست را انتخاب کن» (نه flash) رندر شد، ۴ گزینه داشت، جواب عمداً غلط «دوباره» را نشان داد (طبق `LEG-001` دست‌نخورده)، و کلیک «دوباره» واقعاً `vocab_sr_v1` را عوض کرد (`successes 1→0, ease 1→0.88`)؛ اسکرین‌شات‌ها `leg005-turnB-mcq.png`, `leg005-regular-review-mcq.png`. خارج از scope عمدی (طبق بریف): distractor بر اساس شباهت معنایی/embeddings؛ حافظهٔ «جفت اشتباه‌گیری» بین‌جلسه‌ای؛ هیچ تغییری در `data/words.json`، ریاضیات SRS، یا منطق نوبت‌بندی `LEG-003`؛ `placementVocabQs`/placement عمداً دست‌نخورده ماند (منطق distractor مستقل و ساده‌ی خودش را دارد، طبق بریف). |
| 2026-08-17 | `LEG-006` | Claude | این task ابتدا با `isolation: worktree` به یک agent سپرده شد. آن worktree از آخرین commit شاخه زده بود (`9335554`، فقط شامل `LEG-001`) نه از تغییرات commit‌نشدهٔ `LEG-002`–`LEG-005` که فقط در working tree اصلی حضور دارند — یعنی `chunkOrder()` در آن worktree هنوز شکل قدیمی (`chunkOrder(r,n)`، انتخاب واژهٔ تازه از کل باند سطح) را داشت. Agent این ناهماهنگی را خودش، با grep و بررسی `git log`، تشخیص داد؛ به‌جای نوشتن ادعای «تأیید شد» روی کدی که با اپ واقعی فرق دارد (که طبق بخش ۱۰ همین سند «صرفاً ادعای AI بدون شواهد واقعی» محسوب می‌شود)، متوقف شد و فقط فرمول را با یک شبیه‌سازی pure-JS مستقل از اپ (`leg006-formula-check.js`) درست ثابت کرد. من فرمول را عیناً (بدون تغییر) در `data/src/app.jsx` واقعی، داخل `chunkOrder()` فعلی (پس از `LEG-002`/`LEG-003`/`LEG-005`) اعمال کردم. Build: `node tools/repack.js` → `app.jsx spliced in (289227 -> 310819 chars)`؛ `node tools/validate.js` → `ok — 10524 entries valid`. Verification با Playwright واقعی (نه شبیه‌سازی) روی `english-vocab-v1.html`: سه واژه در `vocab_sr_v1` seed شد (`city`: ۰ successes/ease=.75/۳روز عقب؛ `especially`: ۶ successes/ease=۱.۶/۵روز عقب؛ `index finger`: ۶ successes/ease=۱.۶/۳۰روز عقب)، سپس با پاسخ‌دادن درست به هر کارت و پیشروی واقعی (نه صرفاً خواندن state)، ترتیب واقعی مشاهده‌شده `index finger → city → especially` بود — دقیقاً برابر با ترتیب نزولی `duePriority` محاسبه‌شده (۳۰ / ۸.۷۵ / ۵): واژهٔ خیلی عقب‌افتاده starve نشد، و بین دو واژهٔ نزدیک‌به‌هم‌عقب‌افتاده، ضعیف‌تر جلو افتاد. بدون console error جز شش موردِ (۲×۳ به‌خاطر یک `reload`) شناخته‌شدهٔ `net::ERR_FILE_NOT_FOUND`. worktree خالی‌شدهٔ agent (`agent-abcee821bfdcde9a3` / شاخهٔ `worktree-agent-abcee821bfdcde9a3`) با `git worktree remove --force` و `git branch -D` پاک شد. |
| 2026-08-17 | `LEG-007` | Claude | این task هم با `isolation: worktree` شروع شد و وسط اجرا با ریستارت سشن قطع شد (نه یک stop تمیز). قبل از قطع‌شدن، agent با `diff -rq` واقعی تشخیص داده و با `cp` مستقیم از working tree اصلی، `LEG-001`–`LEG-005` را کامل و بدون بازسازی به worktree خودش آورده بود؛ فقط توابع placement (`startPlacement`, `placementPick`, `placementAdvance`, `applyPlacement`, `placementSetOverride` تازه) و markup صفحهٔ نتیجه را ویرایش کرده بود. چون این کپی قبل از فرود `LEG-006` رخ داده بود، worktree فاقد `duePriority`/`weaknessBonus` بود — با grep تأیید شد. بعد از resume (طبق دستورالعمل notification)، agent دقیقاً همین را گزارش کرد، به‌علاوه این‌که Playwright را کامل اجرا نکرده بود و ردیف `LEG-007` هنوز به هیچ نسخه‌ای از سند اضافه نشده بود. من دقیقاً همان تابع‌ها/render props/markup مربوط به placement را از worktree خواندم و روی `data/src/app.jsx`/`data/src/template.html` واقعی (که `LEG-001`–`LEG-006` را داشت) پورت کردم؛ `chunkOrder`/`LEG-006` را دست نزدم چون کد placement فقط `this.chunkOrder(d,n)` را با امضای فعلی صدا می‌زد. Build: `node tools/repack.js` → `app.jsx spliced in (289227 -> 317019 chars)`؛ `node tools/validate.js` → `ok — 10524 entries valid`. Verification (تفصیل کامل در ردیف جدول بالا) دوبخشی: تست منطق خالص با سناریوی ناهمسو (`leg007-logic-check.js`) + سه اجرای زندهٔ Playwright روی `english-vocab-v1.html` (نتیجهٔ عادی با شکست واژگان/گرامر، override زنده با کلیک چیپ، و apply واقعی که `vocab_app_v1` را با `level:"B2",round:16,unit:1,lesson:1` ذخیره کرد). worktree خالی‌شدهٔ agent (`agent-a8505978fff16b551`) با `git worktree remove --force` و `git branch -D` پاک شد. |
| 2026-08-17 | `LEG-008` | Claude | بدون agent جدا — مستقیم توسط من، چون هر دو تغییر کوچک و کاملاً مشخص بودند (توسط `LEG-007` حین بررسی پیدا و مستند شده بودند). دو fix در `data/src/app.jsx`: حذف `jobLevel: 'A1'` اجباری از `open()` هر ردیف شغل؛ تغییر `gBand` در `tracks()` به اولویت‌دادن `state.gLv` بر `d.round`. Build: `node tools/repack.js` → `app.jsx spliced in (289227 -> 317935 chars)`؛ `node tools/validate.js` → `ok — 10524 entries valid`. Verification با Playwright واقعی: fix شغل با یک چرخهٔ کامل placement→override B2→apply→باز کردن «Doctor» تأیید شد («متن سطح‌بندی‌شده · B2» نه A1). fix گرامر با دو اجرا تأیید شد: کاربر تازه (بدون خطا، fallback درست) و کاربر بعد از override C1 (کلیک کارت گرامر خانه مستقیم «دستور زبان · سطح C1» را باز کرد). محدودیت صادقانه: چون `override` همه‌چیز را یکسان می‌کند، یک سناریوی واقعاً نامتقارن (واژگان≠گرامر، بدون override) به‌خاطر دشواری کنترل‌کردن پاسخ‌های درست چهارگزینه‌ای با کلیک کور، زنده ساخته نشد؛ درستی برای آن حالت با خواندن کد (`LEVELS.indexOf(gLv)` دقیقاً معادل همان `band`ی است که قبلاً از `d.round` مشتق می‌شد) تأیید شد، نه اجرای زنده — این محدودیت در ردیف جدول بالا هم صریح ثبت شده. بدون console error جز سه‌تای شناخته‌شدهٔ `net::ERR_FILE_NOT_FOUND`. |
