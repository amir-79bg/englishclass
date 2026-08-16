# مدل canonical محتوا (ARC-001)

این سند مدل داده‌ی محتوا (نه user state — آن `ARC-002` است) را برای backend Laravel و local source of truth اندروید (Room) تعریف می‌کند. ورودی آن خواندن مستقیم `data/words.json`، `data/categories.json` و `data/curricula/*.js` است، نه خلاصه‌ی اسناد قدیمی.

اگر این سند با رفتار واقعی کد/داده‌ی موجود تعارض داشت، کد و داده منبع حقیقت‌اند و این سند باید اصلاح شود.

## 1. اصول

- شناسه‌ی عددی فعلی هر واژه (`i`) به `legacy_id` تبدیل و برای همیشه نگه داشته می‌شود؛ داده‌های محلی/`localStorage` نسخه‌ی وب فعلی با همین کلیدها به آن اشاره می‌کنند (`AGENTS.md`, `README.md`).
- `en` (headword) پس از انتشار freeze است؛ تغییرش نیازمند migration صریح است.
- محتوا (کاتالوگ) کاملاً از user state جدا می‌ماند — پیشرفت، علاقه‌مندی، SRS در `ARC-002` تعریف می‌شود، نه اینجا.
- هر انتشار محتوا یک `ContentVersion` دارد: `version`، `schema_version`، `checksum`، `published_at`، `min_app_version` (بخش ۴.۴ در `EXECUTION_PLAN.md`).
- **اولویت MVP فقط واژگان است.** طبق بخش ۵ سند اجرایی، «انتقال کامل همه‌ی فعالیت‌های grammar/speaking در یک release» خارج از MVP اولیه است؛ به همین دلیل مدل زیر برای پنج curriculum غیرواژگانی (grammar، sentence، listening، discussion، collocations) عمداً سبک و انعطاف‌پذیر است — هر کدام بعداً که واقعاً migrate شوند task مستقل و مدل دقیق‌تر خودشان را می‌گیرند.

## 2. Entities

### 2.1 `Category`

منبع: `data/categories.json` (۲۹ دسته).

| فیلد | نوع | توضیح |
|---|---|---|
| `id` | string (PK) | slug فعلی، مثل `food` — همان کلید فایل JSON |
| `label_fa` | string | برچسب فارسی |
| `icon` | string | نام آیکون (Phosphor) |
| `color` | string | hex |
| `type` | enum(`topic`, `grammar-role`, `phrase`) | سیاست topic-first در `docs/vocabulary-categories.md` |
| `sort_order` | int | از ترتیب فعلی آرایه‌ی JSON استخراج می‌شود؛ امروز فایل implicit است، در migration باید صریح شود (بخش ۴) |
| `content_version_id` | FK → `ContentVersion.id` | |

### 2.2 `Word`

منبع: `data/words.json` (۱۰,۵۲۴ رکورد).

| فیلد | نوع | توضیح |
|---|---|---|
| `id` | ULID/UUID (PK) | شناسه‌ی canonical **جدید**، پایدار و مستقل از ترتیب آرایه |
| `legacy_id` | int, unique, indexed | همان `i` فعلی؛ **برای همیشه** نگه داشته می‌شود، فقط برای واژه‌های منتشرشده |
| `en` | string, unique | headword؛ frozen پس از انتشار |
| `fa` | string | معادل فارسی |
| `category_id` | FK → `Category.id` | |
| `ipa` | string, nullable | تلفظ General American |
| `synonyms` | JSON array of string, nullable | معادل `syn[]` فعلی؛ ستون JSON نه جدول جدا — هیچ query بین‌واژه‌ای روی synonym در MVP نیست |
| `content_version_id` | FK → `ContentVersion.id` | |
| `created_at` / `updated_at` | timestamp | |

### 2.3 `Example`

منبع: فیلدهای `ex`/`exfa` روی هر واژه، امروز embedded و ۱‑به‑۱.

| فیلد | نوع | توضیح |
|---|---|---|
| `id` | PK | |
| `word_id` | FK → `Word.id` | امروز **unique** (هر واژه دقیقاً یک مثال) |
| `en` | text | |
| `fa` | text | |
| `sort_order` | int, default 0 | برای امکان چند مثال در آینده بدون migration شکننده |

به‌عنوان جدول جدا مدل شده (نه ستون embedded روی `Word`) چون acceptance criteria خود `ARC-001` صراحتاً «examples» را به‌عنوان یک نوع مجزا از رابطه‌ها خواسته؛ محدودیت unique امروز رفتار فعلی را دقیقاً حفظ می‌کند و بعداً با حذف همان constraint، بدون migration ساختاری، چند-مثالی می‌شود.

### 2.4 `ContentVersion`

هیچ معادل فعلی مستقیم ندارد — امروز کل bundle یک نسخه‌ی ضمنی (`لغتنامه ورژن ۱۱`) است.

| فیلد | نوع | توضیح |
|---|---|---|
| `id` | PK | |
| `version` | string | |
| `schema_version` | int | |
| `published_at` | datetime | |
| `min_app_version` | string | |
| `checksum` | string | |

### 2.5 `CurriculumUnit` (grammar / sentence / listening / discussion sessions / collocation groups)

منبع: `data/curricula/{grammar,sentences,listening1,listening2,collocations}.js` و `DISC.sessions`. یک جدول polymorphic با نوع صریح، نه پنج جدول جدا — چون هیچ‌کدام هنوز در MVP پیاده نمی‌شوند (بخش ۱ بالا) و شکل داخلی‌شان (rules/pit/choose در grammar، patterns در sentence، lines در listening، ladder/phrases/check در discussion) هنوز دست‌نویس و در حال تغییر است؛ نرمال‌سازی زودهنگام آن بدون یک مصرف‌کننده‌ی واقعی، over-engineering است.

| فیلد | نوع | توضیح |
|---|---|---|
| `id` | string (PK) | شناسه‌ی فعلی (`a1_1`, `l_a1_time`, `d_a1_1`, ...) — همین امروز stable string است، نیازی به شناسه‌ی جدید نیست |
| `curriculum_type` | enum(`grammar_lesson`, `sentence_unit`, `listening_text`, `discussion_session`, `collocation_group`) | |
| `cefr_level` | enum(A1..C2), nullable | `collocation_group` سطح ندارد |
| `title` | string | |
| `title_fa` | string, nullable | |
| `method_key` | FK → `DiscussionMethod.id`, nullable | فقط برای `discussion_session` |
| `sort_order` | int | |
| `body` | JSON | باقی ساختار دست‌نخورده — همان شکلی که امروز در فایل JS است (rules/ex/pit/choose، patterns، lines، ladder/phrases/task/check، یا items برای collocation) |
| `content_version_id` | FK → `ContentVersion.id` | |

### 2.6 `DiscussionMethod`

منبع: `DISC.methods` (۹ نوع: `agree`, `role`, `rank`, `story`, `picture`, `problem`, `debate`, `compare`, `wouldyou`, `hotseat`). جدول lookup جدا شد چون چندین `discussion_session` واقعاً به همین ۹ ردیف اشاره می‌کنند (رابطه‌ی N:1 واقعی، نه فقط یک فیلد توصیفی).

| فیلد | نوع | توضیح |
|---|---|---|
| `id` | string (PK) | مثل `agree`, `hotseat` |
| `label_fa` | string | |
| `icon` | string | |
| `color` | string | |
| `how` | text | |

## 3. ERD

```text
                              ┌───────────────────┐
                              │   ContentVersion    │
                              │  version, checksum   │
                              └─────────┬────────────┘
                                        │ 1
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼ N                       ▼ N                       ▼ N
     ┌─────────────────┐       ┌─────────────────┐      ┌───────────────────────┐
     │    Category       │       │      Word         │      │    CurriculumUnit       │
     │ id, label_fa,      │  1   │ id, legacy_id,     │      │ id, curriculum_type,    │
     │ icon, color, type,  │─────▶│ en, fa, ipa,        │      │ cefr_level, title,      │
     │ sort_order          │  N   │ synonyms[]           │      │ method_key, body(JSON)  │
     └─────────────────────┘      └─────────┬───────────┘      └───────────┬──────────────┘
                                            │ 1                            │ N (فقط
                                            ▼ N (unique امروز)             │ discussion_session)
                                   ┌───────────────────┐                   ▼ 1
                                   │      Example         │      ┌───────────────────────┐
                                   │ word_id, en, fa,      │      │   DiscussionMethod       │
                                   │ sort_order              │      │ id, label_fa, icon,      │
                                   └───────────────────────┘      │ color, how                 │
                                                                    └───────────────────────────┘
```

## 4. یادداشت برای `DATA-001` (migration شناسه‌های legacy)

- **Word:** نگاشت `legacy_id = i` مستقیم و بدون ابهام است؛ `en` هم مستقیماً کپی می‌شود. تنها تصمیم باز: اختصاص `id` جدید (ULID پیشنهادی، به‌خاطر ترتیب‌پذیری زمانی و سازگاری با SQLite/Room) در زمان import اولیه.
- **Category:** فایل فعلی ترتیب صریح ندارد؛ `sort_order` باید از اندیس فعلی آرایه‌ی کلیدهای JSON استخراج و در schema صریح شود — یک تصمیم کوچک migration، نه تغییر داده.
- **CurriculumUnit:** شناسه‌های رشته‌ای فعلی (`a1_1`, `l_a1_time`, `d_a1_1`, کلید `make` در collocations) از قبل پایدار و human-readable هستند؛ پیشنهاد می‌شود همان‌ها مستقیماً `id` بشوند، بدون نگاشت جدید.
- هیچ‌کدام از این پنج curriculum امروز progress ذخیره‌شده در `localStorage` ندارد (بر خلاف واژه‌ها) — پس ریسک migration شناسه برایشان صفر است.

## 5. اتصال به بقیه‌ی Phase 1

جزئیات کامل در `EXECUTION_PLAN.md` بخش ۴.۶ («گراف اتصال اجزا»). خلاصه:

- `ARC-002` (user state/SRS) به `Word.id` (نه `legacy_id`) ارجاع می‌دهد.
- `ARC-003` (OpenAPI) فیلدهای همین entityها را در schema‌ی manifest/content pack منعکس می‌کند.
- `ARC-004` (sync policy) نسخه‌بندی و checksum را از `ContentVersion` می‌گیرد.
- Android Room و Laravel migrations هر دو مستقیماً از بخش ۲ همین سند مشتق می‌شوند.

## 6. تصمیم‌های باز پیش از `BE-001`

- نوع PK: ULID پیشنهاد شد؛ تأیید نهایی هنگام نوشتن migration واقعی Laravel لازم است.
- آیا `Category.type` باید enum سطح دیتابیس باشد یا فقط اعتبارسنجی سطح اپلیکیشن؟ (SQLite enum ندارد؛ پیشنهاد: CHECK constraint + validation در Laravel.)
- دقیق‌شدن انواع drill در `grammar_lesson.body` (`ex`, `pit`, `choose`, و حداقل یک نوع دیگر طبق README) موکول به زمانی است که واقعاً migrate شود؛ اینجا فقط به‌عنوان JSON دست‌نخورده منتقل می‌شود.
