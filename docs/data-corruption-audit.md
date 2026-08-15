# گزارش QA خرابی‌های محتوایی `data/words.json`

تاریخ بررسی: ۲۰ مرداد ۱۴۰۵ / 2026-08-10

## روش و دامنه

- فایل کامل با JSON parser بارگذاری شد: ۱۰٬۵۲۴ رکورد.
- `index` آرایه با فیلد `i` تطبیق داده شد؛ در موارد زیر هر دو یکسان‌اند.
- سرواژه‌های بسیار کوتاه، تکه‌واژه‌ها، ورود حروف لاتین به ترجمه‌ی فارسی، الگو‌های گزینه‌ی آزمون و جمله‌های قالبیِ ناسازگار اسکن شدند.
- این گزارش فقط موارد قطعی یا بسیار روشن را فهرست می‌کند؛ موارد صرفاً کم‌کیفیت ولی قابل‌قبول وارد فهرست نشده‌اند.
- هیچ تغییری در `data/words.json` انجام نشده است.

## خرابی قطعی: آلودگی گزینه‌های آزمون در ترجمه

| index / i | en | مقدار فعلی `fa` | تشخیص | پیشنهاد |
|---:|---|---|---|---|
| 1353 | `b` | `(a آزرده (b شگفتزده (c خجالت‌زده` | یک گزینه/کلید آزمون به‌جای مدخل واژه وارد شده؛ سرواژه، ترجمه و مثال معتبر نیستند. | رکورد قرنطینه یا حذف شود؛ از منبع اولیه، واژه‌ی احساس موردنظر بازیابی شود. حدس‌زدن واژه از این داده امن نیست. |
| 1354 | `a` | `(a هوس شدید (b تنبلی (c شجاعت` | گزینه‌های آزمون وارد ترجمه شده‌اند. مثال مربوط به حرف نامعین `a` است ولی دسته و ترجمه مربوط به آزمون دیگری‌اند. | رکورد قرنطینه/حذف و از منبع اولیه بازسازی شود؛ در صورت قصد آموزش article، `fa` باید «یک / حرف تعریف نامعین» و `cat` مناسب باشد. |
| 2113 | `ght` | `during adjusted are Weights وزن` | ادغام چند توکن انگلیسی و فارسی؛ سرواژه fragment و کل رکورد مخدوش است. | حذف/قرنطینه و بررسی خط تولید پیرامون این index؛ بازیابی خودکار قابل اعتماد نیست. |

## خرابی قطعی: fragment یا suffix به‌عنوان سرواژه

| index / i | en | مشکل | پیشنهاد اصلاح |
|---:|---|---|---|
| 5277 | `ing` | پسوند بدون خط تیره به‌شکل اسم مستقل ثبت شده و مثال `We talked about the ing...` بی‌معناست. | اگر هدف آموزش پسوند است: `en: "-ing"`، `fa: "پسوند -ing"`، مثال فرازبانی مانند `The suffix -ing can form a gerund.` |
| 5727 | `tion` | fragment پسوندی و مثال بی‌معنا. | `en: "-tion"` و مثال `The suffix -tion often forms nouns.` یا حذف از واژگان عمومی. |
| 6495 | `ext` | تکه‌واژه‌ی مبهم با ترجمه‌ی مخلوط «پسوند / توسعه»؛ مدخل مستقل مشخصی نیست. | قرنطینه؛ فقط در صورت وجود منبع معتبر به abbreviation مشخص با حروف بزرگ و معنای واحد بازسازی شود. |
| 7434 | `ist` | پسوند بدون خط تیره، ترجمه‌ی نادرست/مبهم «پسوند / سومی» و مثال بی‌معنا. | `en: "-ist"`، `fa: "پسوند سازنده‌ی نام شخص/پیرو"` و مثال فرازبانی معتبر؛ یا حذف. |
| 8459 | `ment` | fragment با `cat: adj` نادرست و جمله‌ی `Everything felt ment...` بی‌معنا. | `en: "-ment"`، `cat: "suffix"` (اگر schema اجازه می‌دهد)، مثال `The suffix -ment can form nouns.`؛ یا حذف. |
| 9824 | `tions` | نه واژه است و نه صورت استاندارد یک پسوند؛ مثال نیز بی‌معناست. | حذف/قرنطینه؛ احتمالاً ضایعه‌ی tokenization از واژه‌ای جمع است. |
| 9848 | `enb` | سرواژه‌ی نامشخص با ترجمه‌ی صریح «متن نامشخص». | حذف/قرنطینه و بازیابی از منبع؛ نباید در دیتاست آموزشی منتشر شود. |

## جمله‌ها یا برچسب‌های قطعیِ خراب که spell-check تشخیص نمی‌دهد

| index / i | en | مقدار خراب | پیشنهاد اصلاح |
|---:|---|---|---|
| 6820 | `adjusted` | `Learning to adjusted takes time and practice.` | اگر سرواژه فعل پایه است، `en: "adjust"`, `fa: "تنظیم کردن / سازگار شدن"`, `ex: "Learning to adjust takes time and practice."`؛ یا با حفظ `adjusted`: `The seat was adjusted for greater comfort.` |
| 2149 | `which` | `cat: noun` و `The which changed everything for us.` | دسته به pronoun/determiner تغییر کند؛ مثال: `Which color do you prefer?`، ترجمه: «کدام رنگ را ترجیح می‌دهی؟» |
| 2795 | `none` | `This none is very important to me.` و ترجمه‌ی «نه‌ای» | `fa: "هیچ‌کدام"`؛ مثال: `None of the answers was correct.` |
| 4708 | `neither` | `Do you remember that neither?` | مثال: `Neither answer is correct.`، ترجمه: «هیچ‌کدام از دو پاسخ درست نیست.» |
| 5020 | `choices` | `This choices is very important to me.` | مثال: `These choices are very important to me.` یا مثال طبیعی‌تر `You have three choices.` |
| 10189 | `sic` | `cat: adj` و `This room is too sic for me.` | دسته به adverb/editorial marker تغییر کند؛ مثال: `The error appears in the original quotation [sic].`، ترجمه‌ی توضیحی مناسب افزوده شود. |
| 405 | `or` | `This or is very important to me.` | دسته conjunction؛ مثال: `Would you like tea or coffee?` |
| 2120 | `and` | `This and is very important to me.` | دسته conjunction؛ مثال: `Sara and Mina are classmates.` |
| 2121 | `for` | `I need a new for for my work.` | دسته preposition/conjunction؛ مثال: `This gift is for you.` |
| 2122 | `that` | `We talked about the that for an hour.` | مثال کاربردی: `I know that she is busy.` یا `That book is mine.`؛ معنا و دسته با مثال هماهنگ شود. |
| 2124 | `with` | `The with changed everything for us.` | دسته preposition؛ مثال: `She went with her brother.` |
| 2141 | `but` | `I need a new but for my work.` | دسته conjunction؛ مثال: `I called, but nobody answered.` |
| 2161 | `who` | `I need a new who for my work.` | دسته pronoun؛ مثال: `Who called you last night?` |

## نتیجه‌ی QA

وجود واژه‌های املاییِ معتبر در این موارد باعث می‌شود spell-check معمولی آن‌ها را رد نکند. الگوی مشترک، تزریق گزینه‌های آزمون، شکستن توکن‌ها و قرار دادن کورکورانه‌ی سرواژه در چند قالب جمله (`This X is...`, `I need a new X...`, `Do you remember that X?`) است. اصلاح پایدار باید علاوه بر موارد بالا، شامل اعتبارسنجی نوع واژه و سازگاری قالب مثال با part of speech باشد.

پیشنهاد برای خط تولید: رکورد‌هایی با سرواژه‌ی تک‌حرفی، fragmentهای پسوندی بدون `-`، `fa` شامل الگوی گزینه‌های `(a)/(b)/(c)`، مقدار‌هایی مانند «متن نامشخص»، و مثال‌هایی که determiner را به‌جای noun می‌نشانند به‌طور خودکار quarantine شوند.
