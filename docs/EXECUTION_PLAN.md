# سند اجرایی بازطراحی لغتنامه — Laravel API + Android Native

**Status:** Active — canonical source of truth

**Last updated:** 2026-08-16

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
