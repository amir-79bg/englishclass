# مدل user state و SRS (ARC-002)

این سند progress، favorites، custom content، activity و outbox را برای backend Laravel و local source of truth اندروید (Room) تعریف می‌کند — همان چیزی که `ARC-001` («مدل canonical محتوا») عمداً کنار گذاشت. ورودی آن دو منبع واقعی است، نه بحث یا فرض:

1. خواندن مستقیم منطق SRS/progress موجود در اپ فعلی، از طریق `node tools/unpack.js` روی `english-vocab-v1.html` → `data/src/app.jsx` (کلاس‌های `srLoad`/`srMark`/`srKnown`/... و ساختار `blank(n)` state).
2. تصمیم‌های محصولی که در همین نشست با مالک محصول گرفته شد (بخش ۳.۴).

اگر این سند با رفتار واقعی کد یا داده تعارض داشت، کد و داده منبع حقیقت‌اند و این سند باید اصلاح شود — مگر جایی که صریحاً به‌عنوان انحراف عمدی (بخش ۳.۴) ثبت شده باشد.

## 1. اصول

- `UserProgress.word_id` به `Word.id` جدید ارجاع می‌دهد (نه `legacy_id`)، طبق نکتهٔ بخش ۵ در `content-model.md`.
- محتوای کاتالوگ (`ARC-001`) و user state کاملاً جدا می‌مانند؛ هیچ فیلد progress روی جدول‌های `Word`/`Category` اضافه نمی‌شود.
- **هیچ واژه‌ای که یک‌بار `introduced` شده هرگز به‌طور دائم از چرخهٔ مرور خارج نمی‌شود.** همیشه یک `due_date` معتبر در آینده دارد؛ فاصله می‌تواند خیلی بلند شود (ماه‌ها) اما هرگز null/حذف‌شده نیست. این پاسخ مستقیم به نگرانی مالک محصول در همین نشست است («هرچی جلو می‌رم بازم با درصد کم یادآوری می‌کنه») — و رفتار فعلی کد هم همین را با `due_date` همیشه-معتبر پیاده می‌کند، فقط این‌جا صریح شده.
- **بدون دکمهٔ خودارزیابی («بلدم» / «نمی‌دونم»).** این یک انحراف عمدی از رفتار فعلی است — جزئیات و دلیل در بخش ۳.۴.
- سنجش مهارت به‌جای «جهت سوال» جدا، از **تنوع mode** استفاده می‌کند؛ mode خودش جهت را مشخص می‌کند (بخش ۳.۲). نیازی به فیلد `direction` مجزا نیست.
- عملیات‌های sync باید idempotent باشند (طبق معیار پذیرش بخش ۶ سند اجرایی: «retry یک عملیات، رکورد تکراری روی سرور نسازد»). این الزام مستقیماً روی طراحی `Outbox` (بخش ۲.۶) اثر می‌گذارد چون شمارنده‌های افزایشی (XP، `seen`/`correct`/`wrong`) بدون کلید idempotency در برابر retry امن نیستند.
- سیاست دقیق تعارض بین دو دستگاه (وقتی هر دو آفلاین یک واژه را تمرین کرده‌اند) به `ARC-004` واگذار می‌شود؛ این‌جا فقط شکل عملیات و invariant هایش تعریف می‌شود.

## 2. Entities

### 2.1 `UserProgress` — هستهٔ SRS

منبع: `vocab_sr_v1` در `app.jsx` (`srLoad`/`srMark`/`srIntroduce`/`srKnown`، خطوط ۷۸۸–۹۰۵). ساختار فعلی یک آرایهٔ افزایشی ۹ عضوی به ازای هر واژه است؛ جدول زیر همان فیلدها را نام‌گذاری‌شده و به‌صورت normalized نشان می‌دهد.

| فیلد | نوع | معادل فعلی | توضیح |
|---|---|---|---|
| `id` | PK | — | |
| `user_id` | FK | — | |
| `content_type` | enum(`catalog_word`, `custom_word`) | — | polymorphic، مثل الگوی `CurriculumUnit` در `ARC-001` — چون واژه‌های شخصی کاربر (`CustomWord`, بخش ۲.۳) هم باید همین چرخهٔ SRS را داشته باشند |
| `content_id` | FK → `Word.id` یا `CustomWord.id` | کلید آرایه (`i` فعلی) | بسته به `content_type` |
| `successes` | int, ≥0 | `r[0]` | با جواب درست +۱، با جواب غلط −۱ (نه صفر شدن کامل) |
| `first_day` | date, nullable | `r[1]` | اولین روزی که جواب درست ثبت شد |
| `last_day` | date, nullable | `r[2]` | آخرین روزی که (فقط اولین تلاش آن روز) ثبت شد |
| `mode_mask` | bitmask int | `r[3]` | `1=mcq, 2=type/cloze, 4=listen, 8=flash/introduced` |
| `introduced` | bool | `r[4]` | |
| `phase` | int 0–4 | `r[5]` | سطح/جعبه؛ ۴ یعنی «نگهداری» |
| `due_date` | date | `r[6]` | هرگز null نیست (اصل بخش ۱) |
| `ease` | float [0.75, 1.8] | `r[7]` | ضریب SM-2-مانند؛ با جواب راحت زیاد، با جواب سخت/غلط کم می‌شود |
| `created_at` / `updated_at` | timestamp | — | |

**حذف‌شده نسبت به مدل فعلی:** `manualKnown` (`r[8]`) و تابع `toggleKnown` — طبق تصمیم `D-012` (بخش ۳.۴)، در طراحی جدید وجود ندارد.

**قاعدهٔ به‌روزرسانی (از `srMark`، حفظ‌شده عیناً چون پژوهش‌محور و اثبات‌شده است):**

```text
جواب درست:
  successes += 1
  phase = min(4, phase + 1)
  mode_mask |= mode_bit
  base_gap = [1, 1, 3, 7, 21, 60][min(successes, 5)]
  ease = clamp(ease + (اگر rating=easy: +.08، اگر rating=hard: -.08، وگرنه +.02), .75, 1.8)
  due_date = today + round(base_gap × ease)

جواب غلط:
  successes = max(0, successes - 1)
  phase = max(1, phase - 1)      ← کاهش یک‌پله‌ای، نه ریست کامل به سطح ۱
  ease = max(.75, ease - .12)
  due_date = today + 1
```

نکتهٔ مهم برای مالک محصول: در بحث اولیهٔ همین نشست، مدل ساده‌شدهٔ «جواب غلط → ریست کامل به سطح ۱» مطرح شد. رفتار واقعی کد فعلی این نیست — کاهش یک‌پله‌ای است، نه ریست کامل، و به تحقیقات فاصله‌گذاری (Cepeda 2008، Karpicke & Roediger 2007) که در کامنت‌های کد ارجاع داده شده متکی است. این سند همان رفتار اثبات‌شده را حفظ می‌کند مگر این‌که صراحتاً رد شود.

**قاعدهٔ due (از `srDue`):** `is_due = introduced && today >= due_date`.

**قاعدهٔ mastery/«بلد» (از `srKnown`، بدون شاخهٔ manualKnown):**

```text
known = successes >= 3
        && (mode_mask & (type|cloze|listen bits)) != 0   // حداقل یک‌بار production، نه فقط recognition
        && (last_day - first_day) >= 7 days
```

### 2.2 صف روزانه (daily queue) — نه یک entity، یک query

منبع محدودیت: بخش ۵ سند اجرایی («flashcard، MCQ، تایپ و تمرین listening»؛ «الگوریتم مرور فاصله‌دار و صف روزانه»). چون فقط یک query روی `UserProgress` است، جدول جدا لازم ندارد:

```text
queue = UserProgress
  WHERE user_id = :u AND is_due(today)
  ORDER BY phase ASC, due_date ASC
  LIMIT session_size
```

اگر تعداد due کمتر از `session_size` باشد، واژه‌های `introduced=false` جدید اضافه می‌شوند (معادل `srIntroduce`).

**جهت سوال از mode مشتق می‌شود، نه یک فیلد جدا:**

| mode | جهت واقعی | نوع recall |
|---|---|---|
| `mcq` | انگلیسی → انتخاب معنی فارسی | recognition |
| `type` | فارسی → تایپ املای انگلیسی | production |
| `listen` | صدا → تایپ املای انگلیسی | production |
| `cloze` | جملهٔ انگلیسی با جای خالی | production در بافت |
| `flash` | خودارزیابی نمایشی، نه یک تست حقیقی | — |

انتخاب mode برای هر آیتم صف باید بین این‌ها بچرخد (نه ثابت روی یکی) تا `mode_mask` واقعاً تنوع بگیرد؛ در غیر این صورت شرط mastery در بخش ۲.۱ هرگز true نمی‌شود.

### 2.3 `Favorite`, `CustomWord`, `CustomCategory`, `CategoryOverride`

منبع: چهار کلید جدا در `localStorage` فعلی (`vocab_famap` + `d.starred` داخل `vocab_app_v1`، `vocab_custom`، `vocab_mycats`، `vocab_catover`؛ دیده‌شده در `BACKUP_KEYS` و `app.jsx` خطوط ۴۸۵–۴۹۵ و ۱۲۰۵–۱۲۳۰).

| Entity | فیلد | توضیح |
|---|---|---|
| `Favorite` | `user_id`, `content_type`, `content_id`, `created_at` | polymorphic مثل `UserProgress` |
| `CustomWord` | `id`, `user_id`, `en`, `fa`, `cat`, `ex`, `created_at` | واژهٔ خصوصی کاربر؛ **در فضای شناسهٔ کاتالوگ نیست** — هرگز با `Word.id` تداخل نمی‌کند |
| `CustomCategory` | `id`, `user_id`, `key`, `label`, `color` | معادل `vocab_mycats` |
| `CategoryOverride` | `user_id`, `content_type`, `content_id`, `category_id` | کاربر یک واژهٔ کاتالوگ را به دستهٔ دیگری (built-in یا شخصی) می‌برد، بدون تغییر کاتالوگ |

**تناقض یافت‌شده در داده/کد فعلی که باید حل شود:** favorites همین امروز دو نمایش هم‌پوشان دارد — `d.starred{}` داخل blob اصلی و کلید مستقل `vocab_famap`. کدام authoritative است بدون بررسی export واقعی یک کاربر مشخص نیست؛ در `DATA-001`(-مانند) migration این‌ها باید merge شوند، نه این‌که یکی بی‌سروصدا دور ریخته شود. **باز نگه‌داشته می‌شود** (بخش ۵).

### 2.4 `UserSentence`

منبع: `vocab_mysent` (خطوط ۱۱۹۰–۱۲۰۲) — تمرین «جملهٔ من» که در commit اخیر (`88c582b`) به‌صورت collapsed/ثانویه شد.

| فیلد | نوع |
|---|---|
| `id` | PK |
| `user_id` | FK |
| `content_type` / `content_id` | polymorphic (کاتالوگ یا custom) |
| `text` | متن نوشتهٔ کاربر |
| `is_correct` | bool |
| `feedback` | text |
| `corrected_text` | text, nullable |
| `translation` | text, nullable |
| `checked_online` | bool |
| `created_at` |  |

هر واژه فعلاً حداکثر یک `UserSentence` دارد (رفتار فعلی: overwrite با کلید `w.en`)؛ جدول به‌جای ستون embedded مدل شده تا بعداً چند تلاش در طول زمان بدون migration ساختاری ممکن شود — دقیقاً همان استدلال `Example` در `content-model.md` بخش ۲.۳.

### 2.5 `DailyActivity`

منبع: `d.dayStats`, `d.days`, `d.streak`, `d.goal`, `vocab_game.xp` (خطوط ۱۲۴۹, ۱۳۴۲–۱۳۵۲, ۱۸۳۵).

| فیلد | نوع |
|---|---|
| `user_id` | FK |
| `date` | date |
| `cards_seen` | int |
| `correct` | int |
| `wrong` | int |
| `introduced` | int |
| `xp_earned` | int |

**تفاوت عمدی با رفتار فعلی:** `streak` و `goal` در مدل فعلی روی خود blob ذخیره می‌شوند (`d.streak`) و دستی نگه‌داری می‌شوند — می‌توانند desync شوند (مثلاً اگر یک روز رکورد فعالیت پاک/edit شود، streak ذخیره‌شده اصلاح نمی‌شود). در مدل جدید `streak` **محاسبه‌شده** است (طولانی‌ترین دنبالهٔ تاریخ‌های متوالی با `cards_seen > 0` در `DailyActivity`)، نه ستون ذخیره‌شدهٔ جدا. `goal` یک تنظیم کاربر است، نه بخشی از activity log.

### 2.6 `Outbox`

بدون معادل مستقیم در نسخهٔ فعلی (که فقط `localStorage` + Google Drive backup دستی دارد، نه صف عملیات واقعی) — طبق `D-005` («Room منبع حقیقت محلی و WorkManager مسئول sync باشد») این بخش کاملاً تازه طراحی می‌شود، نه مهاجرت‌شده.

| فیلد | نوع | توضیح |
|---|---|---|
| `id` | UUID (client-generated, PK) | **کلید idempotency** — سرور با همین id تشخیص می‌دهد عملیات قبلاً اعمال شده یا نه |
| `user_id` | FK | |
| `op_type` | enum(`srMark`, `toggleFavorite`, `addCustomWord`, `removeCustomWord`, `saveSentence`, `recordActivity`, ...) | |
| `payload` | JSON | ورودی خام عملیات (مثلاً `{content_type, content_id, mode, correct, rating}` برای `srMark`) |
| `client_created_at` | timestamp | زمان دستگاه، نه سرور |
| `status` | enum(`pending`, `synced`, `failed`) | |
| `synced_at` | timestamp, nullable | |

**Invariant حیاتی:** عملیات‌ها **transform** هستند نه **state جایگزین** (مثلاً `srMark` یک تابع از state فعلی + input است، نه یک snapshot نهایی) — چون `addXp`، `successes`، `dayStats` همگی افزایشی‌اند. این یعنی صرفاً «آخرین state برنده» (last-write-wins) برای این داده‌ها غلط است؛ سرور باید عملیات را با همان تابع تعیّنی (بخش ۲.۱) روی state خودش اعمال کند، نه این‌که مقدار نهایی کلاینت را جایگزین کند. جزئیات کامل سیاست merge/conflict وقتی دو دستگاه آفلاین هر دو یک واژه را تمرین کرده‌اند، به `ARC-004` واگذار می‌شود؛ همین‌جا فقط این الزام ثبت شد چون مستقیماً روی شکل `Outbox` اثر گذاشت.

## 3. تصمیم‌ها

### 3.4 تصمیم‌های محصولی این نشست (پیش‌نویس برای بخش ۸ سند اجرایی)

این‌ها مستقیماً از گفتگو با مالک محصول در همین نشست می‌آیند و باید به‌عنوان `D-011` تا `D-013` در `EXECUTION_PLAN.md` ثبت شوند (بخش ۴ همین سند آن‌ها را اعمال می‌کند):

1. **بدون دکمهٔ خودارزیابی.** رفتار فعلی (`toggleKnown`, `manualKnown`) در اپ جدید پیاده نمی‌شود. سطح/mastery فقط از رفتار واقعی کاربر در تمرین (جواب درست/غلط، تنوع mode) مشتق می‌شود، نه از ادعای کاربر. دلیل: خودارزیابی معمولاً خوش‌بینانه و غیرقابل‌اعتماد است؛ مالک محصول این را صریحاً بعد از شنیدن تبعات (بخش قبلی گفتگو) رد کرد.
2. **بدون حذف دائمی از چرخهٔ مرور** برای واژه‌های تسلط‌یافته — به‌جای دکمهٔ «بلدم که برای همیشه حذفش کند»، `due_date` فقط خیلی بلند می‌شود ولی هرگز null نیست (بخش ۱). این با رفتار فعلی کد (که `manualKnown` هم فقط تا ۶۰ روز عقب می‌اندازد، نه حذف کامل) هم‌راستاست.
3. **آزمون تعیین سطح اولیه (placement) به‌جای دکمهٔ per-word.** برای این‌که واژه‌های از قبل بلد نیاز به چند بار جواب‌دادن دستی نداشته باشند، به‌جای دکمهٔ تک‌تک، یک آزمون گروهی هنگام شروع هر pack واژگان سطح شروع `phase`/`successes` را دسته‌جمعی تنظیم می‌کند (مکانیزم `9 سوال/۶ درست` که همین امروز برای placement سطح CEFR در `app.jsx` خط ۱۴ به بعد استفاده می‌شود، الگوی مشابهی است — ولی این‌جا per-word اعمال می‌شود، نه per-level؛ طراحی دقیق آن یک task جدا بعد از `AND-013` است، **خارج از scope همین سند**).

## 4. ERD

```text
                    ┌──────────────┐
                    │     User      │
                    └──────┬────────┘
        ┌──────────┬────────┼────────┬───────────────┬─────────────┐
        ▼          ▼        ▼        ▼                ▼             ▼
┌───────────────┐┌────────┐┌──────────────┐┌─────────────────┐┌───────────┐┌─────────┐
│ UserProgress    ││Favorite││ CustomWord     ││  UserSentence      ││DailyActivity││ Outbox   │
│ content_type/id ││content_││CustomCategory  ││ content_type/id     ││date, seen,   ││op_type,  │
│ successes,phase ││type/id ││CategoryOverride││ text, feedback       ││correct,xp    ││payload,  │
│ due_date,ease    ││        ││                ││                      ││              ││ id(UUID) │
└───────┬─────────┘└───┬────┘└───────┬────────┘└──────────┬──────────┘└─────────────┘└──────────┘
        │ N             │ N           │ N                    │ N
        ▼ (polymorphic)  ▼             ▼                      ▼
   content_type=catalog_word ──▶ Word.id (ARC-001)
   content_type=custom_word  ──▶ CustomWord.id (همین سند)
```

## 5. تصمیم‌های باز پیش از `BE-013`/`AND-013`

- کدام یک از دو نمایش فعلی favorites (`d.starred` یا `vocab_famap`) authoritative است؟ نیازمند بررسی export واقعی کاربر، نه حدس (بخش ۲.۳).
- طراحی دقیق آزمون placement per-word (بند ۳ در بخش ۳.۴) یک task جداست.
- اندازهٔ `session_size` صف روزانه (بخش ۲.۲) یک پارامتر UX است، نه تصمیم معماری؛ به `AND-013` واگذار می‌شود.
- سیاست دقیق conflict-merge چند-دستگاهی برای عملیات افزایشی (بخش ۲.۶) به `ARC-004` واگذار شد.

## 6. اتصال به بقیه‌ی Phase 1

- `ARC-001`: `UserProgress.content_id` (وقتی `content_type=catalog_word`) به `Word.id` ارجاع می‌دهد، نه `legacy_id`.
- `ARC-003` (OpenAPI): فیلدهای همین entityها را در schema‌ی sync/progress منعکس می‌کند.
- `ARC-004` (sync policy): سیاست merge عملیات افزایشی `Outbox` (بخش ۲.۶) و ordering را تعریف می‌کند.
- Android Room و Laravel migrations هر دو مستقیماً از بخش ۲ همین سند مشتق می‌شوند.
