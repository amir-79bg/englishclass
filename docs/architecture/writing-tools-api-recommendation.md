# پیشنهاد نهایی سرویس‌ها برای ابزارهای نوشتاری انگلیسی

**نسخه اجرایی برای MVP — آخرین بررسی: ۱۶ اوت ۲۰۲۶**

این سند مرجع تصمیم برای انتخاب سرویس/مدل هر ابزار نوشتاری Backend است (spell check، grammar check، explain/rewrite، خلاصه‌سازی، تصحیح Writing آیلتس). وقتی پیاده‌سازی این ابزارها شروع شد — به‌ویژه در طراحی `ARC-003` (قرارداد OpenAPI v1) — این سند مبنای انتخاب provider/مدل و مسیر endpointهاست.

**جمع‌بندی نهایی:** Spell Check با Hunspell، Grammar Check با LanguageTool Self-hosted، Explain/Grammar Improve/Rewrite با Cloudflare Workers AI، Summary با Gemini 3.5 Flash-Lite، و IELTS Writing با Gemini 3.7 Flash.

## ۱. جدول تصمیم نهایی

| فیچر | انتخاب اصلی | نحوه داشتن | هزینه/محدودیت رایگان | Fallback |
|---|---|---|---|---|
| تصحیح املای کلمه | Hunspell | نصب روی سرور؛ بدون API Key | بدون quota خارجی؛ محدود به منابع سرور | در صورت نیاز LanguageTool |
| پیدا کردن غلط Grammar در جمله/پاراگراف | LanguageTool Self-hosted | اجرای HTTP Server روی سرور خودمان | بدون quota خارجی؛ محدود به RAM/CPU | Cloudflare AI برای موارد مبهم |
| توضیح اینکه چرا خطا است | Cloudflare Workers AI — Qwen3-30B | Cloudflare Account + API Token + Account ID | ۱۰٬۰۰۰ Neuron در روز روی Workers AI Free | GLM-4.7-Flash |
| بهبود Grammar و طبیعی‌سازی متن | Cloudflare Workers AI — Qwen3-30B | همان API سرویس | از همان سهم ۱۰٬۰۰۰ Neuron/روز | GLM-4.7-Flash یا Gemini |
| بازنویسی (Rewrite) | Cloudflare Workers AI — Qwen3-30B | OpenAI-compatible REST API یا endpoint | از همان سهم ۱۰٬۰۰۰ Neuron/روز | GLM-4.7-Flash یا Gemini |
| خلاصه‌سازی | Gemini 3.5 Flash-Lite | Google AI Studio → API Key | Text input/output در Free Tier رایگان؛ quota دقیق پروژه در AI Studio | Cloudflare Workers AI |
| تصحیح و ارزیابی Writing آیلتس | Gemini 3.7 Flash | Google AI Studio → API Key | Text input/output در Free Tier فعلاً رایگان؛ quota پروژه متغیر | Gemini 3.5 Flash-Lite / Cloudflare AI |

## ۲. Spell Check — Hunspell

**کاربرد:** بررسی یک کلمه یا فهرست کلمات، تشخیص غلط املایی و ارائه پیشنهادهای نزدیک.

### چرا انتخاب شود؟

- رایگان و متن‌باز است و روی سرور خودمان اجرا می‌شود.
- هیچ درخواست خارجی و هیچ quota روزانه/ماهانه ندارد.
- برای ورودی‌هایی مثل «enviroment → environment» بسیار مناسب و سریع است.
- برای Grammar جمله مناسب نیست؛ مسئولیت آن را LanguageTool می‌گیرد.

### راه‌اندازی پیشنهادی

```
apt update
apt install hunspell hunspell-en-us
```

در Backend بهتر است یک wrapper کوچک ساخته شود و API داخلی محصول مثلاً `/tools/spell-check` باشد. فرانت نباید مستقیماً Hunspell را بشناسد.

## ۳. Grammar Check — LanguageTool Self-hosted

**کاربرد:** پیدا کردن خطاهای گرامری، punctuation و برخی خطاهای سبک در جمله یا پاراگراف، همراه با موقعیت خطا و پیشنهاد اصلاح.

### چرا انتخاب شود؟

- LanguageTool یک Grammar/Style checker تخصصی است و HTTP Server داخلی دارد.
- با self-host کردن، محدودیت API عمومی LanguageTool حذف می‌شود و هزینه هر درخواست خارجی نداریم.
- خروجی ساختاریافته‌تر از LLM برای highlight کردن دقیق span error در UI می‌دهد.
- نسخه‌ی self-host همه قابلیت‌های اختصاصی LanguageTool Cloud را ندارد؛ برای Explanation پیشرفته از LLM استفاده می‌کنیم.

### معماری پیشنهادی

```
Frontend → POST /tools/grammar-check → Backend → Local LanguageTool HTTP Server
```

**نکته:** API عمومی رایگان LanguageTool برای Production انتخاب اصلی نیست؛ هدف این پیشنهاد اجرای instance اختصاصی روی زیرساخت خودمان است.

## ۴. Explain / Grammar Improve / Rewrite — Cloudflare Workers AI

انتخاب اصلی فعلی: `@cf/qwen/qwen3-30b-a3b-fp8`. انتخاب جایگزین: `@cf/zai-org/glm-4.7-flash`.

### چرا Cloudflare؟

- Workers AI روی پلن Free روزانه ۱۰٬۰۰۰ Neuron سهم رایگان دارد و سهم در ۰۰:۰۰ UTC reset می‌شود.
- Qwen3-30B برای input حدود ۴٬۶۲۵ neuron به ازای یک میلیون token و برای output حدود ۳۰٬۴۷۵ neuron مصرف دارد.
- GLM-4.7-Flash مدل multilingual با context حدود ۱۳۱K token است و به‌عنوان fallback مناسب است.
- REST API و endpoint سازگار با OpenAI دارد؛ بنابراین تعویض مدل/provider در Backend ساده‌تر است.

### ظرفیت تقریبی Qwen3 روی سهم رایگان

| سناریو | فرض مصرف هر درخواست | مصرف تقریبی | ظرفیت تئوری روزانه |
|---|---|---|---|
| Explain Error | input + ۱۲۰ output token | ≈ ۲۵۰ neuron | ≈ ۲٬۰۷۰ درخواست/روز |
| Grammar Improve | input + ۲۵۰ output token | ≈ ۴۰۰ neuron | ≈ ۱٬۰۵۰ درخواست/روز |
| Rewrite متوسط | input + ۳۰۰ output token | ≈ ۶۰۰ neuron | ≈ ۸۳۰ درخواست/روز |

این ظرفیت‌ها تخمینی‌اند؛ همه‌ی این فیچرها یک سهم ۱۰٬۰۰۰ Neuron مشترک را مصرف می‌کنند. در محصول باید usage logging و rate limit داخلی داشته باشیم.

### بهینه‌سازی مهم

- برای Cloudflare، Grammar Check را خودکار صدا نزنیم. LanguageTool ابتدا خطا را پیدا کند و فقط اگر کاربر روی «چرا؟» زد، API Explain اجرا شود.
- برای Improve/Rewrite طول input و max output token محدود شود تا یک درخواست سنگین quota را مصرف نکند.

## ۵. Summary — Gemini 3.5 Flash-Lite

**کاربرد:** خلاصه‌سازی متن‌های کوتاه تا بلند با هزینه پایین و ظرفیت مناسب برای حجم بالا.

### چرا انتخاب شود؟

- Google آن را مدل GA کم‌هزینه و مناسب high-volume معرفی می‌کند.
- در Pricing فعلی Gemini Developer API، input و output استاندارد این مدل در Free Tier رایگان است.
- quota دقیق RPD/TPM/RPM ثابت و عمومی نیست و باید از بخش Rate Limits پروژه در Google AI Studio خوانده شود.

### نحوه گرفتن دسترسی

- ورود به Google AI Studio.
- ساخت/انتخاب Project و ایجاد Gemini API Key.
- نگهداری Key فقط در Backend و فراخوانی Gemini Developer API از سرور.

## ۶. IELTS Writing Correction — Gemini 3.7 Flash

**کاربرد:** تحلیل Writing، تشخیص خطاها، ارائه feedback، بازنویسی پیشنهادی و تخمین Band Score.

### چرا Flash 3.7؟

- در مستندات فعلی Google، Gemini Flash 3.7 به‌عنوان Flash capable برای reasoning معرفی شده است.
- Text input/output در Free Tier Standard فعلاً رایگان است؛ محدودیت واقعی درخواست‌ها از Rate Limits پروژه در AI Studio خوانده می‌شود.
- برای IELTS به reasoning و تحلیل rubric بیشتر از صرفاً rewrite نیاز داریم؛ بنابراین مدل قوی‌تر را برای این فیچر نگه می‌داریم.

### خروجی پیشنهادی

- Estimated overall band — با برچسب «تخمینی»، نه نمره رسمی IELTS.
- Task Achievement/Task Response
- Coherence & Cohesion
- Lexical Resource
- Grammatical Range & Accuracy
- فهرست خطاها با original/correction/explanation و نسخه‌ی improved essay.

چهار معیار بالا همان معیارهای رسمی ارزیابی Writing آیلتس هستند. بهتر است prompt و schema خروجی مستقیماً حول همین rubric طراحی شوند.

## ۷. معماری Backend پیشنهادی

```
POST /tools/spell-check       → Hunspell
POST /tools/grammar-check     → LanguageTool Self-hosted
POST /tools/explain-error     → Cloudflare Workers AI
POST /tools/grammar-improve   → Cloudflare Workers AI
POST /tools/rewrite           → Cloudflare Workers AI
POST /tools/summarize         → Gemini 3.5 Flash-Lite
POST /tools/ielts-check       → Gemini 3.7 Flash
```

**اصل مهم:** Provider در قرارداد API فرانت دیده نشود. فرانت فقط endpointهای محصول را بشناسد تا بعداً بتوان provider یا مدل را بدون تغییر اپ عوض کرد.

## ۸. سیاست Fallback و کنترل مصرف

| مسیر | Main | Fallback | قانون |
|---|---|---|---|
| Spell | Hunspell | — | کاملاً local |
| Grammar | LanguageTool | Cloudflare فقط برای موارد خاص | LLM برای هر check اجرا نشود |
| Explain/Improve/Rewrite | Qwen3-30B | GLM-4.7-Flash | روی 429/availability مدل جایگزین شود |
| Summary | Gemini 3.5 Flash-Lite | Cloudflare | برای متن خیلی بلند سقف طول ورودی تعیین شود |
| IELTS | Gemini 3.7 Flash | Cloudflare یا 3.5 Flash-Lite | فقط Band estimated نمایش داده شود |

## ۹. اولویت پیاده‌سازی

- **مرحله ۱:** LanguageTool + Hunspell؛ چون رایگان، local و مناسب دو ابزار پرتکرار هستند.
- **مرحله ۲:** Cloudflare Workers AI برای Explain / Improve / Rewrite و اضافه کردن usage meter.
- **مرحله ۳:** Gemini برای Summary و IELTS با schema خروجی JSON ثابت.
- **مرحله ۴:** اضافه کردن retry، timeout، fallback routing محدود و dashboard مصرف quota.

## ۱۰. ملاحظات مهم

- Free Tierها و مدل‌های در دسترس می‌توانند تغییر کنند؛ مدل Cloudflare و Gemini باید از environment/config انتخاب شوند، نه hard-code در business logic.
- متن کاربر و API key هیچ‌وقت مستقیم از اپ موبایل به provider خارجی ارسال نشود؛ درخواست از Backend خودمان عبور کند.
- برای Gemini Free Tier، Google اعلام می‌کند محتوای Free Tier ممکن است برای بهبود محصولات استفاده شود؛ برای داده حساس باید سیاست داده و Paid Tier جداگانه بررسی شود.
- برای IELTS یک مجموعه تست دستی با essayهای دارای band و feedback معتبر نگه داریم تا model/prompt را A/B تست کنیم؛ فقط به ادعای مدل اکتفا نشود.

## ۱۱. منابع رسمی

- Hunspell: <https://github.com/hunspell/hunspell>
- LanguageTool Embedded HTTP Server: <https://dev.languagetool.org/http-server.html>
- LanguageTool Public API notes: <https://dev.languagetool.org/public-http-api.html>
- Cloudflare Workers AI Pricing: <https://developers.cloudflare.com/workers-ai/platform/pricing/>
- Cloudflare Workers AI Models: <https://developers.cloudflare.com/workers-ai/models/>
- Cloudflare GLM-4.7-Flash: <https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/>
- Gemini API Pricing: <https://ai.google.dev/gemini-api/docs/pricing>
- Gemini API Rate Limits: <https://ai.google.dev/gemini-api/docs/rate-limits>
- IELTS Writing marking criteria: <https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing>
