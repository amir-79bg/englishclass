# سند اجرایی بازطراحی لغتنامه — Laravel API + Android Native

**Status:** Active — canonical source of truth

**Last updated:** 2026-08-16

**Current phase:** Phase 0 — environment and repository governance

**Next executable task:** `ENV-004` — install and verify Android SDK toolchain

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
└── لغتنامه (ورژن ۱۱).html      # محصول legacy؛ فعلاً در محل فعلی می‌ماند
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
| `ENV-001` | DONE | نصب backend toolchain | PHP 8.5.0، Composer 2.10.2، Laravel Installer 5.31.1؛ تمام PHP extensionهای لازم حاضر؛ `composer diagnose` بدون vulnerability |
| `ENV-002` | DONE | دریافت installer رسمی Android Studio | نسخه 2026.1.3.7؛ 1,508,410,976 bytes؛ SHA-256 مطابق winget؛ امضای `Google LLC` معتبر |
| `ENV-003` | DONE | نصب Android Studio | نصب در `C:\Program Files\Android\Android Studio`؛ build و JBR داخلی معتبر؛ Registry و winget نصب را تشخیص می‌دهند |
| `ENV-004` | TODO | نصب Android SDK toolchain | SDK platform، build-tools، platform-tools، command-line tools؛ اجرای موفق `adb version` |
| `ENV-005` | BLOCKED | فعال‌سازی Virtualization برای Emulator | نیازمند اقدام دستی کاربر در BIOS/UEFI و سپس Windows Hypervisor Platform؛ تا آن زمان گوشی واقعی قابل استفاده است |
| `DOC-001` | DONE | ایجاد سند اجرایی canonical | این فایل ایجاد و از README قابل کشف است |
| `DOC-002` | DONE | افزودن entrypoint برای AIها | `AGENTS.md`، `CLAUDE.md` و Copilot instructions به سند canonical ارجاع می‌دهند |

### Phase 1 — قراردادها و مدل داده

| ID | Status | Task | Acceptance / evidence |
|---|---|---|---|
| `ARC-001` | TODO | مدل canonical محتوا و ERD اولیه | words/categories/examples/curricula/content versions و روابط مستند شوند |
| `ARC-002` | TODO | مدل user state و SRS | progress/favorites/custom content/activity/outbox با invariants مشخص شود |
| `ARC-003` | TODO | قرارداد OpenAPI v1 | health/auth/manifest/content/sync schemas و error envelope تعریف شوند |
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

## 13. Verification and change log

این جدول append-only است.

| Date | Task | Actor | Verification / change |
|---|---|---|---|
| 2026-08-16 | `ENV-001` | Codex | `php -v` = 8.5.0؛ `composer --version` = 2.10.2؛ `laravel --version` = 5.31.1؛ تمام extensionهای الزامی حاضر؛ `composer diagnose` بدون vulnerability |
| 2026-08-16 | `ENV-002` | Codex | Android Studio 2026.1.3.7، size = 1,508,410,976 bytes، SHA-256 = `33c0da36175dbab84b16257e9709fce0ca9bdc533af92ed08d6634116f78bcdd`، Authenticode signer = Google LLC، status = Valid |
| 2026-08-16 | `DOC-001` | Codex | سند canonical شامل vision، scope، architecture، task board، decisions، DoD و AI protocol ایجاد شد. |
| 2026-08-16 | `DOC-002` | Codex | ورودی‌های `AGENTS.md`، `CLAUDE.md` و `.github/copilot-instructions.md` ایجاد شدند و همگی به سند canonical ارجاع می‌دهند. |
| 2026-08-16 | `ENV-003` | Codex | Android Studio در `C:\Program Files\Android\Android Studio` نصب شد؛ build = `AI-261.26222.65.2613.15948027`؛ Authenticode فایل `studio64.exe` معتبر و signer = Google LLC؛ JBR داخلی OpenJDK 25.0.2 با exit code صفر اجرا شد؛ Registry و `winget list` نصب را تشخیص دادند. |
