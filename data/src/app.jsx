
const KEY = 'vocab_app_v1';
const BACKUP_KEYS = ['vocab_app_v1', 'vocab_sentences', 'vocab_custom', 'vocab_overrides', 'vocab_mysent', 'vocab_mycats', 'vocab_catover', 'vocab_famap',
  'vocab_game', 'vocab_sent', 'vocab_course', 'vocab_listen', 'vocab_disc', 'vocab_ui_v1', 'vocab_sr_v1'];
const LOCAL_BACKUP_KIND = 'vocabLocalBackupV2';
const MODES = [
  { mode: 'flash',  name: 'کارت واژه',     desc: 'ببین، بشنو، معنی را به یاد بیاور و به خودت نمره بده', icon: 'ph ph-cards' },
  { mode: 'mcq',    name: 'چهارگزینه‌ای', desc: 'لغت انگلیسی را می‌بینی، معنی درست را انتخاب کن', icon: 'ph ph-list-checks' },
  // LEG-003 — Initial Learning Turn C (fa->en retrieval). Same 4-option MCQ
  // rendering path as 'mcq' above, just the reverse direction: reuses
  // buildOptions()/the options template unchanged, only prompt/option source
  // differs (see modeFor()/renderVals()).
  { mode: 'fa2en',  name: 'بازیابی',       desc: 'معنی فارسی را می‌بینی، واژهٔ انگلیسی درست را انتخاب کن', icon: 'ph ph-arrows-left-right' },
  { mode: 'type',   name: 'نوشتاری',      desc: 'از روی معنی فارسی، املای انگلیسی را بنویس', icon: 'ph ph-keyboard' },
  { mode: 'listen', name: 'شنیداری',      desc: 'فقط صدا را می‌شنوی و لغت را می‌نویسی', icon: 'ph ph-ear' },
  { mode: 'cloze',  name: 'در جمله',      desc: 'جای خالی یک جمله‌ی واقعی را پر کن', icon: 'ph ph-text-aa' }
];
const QUIZ_EVERY = 300, QUIZ_LEN = 20, PASS = 0.7;
// Placement is a quick per-level probe, not the mastery check the periodic
// quiz is. 9 items / 6-correct (~67%) instead of 5/60%: with 4-option MCQ
// and c=.25 guessing, 5 items at 60% only requires ~47% real knowledge and
// lets someone who knows nothing of a level pass it 10% of the time; 9/6
// roughly triples the separation between a 20%-knower and a 60%-knower.
// Each level probes 6 vocabulary items + 3 grammar items (see PLACEMENT_WORDS
// below and GRAM[L].choose) rather than vocabulary alone — vocabulary breadth
// predicts proficiency well at the bottom of the CEFR scale but syntactic
// knowledge is the stronger signal at the top (Shiotsu & Weir), which is
// exactly where a word-only test struggles to tell adjacent levels apart.
const PLACEMENT_LEN = 9, PLACEMENT_PASS = 6 / 9, PLACEMENT_VOCAB_N = 6, PLACEMENT_GRAM_N = 3;
// LEG-007 — per-dimension pass bars used only for the split vocab/grammar
// report (docs/placement-test-methodology.md §6.1/§8.5). The combined
// PLACEMENT_PASS above still decides which levels the ladder tests, unchanged.
const PLACEMENT_VOCAB_PASS = 4 / 6, PLACEMENT_GRAM_PASS = 2 / 3;
// The one thing placement genuinely cannot get from data/words.json: a small,
// hand-checked, actually CEFR-appropriate word per level. VOCAB_ORDER has no
// real difficulty signal past the ~1,800 words that appear in the app's own
// curricula (tools/reorder.js ties everything else to a flat score and sorts
// by length) — so a level test drawn from it was mostly measuring word length
// and proper-noun familiarity, not English level. This 72-word bank (12 per
// level, docs/placement-test-methodology.md §8.1) is curated by hand instead:
// real words at each level, unique Persian gloss (no shared-meaning distractor
// collisions), no proper nouns. Source of truth is data/placement.json; keep
// the two in sync by hand if either changes.
const PLACEMENT_WORDS = {
  "A1": [
    { "i": 2315, "en": "house", "fa": "خانه / مجلس" },
    { "i": 2344, "en": "water", "fa": "آب" },
    { "i": 211, "en": "family", "fa": "خانواده" },
    { "i": 1308, "en": "friend", "fa": "دوست" },
    { "i": 1203, "en": "school", "fa": "مدرسه" },
    { "i": 3058, "en": "happy", "fa": "خوشحال / شاد" },
    { "i": 2352, "en": "small", "fa": "کوچک" },
    { "i": 1131, "en": "kitchen", "fa": "آشپزخانه" },
    { "i": 1332, "en": "morning", "fa": "صبح" },
    { "i": 100, "en": "city", "fa": "شهر" },
    { "i": 1277, "en": "money", "fa": "پول" },
    { "i": 1182, "en": "book", "fa": "کتاب" }
  ],
  "A2": [
    { "i": 4055, "en": "apartment", "fa": "آپارتمان / خانه" },
    { "i": 2817, "en": "holiday", "fa": "تعطیلات / روز تعطیل" },
    { "i": 3109, "en": "hospital", "fa": "بیمارستان" },
    { "i": 810, "en": "restaurant", "fa": "رستوران" },
    { "i": 151, "en": "decide", "fa": "تصمیم گرفتن" },
    { "i": 2834, "en": "remember", "fa": "به یاد آوردن" },
    { "i": 165, "en": "difficult", "fa": "دشوار" },
    { "i": 1041, "en": "dangerous", "fa": "خطرناک" },
    { "i": 60, "en": "borrow", "fa": "قرض گرفتن" },
    { "i": 293, "en": "improve", "fa": "بهبود بخشیدن" },
    { "i": 6444, "en": "invite", "fa": "دعوت کردن" },
    { "i": 110, "en": "comfortable", "fa": "راحت" }
  ],
  "B1": [
    { "i": 198, "en": "environment", "fa": "محیط" },
    { "i": 3117, "en": "opportunity", "fa": "فرصت" },
    { "i": 1317, "en": "relationship", "fa": "رابطه" },
    { "i": 3656, "en": "argument", "fa": "دعوا / بحث / استدلال" },
    { "i": 6907, "en": "considerable", "fa": "قابل‌توجه / زیاد" },
    { "i": 2750, "en": "various", "fa": "مختلف / گوناگون" },
    { "i": 1272, "en": "industry", "fa": "صنعت" },
    { "i": 37, "en": "avoid", "fa": "اجتناب کردن" },
    { "i": 5313, "en": "imagine", "fa": "تصور کردن / در نظر گرفتن" },
    { "i": 2948, "en": "decision", "fa": "تصمیم" },
    { "i": 1036, "en": "experience", "fa": "تجربه کردن" },
    { "i": 4451, "en": "attempt", "fa": "تلاش" }
  ],
  "B2": [
    { "i": 1917, "en": "alternative", "fa": "جایگزین" },
    { "i": 5433, "en": "principle", "fa": "اصل / نیت" },
    { "i": 3102, "en": "impact", "fa": "تأثیر / برخورد" },
    { "i": 10397, "en": "controversy", "fa": "مجادله / بحث" },
    { "i": 9517, "en": "phenomenon", "fa": "پدیده / رویداد خاص" },
    { "i": 10109, "en": "justify", "fa": "توجیه کردن" },
    { "i": 3716, "en": "comprehensive", "fa": "جامع / کامل" },
    { "i": 9113, "en": "consequence", "fa": "نتیجه / پیامد" },
    { "i": 5615, "en": "substantial", "fa": "قابل‌توجه / بزرگ" },
    { "i": 10498, "en": "constraint", "fa": "محدودیت / قید" },
    { "i": 4999, "en": "flexible", "fa": "انعطاف‌پذیر" },
    { "i": 189, "en": "efficient", "fa": "کارآمد" }
  ],
  "C1": [
    { "i": 3419, "en": "implementation", "fa": "اجرا / پیاده‌سازی" },
    { "i": 5522, "en": "interpretation", "fa": "تفسیر / برداشت" },
    { "i": 4189, "en": "infrastructure", "fa": "زیرساخت" },
    { "i": 170, "en": "discrimination", "fa": "تبعیض" },
    { "i": 6071, "en": "rehabilitation", "fa": "بازتوانبخشی / احیاء" },
    { "i": 6155, "en": "authentication", "fa": "احراز هویت / تأیید" },
    { "i": 7549, "en": "accountability", "fa": "پاسخ‌گویی / مسئولیت" },
    { "i": 7144, "en": "correspondence", "fa": "مکاتبات / تطابق" },
    { "i": 8602, "en": "reconstruction", "fa": "بازسازی / احیا" },
    { "i": 10058, "en": "characterization", "fa": "نقش‌آفرینی / تشریح" },
    { "i": 453, "en": "procrastination", "fa": "اهمال‌کاری" },
    { "i": 10083, "en": "confidentiality", "fa": "محرمانگی / سری بودن" }
  ],
  "C2": [
    { "i": 9772, "en": "empirical", "fa": "تجربی / مشاهده‌ای" },
    { "i": 9302, "en": "hypothesis", "fa": "فرضیه / گمان" },
    { "i": 7410, "en": "synthesis", "fa": "ترکیب / تولید" },
    { "i": 1357, "en": "ambivalent", "fa": "دوسوگرا" },
    { "i": 1399, "en": "fastidious", "fa": "سخت‌گیر" },
    { "i": 9592, "en": "equilibrium", "fa": "تعادل / توازن" },
    { "i": 9416, "en": "catalyst", "fa": "عامل تحریک‌کننده" },
    { "i": 6691, "en": "methodology", "fa": "روش / روش‌شناسی" },
    { "i": 8152, "en": "correlation", "fa": "همبستگی / ارتباط" },
    { "i": 9715, "en": "deviation", "fa": "انحراف / فاصله از مسیر" },
    { "i": 9887, "en": "convergence", "fa": "همگرایی / تقارب" },
    { "i": 763, "en": "resilient", "fa": "تابآور" }
  ]
};
// The verbs the collocation groups are built around. Every verb group has
// exactly one distinct first word, so distractors have to come from this list —
// drawing them from the other groups produced options like "make / bitterly /
// I'm / long", which never asks make-vs-do-vs-take, the point of the section.
const CORE_VERBS = ['make', 'do', 'take', 'have', 'get', 'go', 'come', 'keep', 'put', 'set', 'give', 'bring'];
// Four labelled tabs replace nine icon-only header buttons whose only labels
// were title tooltips — which do not exist on a touch screen. "owns" lists the
// screens that belong to a tab, so the tab stays lit while you are inside them.
// Four lanes, named so the shape of the whole app is legible at a glance:
// learn it, look it up, drill it, see how far you are. «امروز» was left over
// from the daily-lesson model that no longer exists, and «ساختار» / «شنیدن و
// گفتن» named two curricula rather than two things a learner wants to do.
const NAV = [
  { screen: 'home', label: 'یادگیری', icon: 'ph ph-graduation-cap',
    owns: ['lessons', 'study', 'quiz', 'result', 'sent', 'sbrun', 'gram', 'glesson', 'colloc', 'csrun', 'listen', 'ltext', 'disc', 'dses'] },
  { screen: 'browse', label: 'واژه‌نامه', icon: 'ph ph-magnifying-glass', owns: ['add'] },
  { screen: 'words', label: 'تمرین', icon: 'ph ph-game-controller', owns: ['exercise', 'game'] },
  { screen: 'jobs', label: 'شغل‌ها', icon: 'ph ph-briefcase', owns: ['jobdetail'] }
];
const JOBS = [
  { en: 'Doctor', fa: 'پزشک', icon: 'ph ph-stethoscope', group: 'سلامت' },
  { en: 'Nurse', fa: 'پرستار', icon: 'ph ph-first-aid', group: 'سلامت' },
  { en: 'Dentist', fa: 'دندان‌پزشک', icon: 'ph ph-tooth', group: 'سلامت' },
  { en: 'Pharmacist', fa: 'داروساز', icon: 'ph ph-prescription', group: 'سلامت' },
  { en: 'Teacher', fa: 'معلم', icon: 'ph ph-chalkboard-teacher', group: 'آموزش' },
  { en: 'Professor', fa: 'استاد دانشگاه', icon: 'ph ph-student', group: 'آموزش' },
  { en: 'Software Developer', fa: 'توسعه‌دهندهٔ نرم‌افزار', icon: 'ph ph-code', group: 'فناوری' },
  { en: 'Engineer', fa: 'مهندس', icon: 'ph ph-gear', group: 'فنی' },
  { en: 'Architect', fa: 'معمار', icon: 'ph ph-buildings', group: 'فنی' },
  { en: 'Electrician', fa: 'برق‌کار', icon: 'ph ph-lightning', group: 'فنی' },
  { en: 'Mechanic', fa: 'مکانیک', icon: 'ph ph-wrench', group: 'فنی' },
  { en: 'Accountant', fa: 'حسابدار', icon: 'ph ph-calculator', group: 'کسب‌وکار' },
  { en: 'Manager', fa: 'مدیر', icon: 'ph ph-presentation-chart', group: 'کسب‌وکار' },
  { en: 'Entrepreneur', fa: 'کارآفرین', icon: 'ph ph-rocket-launch', group: 'کسب‌وکار' },
  { en: 'Salesperson', fa: 'فروشنده', icon: 'ph ph-storefront', group: 'کسب‌وکار' },
  { en: 'Lawyer', fa: 'وکیل', icon: 'ph ph-scales', group: 'حقوق' },
  { en: 'Police Officer', fa: 'افسر پلیس', icon: 'ph ph-shield', group: 'خدمات عمومی' },
  { en: 'Firefighter', fa: 'آتش‌نشان', icon: 'ph ph-fire-extinguisher', group: 'خدمات عمومی' },
  { en: 'Chef', fa: 'آشپز حرفه‌ای', icon: 'ph ph-cooking-pot', group: 'خدمات' },
  { en: 'Pilot', fa: 'خلبان', icon: 'ph ph-airplane-tilt', group: 'حمل‌ونقل' },
  { en: 'Driver', fa: 'راننده', icon: 'ph ph-car', group: 'حمل‌ونقل' },
  { en: 'Designer', fa: 'طراح', icon: 'ph ph-palette', group: 'هنر و رسانه' },
  { en: 'Photographer', fa: 'عکاس', icon: 'ph ph-camera', group: 'هنر و رسانه' },
  { en: 'Journalist', fa: 'روزنامه‌نگار', icon: 'ph ph-newspaper', group: 'هنر و رسانه' },
  { en: 'Farmer', fa: 'کشاورز', icon: 'ph ph-plant', group: 'کشاورزی' }
];
// Job facts are deliberately separate from the level templates. The facts are
// stable occupational content (tasks, setting, tools, collaborators, outcome
// and a real trade-off); the templates control CEFR language complexity. This
// avoids the old failure mode where changing A1 to C2 changed only the tab.
const JP = (en, fa) => ({ en, fa });
const JOB_FACTS = {
  Doctor: {
    place: JP('in hospitals and clinics', 'در بیمارستان‌ها و درمانگاه‌ها'),
    tasks: [JP('examine patients', 'بیماران را معاینه می‌کند'), JP('diagnose health problems', 'مشکلات سلامتی را تشخیص می‌دهد'), JP('plan and review treatments', 'درمان‌ها را برنامه‌ریزی و بازبینی می‌کند')],
    tools: JP('medical records and diagnostic tests', 'پرونده‌های پزشکی و آزمایش‌های تشخیصی'), skill: JP('careful judgement and clear communication', 'قضاوت دقیق و ارتباط روشن'),
    partners: JP('nurses, specialists, and patients', 'پرستاران، متخصصان و بیماران'), outcome: JP('helps patients recover and manage their health', 'به بیماران کمک می‌کند بهبود یابند و سلامت خود را مدیریت کنند'),
    challenge: JP('must make timely decisions while protecting patient safety and dignity', 'باید ضمن حفظ ایمنی و کرامت بیمار، به‌موقع تصمیم بگیرد')
  },
  Nurse: {
    place: JP('in hospitals, clinics, and community settings', 'در بیمارستان‌ها، درمانگاه‌ها و مراکز محلی'),
    tasks: [JP('monitor patients', 'وضعیت بیماران را پایش می‌کند'), JP('give medicines and treatments', 'دارو و درمان ارائه می‌دهد'), JP('coordinate daily care', 'مراقبت روزانه را هماهنگ می‌کند')],
    tools: JP('medical equipment and care records', 'تجهیزات پزشکی و پرونده‌های مراقبتی'), skill: JP('close observation, empathy, and calm communication', 'مشاهدهٔ دقیق، همدلی و ارتباط آرام'),
    partners: JP('patients, families, and healthcare teams', 'بیماران، خانواده‌ها و تیم‌های درمانی'), outcome: JP('keeps care safe, continuous, and centred on the patient', 'مراقبت را ایمن، پیوسته و بیمارمحور نگه می‌دارد'),
    challenge: JP('must respond to changing conditions without losing accuracy or compassion', 'باید بدون کاهش دقت یا همدلی به تغییر وضعیت بیماران پاسخ دهد')
  },
  Dentist: {
    place: JP('in dental clinics and practices', 'در درمانگاه‌ها و مطب‌های دندان‌پزشکی'),
    tasks: [JP('examine teeth and gums', 'دندان‌ها و لثه‌ها را معاینه می‌کند'), JP('treat decay and damaged teeth', 'پوسیدگی و آسیب دندان را درمان می‌کند'), JP('teach patients about oral care', 'مراقبت از دهان و دندان را به بیماران آموزش می‌دهد')],
    tools: JP('x-rays, mirrors, drills, and digital scanners', 'عکس‌های رادیولوژی، آینه، مته و اسکنر دیجیتال'), skill: JP('precision, infection control, and reassuring communication', 'دقت، کنترل عفونت و ارتباط اطمینان‌بخش'),
    partners: JP('patients, hygienists, and dental assistants', 'بیماران، بهداشت‌کاران و دستیاران دندان‌پزشکی'), outcome: JP('protects oral health and prevents more serious problems', 'از سلامت دهان محافظت می‌کند و مانع مشکلات جدی‌تر می‌شود'),
    challenge: JP('must control pain and infection while choosing the least harmful effective treatment', 'باید هم‌زمان با کنترل درد و عفونت، کم‌ضررترین درمان مؤثر را انتخاب کند')
  },
  Pharmacist: {
    place: JP('in pharmacies, hospitals, and health centres', 'در داروخانه‌ها، بیمارستان‌ها و مراکز سلامت'),
    tasks: [JP('check prescriptions', 'نسخه‌ها را بررسی می‌کند'), JP('dispense medicines safely', 'داروها را با ایمنی تحویل می‌دهد'), JP('explain dosage, side effects, and storage', 'مقدار مصرف، عوارض و شیوهٔ نگهداری را توضیح می‌دهد')],
    tools: JP('drug databases, prescriptions, and patient records', 'پایگاه‌های اطلاعات دارویی، نسخه‌ها و پرونده‌های بیماران'), skill: JP('accuracy, pharmacological knowledge, and accessible explanations', 'دقت، دانش داروشناسی و توضیح قابل‌فهم'),
    partners: JP('patients, doctors, and pharmacy technicians', 'بیماران، پزشکان و تکنسین‌های داروخانه'), outcome: JP('prevents medication errors and supports effective treatment', 'از خطاهای دارویی جلوگیری می‌کند و به درمان مؤثر کمک می‌کند'),
    challenge: JP('must provide timely access to medicine without compromising clinical checks', 'باید بدون کوتاه‌آمدن از بررسی‌های بالینی، دسترسی به‌موقع به دارو را فراهم کند')
  },
  Teacher: {
    place: JP('in schools and learning centres', 'در مدرسه‌ها و مراکز آموزشی'),
    tasks: [JP('plan lessons', 'درس‌ها را برنامه‌ریزی می‌کند'), JP('explain ideas and guide practice', 'مفاهیم را توضیح می‌دهد و تمرین را هدایت می‌کند'), JP('assess progress and give feedback', 'پیشرفت را ارزیابی می‌کند و بازخورد می‌دهد')],
    tools: JP('books, classroom materials, and digital learning tools', 'کتاب‌ها، مواد کلاسی و ابزارهای دیجیتال یادگیری'), skill: JP('subject knowledge, patience, and adaptable communication', 'دانش موضوعی، صبر و ارتباط انعطاف‌پذیر'),
    partners: JP('students, families, and other teachers', 'دانش‌آموزان، خانواده‌ها و معلمان دیگر'), outcome: JP('helps learners build knowledge, confidence, and independence', 'به یادگیرندگان کمک می‌کند دانش، اعتمادبه‌نفس و استقلال بسازند'),
    challenge: JP('must meet shared learning goals while responding to different needs', 'باید ضمن پاسخ به نیازهای متفاوت، به هدف‌های مشترک یادگیری برسد')
  },
  Professor: {
    place: JP('at universities and research institutions', 'در دانشگاه‌ها و مؤسسه‌های پژوهشی'),
    tasks: [JP('teach advanced subjects', 'موضوعات پیشرفته را تدریس می‌کند'), JP('conduct and publish research', 'پژوهش انجام می‌دهد و منتشر می‌کند'), JP('supervise students and academic projects', 'بر دانشجویان و پروژه‌های دانشگاهی نظارت می‌کند')],
    tools: JP('research literature, data, laboratories, and specialist software', 'منابع پژوهشی، داده، آزمایشگاه و نرم‌افزار تخصصی'), skill: JP('deep expertise, critical inquiry, and precise explanation', 'تخصص عمیق، پرسشگری نقادانه و توضیح دقیق'),
    partners: JP('students, researchers, and academic communities', 'دانشجویان، پژوهشگران و جامعه‌های دانشگاهی'), outcome: JP('develops knowledge and prepares others to question it responsibly', 'دانش را گسترش می‌دهد و دیگران را برای نقد مسئولانهٔ آن آماده می‌کند'),
    challenge: JP('must balance teaching, research, public value, and academic integrity', 'باید میان تدریس، پژوهش، ارزش عمومی و درستکاری دانشگاهی تعادل برقرار کند')
  },
  'Software Developer': {
    place: JP('in technology teams, offices, or distributed workplaces', 'در تیم‌های فناوری، دفترها یا محیط‌های کاری دورکار'),
    tasks: [JP('analyse user needs', 'نیازهای کاربران را تحلیل می‌کند'), JP('design and build software', 'نرم‌افزار را طراحی و تولید می‌کند'), JP('test, document, and maintain systems', 'سامانه‌ها را آزمایش، مستندسازی و نگهداری می‌کند')],
    tools: JP('code editors, version control, tests, and monitoring data', 'ویرایشگر کد، کنترل نسخه، آزمون‌ها و داده‌های پایش'), skill: JP('logical reasoning, technical curiosity, and collaboration', 'استدلال منطقی، کنجکاوی فنی و همکاری'),
    partners: JP('users, designers, testers, and other developers', 'کاربران، طراحان، آزمون‌گران و توسعه‌دهندگان دیگر'), outcome: JP('turns user needs into reliable and useful digital tools', 'نیازهای کاربر را به ابزارهای دیجیتال قابل‌اعتماد و مفید تبدیل می‌کند'),
    challenge: JP('must deliver useful changes while protecting security, quality, and maintainability', 'باید ضمن حفظ امنیت، کیفیت و نگهداشت‌پذیری، تغییرهای مفید را ارائه کند')
  },
  Engineer: {
    place: JP('in offices, laboratories, factories, and project sites', 'در دفترها، آزمایشگاه‌ها، کارخانه‌ها و محل پروژه'),
    tasks: [JP('analyse technical problems', 'مسائل فنی را تحلیل می‌کند'), JP('design and test systems', 'سامانه‌ها را طراحی و آزمایش می‌کند'), JP('review performance and improve solutions', 'عملکرد را بازبینی و راه‌حل‌ها را بهتر می‌کند')],
    tools: JP('models, simulations, design software, and measurement equipment', 'مدل‌ها، شبیه‌سازی‌ها، نرم‌افزار طراحی و تجهیزات اندازه‌گیری'), skill: JP('mathematical reasoning, precision, and practical judgement', 'استدلال ریاضی، دقت و قضاوت عملی'),
    partners: JP('technicians, clients, scientists, and project teams', 'تکنسین‌ها، مشتریان، دانشمندان و تیم‌های پروژه'), outcome: JP('creates systems that solve practical problems safely and efficiently', 'سامانه‌هایی می‌سازد که مسائل عملی را ایمن و کارآمد حل می‌کنند'),
    challenge: JP('must reconcile safety, cost, performance, and environmental impact', 'باید ایمنی، هزینه، عملکرد و اثر زیست‌محیطی را با هم سازگار کند')
  },
  Architect: {
    place: JP('in design studios and on construction sites', 'در استودیوهای طراحی و محل‌های ساخت‌وساز'),
    tasks: [JP('discuss needs with clients', 'نیازها را با کارفرما بررسی می‌کند'), JP('design buildings and spaces', 'ساختمان‌ها و فضاها را طراحی می‌کند'), JP('coordinate technical plans and construction details', 'نقشه‌های فنی و جزئیات ساخت را هماهنگ می‌کند')],
    tools: JP('drawings, digital models, building codes, and site information', 'نقشه‌ها، مدل‌های دیجیتال، مقررات ساختمان و اطلاعات محل'), skill: JP('spatial thinking, creativity, and technical coordination', 'تفکر فضایی، خلاقیت و هماهنگی فنی'),
    partners: JP('clients, engineers, planners, and contractors', 'کارفرمایان، مهندسان، برنامه‌ریزان و پیمانکاران'), outcome: JP('shapes safe, useful, and meaningful places for people', 'فضاهایی ایمن، کاربردی و معنادار برای مردم شکل می‌دهد'),
    challenge: JP('must balance design quality with cost, regulation, access, and sustainability', 'باید کیفیت طراحی را با هزینه، مقررات، دسترس‌پذیری و پایداری متعادل کند')
  },
  Electrician: {
    place: JP('in homes, businesses, factories, and construction sites', 'در خانه‌ها، کسب‌وکارها، کارخانه‌ها و محل‌های ساخت'),
    tasks: [JP('install wiring and electrical equipment', 'سیم‌کشی و تجهیزات برقی را نصب می‌کند'), JP('inspect circuits and safety systems', 'مدارها و سامانه‌های ایمنی را بازرسی می‌کند'), JP('find and repair electrical faults', 'خرابی‌های برقی را پیدا و تعمیر می‌کند')],
    tools: JP('circuit diagrams, test meters, and insulated hand tools', 'نقشهٔ مدار، دستگاه‌های اندازه‌گیری و ابزار دستی عایق'), skill: JP('safety awareness, practical reasoning, and accuracy', 'آگاهی ایمنی، استدلال عملی و دقت'),
    partners: JP('clients, builders, engineers, and maintenance teams', 'مشتریان، سازندگان، مهندسان و تیم‌های نگهداری'), outcome: JP('keeps electrical power safe, reliable, and available', 'برق را ایمن، قابل‌اعتماد و در دسترس نگه می‌دارد'),
    challenge: JP('must solve faults efficiently while following strict safety codes', 'باید ضمن رعایت دقیق مقررات ایمنی، خرابی‌ها را کارآمد رفع کند')
  },
  Mechanic: {
    place: JP('in garages, workshops, and service centres', 'در تعمیرگاه‌ها، کارگاه‌ها و مراکز خدماتی'),
    tasks: [JP('inspect vehicles and machines', 'خودروها و ماشین‌آلات را بازرسی می‌کند'), JP('diagnose mechanical faults', 'خرابی‌های مکانیکی را تشخیص می‌دهد'), JP('repair, replace, and test parts', 'قطعات را تعمیر، تعویض و آزمایش می‌کند')],
    tools: JP('diagnostic scanners, lifts, manuals, and hand tools', 'اسکنرهای عیب‌یابی، بالابر، راهنما و ابزار دستی'), skill: JP('practical reasoning, precision, and systematic testing', 'استدلال عملی، دقت و آزمایش نظام‌مند'),
    partners: JP('customers, technicians, and parts suppliers', 'مشتریان، تکنسین‌ها و تأمین‌کنندگان قطعه'), outcome: JP('keeps transport and machinery safe and dependable', 'حمل‌ونقل و ماشین‌آلات را ایمن و قابل‌اعتماد نگه می‌دارد'),
    challenge: JP('must identify the real cause of a fault before time and cost increase', 'باید پیش از افزایش زمان و هزینه، علت واقعی خرابی را پیدا کند')
  },
  Accountant: {
    place: JP('in organisations, accounting firms, or client offices', 'در سازمان‌ها، مؤسسه‌های حسابداری یا دفتر مشتریان'),
    tasks: [JP('record and classify financial transactions', 'تراکنش‌های مالی را ثبت و طبقه‌بندی می‌کند'), JP('prepare and review financial statements', 'صورت‌های مالی را تهیه و بازبینی می‌کند'), JP('check records against rules and evidence', 'سوابق را با قوانین و شواهد تطبیق می‌دهد')],
    tools: JP('spreadsheets, accounting software, invoices, and ledgers', 'صفحه‌گسترده، نرم‌افزار حسابداری، فاکتورها و دفترهای مالی'), skill: JP('numerical accuracy, integrity, and analytical judgement', 'دقت عددی، درستکاری و قضاوت تحلیلی'),
    partners: JP('managers, clients, auditors, and regulators', 'مدیران، مشتریان، حسابرسان و نهادهای ناظر'), outcome: JP('makes financial information reliable enough for decisions and accountability', 'اطلاعات مالی را برای تصمیم‌گیری و پاسخ‌گویی قابل‌اعتماد می‌کند'),
    challenge: JP('must meet deadlines while interpreting complex rules and protecting confidential data', 'باید ضمن تفسیر مقررات پیچیده و حفظ داده‌های محرمانه، مهلت‌ها را رعایت کند')
  },
  Manager: {
    place: JP('in businesses, public services, and non-profit organisations', 'در شرکت‌ها، خدمات عمومی و سازمان‌های غیرانتفاعی'),
    tasks: [JP('set goals and priorities', 'هدف‌ها و اولویت‌ها را تعیین می‌کند'), JP('organise people, budgets, and schedules', 'نیروها، بودجه و زمان‌بندی را سازمان می‌دهد'), JP('review performance and support improvement', 'عملکرد را بازبینی و از بهبود حمایت می‌کند')],
    tools: JP('plans, budgets, meetings, and performance data', 'برنامه‌ها، بودجه‌ها، جلسه‌ها و داده‌های عملکرد'), skill: JP('leadership, judgement, listening, and clear delegation', 'رهبری، قضاوت، گوش‌دادن و تفویض روشن'),
    partners: JP('employees, customers, senior leaders, and external partners', 'کارکنان، مشتریان، مدیران ارشد و شرکای بیرونی'), outcome: JP('aligns people and resources so that useful work gets done', 'افراد و منابع را همسو می‌کند تا کار مفید انجام شود'),
    challenge: JP('must achieve results while protecting staff wellbeing, trust, and long-term capacity', 'باید ضمن حفظ سلامت کارکنان، اعتماد و توان بلندمدت، به نتیجه برسد')
  },
  Entrepreneur: {
    place: JP('in start-ups, small businesses, and changing markets', 'در استارتاپ‌ها، کسب‌وکارهای کوچک و بازارهای متغیر'),
    tasks: [JP('identify a problem or opportunity', 'یک مسئله یا فرصت را شناسایی می‌کند'), JP('develop and test a product or service', 'محصول یا خدمتی را توسعه و آزمایش می‌کند'), JP('manage finance, sales, and operations', 'امور مالی، فروش و عملیات را مدیریت می‌کند')],
    tools: JP('market research, budgets, prototypes, and digital platforms', 'پژوهش بازار، بودجه، نمونه‌های اولیه و بسترهای دیجیتال'), skill: JP('initiative, adaptability, financial awareness, and persistence', 'ابتکار، سازگاری، آگاهی مالی و پشتکار'),
    partners: JP('customers, employees, suppliers, and investors', 'مشتریان، کارکنان، تأمین‌کنندگان و سرمایه‌گذاران'), outcome: JP('turns an uncertain idea into value, services, and employment', 'یک ایدهٔ نامطمئن را به ارزش، خدمات و اشتغال تبدیل می‌کند'),
    challenge: JP('must pursue growth without ignoring cash flow, evidence, or responsibility to others', 'باید بدون نادیده‌گرفتن جریان نقدی، شواهد یا مسئولیت در برابر دیگران، رشد کند')
  },
  Salesperson: {
    place: JP('in shops, offices, showrooms, or online services', 'در فروشگاه‌ها، دفترها، نمایشگاه‌ها یا خدمات آنلاین'),
    tasks: [JP('ask about customer needs', 'دربارهٔ نیاز مشتری پرس‌وجو می‌کند'), JP('explain and compare products or services', 'محصولات یا خدمات را توضیح و مقایسه می‌کند'), JP('complete sales and follow up with customers', 'فروش را نهایی و با مشتری پیگیری می‌کند')],
    tools: JP('product information, customer records, and payment systems', 'اطلاعات محصول، سوابق مشتری و سامانه‌های پرداخت'), skill: JP('active listening, product knowledge, and honest persuasion', 'گوش‌دادن فعال، شناخت محصول و متقاعدسازی صادقانه'),
    partners: JP('customers, stock teams, managers, and suppliers', 'مشتریان، تیم انبار، مدیران و تأمین‌کنندگان'), outcome: JP('helps customers choose a suitable solution and supports the business', 'به مشتریان در انتخاب راه‌حل مناسب کمک می‌کند و از کسب‌وکار حمایت می‌کند'),
    challenge: JP('must meet commercial targets without weakening suitability or trust', 'باید بدون آسیب‌زدن به تناسب انتخاب یا اعتماد، به هدف‌های تجاری برسد')
  },
  Lawyer: {
    place: JP('in offices, courts, public bodies, and client meetings', 'در دفترها، دادگاه‌ها، نهادهای عمومی و جلسه‌های موکلان'),
    tasks: [JP('research laws and previous cases', 'قوانین و پرونده‌های پیشین را بررسی می‌کند'), JP('advise and represent clients', 'به موکلان مشاوره می‌دهد و از آنان نمایندگی می‌کند'), JP('prepare legal documents and arguments', 'اسناد و استدلال‌های حقوقی را آماده می‌کند')],
    tools: JP('legislation, case law, contracts, evidence, and legal databases', 'قوانین، رویهٔ قضایی، قراردادها، شواهد و پایگاه‌های حقوقی'), skill: JP('close analysis, persuasive writing, advocacy, and ethical judgement', 'تحلیل دقیق، نگارش متقاعدکننده، دفاع و قضاوت اخلاقی'),
    partners: JP('clients, colleagues, courts, and public authorities', 'موکلان، همکاران، دادگاه‌ها و نهادهای عمومی'), outcome: JP('protects rights, clarifies obligations, and helps resolve disputes', 'از حقوق محافظت می‌کند، تعهدات را روشن می‌سازد و به حل اختلاف کمک می‌کند'),
    challenge: JP('must advance a client’s lawful interests while respecting confidentiality and duties to justice', 'باید ضمن رعایت محرمانگی و وظایف خود در برابر عدالت، منافع قانونی موکل را پیگیری کند')
  },
  'Police Officer': {
    place: JP('in communities, police stations, and incident locations', 'در محله‌ها، کلانتری‌ها و محل رویدادها'),
    tasks: [JP('respond to calls and protect the public', 'به تماس‌ها پاسخ می‌دهد و از مردم محافظت می‌کند'), JP('investigate incidents and gather evidence', 'رویدادها را بررسی و شواهد را جمع‌آوری می‌کند'), JP('record decisions and enforce the law', 'تصمیم‌ها را ثبت و قانون را اجرا می‌کند')],
    tools: JP('radios, body cameras, records, and protective equipment', 'بی‌سیم، دوربین بدنی، سوابق و تجهیزات حفاظتی'), skill: JP('situational awareness, restraint, communication, and sound judgement', 'آگاهی موقعیتی، خویشتن‌داری، ارتباط و قضاوت درست'),
    partners: JP('members of the public, emergency services, and justice agencies', 'مردم، خدمات امدادی و نهادهای قضایی'), outcome: JP('supports public safety and the fair application of law', 'از امنیت عمومی و اجرای عادلانهٔ قانون پشتیبانی می‌کند'),
    challenge: JP('must use authority lawfully and proportionately while maintaining public trust', 'باید ضمن حفظ اعتماد عمومی، از اختیار خود قانونی و متناسب استفاده کند')
  },
  Firefighter: {
    place: JP('at fire stations and emergency locations', 'در ایستگاه‌های آتش‌نشانی و محل‌های اضطراری'),
    tasks: [JP('respond to fires, accidents, and rescues', 'به آتش‌سوزی، حادثه و عملیات نجات پاسخ می‌دهد'), JP('give emergency first aid', 'کمک‌های اولیهٔ اضطراری ارائه می‌دهد'), JP('inspect and maintain rescue equipment', 'تجهیزات نجات را بازرسی و نگهداری می‌کند')],
    tools: JP('protective clothing, hoses, breathing equipment, and rescue tools', 'لباس حفاظتی، شیلنگ، تجهیزات تنفسی و ابزار نجات'), skill: JP('teamwork, physical readiness, risk awareness, and calm action', 'کار تیمی، آمادگی جسمانی، آگاهی از خطر و اقدام آرام'),
    partners: JP('fire crews, paramedics, police, and local communities', 'گروه‌های آتش‌نشانی، امدادگران، پلیس و جامعهٔ محلی'), outcome: JP('saves lives, limits damage, and helps communities prepare for emergencies', 'جان انسان‌ها را نجات می‌دهد، خسارت را محدود می‌کند و جامعه را برای بحران آماده می‌سازد'),
    challenge: JP('must act quickly without exposing the crew or public to avoidable danger', 'باید سریع عمل کند، بی‌آنکه گروه یا مردم را در معرض خطر قابل‌پیشگیری قرار دهد')
  },
  Chef: {
    place: JP('in restaurant, hotel, and institutional kitchens', 'در آشپزخانهٔ رستوران‌ها، هتل‌ها و مراکز بزرگ'),
    tasks: [JP('plan menus and prepare ingredients', 'منو را برنامه‌ریزی و مواد را آماده می‌کند'), JP('cook and present food', 'غذا را می‌پزد و ارائه می‌کند'), JP('coordinate service, hygiene, and stock', 'سرویس، بهداشت و موجودی را هماهنگ می‌کند')],
    tools: JP('knives, ovens, recipes, temperature controls, and stock records', 'چاقو، فر، دستور غذا، کنترل دما و سوابق موجودی'), skill: JP('timing, taste, organisation, creativity, and food safety', 'زمان‌بندی، ذائقه، نظم، خلاقیت و ایمنی غذا'),
    partners: JP('kitchen staff, servers, suppliers, and guests', 'کارکنان آشپزخانه، پیشخدمت‌ها، تأمین‌کنندگان و مهمانان'), outcome: JP('turns ingredients into safe, consistent, and enjoyable meals', 'مواد اولیه را به غذاهایی ایمن، یکدست و لذت‌بخش تبدیل می‌کند'),
    challenge: JP('must maintain quality and allergy safety during fast service while limiting waste', 'باید هنگام سرو سریع، کیفیت و ایمنی حساسیت غذایی را حفظ و ضایعات را محدود کند')
  },
  Pilot: {
    place: JP('in aircraft, airports, and flight operations centres', 'در هواپیما، فرودگاه و مرکز عملیات پرواز'),
    tasks: [JP('plan flights and review conditions', 'پرواز را برنامه‌ریزی و شرایط را بررسی می‌کند'), JP('operate and monitor the aircraft', 'هواپیما را هدایت و پایش می‌کند'), JP('communicate with crew and air traffic control', 'با خدمه و کنترل ترافیک هوایی ارتباط برقرار می‌کند')],
    tools: JP('flight instruments, navigation systems, radios, and checklists', 'ابزارهای پرواز، سامانه‌های ناوبری، رادیو و چک‌لیست'), skill: JP('concentration, procedural discipline, communication, and judgement', 'تمرکز، انضباط اجرایی، ارتباط و قضاوت'),
    partners: JP('crew members, dispatchers, engineers, and air traffic controllers', 'خدمه، مسئولان اعزام، مهندسان و کنترل‌کنندگان ترافیک هوایی'), outcome: JP('moves passengers or cargo safely and efficiently between places', 'مسافر یا بار را ایمن و کارآمد میان مکان‌ها جابه‌جا می‌کند'),
    challenge: JP('must manage weather, workload, and changing information without weakening safety margins', 'باید بدون کاهش حاشیهٔ ایمنی، آب‌وهوا، فشار کاری و اطلاعات متغیر را مدیریت کند')
  },
  Driver: {
    place: JP('on roads, at depots, and at customer locations', 'در جاده‌ها، پایانه‌ها و محل مشتریان'),
    tasks: [JP('inspect the vehicle before travel', 'پیش از حرکت خودرو را بازرسی می‌کند'), JP('plan and follow safe routes', 'مسیرهای ایمن را برنامه‌ریزی و طی می‌کند'), JP('carry passengers or goods and keep records', 'مسافر یا بار را جابه‌جا و سوابق را ثبت می‌کند')],
    tools: JP('vehicles, navigation systems, delivery records, and safety equipment', 'خودرو، سامانهٔ ناوبری، سوابق تحویل و تجهیزات ایمنی'), skill: JP('attention, patience, route awareness, and responsible driving', 'توجه، صبر، شناخت مسیر و رانندگی مسئولانه'),
    partners: JP('passengers, customers, dispatchers, and maintenance teams', 'مسافران، مشتریان، مسئولان اعزام و تیم‌های نگهداری'), outcome: JP('provides dependable movement of people and goods', 'جابه‌جایی قابل‌اعتماد مردم و کالا را فراهم می‌کند'),
    challenge: JP('must meet schedules while managing traffic, fatigue, weather, and road safety', 'باید ضمن مدیریت ترافیک، خستگی، آب‌وهوا و ایمنی راه، زمان‌بندی را رعایت کند')
  },
  Designer: {
    place: JP('in studios, product teams, agencies, or independent practice', 'در استودیوها، تیم‌های محصول، آژانس‌ها یا به‌صورت مستقل'),
    tasks: [JP('research users and define a design problem', 'دربارهٔ کاربران پژوهش و مسئلهٔ طراحی را تعریف می‌کند'), JP('create and compare concepts', 'ایده‌ها را می‌سازد و مقایسه می‌کند'), JP('prototype, test, and refine a solution', 'راه‌حل را نمونه‌سازی، آزمایش و اصلاح می‌کند')],
    tools: JP('sketches, design software, prototypes, and user feedback', 'طرح‌های دستی، نرم‌افزار طراحی، نمونه‌های اولیه و بازخورد کاربر'), skill: JP('creativity, empathy, visual judgement, and clear rationale', 'خلاقیت، همدلی، قضاوت بصری و استدلال روشن'),
    partners: JP('users, clients, researchers, developers, and producers', 'کاربران، مشتریان، پژوهشگران، توسعه‌دهندگان و تولیدکنندگان'), outcome: JP('makes products, messages, or services clearer and more useful', 'محصولات، پیام‌ها یا خدمات را روشن‌تر و کاربردی‌تر می‌کند'),
    challenge: JP('must balance originality with usability, accessibility, evidence, and constraints', 'باید اصالت را با کاربردپذیری، دسترس‌پذیری، شواهد و محدودیت‌ها متعادل کند')
  },
  Photographer: {
    place: JP('in studios, public spaces, workplaces, and event locations', 'در استودیو، فضای عمومی، محیط کار و محل رویداد'),
    tasks: [JP('plan a shoot and understand its purpose', 'عکاسی را برنامه‌ریزی و هدف آن را درک می‌کند'), JP('control light, timing, and composition', 'نور، زمان و ترکیب‌بندی را کنترل می‌کند'), JP('select, edit, and deliver images', 'تصاویر را انتخاب، ویرایش و تحویل می‌دهد')],
    tools: JP('cameras, lenses, lighting, editing software, and image archives', 'دوربین، لنز، نورپردازی، نرم‌افزار ویرایش و آرشیو تصویر'), skill: JP('observation, technical control, visual storytelling, and sensitivity', 'مشاهده، کنترل فنی، روایت بصری و حساسیت'),
    partners: JP('subjects, clients, editors, and production teams', 'سوژه‌ها، مشتریان، ویراستاران و تیم‌های تولید'), outcome: JP('records evidence, identity, products, and moments through images', 'شواهد، هویت، محصولات و لحظه‌ها را با تصویر ثبت می‌کند'),
    challenge: JP('must meet a visual brief while respecting authenticity, consent, and privacy', 'باید ضمن رعایت اصالت، رضایت و حریم خصوصی، خواستهٔ تصویری را برآورده کند')
  },
  Journalist: {
    place: JP('in newsrooms, communities, and the locations of unfolding events', 'در تحریریه، جامعه و محل رویدادهای در حال وقوع'),
    tasks: [JP('investigate questions of public interest', 'موضوعات مهم برای عموم را بررسی می‌کند'), JP('interview sources and verify evidence', 'با منابع مصاحبه و شواهد را راستی‌آزمایی می‌کند'), JP('write, edit, and update reports', 'گزارش‌ها را می‌نویسد، ویرایش و به‌روزرسانی می‌کند')],
    tools: JP('interviews, public records, data, recordings, and publishing systems', 'مصاحبه، اسناد عمومی، داده، ضبط‌ها و سامانه‌های انتشار'), skill: JP('curiosity, scepticism, verification, and lucid writing', 'کنجکاوی، تردید سنجیده، راستی‌آزمایی و نگارش روشن'),
    partners: JP('sources, editors, experts, and affected communities', 'منابع، سردبیران، کارشناسان و جامعه‌های درگیر'), outcome: JP('gives the public verified information for understanding and debate', 'اطلاعات راستی‌آزمایی‌شده را برای فهم و گفت‌وگوی عمومی فراهم می‌کند'),
    challenge: JP('must report quickly without sacrificing accuracy, fairness, context, or source safety', 'باید سریع گزارش دهد، بی‌آنکه دقت، انصاف، زمینه یا امنیت منبع را قربانی کند')
  },
  Farmer: {
    place: JP('on farms, in fields, and around livestock facilities', 'در مزرعه، کشتزار و محل نگهداری دام'),
    tasks: [JP('plan crops or animal care', 'کشت یا مراقبت از دام را برنامه‌ریزی می‌کند'), JP('operate equipment and manage daily work', 'تجهیزات و کار روزانه را مدیریت می‌کند'), JP('monitor soil, weather, crops, and animal health', 'خاک، آب‌وهوا، محصول و سلامت دام را پایش می‌کند')],
    tools: JP('machinery, irrigation, weather information, and farm records', 'ماشین‌آلات، آبیاری، اطلاعات هواشناسی و سوابق مزرعه'), skill: JP('practical knowledge, patience, observation, and planning', 'دانش عملی، صبر، مشاهده و برنامه‌ریزی'),
    partners: JP('farm workers, suppliers, buyers, advisers, and veterinarians', 'کارگران مزرعه، تأمین‌کنندگان، خریداران، مشاوران و دام‌پزشکان'), outcome: JP('produces food and materials while caring for land and animals', 'با مراقبت از زمین و حیوانات، غذا و مواد اولیه تولید می‌کند'),
    challenge: JP('must manage weather, costs, welfare, productivity, and long-term soil health', 'باید آب‌وهوا، هزینه، رفاه دام، بهره‌وری و سلامت بلندمدت خاک را مدیریت کند')
  }
};
const JOB_LEVEL_META = {
  A1: { focus: 'جمله‌های کوتاه، عینی و مستقل', range: '۳۵ تا ۵۵ واژه' },
  A2: { focus: 'شرح سادهٔ کار روزانه با and، but و because', range: '۵۵ تا ۸۰ واژه' },
  B1: { focus: 'متن پیوسته و خطی با دلیل، ترتیب و تضاد ساده', range: '۹۰ تا ۱۲۰ واژه' },
  B2: { focus: 'شرح دقیق، رابطهٔ روشن ایده‌ها و یک مسئلهٔ حرفه‌ای', range: '۱۴۵ تا ۱۷۰ واژه' },
  C1: { focus: 'تحلیل منسجم، واژگان تخصصی و استدلال چندلایه', range: '۱۷۰ تا ۲۱۰ واژه' },
  C2: { focus: 'نثر دقیق و ظریف با ساختار استدلالی و معنای ضمنی', range: '۲۱۰ تا ۲۶۰ واژه' }
};

function jobLevelLesson(job, lv) {
  const p = JOB_FACTS[job.en] || JOB_FACTS.Doctor;
  const title = job.en.toLowerCase(), article = /^[aeiou]/i.test(title) ? 'An' : 'A';
  const t = p.tasks;
  let text = '', translation = '', extra = [];
  if (lv === 'A1') {
    text = `${article} ${title} works ${p.place.en}. They ${t[0].en} and ${t[1].en}. They use ${p.tools.en}. They need ${p.skill.en}. Their work ${p.outcome.en}.`;
    translation = `یک ${job.fa} ${p.place.fa} کار می‌کند. او ${t[0].fa} و ${t[1].fa}. برای کارش از ${p.tools.fa} استفاده می‌کند. این کار به ${p.skill.fa} نیاز دارد. کار او ${p.outcome.fa}.`;
  } else if (lv === 'A2') {
    text = `${article} ${title} usually works ${p.place.en}. During a normal day, they ${t[0].en}, ${t[1].en}, and ${t[2].en}. They use ${p.tools.en} because the work must be accurate. They often work with ${p.partners.en}. The job can be demanding, but it ${p.outcome.en}.`;
    translation = `یک ${job.fa} معمولاً ${p.place.fa} کار می‌کند. او در یک روز عادی ${t[0].fa}، ${t[1].fa} و ${t[2].fa}. از ${p.tools.fa} استفاده می‌کند، زیرا کار باید دقیق باشد. او اغلب با ${p.partners.fa} همکاری می‌کند. این شغل می‌تواند دشوار باشد، اما ${p.outcome.fa}.`;
    extra = [JP('a normal day', 'یک روز عادی'), JP('accurate', 'دقیق')];
  } else if (lv === 'B1') {
    text = `${article} ${title} has a varied working day ${p.place.en}. They often ${t[0].en} before they ${t[1].en}. They also ${t[2].en}. To do these tasks well, they use ${p.tools.en} and share information with ${p.partners.en}. The work requires ${p.skill.en} because even a small decision can affect other people. Although the job is often demanding, it ${p.outcome.en}. A common challenge is that they ${p.challenge.en}.`;
    translation = `یک ${job.fa} ${p.place.fa} روز کاری متنوعی دارد. او اغلب ${t[0].fa} و پس از آن ${t[1].fa}. او همچنین ${t[2].fa}. برای انجام درست این وظایف، از ${p.tools.fa} استفاده می‌کند و اطلاعات را با ${p.partners.fa} به اشتراک می‌گذارد. ${p.skill.fa} مهم است، زیرا حتی یک تصمیم کوچک می‌تواند بر دیگران اثر بگذارد. با اینکه کار اغلب دشوار است، ${p.outcome.fa}. یکی از چالش‌های معمول این است که او ${p.challenge.fa}.`;
    extra = [JP('a varied working day', 'یک روز کاری متنوع'), JP('share information', 'اطلاعات را به اشتراک گذاشتن'), JP('affect other people', 'بر دیگران اثر گذاشتن')];
  } else if (lv === 'B2') {
    text = `The work of ${article.toLowerCase()} ${title} involves more than completing a list of routine tasks. ${article} ${title} works ${p.place.en}, where they ${t[0].en}, ${t[1].en}, and ${t[2].en}. They use ${p.tools.en} to check their work, communicate findings, and reduce avoidable errors. However, tools do not replace ${p.skill.en}. Decisions are often made with ${p.partners.en}, so clear explanations and reliable records are essential. When priorities change, the professional has to decide what needs immediate attention and what can safely wait. The occupation matters because it ${p.outcome.en}. Its central challenge is that professionals ${p.challenge.en}. Effective practice therefore requires people to document their reasoning, communicate risks, and review outcomes instead of assuming that the first solution is final.`;
    translation = `کار یک ${job.fa} بیش از انجام فهرستی از وظایف تکراری است. او ${p.place.fa} کار می‌کند و ${t[0].fa}، ${t[1].fa} و ${t[2].fa}. برای بررسی کار، انتقال یافته‌ها و کاهش خطاهای قابل‌پیشگیری از ${p.tools.fa} استفاده می‌کند. بااین‌حال، ابزار جای ${p.skill.fa} را نمی‌گیرد. تصمیم‌ها اغلب با همکاری ${p.partners.fa} گرفته می‌شوند؛ بنابراین توضیح روشن و ثبت قابل‌اعتماد ضروری است. وقتی اولویت‌ها تغییر می‌کنند، فرد حرفه‌ای باید تشخیص دهد چه چیزی فوراً نیازمند توجه است و چه چیزی را می‌توان بدون خطر به تعویق انداخت. این حرفه مهم است، زیرا ${p.outcome.fa}. چالش اصلی آن این است که فرد حرفه‌ای ${p.challenge.fa}. در نتیجه، کار مؤثر به ثبت استدلال، توضیح خطرها و بازبینی نتیجه نیاز دارد، نه پذیرفتن نخستین راه‌حل به‌عنوان پاسخ نهایی.`;
    extra = [JP('routine tasks', 'وظایف تکراری'), JP('avoidable errors', 'خطاهای قابل‌پیشگیری'), JP('changing priorities', 'اولویت‌های متغیر'), JP('review outcomes', 'بازبینی نتیجه‌ها')];
  } else if (lv === 'C1') {
    text = `${article} ${title} is sometimes defined by visible tasks, yet the profession is better understood as a chain of informed decisions. While working ${p.place.en}, practitioners ${t[0].en}, ${t[1].en}, and ${t[2].en}; each activity depends on information that may be incomplete, time-sensitive, or open to interpretation. ${p.tools.en[0].toUpperCase() + p.tools.en.slice(1)} extend what professionals can observe and verify, but they cannot substitute for ${p.skill.en}.\n\nBecause the work ${p.outcome.en}, its consequences reach beyond the immediate task. Practitioners must communicate with ${p.partners.en}, distinguish evidence from assumption, and make their reasoning available for scrutiny. They also ${p.challenge.en}. This tension creates competing priorities rather than a single technical problem with an obvious answer. A capable ${title} therefore does more than follow procedure: they explain uncertainty, invite relevant challenge, keep an accountable record, and revise a decision when better evidence emerges. Professional quality lies in combining expertise with proportionate action, ethical awareness, and attention to long-term consequences.`;
    translation = `گاهی ${job.fa} را با وظایف قابل‌مشاهده‌اش تعریف می‌کنند، اما بهتر است این حرفه را زنجیره‌ای از تصمیم‌های آگاهانه بدانیم. یک ${job.fa} ${p.place.fa} ${t[0].fa}، ${t[1].fa} و ${t[2].fa}؛ هر فعالیت به اطلاعاتی وابسته است که ممکن است ناقص، زمان‌حساس یا قابل‌تفسیر باشد. ${p.tools.fa} توان مشاهده و راستی‌آزمایی را بیشتر می‌کند، اما نمی‌تواند جای ${p.skill.fa} را بگیرد.\n\nازآنجاکه این کار ${p.outcome.fa}، پیامدهایش از وظیفهٔ فوری فراتر می‌رود. متخصص باید با ${p.partners.fa} ارتباط برقرار کند، شواهد را از فرض جدا سازد و استدلال خود را برای بررسی در دسترس بگذارد. او همچنین ${p.challenge.fa}. این تنش چند اولویت رقیب می‌سازد، نه یک مسئلهٔ فنی با پاسخی آشکار. بنابراین یک ${job.fa} توانمند فقط از دستورالعمل پیروی نمی‌کند؛ عدم قطعیت را توضیح می‌دهد، نقد مرتبط را می‌شنود، تصمیم‌ها را به‌شکلی پاسخ‌گو ثبت می‌کند و با ظهور شواهد بهتر تصمیم را اصلاح می‌کند. کیفیت حرفه‌ای از ترکیب تخصص، اقدام متناسب، آگاهی اخلاقی و توجه به پیامدهای بلندمدت شکل می‌گیرد.`;
    extra = [JP('informed decisions', 'تصمیم‌های آگاهانه'), JP('open to interpretation', 'قابل‌تفسیر'), JP('distinguish evidence from assumption', 'جداکردن شواهد از فرض'), JP('competing priorities', 'اولویت‌های رقیب'), JP('long-term consequences', 'پیامدهای بلندمدت')];
  } else {
    text = `Reducing the work of ${article.toLowerCase()} ${title} to its most visible task obscures the judgement on which credible practice depends. The work takes place ${p.place.en}, where practitioners are expected to ${t[1].en}, ${t[2].en}, and justify choices to ${p.partners.en}. ${p.tools.en[0].toUpperCase() + p.tools.en.slice(1)} may sharpen perception and expose patterns, but they neither resolve ambiguity nor remove professional responsibility.\n\nThe central difficulty is not merely that practitioners ${p.challenge.en}. It is that every defensible choice privileges some values—speed, safety, access, quality, cost, or autonomy—while constraining others. Since the work ${p.outcome.en}, apparently local decisions can produce cumulative and sometimes unintended effects. Expertise therefore includes recognising when a familiar rule no longer fits, seeking countervailing evidence, and explaining why a proportionate response remains justified despite uncertainty.\n\nAt its best, the profession combines ${p.skill.en} with disciplined self-critique. A trustworthy ${title} makes assumptions explicit, records the basis of consequential decisions, invites scrutiny before certainty hardens into habit, and changes course without disguising the change as consistency. Such professional discretion is not freedom from standards; it is the accountable capacity to interpret standards under real institutional constraints. That distinction—between merely completing a task and remaining answerable for its wider effects—is what sustains public trust.`;
    translation = `فروکاستن کار ${job.fa} به آشکارترین وظیفهٔ آن، قضاوتی را پنهان می‌کند که اعتبار حرفه‌ای به آن وابسته است. این حرفه ${p.place.fa} انجام می‌شود؛ جایی که متخصص ${t[1].fa}، ${t[2].fa} و انتخاب‌های خود را برای ${p.partners.fa} توجیه می‌کند. ${p.tools.fa} می‌تواند ادراک را دقیق‌تر و الگوها را آشکار کند، اما نه ابهام را از میان می‌برد و نه مسئولیت حرفه‌ای را حذف می‌کند.\n\nدشواری اصلی فقط این نیست که متخصص ${p.challenge.fa}. مسئله این است که هر انتخاب دفاع‌پذیر به برخی ارزش‌ها—سرعت، ایمنی، دسترسی، کیفیت، هزینه یا استقلال—اولویت می‌دهد و ارزش‌های دیگر را محدود می‌کند. چون این کار ${p.outcome.fa}، تصمیم‌های ظاهراً محلی می‌توانند اثرهای انباشته و گاه ناخواسته داشته باشند. پس تخصص شامل تشخیص لحظه‌ای است که یک قاعدهٔ آشنا دیگر مناسب نیست، جست‌وجوی شواهد مخالف و توضیح این موضوع که چرا با وجود عدم قطعیت، یک واکنش متناسب همچنان موجه است.\n\nاین حرفه در بهترین حالت ${p.skill.fa} را با خودانتقادی منضبط ترکیب می‌کند. ${job.fa} قابل‌اعتماد فرض‌ها را آشکار می‌سازد، مبنای تصمیم‌های مهم را ثبت می‌کند، پیش از آنکه اطمینان به عادت تبدیل شود از بررسی دیگران استقبال می‌کند و بدون پنهان‌کردن تغییر، مسیر خود را اصلاح می‌کند. اختیار حرفه‌ای رهایی از استانداردها نیست؛ بلکه توان مسئولانهٔ تفسیر استانداردها در محدودیت‌های واقعی سازمانی است. همین تفاوت میان صرفاً انجام یک وظیفه و پاسخ‌گو ماندن در برابر اثرهای گسترده‌تر آن، اعتماد عمومی را حفظ می‌کند.`;
    extra = [JP('credible practice', 'عملکرد حرفه‌ای معتبر'), JP('professional responsibility', 'مسئولیت حرفه‌ای'), JP('countervailing evidence', 'شواهد مخالف'), JP('proportionate response', 'واکنش متناسب'), JP('professional discretion', 'اختیار حرفه‌ای'), JP('institutional constraints', 'محدودیت‌های سازمانی'), JP('public trust', 'اعتماد عمومی')];
  }
  const baseTerms = [JP(title, job.fa), p.tasks[0], p.tasks[1], p.tools, p.skill, p.challenge];
  const seen = {}, terms = baseTerms.concat(extra).filter(x => {
    const k = x.en.toLowerCase();
    if (seen[k] || text.toLowerCase().indexOf(k) < 0) return false;
    seen[k] = 1; return true;
  }).slice(0, lv === 'C2' ? 9 : 7);
  return { text, translation, terms, meta: JOB_LEVEL_META[lv] || JOB_LEVEL_META.A1 };
}

function highlightedJobParts(text, terms, colors) {
  const ranges = [];
  (terms || []).forEach((term, ti) => {
    const hay = text.toLowerCase(), needle = term.en.toLowerCase(); let at = 0;
    while (needle && (at = hay.indexOf(needle, at)) >= 0) { ranges.push({ start: at, end: at + needle.length, ti }); at += needle.length; }
  });
  ranges.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const picked = []; let end = -1;
  ranges.forEach(r => { if (r.start >= end) { picked.push(r); end = r.end; } });
  const parts = []; let pos = 0;
  picked.forEach(r => {
    if (r.start > pos) parts.push({ text: text.slice(pos, r.start), plain: true, important: false, style: '', n: '' });
    const color = colors[r.ti % colors.length];
    parts.push({ text: text.slice(r.start, r.end), plain: false, important: true,
      style: 'display:inline;padding:1px 4px;border-radius:5px;background:' + color + '24;border-bottom:1px solid ' + color + '99;color:#f5f5f8;box-decoration-break:clone;-webkit-box-decoration-break:clone', n: String(r.ti + 1) });
    pos = r.end;
  });
  if (pos < text.length) parts.push({ text: text.slice(pos), plain: true, important: false, style: '', n: '' });
  return parts;
}
// Word-list stages, measured rather than claimed: how many of these words the
// app's own grammar / sentence / listening / discussion material actually uses.
// Produced by tools/reorder.js — keep in step with data/stages.json.
const STAGES = { core: 777, periphery: 1866, total: 10524 };
// The three steps of a day's lesson, in order. Words supply the units,
// structure teaches how they combine, listening and speaking put them to use —
// you cannot build a sentence from words you have never met.
// What each word goes through, in order. Stage is the number of successful
// retrievals so far, so the list doubles as a progress report.
const WORD_LADDER = [
  { name: 'تازه دیده‌شده', desc: 'کارت واژه — می‌بینی، می‌شنوی، معنی را برمی‌گردانی', icon: 'ph ph-cards' },
  { name: 'شناخت', desc: 'چهارگزینه‌ای — معنی درست را از بین چهار گزینه پیدا می‌کنی', icon: 'ph ph-list-checks' },
  { name: 'از روی صدا', desc: 'شنیداری — فقط صدا را می‌شنوی و واژه را می‌نویسی', icon: 'ph ph-ear' },
  { name: 'تولید', desc: 'نوشتاری — از روی معنی فارسی، خودت انگلیسی را می‌نویسی', icon: 'ph ph-keyboard' },
  { name: 'بلد', desc: 'سه بار درست، در سه روز مختلف، یک بارش با نوشتن خودت', icon: 'ph ph-seal-check' }
];
// «درس امروز» — two slots, not three.
//
// The three-step day spent bounded content at the same rate as unbounded
// content: at one item a day the grammar course lasts 72 days, listening 20 and
// speaking 24, while the word list lasts about 1,500. Splitting the day 1:1:1
// drained the authored curricula in about three weeks per level. So: words
// every day, and ONE course item, drawn from all four authored curricula in
// rotation. Both the research review and the survey of shipped products landed
// here independently — an unbounded engine plus one finite course, never n
// parallel skill tracks.
const SB_MODE_FA = { pattern: 'الگو', chunk: 'تکه‌چینی', expand: 'بسط دادن', combine: 'ترکیب', free: 'نوشتن آزاد', game: 'بازی' };
const RUNNERS = ['study', 'quiz', 'result', 'add', 'exercise', 'game', 'sbrun', 'glesson', 'csrun', 'ltext', 'dses', 'placement'];
// The seven curricula, grouped by what the learner DOES — not by which data
// file backs them. Three groups is what makes the app describable in a sentence.
const HUBS = {
  words: { title: 'تمرین', icon: 'ph-fill ph-game-controller', color: '#e0a458', desc: 'تمرین‌های آزاد و بازی‌های سرعتی — بدون ترتیب، هر وقت خواستی.' }
};
// Module-level twins of the per-method helpers, for the hub and section cards.
const cardBtn = c => 'display:flex;align-items:center;gap:11px;padding:13px 13px;border-radius:12px;background:rgba(233,233,237,.03);border:1px solid ' + c + '3d;cursor:pointer;width:100%;text-align:right';
const iconSq = c => 'flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:' + c + '1f;border:1px solid ' + c + '44;color:' + c + ';font-size:18px';
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], PER_LEVEL = 5, MAX_NEW = 8, MAX_REVIEWS = 15;
const LEVEL_SHARE = [0.08, 0.11, 0.15, 0.19, 0.22, 0.25];
// LEG-002 — Level -> Unit -> Lesson curriculum position. This sits above the
// existing round/band system without changing LEVEL_SHARE or levelSpans():
// a "level" is still exactly the same LEVEL_SHARE band a round's band()
// already pointed at. LESSON_SIZE (8 new words/lesson) is an already-agreed
// product decision, not derived here. UNIT_LESSONS=10 (80 words/unit) is
// this task's own call: it lands close to a typical printed-coursebook unit
// (60-100 headwords) and keeps the unit count per level in a browsable
// range (11 units for A1's 842 words, up to 33 for C2's ~2,630) — a smaller
// N would multiply units without adding real structure, a much larger N
// would make "unit" nearly synonymous with "level" for A1.
const LESSON_SIZE = 8, UNIT_LESSONS = 10;
// LEG-015 — bumped whenever the taught word sequence changes shape enough that
// a stored {unit, lesson} cursor no longer names the same eight words. load()
// resets only the cursor when this differs from the saved value; vocab_sr_v1 is
// never touched, so nothing a learner actually learned is affected.
const CURRICULUM_V = 2;
// LEG-003 — same-session Initial Learning for brand-new words (see
// vocab_session_v1 below). A word gets exactly 3 turns this session, spread
// apart so it never repeats back-to-back: introduce (A) -> recognition MCQ
// en->fa (B) -> retrieval MCQ fa->en (C). Gaps are expanding (Karpicke &
// Roediger 2007) and jittered within a range, not fixed, so spacing never
// feels mechanical; the MIN/MAX pairs below bracket the "roughly 2-4 cards,
// then 4-7 cards" the product spec asked for, centered near 3 and 5.
const IL_GAP_B_MIN = 2, IL_GAP_B_MAX = 4;
const IL_GAP_C_MIN = 4, IL_GAP_C_MAX = 7;
// A wrong Turn B/C answer never shows "دوباره" (LEG-001's pattern stays
// removed here) — it silently re-queues the same turn a few cards later.
const IL_RETRY_GAP_MIN = 3, IL_RETRY_GAP_MAX = 5;
// Wrong on the same turn this many times in one session -> stop retrying and
// mark the word 'unfinished' for this lesson (see ilAdvance()).
const IL_MAX_FAILS = 3;
// Same safety valve for the grammar/collocation drill's retry-to-criterion
// (csNext()): without a cap, a learner with a genuine, persistent
// misconception about one item would requeue it forever with no way out —
// the exact "one stuck item blocks everything downstream" trap LEG-034
// found and fixed for vocabulary, just reintroduced in a different engine.
const CS_MAX_RETRY = 3;
function levelSpans(total) {
  const out = []; let acc = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const n = i === LEVELS.length - 1 ? total - acc : Math.round(total * LEVEL_SHARE[i]);
    out.push([acc, Math.max(0, n)]); acc += n;
  }
  return out;
}
// Calendar boundaries must follow the learner's local day, not UTC. Around
// midnight in Iran the old ISO date could put answers on the wrong day.
const today = () => {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
const currentDayNo = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffled(arr, seed) { const r = mulberry(seed), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
const norm = s => (s || '').toLowerCase().trim().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ');
// Search is forgiving about Persian/Arabic keyboard variants, half-spaces,
// punctuation and accents while leaving the original display text untouched.
const searchNorm = s => (s || '').normalize('NFKC').toLowerCase()
  .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064b-\u065f\u0670]/g, '')
  .replace(/[\u200c\u200d'’`\-ـ]/g, '').replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();

class Component extends DCLogic {
  constructor(p) {
    super(p);
    this.BASE = (typeof window !== 'undefined' && window.VOCAB_WORDS) || [];
    this.CATS = (typeof window !== 'undefined' && window.VOCAB_CATS) || {};
    this.ORDER = (typeof window !== 'undefined' && window.VOCAB_ORDER) || null;
    // LEG-015 — the taught CEFR curriculum (see levelWords()). Kept on the
    // instance as well as read from window, so the late-arriving-data path
    // below can refresh it without every caller reaching for a global.
    this.LEVELWORDS = (typeof window !== 'undefined' && window.VOCAB_LEVELS) || null;
    this.custom = [];
    try { this.custom = JSON.parse(localStorage.getItem('vocab_custom') || '[]'); } catch (e) {}
    this.over = {};
    try { this.over = JSON.parse(localStorage.getItem('vocab_overrides') || '{}'); } catch (e) {}
    this.mySent = {};
    try { this.mySent = JSON.parse(localStorage.getItem('vocab_mysent') || '{}'); } catch (e) {}
    this.myCats = [];
    try { this.myCats = JSON.parse(localStorage.getItem('vocab_mycats') || '[]'); } catch (e) {}
    this.catOver = {};
    try { this.catOver = JSON.parse(localStorage.getItem('vocab_catover') || '{}'); } catch (e) {}
    this.faMap = {};
    try { this.faMap = JSON.parse(localStorage.getItem('vocab_famap') || '{}'); } catch (e) {}
        this.rebuildW();
    const W = this.W;
    this.state = {
      screen: 'home', data: this.load(W.length), settingsFrom: 'home', job: null, jobLevel: 'A1',
      nEn: '', nFa: '', nEx: '', nCat: 'general', nErr: '', nBusy: false, nReview: null,
      editEn: null, editVal: '', msText: '', msBusy: false, msErr: '', msOpen: false,
      catFilter: 'all', catPickEn: null, addingCat: false, newCatName: '', dictToolsOpen: false, wordMoreEn: null, practiceLv: 'A1',
      showBack: false, picked: null, typed: '', checked: false, correct: null,
      options: [], quiz: null, result: null, query: '', dictSort: 'course', dictTrBusy: false, dictTrResult: null, dictTrErr: '', limit: 60, confirmReset: false, tick: 0, ex: null, game: null,
      gpText: '', gpBusy: false, gpErr: '', gpResult: null, gFlowNote: '',
      placement: null
    };
    this.sentCache = {};
    try { this.sentCache = JSON.parse(localStorage.getItem('vocab_sentences') || '{}'); } catch (e) {}
    this.fetching = false;
  }

  // ---- local backup ----
  collectBackup() {
    const dump = {};
    BACKUP_KEYS.forEach(k => {
      let value = null;
      try { value = localStorage.getItem(k); } catch (e) {}
      if (value == null && k === KEY && this.state && this.state.data) value = JSON.stringify(this.state.data);
      if (value == null) value = (k === 'vocab_custom' || k === 'vocab_mycats') ? '[]' : '{}';
      dump[k] = value;
    });
    return dump;
  }
  validateBackup(dump, requireComplete) {
    if (!dump || typeof dump !== 'object' || Array.isArray(dump)) throw new Error('ساختار فایل پشتیبان معتبر نیست.');
    const unknown = Object.keys(dump).filter(k => BACKUP_KEYS.indexOf(k) < 0);
    if (unknown.length) throw new Error('فایل پشتیبان شامل دادهٔ ناشناخته است.');
    const clean = {}, arrays = new Set(['vocab_custom', 'vocab_mycats']);
    let found = 0, bytes = 0;
    BACKUP_KEYS.forEach(k => {
      if (!Object.prototype.hasOwnProperty.call(dump, k)) {
        if (requireComplete) throw new Error('فایل پشتیبان کامل نیست؛ دادهٔ «' + k + '» وجود ندارد.');
        return;
      }
      found++;
      if (typeof dump[k] !== 'string') throw new Error('دادهٔ «' + k + '» معتبر نیست.');
      bytes += dump[k].length;
      if (bytes > 8 * 1024 * 1024) throw new Error('حجم فایل پشتیبان بیش از حد مجاز است.');
      let parsed;
      try { parsed = JSON.parse(dump[k]); } catch (e) { throw new Error('دادهٔ «' + k + '» خراب است.'); }
      if (arrays.has(k)) {
        if (!Array.isArray(parsed)) throw new Error('دادهٔ «' + k + '» باید فهرست باشد.');
      } else if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('دادهٔ «' + k + '» باید یک شیء باشد.');
      }
      clean[k] = dump[k];
    });
    if (!found) throw new Error('این فایل هیچ دادهٔ قابل‌بازیابی ندارد.');
    if (Object.prototype.hasOwnProperty.call(clean, KEY)) {
      let core;
      try { core = JSON.parse(clean[KEY]); } catch (e) {}
      const integer = (value, min) => typeof value === 'number' && Number.isInteger(value) && value >= min;
      const orderOk = core && Array.isArray(core.order) && core.order.every(value => integer(value, 0)) &&
        new Set(core.order).size === core.order.length;
      if (!core || !orderOk || !integer(core.round, 1) || !integer(core.pos, 0) ||
          core.pos > core.order.length || !integer(core.seen, 0)) {
        throw new Error('دادهٔ اصلی پیشرفت معتبر نیست.');
      }
    } else if (requireComplete) throw new Error('دادهٔ اصلی پیشرفت در فایل وجود ندارد.');
    return clean;
  }
  normalizeLegacyBackup(dump) {
    const sparse = this.validateBackup(dump, false);
    if (!Object.prototype.hasOwnProperty.call(sparse, KEY)) throw new Error('نسخهٔ قدیمی، دادهٔ اصلی پیشرفت را ندارد.');
    const complete = {};
    BACKUP_KEYS.forEach(k => { complete[k] = (k === 'vocab_custom' || k === 'vocab_mycats') ? '[]' : '{}'; });
    Object.keys(sparse).forEach(k => { complete[k] = sparse[k]; });
    return this.validateBackup(complete, true);
  }
  reloadStoredModels() {
    const P = (k, dflt) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : dflt; } catch (e) { return dflt; } };
    this.custom = P('vocab_custom', []);
    this.over = P('vocab_overrides', {});
    this.mySent = P('vocab_mysent', {});
    this.myCats = P('vocab_mycats', []);
    this.catOver = P('vocab_catover', {});
    this.faMap = P('vocab_famap', {});
    this.sentCache = P('vocab_sentences', {});
    this._sr = null;
    this.rebuildW();
  }
  applyBackup(dump) {
    const clean = this.validateBackup(dump, true);
    const before = {};
    BACKUP_KEYS.forEach(k => {
      try { const value = localStorage.getItem(k); if (value != null) before[k] = value; } catch (e) {}
    });
    try {
      BACKUP_KEYS.forEach(k => {
        if (Object.prototype.hasOwnProperty.call(clean, k)) localStorage.setItem(k, clean[k]);
        else localStorage.removeItem(k);
      });
    } catch (err) {
      let rollbackOk = true;
      try {
        BACKUP_KEYS.forEach(k => {
          if (Object.prototype.hasOwnProperty.call(before, k)) localStorage.setItem(k, before[k]);
          else localStorage.removeItem(k);
        });
      } catch (rollbackErr) { rollbackOk = false; }
      if (!rollbackOk) throw new Error('بازیابی به‌علت کمبود فضای مرورگر متوقف شد و بازگردانی کامل دادهٔ قبلی تأیید نشد؛ صفحه را نبند و یک فایل پشتیبان بگیر.');
      throw new Error('فضای ذخیره‌سازی مرورگر کافی نیست؛ دادهٔ قبلی نگه داشته شد.');
    }
    this.reloadStoredModels();
    const data = this.load(this.W.length);
    if (this._mounted) this.setState({ data: data, screen: 'home', confirmReset: false });
    return clean;
  }
  exportBackup() {
    const wrapped = { kind: LOCAL_BACKUP_KIND, schema: 2, createdAt: new Date().toISOString(), data: this.collectBackup() };
    const blob = new Blob([JSON.stringify(wrapped)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'vocab-backup.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  importBackupFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const raw = JSON.parse(r.result);
        let dump;
        if (raw && raw.kind === LOCAL_BACKUP_KIND && raw.schema === 2) {
          dump = this.validateBackup(raw.data, true);
        } else {
          const legacy = this.validateBackup(raw, false);
          dump = Object.assign({}, this.collectBackup(), legacy);
          this.validateBackup(dump, true);
        }
        this.applyBackup(dump);
        alert('بازیابی فایل پشتیبان انجام شد.');
      } catch (err) { alert(err && err.message ? err.message : 'فایل پشتیبان معتبر نیست.'); }
    };
    r.readAsText(f); e.target.value = '';
  }
  // ---- cross-section resume ----
  // The app stores progress for six sections in six keys and can therefore
  // already answer "where was I?" — it just never asked. vocab_ui_v1 is
  // additive: no existing key is renamed, re-scoped, or read differently.
  uiLoad() { try { return JSON.parse(localStorage.getItem('vocab_ui_v1') || '{}') || {}; } catch (e) { return {}; } }
  remember(screen, label, sub) {
    const u = this.uiLoad();
    u.seen = true;
    u.last = { screen: screen, label: label, sub: sub || '' };
    try { localStorage.setItem('vocab_ui_v1', JSON.stringify(u)); } catch (e) {}
  }
  resumeGo(last) {
    const go = {
      study: () => this.setState({ screen: 'study' }, () => this.prepare()),
      browse: () => this.setState({ screen: 'browse', limit: 60 }),
      sent: () => this.goSent(), sbrun: () => this.goSent(),
      gram: () => this.goGram(), glesson: () => this.goGram(), csrun: () => this.goGram(),
      colloc: () => this.goColloc(),
      listen: () => this.goListen(), ltext: () => this.goListen(),
      disc: () => this.goDisc(), dses: () => this.goDisc()
    }[last && last.screen];
    return go || (() => this.setState({ screen: 'words' }));
  }

  // The cards inside a section hub. Each carries a "meta" line saying where the
  // learner stands, drawn from progress the app already stores per section.
  // ---- the course level ----
  // One level for the four authored curricula. Absent for an existing learner,
  // who therefore opens exactly where they open today.
  courseLv() {
    const u = this.uiLoad();
    return u.lv || this.levelOf(((this.state && this.state.data) || this.load()).round || 1);
  }

  // ---- the five tracks ----
  // Each advances one item at a time, at the learner's pace. Nothing is keyed
  // to the calendar; a track's position is simply how much of it is done.
  gramItems() {
    const out = [];
    LEVELS.forEach(lv => this.gramLessons(lv).forEach(les => out.push({ lv: lv, les: les })));
    return out;
  }
  // Writing opens as grammar advances: one writing exercise per grammar lesson
  // completed, so you always write with a structure you have just studied.
  writeItems() {
    const out = [];
    LEVELS.forEach(lv => {
      out.push({ lv: lv, mode: 'combine', label: 'ترکیب جمله · ' + lv });
      out.push({ lv: lv, mode: 'free', label: 'نوشتن آزاد · ' + lv });
    });
    return out;
  }
  gramModes(les) {
    // 'learn' comes first (the rule/example/pitfall reading a lesson used to
    // show permanently alongside four drill buttons, now gated as its own
    // step) and 'choose' moved LAST. Per the grammar teaching-method
    // research: 'choose' is a 4-option discrimination task between
    // confusable forms, which is the END state of knowing a form, not the
    // entry point — the old first-position ordering put the hardest task
    // first and mislabelled it "quick assessment".
    // 'input' comes right after 'learn': structured input (VanPatten &
    // Oikkenon — the gains in processing instruction come from the input
    // activity, not the explanation itself) forces the learner to actually
    // process the form to get a sentence's MEANING, before ever being asked
    // to produce it. See gramBuildInputItems() for how its items are built
    // from data that already exists (ex sentences + a contrast lesson or,
    // failing that, this lesson's own pitfalls) — no new authored content.
    return ['learn', 'input', 'fill', 'order', 'err', 'choose'].filter(m => {
      if (m === 'learn' || m === 'input') return (les.ex || []).length > 0;
      const key = m === 'err' ? 'err' : m;
      return (les[key] || []).length > 0;
    });
  }
  gramProduction(les) {
    const p = this.csLoad(); return ((p.gp || {})[les.id]) || null;
  }
  gramStats(les) {
    const modes = this.gramModes(les);
    const drills = modes.map(m => ({ mode: m, score: this.csRecent('g_' + les.id + '_' + m) }));
    const prod = this.gramProduction(les);
    const steps = drills.concat([{ mode: 'produce', score: prod && typeof prod.score === 'number' ? prod.score : null }]);
    // Gate on FINISHING a step, not on a percentage. csNext() below now
    // retries a wrong item in place until it is answered correctly instead
    // of letting the drill end with it still wrong — so a completed step
    // already means every item was eventually right at least once, and
    // `score` is purely informational (first-attempt accuracy), never a
    // pass/fail bar. The old ">= 70" cutoff swung between 60% and 100% real
    // pass rate depending on whether a step had 3 items or 5 (product-owner
    // finding, 2026-08-18) — completion is the only threshold that is the
    // same for every step regardless of item count.
    const passed = steps.filter(x => x.score != null).length;
    const attempted = passed;
    const vals = steps.filter(x => x.score != null).map(x => x.score);
    return { steps, total: steps.length, passed, attempted, complete: passed === steps.length,
      avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
      next: steps.find(x => x.score == null) || null };
  }
  gramDoneCount() { return this.gramItems().filter(x => this.gramStats(x.les).complete).length; }
  gramStartedCount() { return this.gramItems().filter(x => this.gramStats(x.les).attempted > 0).length; }
  writeDone(it) { return this.sbLoad()[it.lv + '_' + it.mode] != null; }

  tracks() {
    const srn = this.srCounts();
    const d = this.state && this.state.data;
    const qs = this.queueStats(d, this.W.length);
    const gi = this.gramItems();
    const gDone = this.gramDoneCount();
    const gStarted = this.gramStartedCount();
    // Prefer the first incomplete lesson AT the placed level or above, so a
    // placement result actually moves the "next" suggestion — otherwise this
    // always resolves to lesson one of A1 for anyone who hasn't touched
    // grammar yet, no matter what level they were placed into. Lower levels
    // remain visitable (gramLevelUnlocked), just not the default landing spot.
    // LEG-008 — use state.gLv (the grammar-specific level LEG-007 split out
    // from vocabulary), not d.round's vocab band: a learner placed at strong
    // vocab but weaker grammar would otherwise have this "continue" shortcut
    // push them into grammar lessons matched to their vocab level, silently
    // undoing the whole point of the split. Only fall back to the vocab band
    // when gLv was never set at all (a learner who hasn't touched placement
    // or grammar yet), matching the original pre-split behaviour for that case.
    const gBand = Math.max(0, LEVELS.indexOf(this.state.gLv || this.levelOf((d && d.round) || 1)));
    const gNext = gi.find(x => !this.gramStats(x.les).complete && LEVELS.indexOf(x.lv) >= gBand)
      || gi.find(x => !this.gramStats(x.les).complete);
    const wi = this.writeItems();
    // Keep previously unlocked writing available.  Grammar completion is now
    // stricter (all stages, not merely an attempted quiz), so using “started”
    // here avoids taking access away from existing learners.
    const unlocked = Math.min(wi.length, gStarted);
    const wDone = wi.filter(x => this.writeDone(x)).length;
    const wNext = wi.slice(0, unlocked).find(x => !this.writeDone(x));
    const groups = this.cGroups() || [];
    const cDone = groups.filter(g => this.csScore('c_' + g.key + '_choose') != null).length;
    const cNext = groups.find(g => this.csScore('c_' + g.key + '_choose') == null);

    return [
      { key: 'words', label: 'واژه‌ها', icon: 'ph-fill ph-cards', color: '#9184d9',
        // This bar is course coverage, so it moves the moment a word is first
        // studied. “Known” remains the stricter, separately labelled metric.
        // Target scales with progress the same way stageLabel/coverageTarget
        // do below — a fixed STAGES.core (777) pins the bar at 100% forever
        // for anyone who clears it in one placement-test bulk-write.
        done: srn.introduced, total: srn.introduced < STAGES.core ? STAGES.core : (srn.introduced < STAGES.periphery ? STAGES.periphery : STAGES.total),
        sub: srn.introduced + ' آشناشده · ' + srn.learning + ' در حال یادگیری · ' + srn.known + ' بلد',
        next: qs.due || qs.fresh ? 'دیدن فهرست درس‌ها' : 'مرورهای امروز تمام شده',
        // LEG-009 — vocabulary now opens on the lesson browser, not straight
        // into a continuous study queue; the learner picks a lesson there
        // and "شروع تمرین" is what actually starts a session (startLessonPractice()).
        go: () => this.setState({ screen: 'lessons' }) },

      { key: 'gram', label: 'دستور زبان', icon: 'ph-fill ph-book-open-text', color: '#b3a9e6',
        done: gDone, total: gi.length,
        sub: gDone + ' درس مسلط · ' + gStarted + ' شروع‌شده از ' + gi.length,
        next: gNext ? gNext.les.t : 'همه‌ی درس‌ها تمام شد',
        go: () => this.goGram(gNext ? gNext.lv : undefined) },

      { key: 'write', label: 'نوشتن', icon: 'ph-fill ph-pen-nib', color: '#8fc7a0',
        done: wDone, total: wi.length,
        sub: unlocked ? wDone + ' تمرین از ' + unlocked + ' تمرین باز' : 'با تمام‌کردن اولین درس دستور زبان باز می‌شود',
        next: wNext ? wNext.label : (unlocked ? 'همه‌ی تمرین‌های باز تمام شد' : 'هنوز باز نشده'),
        locked: !unlocked,
        go: () => this.goSent(wNext ? wNext.lv : undefined) },

      { key: 'colloc', label: 'ترکیب‌های رایج', icon: 'ph-fill ph-link-simple', color: '#8fd9c1',
        done: cDone, total: groups.length,
        sub: cDone + ' گروه از ' + groups.length,
        next: cNext ? cNext.label : 'همه‌ی گروه‌ها تمام شد',
        go: () => cNext
          ? this.setState({ screen: 'colloc', cgKey: cNext.key, cs: null })
          : this.goColloc() },

      { key: 'skills', label: 'شنیدن و گفتن', icon: 'ph-fill ph-headphones', color: '#e0879e',
        done: Object.keys((this.lsProg().r) || {}).length + Object.keys(this.dcProg()).length,
        total: this.lsAll().length + this.dcSessions().length,
        sub: 'متن‌های شنیداری و جلسه‌های گفت‌وگو',
        next: 'ادامه',
        go: () => this.goListen() }
    ];
  }

  // ---- spaced repetition ----
  // vocab_sr_v1 — additive array schema:
  // [successes, firstDay, lastDay, modeMask, introduced, phase, dueDay, ease, manualKnown]
  // The first four positions stay intact, so old backups remain compatible.
  // modeMask bits: 1 mcq, 2 type/cloze, 4 listen, 8 introduction.
  srLoad() {
    if (!this._sr) {
      try { this._sr = JSON.parse(localStorage.getItem('vocab_sr_v1') || '{}') || {}; } catch (e) { this._sr = {}; }
      let changed = false;
      for (const k in this._sr) {
        const r = this._sr[k]; if (!Array.isArray(r)) continue;
        const gap = [1, 1, 3, 7, 21, 60][Math.min(Number(r[0]) || 0, 5)];
        if (r[4] == null) { r[4] = (Number(r[0]) || 0) > 0 ? 1 : 0; changed = true; }
        if (r[5] == null) { r[5] = r[4] ? Math.min(4, Math.max(1, Number(r[0]) || 1)) : 0; changed = true; }
        if (r[6] == null) { r[6] = (Number(r[2]) || currentDayNo()) + gap; changed = true; }
        if (r[7] == null) { r[7] = 1; changed = true; }
        if (r[8] == null) { r[8] = 0; changed = true; }
      }
      if (changed) this.srSave();
    }
    return this._sr;
  }
  srSave() { try { localStorage.setItem('vocab_sr_v1', JSON.stringify(this._sr || {})); } catch (e) {} }
  srRec(i) { return this.srLoad()[i] || null; }
  srStage(i) { const r = this.srRec(i); return r ? (r[5] || 0) : 0; }
  // Cepeda 2008: the gap should scale with the retention horizon. Karpicke &
  // Roediger 2007: expand gently, then flatten — equal spacing wins long-term.
  srDue(i, day) {
    const r = this.srRec(i);
    if (!r || !r[4]) return false;
    return day >= (r[6] == null ? r[2] : r[6]);
  }
  srIntroduce(i, rating) {
    const day = currentDayNo(), sr = this.srLoad(), r = sr[i] || [0, 0, 0, 0, 0, 0, day, 1];
    r[4] = 1; r[5] = 1; r[3] = r[3] | 8;
    // Introduction itself is not a test. It becomes eligible for retrieval in
    // the next queue; “again” also repeats it later in this session.
    r[6] = day;
    r[7] = rating === 1 ? .9 : (rating === 3 ? 1.1 : 1);
    sr[i] = r; this.srSave();
  }
  // The actual scoring math (base_gap/ease table), factored out of srMark()
  // unchanged so LEG-003's srCompleteInitialLearning() below can apply it
  // twice in one day without duplicating — or drifting from — this logic.
  _srApplyOutcome(r, ok, mode, rating, day) {
    const MASK = { mcq: 1, type: 2, cloze: 2, listen: 4, flash: 8 };
    if (ok) {
      r[0] = r[0] + 1; r[5] = Math.min(4, Math.max(1, r[5] || 1) + 1);
      r[3] = r[3] | (MASK[mode] || 0);
      const base = [1, 1, 3, 7, 21, 60][Math.min(r[0], 5)];
      const mult = rating === 1 ? .65 : (rating === 3 ? 1.7 : 1);
      r[7] = Math.max(.75, Math.min(1.8, (r[7] || 1) + (rating === 3 ? .08 : (rating === 1 ? -.08 : .02))));
      r[6] = day + Math.max(1, Math.round(base * mult * r[7]));
    } else {
      r[0] = Math.max(0, r[0] - 1); r[5] = Math.max(1, (r[5] || 1) - 1);
      r[7] = Math.max(.75, (r[7] || 1) - .12); r[6] = day + 1;
    }
    if (!r[1]) r[1] = day;
    r[2] = day; r[4] = 1;
  }
  // Only a word's FIRST answer of the day counts. The in-session re-show after
  // a wrong answer must never advance the criterion, or the count inflates.
  srMark(i, ok, mode, rating) {
    const day = currentDayNo();
    const sr = this.srLoad();
    const r = sr[i] || [0, 0, 0, 0, 1, 1, day, 1];
    if (r[2] === day) return false;
    this._srApplyOutcome(r, ok, mode, rating, day);
    sr[i] = r;
    this.srSave();
    return true;
  }
  // LEG-003 — the one place Initial Learning writes to vocab_sr_v1: a word
  // enters long-term SRS only once, the moment its Turn C (retrieval) really
  // succeeds. Turn A/B never call this. srIntroduce() seeds the record, then
  // _srApplyOutcome() (srMark()'s own math, unchanged) is applied twice back
  // to back — Turn B's recognition pass, then Turn C's retrieval pass — as
  // this word's real first two SRS data points, bypassing srMark()'s "one
  // advance per day" guard on purpose, since both legitimately happened
  // today in the same session.
  srCompleteInitialLearning(i) {
    const day = currentDayNo();
    this.srIntroduce(i, 2);
    const sr = this.srLoad();
    const r = sr[i];
    this._srApplyOutcome(r, true, 'mcq', 2, day); // Turn B: en->fa recognition
    this._srApplyOutcome(r, true, 'mcq', 2, day); // Turn C: fa->en retrieval
    sr[i] = r;
    this.srSave();
  }
  // LEG-011 — placement's "everything below the placed level is already
  // done" bulk step. Same real Initial-Learning-completion path as
  // srCompleteInitialLearning() above (introduce, rating 2, then two
  // successful outcome applications standing in for Turn B/C) — reused
  // exactly, field for field, per D-012 ("a mastered word is never
  // permanently removed from review, only spaced further out"), so a
  // bulk-skipped word gets the same real successes=2/dueDay a normally
  // learned word gets and comes back into rotation on the same schedule if
  // placement was wrong about it. The only difference from calling
  // srCompleteInitialLearning() once per word is batching: this can be
  // 1,000+ words for one placement, so it builds the whole vocab_sr_v1
  // object in memory and calls srSave() once at the end instead of once per
  // word (srIntroduce()'s own per-word save is deliberately not reused here
  // for that reason — its record-seeding logic is inlined instead).
  srBulkCompleteInitialLearning(indices) {
    const day = currentDayNo(), sr = this.srLoad();
    indices.forEach(i => {
      const r = sr[i] || [0, 0, 0, 0, 0, 0, day, 1];
      r[4] = 1; r[5] = 1; r[3] = r[3] | 8; r[6] = day; r[7] = 1; // srIntroduce(i, 2), inlined
      this._srApplyOutcome(r, true, 'mcq', 2, day); // Turn B: en->fa recognition
      this._srApplyOutcome(r, true, 'mcq', 2, day); // Turn C: fa->en retrieval
      sr[i] = r;
    });
    this.srSave();
  }
  // All word indices in every level strictly below `vocabLevel`, in
  // canonical lesson order — built the same way lessonBrowserVals() walks a
  // level (unitsInLevel -> lessonsInUnit -> lessonWordsOf, all LEG-002,
  // untouched) so this sees exactly the same lessons the lesson browser
  // will later mark complete.
  wordsBelowLevel(vocabLevel) {
    const out = [];
    for (let li = 0; li < LEVELS.indexOf(vocabLevel); li++) {
      const L = LEVELS[li];
      for (let u = 1; u <= this.unitsInLevel(L); u++) {
        for (let les = 1; les <= this.lessonsInUnit(L, u); les++) {
          out.push.apply(out, this.lessonWordsOf(L, u, les));
        }
      }
    }
    return out;
  }
  // «بلد»: three correct answers, on three different days, at least one of them
  // produced by the learner, and at least a week between the first and the last.
  srKnown(i) {
    const r = this.srRec(i);
    return !!r && (r[8] === 1 || (r[0] >= 3 && (r[3] & 6) !== 0 && (r[2] - r[1]) >= 7));
  }
  // __seeded is a marker, not a word — skip anything that is not a record.
  srCounts() {
    const sr = this.srLoad();
    let known = 0, learning = 0, introduced = 0, due = 0;
    const phases = [0, 0, 0, 0, 0];
    const day = currentDayNo();
    for (const k in sr) {
      const r = sr[k];
      if (!Array.isArray(r) || !r[4]) continue;
      introduced++;
      const isKnown = this.srKnown(k);
      // Phase 4 is a maintenance mode, not proof of mastery by itself. Until
      // the multi-day criterion is met, keep it in the production bucket.
      const phase = isKnown ? 4 : Math.min(3, Math.max(0, Number(r[5]) || 0));
      phases[phase]++;
      if (isKnown) known++; else learning++;
      if (this.srDue(k, day)) due++;
    }
    return { known: known, learning: learning, introduced: introduced, due: due, phases: phases };
  }
  // One-time reinterpretation of the old counter. mastered[] recorded a single
  // correct answer in any mode, so it cannot be trusted as «بلد» — but it is
  // real history and nobody's number should drop to zero.
  srSeed(d) {
    const sr = this.srLoad();
    if (sr.__seeded) return;
    const day = currentDayNo();
    Object.keys(d.mastered || {}).forEach(k => {
      if (sr[k]) return;
      const n = d.mastered[k] >= 3 ? 2 : 1;
      sr[k] = [n, day, day - 1, 1, 1, Math.min(4, n), day, 1];
    });
    sr.__seeded = 1;
    this._sr = sr;
    this.srSave();
  }

  // ---- Initial Learning — session-scoped, separate from vocab_sr_v1 (LEG-003) ----
  // vocab_session_v1 = { day, words: { <wordIndex>: { turn: 'A'|'B'|'C'|'done'|'unfinished', fails } } }
  // Deliberately its own key: vocab_sr_v1 is long-term SRS truth and
  // vocab_app_v1 is session position/stats, neither should carry a value
  // that is only meaningful for "today" and is fine to discard on a new day.
  ilLoad() {
    if (!this._il) {
      let raw = null;
      try { raw = JSON.parse(localStorage.getItem('vocab_session_v1') || 'null'); } catch (e) { raw = null; }
      const day = currentDayNo();
      this._il = (raw && raw.day === day && raw.words) ? raw : { day: day, words: {} };
    }
    return this._il;
  }
  ilSave() { try { localStorage.setItem('vocab_session_v1', JSON.stringify(this._il || { day: currentDayNo(), words: {} })); } catch (e) {} }
  // Which Initial-Learning turn (if any) is currently active for word i.
  // null once the word finished (turn 'done', already in vocab_sr_v1) or was
  // abandoned this session (turn 'unfinished') — modeFor() then falls back
  // to the normal SRS-phase ladder untouched.
  ilTurnFor(i) {
    const rec = this.ilLoad().words[i];
    if (!rec || rec.turn === 'done' || rec.turn === 'unfinished') return null;
    return rec.turn;
  }
  // Any word introduced this session whose 3-turn sequence has not yet
  // finished (or failed out). Used only to delay the "goal reached" screen
  // (point 2) so a word's Turn B/C is never silently abandoned mid-sequence —
  // never to change srMark()/srDue() themselves.
  ilHasPending() {
    const words = this.ilLoad().words || {};
    return Object.keys(words).some(k => {
      const t = words[k].turn;
      return t === 'A' || t === 'B' || t === 'C';
    });
  }
  // Insert word i's next turn `min`-`max` cards ahead of the card just
  // answered, clamped to the current queue length — the exact same "requeue
  // a few cards later" pattern advance() already used for a wrong review
  // answer, just with a wider/jittered gap so the same word never comes back
  // adjacent, or even close, to its previous turn.
  ilSchedule(d, i, min, max) {
    const span = Math.max(0, max - min);
    const gap = min + (span ? Math.floor(mulberry(i * 2654435761 + d.pos)() * (span + 1)) : 0);
    const at = Math.min(d.pos + gap, d.order.length);
    d.order = d.order.slice(0, at).concat([i], d.order.slice(at));
  }

  hubCards(screen) {
    if (screen !== 'words') return [];
    const mk = (label, desc, meta, icon, color, go) => ({ label, desc, meta, icon, style: cardBtn(color), iconStyle: iconSq(color), go });
    const g = this.gameLoad();
    const lv = this.state.practiceLv || 'A1';
    const learnedGrammar = this.gramItems().filter(x => x.lv === lv && this.gramStats(x.les).passed > 0);
    // Everything that is practice rather than progression, in one place. None
    // of it advances a track; it is the lane you use when you want to drill.
    return [
      mk('بازی جفت‌سازی', 'واژه و معنی را سریع جفت کن', 'سطح ' + lv + ' · رکورد: ' + (g.best || 0), 'ph-fill ph-cards', '#e0a458', () => this.startGame('all', lv)),
      mk('مرور دستور زبان', learnedGrammar.length ? 'درس‌های گذرانده‌شدهٔ این سطح را دوباره تمرین کن' : 'بعد از گذراندن اولین مرحلهٔ این سطح، درس برای مرور ظاهر می‌شود', 'سطح ' + lv + ' · ' + learnedGrammar.length + ' درس در دسترس', 'ph-fill ph-books', '#b3a9e6', () => this.goGramReview(lv)),
      mk('بازی ترکیب‌ها', 'مسابقه‌ی سرعت روی ترکیب‌های رایج این سطح', 'سطح ' + lv + ' · رکورد: ' + this.csBest('c_game_' + lv), 'ph-fill ph-link-simple', '#8fd9c1', () => this.cGame(lv)),
      mk('بازی جمله‌سازی', 'تکه‌های جمله‌های این سطح را سر جایشان بگذار', 'سطح ' + lv + ' · رکورد: ' + ((this.sbLoad().gameBest) || 0), 'ph-fill ph-text-aa', '#84c5d9', () => this.sbGameStart(lv))
    ];
  }
  allCatKeys() { return Object.keys(this.CATS).concat(this.myCats.map(c => c.key)); }
  catMeta(k) { if (this.CATS[k]) return this.CATS[k]; const c = this.myCats.find(x => x.key === k); return c ? ['Folder', c.color] : (this.CATS.general || ['Cube', '#a0a0b4']); }
  catLabel(k) {
    const builtIn = this.CATS[k];
    return (builtIn && builtIn[2]) || ((this.myCats.find(x => x.key === k) || {}).label) || ((this.CATS.general || [])[2]) || 'عمومی';
  }
  setCat(en, k) {
    this.catOver[en] = k;
    try { localStorage.setItem('vocab_catover', JSON.stringify(this.catOver)); } catch (e) {}
    this.rebuildW();
    this.setState({ catPickEn: null });
  }
  addCategory() {
    const label = (this.state.newCatName || '').trim();
    if (!label) return;
    if (this.myCats.some(c => c.label === label) || Object.values(this.CATS).some(meta => meta && meta[2] === label)) return this.setState({ addingCat: false, newCatName: '' });
    const palette = ['#e0a458', '#7fb3d5', '#8fc7a0', '#c58fd9', '#d98f8f', '#8fd9c1', '#d9c98f', '#84c5d9'];
    this.myCats = this.myCats.concat([{ key: 'c' + Date.now().toString(36), label, color: palette[this.myCats.length % palette.length] }]);
    try { localStorage.setItem('vocab_mycats', JSON.stringify(this.myCats)); } catch (e) {}
    this.setState({ addingCat: false, newCatName: '' });
  }
  hasCategory(k) {
    return !!(k && (this.CATS[k] || this.myCats.some(c => c && c.key === k)));
  }
  rebuildW() {
    const ov = this.over || {}, co = this.catOver || {}, fm = this.faMap || {};
    const app = x => {
      const fa = ov[x.en] || x.fa || fm[x.en] || '';
      // Ignore stale/unknown category overrides from older or malformed backups.
      // Valid built-in and user-created categories still take precedence.
      const overCat = co[x.en], cat = this.hasCategory(overCat) ? overCat : x.cat;
      return (fa !== x.fa || cat !== x.cat) ? Object.assign({}, x, { fa, cat }) : x;
    };
    this.W = this.BASE.map(app).concat(this.custom.map((c, k) => app({ i: this.BASE.length + k, en: c.en, fa: c.fa, cat: this.hasCategory(c.cat) ? c.cat : 'general', ex: c.ex || null, own: true })));
  }
  editStart(en, fa) { this.setState({ editEn: en, editVal: fa }); }
  editSave() {
    const en = this.state.editEn, val = (this.state.editVal || '').trim();
    if (en && val) {
      this.over[en] = val;
      try { localStorage.setItem('vocab_overrides', JSON.stringify(this.over)); } catch (e) {}
      this.rebuildW();
    }
    this.setState({ editEn: null, editVal: '' });
  }
  // ===== sentence checker: online proofing/translation + offline fallback =====
  formsOf(w) {
    const b = String(w).toLowerCase().trim();
    const f = [b];
    if (/[^aeiou]y$/.test(b)) { f.push(b.slice(0, -1) + 'ies', b.slice(0, -1) + 'ied'); }
    f.push(b + 's', b + 'es', b + 'ed', b + 'd', b + 'ing');
    if (/e$/.test(b)) f.push(b.slice(0, -1) + 'ing', b.slice(0, -1) + 'ed');
    if (/[^aeiou][aeiou][^aeiouwxy]$/.test(b)) { const dd = b + b.slice(-1); f.push(dd + 'ing', dd + 'ed'); }
    return f;
  }
  usesWord(txt, target) {
    const t = String(target).toLowerCase().trim();
    const low = ' ' + String(txt).toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ') + ' ';
    if (t.indexOf(' ') >= 0) {
      const parts = t.split(/\s+/);
      return low.indexOf(' ' + t + ' ') >= 0 || parts.every(p => low.indexOf(' ' + p + ' ') >= 0);
    }
    return this.formsOf(t).some(f => low.indexOf(' ' + f + ' ') >= 0);
  }
  gradeSentence(txt, target) {
    const raw = String(txt || '').trim();
    const words = raw.replace(/[^A-Za-z' ]/g, ' ').split(/\s+/).filter(Boolean);
    const low = ' ' + words.join(' ').toLowerCase() + ' ';
    const AUX = ['am','is','are','was','were','be','been','being','do','does','did','have','has','had','will','would','can','could','shall','should','may','might','must'];
    const hasAux = AUX.some(a => low.indexOf(' ' + a + ' ') >= 0);
    const hasVerbShape = words.some(w => /(?:ed|ing|s)$/.test(w.toLowerCase()) && w.length > 3);
    const checks = [];
    const usedWord = this.usesWord(raw, target);
    checks.push({ ok: usedWord, label: usedWord ? 'لغت هدف در جمله به کار رفته' : 'لغت «' + target + '» در جمله نیست' });
    const longEnough = words.length >= 4;
    checks.push({ ok: longEnough, label: longEnough ? 'جمله به‌اندازه‌ی کافی کامل است (' + words.length + ' کلمه)' : 'جمله خیلی کوتاه است — حداقل ۴ کلمه بنویس' });
    const hasVerb = hasAux || hasVerbShape || this.usesWord(raw, target);
    checks.push({ ok: hasVerb, label: hasVerb ? 'جمله فعل دارد' : 'جمله فعل ندارد — هر جمله‌ی انگلیسی به فعل نیاز دارد' });
    const capOk = /^[A-Z"']/.test(raw);
    checks.push({ ok: capOk, label: capOk ? 'با حرف بزرگ شروع شده' : 'جمله باید با حرف بزرگ شروع شود' });
    const endOk = /[.!?]$/.test(raw);
    checks.push({ ok: endOk, label: endOk ? 'علامت پایانی دارد' : 'در پایان جمله نقطه یا علامت سؤال بگذار' });
    const pitfalls = [
      [/\b(i|we|they|you)\s+am\s+agree/i, 'به جای «I am agree» بگو «I agree».'],
      [/\bam\s+agree\b/i, 'به جای «am agree» بگو «I agree».'],
      [/\b(he|she|it)\s+(go|have|do|say|make|take|want|like|need|work|play|study|live)\b/i, 'با he/she/it فعل s می‌گیرد (he goes، she has).'],
      [/\b(don't|doesn't|didn't|does not|did not)\s+\w+(?:ed|s)\b/i, 'بعد از don\'t / doesn\'t / didn\'t فعل ساده می‌آید.'],
      [/\b(a)\s+[aeiou]/i, 'قبل از صدای مصوت از an استفاده کن (an apple).'],
      [/\bthe\s+(a|an)\b/i, 'the و a با هم نمی‌آیند.'],
      [/\bmuch\s+(people|books|cars|friends|things)\b/i, 'برای اسم شمردنی از many استفاده کن.'],
      [/\b(is|are|was|were)\s+\w+\s+(go|come|eat|see)\b/i, 'بعد از be فعل ing می‌گیرد.'],
      [/\bto\s+(going|doing|being)\b/i, 'بعد از to فعل ساده می‌آید.']
    ];
    const notes = [];
    pitfalls.forEach(p => { if (p[0].test(raw)) notes.push(p[1]); });
    notes.forEach(n => checks.push({ ok: false, label: n }));
    const passed = checks.filter(c => c.ok).length;
    const ok = usedWord && longEnough && hasVerb && !notes.length;
    let fb;
    if (ok && capOk && endOk) fb = 'آفرین! جمله‌ات کامل است و لغت را درست به کار برده‌ای.';
    else if (!usedWord) fb = 'باید خودِ لغت را در جمله به کار ببری تا در ذهنت بنشیند.';
    else if (!longEnough) fb = 'جمله را کامل‌تر کن: فاعل + فعل + بقیه‌ی جمله.';
    else if (notes.length) fb = 'نکته‌ی دستور زبانی هست — پایین را ببین و یک بار دیگر بنویس.';
    else fb = 'خوب است؛ فقط شکل ظاهری جمله را مرتب کن (حرف بزرگ و نقطه).';
    return { ok: ok, fb: fb, checks: checks, score: Math.round((passed / checks.length) * 100) };
  }
  async fetchJson(url, options, timeout) {
    if (typeof fetch !== 'function') throw new Error('offline');
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeout || 10000) : null;
    try {
      const opts = Object.assign({}, options || {}, ctrl ? { signal: ctrl.signal } : {});
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally { if (timer) clearTimeout(timer); }
  }
  correctedSentence(txt, matches) {
    let out = String(txt);
    (matches || []).slice().sort((a, b) => b.offset - a.offset).forEach(m => {
      const replacement = m.replacements && m.replacements[0] && m.replacements[0].value;
      if (replacement != null) out = out.slice(0, m.offset) + replacement + out.slice(m.offset + m.length);
    });
    return out;
  }
  async proofSentence(txt) {
    // Authored examples consistently accept British forms such as travelled
    // and practised, so the external proofreader must use the same variant.
    const body = new URLSearchParams(); body.set('text', txt); body.set('language', 'en-GB');
    const data = await this.fetchJson('https://api.languagetool.org/v2/check', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString()
    }, 10000);
    const matches = Array.isArray(data.matches) ? data.matches : [];
    return { matches: matches, corrected: this.correctedSentence(txt, matches) };
  }
  async translateSentence(txt) {
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(txt) + '&langpair=en%7Cfa';
    const data = await this.fetchJson(url, {}, 10000);
    if (!data || !data.responseData || !data.responseData.translatedText) throw new Error('no translation');
    return String(data.responseData.translatedText)
      .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }
  async translateDictionaryQuery() {
    const raw = String(this.state.query || '').trim();
    if (!raw) return this.setState({ dictTrErr: 'اول یک واژه یا عبارت بنویس.', dictTrResult: null });
    if (this.state.dictTrBusy) return;
    const isFa = /[\u0600-\u06ff]/.test(raw), from = isFa ? 'fa' : 'en', to = isFa ? 'en' : 'fa';
    this.setState({ dictTrBusy: true, dictTrErr: '', dictTrResult: null });
    try {
      const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(raw) + '&langpair=' + from + '%7C' + to;
      const data = await this.fetchJson(url, {}, 10000);
      const text = data && data.responseData && data.responseData.translatedText;
      if (!text) throw new Error('no translation');
      const clean = String(text).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (this.state.screen === 'browse') this.setState({ dictTrBusy: false, dictTrResult: { source: raw, text: clean, from, to }, dictTrErr: '' });
    } catch (e) {
      if (this.state.screen === 'browse') this.setState({ dictTrBusy: false, dictTrResult: null, dictTrErr: 'ترجمهٔ آنلاین در دسترس نبود؛ اتصال اینترنت را بررسی کن.' });
    }
  }
  async reviewEnglishText(txt) {
    const raw = String(txt || '').trim();
    let proof = null, translation = '', proofFailed = false, translationFailed = false;
    try { proof = await this.proofSentence(raw); } catch (e) { proofFailed = true; }
    const corrected = proof ? proof.corrected : raw;
    try { translation = await this.translateSentence(corrected); } catch (e) { translationFailed = true; }
    const issues = (proof ? proof.matches : []).map(m => {
      const bad = raw.slice(m.offset, m.offset + m.length);
      const suggestion = m.replacements && m.replacements[0] ? m.replacements[0].value : '';
      return { bad, suggestion, type: (m.rule && m.rule.issueType) || 'grammar',
        label: (m.message || 'این بخش را بازبینی کن') + (suggestion ? ' ← ' + suggestion : '') };
    });
    return { text: raw, corrected: corrected !== raw ? corrected : '', translation, issues,
      proofFailed, translationFailed, online: !proofFailed || !translationFailed,
      service: !proofFailed && !translationFailed ? 'بررسی آنلاین + ترجمه'
        : (!proofFailed ? 'بررسی آنلاین · ترجمه در دسترس نبود'
          : (!translationFailed ? 'بررسی محلی + ترجمهٔ آنلاین' : 'بررسی محلی')) };
  }
  speechTokens(txt) {
    return String(txt || '').toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ')
      .split(/\s+/).filter(Boolean);
  }
  speechMatch(spoken, target) {
    const heard = this.speechTokens(spoken), wanted = this.speechTokens(target);
    if (!wanted.length) return { score: 0, matched: 0, total: 0, missing: [] };
    const used = new Array(heard.length).fill(false);
    let matched = 0;
    const missing = [];
    wanted.forEach(w => {
      let hit = -1;
      for (let i = 0; i < heard.length; i++) if (!used[i] && heard[i] === w) { hit = i; break; }
      if (hit >= 0) { used[hit] = true; matched++; } else missing.push(w);
    });
    const coverage = matched / wanted.length;
    const lengthFit = Math.min(1, wanted.length / Math.max(wanted.length, heard.length || 1));
    return { score: Math.round((coverage * 0.85 + lengthFit * 0.15) * 100), matched, total: wanted.length, missing };
  }
  startOnlineSpeech(opts) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || (typeof navigator !== 'undefined' && navigator.onLine === false)) return null;
    let rec;
    try {
      rec = new SR();
      rec.lang = 'en-GB'; rec.interimResults = true; rec.continuous = !!opts.continuous; rec.maxAlternatives = 5;
      // In supporting browsers this explicitly requests the cloud-backed path.
      if ('processLocally' in rec) rec.processLocally = false;
      rec.onresult = ev => {
        const parts = [];
        for (let i = 0; i < ev.results.length; i++) {
          const result = ev.results[i];
          let best = result[0];
          if (opts.target && result.length > 1) {
            for (let j = 1; j < result.length; j++) {
              if (this.speechMatch(result[j].transcript, opts.target).score > this.speechMatch(best.transcript, opts.target).score) best = result[j];
            }
          }
          if (best && best.transcript) parts.push(best.transcript.trim());
        }
        const transcript = parts.join(' ').trim();
        if (transcript && opts.onText) opts.onText(transcript, !!ev.results[ev.results.length - 1].isFinal);
      };
      rec.onerror = ev => opts.onError && opts.onError(ev.error || 'speech-error');
      rec.onend = () => opts.onEnd && opts.onEnd();
      rec.start();
      return rec;
    } catch (e) { return null; }
  }
  async checkNewExample() {
    const txt = (this.state.nEx || '').trim();
    if (!txt) return this.setState({ nErr: 'اول جملهٔ نمونه را بنویس.' });
    if (txt.length > 500) return this.setState({ nErr: 'جملهٔ نمونه را کوتاه‌تر از ۵۰۰ نویسه بنویس.' });
    if (this.state.nBusy) return;
    this.setState({ nBusy: true, nErr: '', nReview: null });
    const r = await this.reviewEnglishText(txt);
    this.setState({ nBusy: false, nReview: r });
  }
  acceptNewExample() {
    const r = this.state.nReview;
    if (r && r.corrected) this.setState({ nEx: r.corrected, nReview: null });
  }
  async checkMy() {
    const w = this.current(), txt = (this.state.msText || '').trim();
    if (!w || !txt) return this.setState({ msErr: 'اول یک جمله بنویس.' });
    if (txt.length > 500) return this.setState({ msErr: 'جمله را کوتاه‌تر از ۵۰۰ نویسه بنویس.' });
    if (this.state.msBusy) return;
    const local = this.gradeSentence(txt, w.en);
    this.setState({ msBusy: true, msErr: '' });

    let proof = null, translation = '', proofFailed = false, translationFailed = false;
    try { proof = await this.proofSentence(txt); } catch (e) { proofFailed = true; }
    const corrected = proof ? proof.corrected : txt;
    try { translation = await this.translateSentence(corrected); } catch (e) { translationFailed = true; }

    const onlineChecks = [];
    (proof ? proof.matches : []).forEach(m => {
      const bad = txt.slice(m.offset, m.offset + m.length);
      const suggestion = m.replacements && m.replacements[0] ? m.replacements[0].value : '';
      const spelling = m.rule && m.rule.issueType === 'misspelling';
      let label = spelling ? 'املای احتمالی: «' + bad + '»' : 'نکتهٔ آنلاین: ' + (m.message || 'جمله را بازبینی کن');
      if (suggestion) label += ' ← «' + suggestion + '»';
      onlineChecks.push({ ok: false, label: label });
    });
    if (!proofFailed && !onlineChecks.length) onlineChecks.push({ ok: true, label: 'بررسی آنلاین املا و دستور مشکلی پیدا نکرد' });

    const checks = local.checks.concat(onlineChecks);
    const ok = local.ok && (proofFailed || onlineChecks.every(c => c.ok));
    const score = Math.max(0, local.score - Math.min(40, onlineChecks.filter(c => !c.ok).length * 10));
    let fb = local.fb;
    const service = !proofFailed && !translationFailed ? 'بررسی آنلاین + ترجمه'
      : (!proofFailed ? 'بررسی آنلاین · ترجمه در دسترس نبود'
        : (!translationFailed ? 'بررسی محلی + ترجمهٔ آنلاین' : 'بررسی محلی'));
    if (!proofFailed && onlineChecks.some(c => !c.ok)) fb = onlineChecks.filter(c => !c.ok).length + ' نکتهٔ املایی یا دستوری پیدا شد؛ پیشنهادها را ببین.';
    else if (local.ok && !proofFailed && !translationFailed) fb = 'بررسی آنلاین انجام شد و ترجمهٔ فارسی آماده است.';
    else if (proofFailed && translationFailed) fb += ' اینترنت در دسترس نبود؛ بررسی محلی انجام شد.';

    this.mySent[w.en] = {
      s: txt, ok: ok, fb: fb, checks: checks, score: score,
      corrected: corrected !== txt ? corrected : '', translation: translation,
      online: !proofFailed || !translationFailed, service: service
    };
    try { localStorage.setItem('vocab_mysent', JSON.stringify(this.mySent)); } catch (e) {}
    if (ok) this.addXp(4);
    this.setState({ msBusy: false, msErr: '', tick: (this.state.tick || 0) + 1 });
  }
  saveCustom() { try { localStorage.setItem('vocab_custom', JSON.stringify(this.custom)); } catch (e) {} }
  addWord() {
    const en = (this.state.nEn || '').trim(), fa = (this.state.nFa || '').trim();
    if (!en || !fa) return this.setState({ nErr: 'لغت انگلیسی و معنی فارسی هر دو لازم است.' });
    if (this.W.some(x => x.en.toLowerCase() === en.toLowerCase())) return this.setState({ nErr: 'این لغت از قبل در فهرست هست.' });
    this.custom = this.custom.concat([{ en, fa, cat: this.state.nCat || 'general', ex: (this.state.nEx || '').trim() || null }]);
    this.saveCustom();
    this.rebuildW();
    const idx = this.W.length - 1;
    this.set(d => { d.order = d.order.concat([idx]); d.wordCount = this.W.length; },
      { nEn: '', nFa: '', nEx: '', nErr: '', nReview: null, justAdded: en });
    this.speakWord(en);
  }
  removeWord(en) {
    const gone = this.W.find(x => x.en === en);
    this.custom = this.custom.filter(c => c.en !== en);
    this.saveCustom();
    const oldLen = this.W.length;
    this.rebuildW();
    this.set(d => {
      d.order = d.order.filter(i => i !== (gone && gone.i)).map(i => (gone && i > gone.i) ? i - 1 : i);
      d.wordCount = this.W.length;
      d.pos = Math.min(d.pos, d.order.length);
      // mastered/starred are keyed by word index too, so they must shift with
      // d.order or every entry above the removed word points at its neighbour.
      if (gone) {
        const shift = map => {
          const out = {};
          Object.keys(map || {}).forEach(k => {
            const i = Number(k);
            if (i === gone.i) return;
            out[i > gone.i ? i - 1 : i] = map[k];
          });
          return out;
        };
        d.mastered = shift(d.mastered);
        d.starred = shift(d.starred);
      }
    });
  }
  isStar(i) { const d = this.state.data; return !!(d && d.starred && d.starred[i]); }
  toggleStar(i) { this.set(d => { if (!d.starred) d.starred = {}; if (d.starred[i]) delete d.starred[i]; else d.starred[i] = 1; }); }
  starCount() { const d = this.state.data; return d && d.starred ? Object.keys(d.starred).length : 0; }
  goStars() { this.setState({ screen: 'browse', catFilter: this.state.catFilter === '__star' ? 'all' : '__star', limit: 60, query: '', dictTrResult: null, dictTrErr: '', wordMoreEn: null }); }
  blank(n) {
    const d = { v5: 1, v6: 1, v7: 1, starred: {}, wordCount: n, round: 1, level: LEVELS[0], unit: 1, lesson: 1, pos: 0, order: [], mastered: {}, seen: 0, correct: 0, wrong: 0, days: {}, dayStats: {}, goal: 20, streak: 1, lastDay: today(), quizzes: {} };
    d.order = this.chunkOrder(d, n);
    return d;
  }
  band(r) { return Math.floor((r - 1) / PER_LEVEL); }
  levelOf(r) { return LEVELS[Math.min(this.band(r), LEVELS.length - 1)]; }
  // d.round only ever takes the form band*PER_LEVEL+1 anywhere it is written
  // (blank(), nextLesson(), applyPlacement()) — the (r-1)%PER_LEVEL!=0 branch
  // in chunkOrder() below is legacy/dead in the shipped app. So the round
  // value that keeps every existing band()/levelOf()/chunkOrder() call site
  // (and the many out-of-scope gramLevelUnlocked/sbLevelUnlocked/
  // lsLevelUnlocked/dcLevelUnlocked-style reads of d.round elsewhere) working
  // unchanged is fully determined by the level alone.
  roundForLevel(L) { return Math.max(0, LEVELS.indexOf(L)) * PER_LEVEL + 1; }
  // ---- Level -> Unit -> Lesson position (LEG-002, re-sourced by LEG-015) ----
  // A level's words, chopped into fixed LESSON_SIZE lessons and UNIT_LESSONS
  // units. The WORDS THEMSELVES now come from window.VOCAB_LEVELS — the real
  // CEFR curriculum (data/curriculum.json, built by tools/build-curriculum.js
  // from CEFR-J + Octanove) — instead of slicing VOCAB_ORDER by percentage.
  //
  // That slicing was indefensible and docs/dictionary-audit.md measured what it
  // cost: VOCAB_ORDER is frequency-scored only for its first ~1,800 entries and
  // sorted by WORD LENGTH after that, so the "advanced" bands filled with porn
  // domains, brand names and scrape artifacts, five explicit terms were dealt in
  // the A2 band, and 836 proper nouns polluted the drills. VOCAB_LEVELS contains
  // only words an external, openly-licensed CEFR wordlist actually grades AND
  // that have real Persian content in the catalog, so none of that is
  // representable any more.
  //
  // VOCAB_ORDER is deliberately still used for review sourcing and search; it is
  // only the TAUGHT sequence that moved.
  levelWords(L) {
    const src = (typeof window !== 'undefined' && window.VOCAB_LEVELS) || this.LEVELWORDS || null;
    const a = src && src[L];
    return Array.isArray(a) ? a : [];
  }
  lessonsInLevel(L) { return Math.max(1, Math.ceil(this.levelWords(L).length / LESSON_SIZE)); }
  unitsInLevel(L) { return Math.max(1, Math.ceil(this.lessonsInLevel(L) / UNIT_LESSONS)); }
  lessonsInUnit(L, unit) {
    const total = this.lessonsInLevel(L), startLesson0 = (Math.max(1, unit) - 1) * UNIT_LESSONS;
    return Math.max(1, Math.min(UNIT_LESSONS, total - startLesson0));
  }
  // The (up to) LESSON_SIZE word indices that make up one specific lesson.
  lessonWordsOf(L, unit, lesson) {
    const band = this.levelWords(L);
    const lessonIdx0 = (Math.max(1, unit) - 1) * UNIT_LESSONS + (Math.max(1, lesson) - 1);
    const start = lessonIdx0 * LESSON_SIZE;
    return band.slice(start, start + LESSON_SIZE);
  }
  // Inverse lookup: where does word i live? Used by anything that needs a
  // single word's curriculum position rather than a whole lesson's roster.
  // Returns null for a word that is not taught at all (most of the catalog) —
  // callers already treat null as "no curriculum position".
  wordPosition(i) {
    for (let li = 0; li < LEVELS.length; li++) {
      const rank = this.levelWords(LEVELS[li]).indexOf(i);
      if (rank >= 0) {
        const lessonIdx0 = Math.floor(rank / LESSON_SIZE);
        return { level: LEVELS[li], unit: Math.floor(lessonIdx0 / UNIT_LESSONS) + 1, lesson: (lessonIdx0 % UNIT_LESSONS) + 1, order: rank % LESSON_SIZE };
      }
    }
    return null;
  }
  // Every taught word, across every level — the pool anything learner-facing
  // may draw from. Distractors use it so a word that is never taught can never
  // appear as a wrong answer either (docs/dictionary-audit.md F1/F4: junk
  // distractors do not make a drill harder, they make it falsely easy).
  teachableSet() {
    if (!this._teachable) {
      const s = new Set();
      LEVELS.forEach(L => this.levelWords(L).forEach(i => s.add(i)));
      this._teachable = s;
    }
    return this._teachable;
  }
  // Same "any never-introduced word left" freshness check queueStats() does
  // for a whole level band (read-only against vocab_sr_v1 via srRec — the SR
  // schema/scheduling itself is untouched), scoped down to one lesson.
  lessonStats(L, unit, lesson) {
    const words = this.lessonWordsOf(L, unit, lesson);
    const il = this.ilLoad();
    // A word that failed all IL_MAX_FAILS attempts today (ilAdvance() marks
    // it 'unfinished') never gets srCompleteInitialLearning() called on it,
    // so srRec(i)[4] never becomes true — without this check it would count
    // as "fresh" forever, and since isFresh() in chunkOrder() already
    // refuses to redraw a word with an il.words record, the lesson could
    // never reach fresh===0 today. That deadlocked afterCard()'s lesson-
    // complete transition AND lessonProgress()'s unlock cascade for every
    // later lesson in the level, so one hard word answered wrong three
    // times could strand a learner on "امروز تموم شد" for the rest of the
    // day even with thousands of untouched words waiting. Treating an
    // 'unfinished' word as resolved-for-today (not fresh) lets the lesson
    // and level move on; il.words resets tomorrow (ilLoad(), day-scoped),
    // so the word becomes drawable again the next time this lesson is open.
    return { total: words.length, fresh: words.filter(i => {
      const x = this.srRec(i);
      if (x && x[4]) return false;
      const ilRec = il.words[i];
      return !(ilRec && ilRec.turn === 'unfinished');
    }).length };
  }
  // LEG-003 — takes the whole `d` (not just d.round) so new words can be
  // sourced from the learner's current lesson (LEG-002) instead of the whole
  // level band. Review sourcing below is completely untouched.
  chunkOrder(d, n) {
    n = n || this.W.length;
    const r = d.round;
    const ord = (this.ORDER && this.ORDER.length ? this.ORDER : Array.from({ length: n }, (_, i) => i)).filter(i => i < n);
    if (!ord.length) return [];
    const spans = levelSpans(ord.length);
    // Reviews first. Nakata & Webb 2016: with a fixed card budget, spacing
    // matters and set size barely does — so due words get first claim and new
    // words fill what is left. New words are capped so the review load can
    // stabilise instead of compounding.
    const day = currentDayNo();
    // LEG-006 — when more words are due than MAX_REVIEWS can fit, prioritise
    // struggling words over merely-more-overdue ones. weaknessBonus is
    // deliberately small (capped ~5.75) next to a real overdue backlog: it
    // only reorders words whose overdue amounts are already close, so a
    // genuinely stale word is never displaced by a weak-but-recent one.
    const weaknessBonus = i => {
      const rec = this.srRec(i);
      const successes = rec ? (rec[0] || 0) : 0;
      const ease = rec ? (rec[7] || 1) : 1;
      return Math.max(0, 3 - successes) * 1.5 + Math.max(0, 1 - ease) * 5;
    };
    const duePriority = i => (day - (this.srRec(i)[6] || 0)) + weaknessBonus(i);
    const due = ord.filter(i => this.srDue(i, day))
      .sort((a, b) => duePriority(b) - duePriority(a))
      .slice(0, MAX_REVIEWS);
    // A word already mid Initial-Learning (or abandoned as 'unfinished') this
    // session must never be redrawn as if it were a brand-new word — it
    // already has (or had) its own turn A/B/C card scheduled by ilSchedule().
    const il = this.ilLoad();
    // Bug fix (reported: a brand-new learner taking the placement test, then
    // landing straight on "مرورهای امروز تمام شد" the moment they tried to
    // actually start lesson 1 — reproduced end-to-end with Playwright).
    // load() speculatively pre-computes d.order the instant the app first
    // opens, and the stamping below marks every word it draws with an
    // Initial-Learning turn:'A' record the moment it is DRAWN, not once it
    // is actually shown. When d.order is then rebuilt from scratch before
    // the learner has answered a single card (d.pos still 0) — e.g.
    // applyPlacement() recomputing d.order for the very same untouched
    // lesson right after the placement test — those turn:'A' stamps from
    // the discarded first draw survive in vocab_session_v1. isFresh() below
    // then treats the exact same words as "already mid Initial-Learning"
    // and refuses to draw them again, so chunkOrder() returns empty even
    // though every one of those words is still fully untouched. Since
    // nothing was ever shown (d.pos === 0), any turn:'A'/fails:0 stamp for
    // a word in the about-to-be-discarded d.order is an orphan of a draw
    // the learner never saw — release it so the rebuild can draw the same
    // words as genuinely fresh. A word already past turn 'A', or with a
    // fail already recorded, was reached by a real card and stays put.
    if (d.pos === 0 && d.order && d.order.length) {
      let releasedAny = false;
      d.order.forEach(i => {
        const rec = il.words[i];
        if (rec && rec.turn === 'A' && !rec.fails) { delete il.words[i]; releasedAny = true; }
      });
      if (releasedAny) this.ilSave();
    }
    const isFresh = i => { const x = this.srRec(i); if (x && x[4]) return false; return !il.words[i]; };
    // LEG-003 point 2: new words come from the current LESSON_SIZE-word
    // lesson specifically, not the whole level band chunkOrder() used before.
    let fresh = this.lessonWordsOf(d.level, d.unit, d.lesson).filter(isFresh).slice(0, MAX_NEW);
    // srDue() is false for any word that was never introduced, so once the
    // round advances past a band (placement or manual level change),
    // chunkOrder() would otherwise never draw new words from that band again
    // — placing someone at C1 silently orphaned every lower-band word they
    // hadn't already met. Reserve one new-word slot per session for the
    // nearest lower band that still has un-introduced words, so a high
    // placement borrows from what it skipped instead of discarding it.
    const band0 = this.band(r);
    if (band0 > 0) {
      fresh = fresh.slice(0, Math.max(0, MAX_NEW - 1));
      for (let b = band0 - 1; b >= 0 && fresh.length < MAX_NEW; b--) {
        const lowerSp = spans[b]; if (!lowerSp) continue;
        const lowerFresh = ord.slice(lowerSp[0], lowerSp[0] + lowerSp[1]).filter(isFresh);
        if (lowerFresh.length) { fresh.push(shuffled(lowerFresh, r * 977 + b)[0]); break; }
      }
    }
    // Every word about to enter the queue as new material gets an Initial-
    // Learning record right away (turn 'A'), so isFresh() above never draws
    // it a second time this session and modeFor() recognises it once shown.
    if (fresh.length) {
      let changed = false;
      fresh.forEach(i => { if (!il.words[i]) { il.words[i] = { turn: 'A', fails: 0 }; changed = true; } });
      if (changed) this.ilSave();
    }
    // Three reviews, then one new word. A backlog can no longer hide all new
    // material, and a session remains a calm, predictable twenty cards.
    const out = [], reviews = due.slice(), news = fresh.slice();
    while (reviews.length || news.length) {
      for (let j = 0; j < 3 && reviews.length; j++) out.push(reviews.shift());
      if (news.length) out.push(news.shift());
      if (!reviews.length && news.length) out.push(news.shift());
    }
    return Array.from(new Set(out));
  }
  // d may be null/undefined at the very first paint, before load() runs.
  queueStats(d, n) {
    n = n || this.W.length;
    const ord = (this.ORDER && this.ORDER.length ? this.ORDER : Array.from({ length: n }, (_, i) => i)).filter(i => i < n);
    const level = (d && d.level) || LEVELS[0], unit = (d && d.unit) || 1, lesson = (d && d.lesson) || 1;
    return {
      due: ord.filter(i => this.srDue(i, currentDayNo())).length,
      // LEG-003: mirrors chunkOrder()'s new-word source — the current lesson,
      // not the whole level band — so the home screen's "X تازه" preview
      // matches what a session will actually draw.
      fresh: this.lessonStats(level, unit, lesson).fresh
    };
  }
  // LEG-015 — "X of Y known at this level" now counts the level's real taught
  // words, not the old percentage slice of VOCAB_ORDER. Before this, C2 claimed
  // 2,630 words when it actually teaches 60, so the progress bar could never
  // move and the number was simply untrue.
  levelStats(r, n) {
    n = n || this.W.length;
    const words = this.levelWords(this.levelOf(r));
    let introduced = 0, known = 0;
    words.forEach(i => {
      const rec = this.srRec(i);
      if (rec && rec[4]) introduced++;
      if (this.srKnown(i)) known++;
    });
    return { total: words.length, introduced: introduced, known: known };
  }
  // LEG-015 — how many words a level actually teaches. Now the real count of
  // graded, content-bearing words in that level (VOCAB_LEVELS), not a
  // percentage slice of the whole catalog. The numbers are smaller and honest:
  // a level that says 160 has 160 teachable words, not 2,315 mostly-unusable ones.
  levelSize(L) { return this.levelWords(L).length; }
  // LEG-015 — the matching game's per-level pool. Same source as the taught
  // sequence, so a word the course never teaches cannot turn up as a game tile
  // either; before this it sliced VOCAB_ORDER and could deal a porn domain.
  levelWordIndices(L) { return new Set(this.levelWords(L)); }
  practiceLevelUnlocked(L) {
    const at = LEVELS.indexOf(L); if (at <= 0) return true;
    const d = (this.state && this.state.data) || this.load();
    if (at <= Math.min(this.band(d.round || 1), LEVELS.length - 1)) return true;
    return this.gramLevelUnlocked(L) || this.sbLevelUnlocked(L) || this.lsLevelUnlocked(L) || this.dcLevelUnlocked(L);
  }
  load(n) {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!d || !Array.isArray(d.order) || !d.order.length) d = this.blank(n);
    // LEG-002 backward-compat migration — additive, same convention as
    // srLoad()'s vocab_sr_v1 field-fill: an existing user's save has
    // `d.round` but not the new `{level, unit, lesson}` fields yet. Derive
    // level from the OLD round with the exact band() math nextRound() and
    // chunkOrder() always used, so the level does not jump. round only ever
    // encoded band*PER_LEVEL+1 in the shipped app (see roundForLevel()) —
    // it never carried a sub-level position — so there is no historical
    // unit/lesson to recover; the learner resumes at unit 1, lesson 1 of
    // their derived level. Nothing they already know is lost: which words
    // are introduced/due still lives entirely in vocab_sr_v1, untouched.
    if (d && !d.level) {
      const legacyRound = (typeof d.round === 'number' && d.round > 0) ? d.round : 1;
      d.level = this.levelOf(legacyRound);
      d.unit = 1;
      d.lesson = 1;
      d.round = this.roundForLevel(d.level);
      // Persist the migrated shape immediately, same as srLoad() saving as
      // soon as it fills in a missing additive field — otherwise a user who
      // closes the tab without interacting keeps re-deriving from the old
      // `round` on every load instead of the migration actually landing.
      this.save(d);
    }
    // LEG-015 curriculum-switch migration. `d.unit`/`d.lesson` used to index a
    // percentage slice of VOCAB_ORDER; they now index the real CEFR curriculum,
    // so the same numbers name a COMPLETELY DIFFERENT set of eight words. A
    // learner left mid-"unit 3 lesson 7" would silently resume in unrelated
    // vocabulary.
    //
    // The level itself is still meaningful, so it is kept; only the position
    // inside it resets. That costs nothing, because completion is not stored on
    // the position — lessonStats() re-derives it from vocab_sr_v1, which is
    // untouched. Any word they genuinely learned still has its SR record, so
    // every lesson built from words they already know shows as complete
    // immediately and the lesson browser lands them at the first real gap.
    // NO SRS PROGRESS IS LOST OR REWRITTEN HERE — this only moves a cursor.
    if (d && d.curriculumV !== CURRICULUM_V) {
      d.curriculumV = CURRICULUM_V;
      d.unit = 1;
      d.lesson = 1;
      // pos back to the start of whatever queue exists. d.order is deliberately
      // LEFT ALONE even though it is now stale: the guard at the top of this
      // function treats an empty order as a corrupt save and replaces the whole
      // blob with blank(), which would wipe the learner's level, streak, goal
      // and lifetime stats — the exact opposite of what this migration is for.
      // The stale order is never shown: entering vocabulary lands on the lesson
      // browser (LEG-009), and every route out of it goes through
      // startLessonPractice(), which rebuilds d.order from the new curriculum.
      d.pos = 0;
      this.save(d);
    }
    const t = today();
    const newDay = d.lastDay !== t;
    if (newDay) {
      const yd = new Date(); yd.setDate(yd.getDate() - 1);
      const p = n => String(n).padStart(2, '0');
      const y = yd.getFullYear() + '-' + p(yd.getMonth() + 1) + '-' + p(yd.getDate());
      d.streak = d.lastDay === y ? (d.streak || 0) + 1 : 1;
      d.lastDay = t;
    }
    this.srSeed(d);
    if (!d.days) d.days = {};
    if (d.days[t] == null) d.days[t] = 0;
    if (!d.mastered) d.mastered = {};
    if (!d.starred) d.starred = {};
    if (!d.quizzes) d.quizzes = {};
    if (!d.dayStats) d.dayStats = {};
    if (!d.dayStats[t]) d.dayStats[t] = { introduced: 0, correct: 0, wrong: 0 };
    if (!d.goal) d.goal = 20;
    if (n && (!d.v7 || newDay)) {
      d.v5 = 1; d.v6 = 1; d.v7 = 1;
      d.order = this.chunkOrder(d, n);
      d.pos = 0;
      d.wordCount = n; this.save(d);
    } else if (n && d.wordCount !== n) {
      const wasPos = d.pos || 0;
      d.order = this.chunkOrder(d, n);
      d.pos = Math.max(0, Math.min(wasPos, d.order.length));
      d.wordCount = n; this.save(d);
    }
    return d;
  }
  save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  set(mut, extra, done) {
    this.setState(s => { const d = JSON.parse(JSON.stringify(s.data)); mut(d); this.save(d); return Object.assign({ data: d }, extra || {}); }, done);
  }

  // ---- where you came from ----
  // Recorded centrally rather than at each of the ~40 places that change
  // screen, so nothing can forget to push. Kept in memory only: a back stack
  // that survived a reload would send you back to a screen from last week.
  // The runtime calls componentDidUpdate(prevProps) — one argument, no
  // prevState — so the previous screen has to be tracked here.
  componentDidUpdate() {
    const to = this.state.screen;
    const from = this._navPrev;
    this._navPrev = to;
    if (!from || !to || from === to) return;
    if (this._navPopped === to) { this._navPopped = null; return; }   // this was a back move
    this._nav = (this._nav || []).filter(x => x !== from).concat([from]).slice(-15);
  }
  navBack() {
    const stack = this._nav || [];
    const dest = stack.pop();
    if (!dest) return null;
    this._nav = stack;
    this._navPopped = dest;
    return dest;
  }
  // Stop whatever the screen being left had running. Timers and the microphone
  // do not stop themselves.
  leaveScreen(screen) {
    if (screen === 'csrun') { clearInterval(this.csIv); this.setState({ cs: null }); }
    if (screen === 'sbrun') { clearInterval(this.sbIv); this.setState({ sb: null }); }
    if (screen === 'ltext' || screen === 'listen') this.lsStop();
    if (screen === 'dses' || screen === 'disc') this.dcStop();
    if (screen === 'game') this.setState({ game: null });
    if (screen === 'exercise') this.setState({ ex: null });
  }

  componentDidMount() {
    this._mounted = true;
    this._navPrev = this.state.screen;
    if (!this.W.length) {
      this.iv = setInterval(() => {
        if (window.VOCAB_WORDS && window.VOCAB_WORDS.length) {
          clearInterval(this.iv); this.BASE = window.VOCAB_WORDS; this.CATS = window.VOCAB_CATS || {}; this.ORDER = window.VOCAB_ORDER || null; this.LEVELWORDS = window.VOCAB_LEVELS || null; this._teachable = null; this.rebuildW();
          this.setState({ data: this.load(this.W.length) });
        }
      }, 150);
    }
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
  }
  componentWillUnmount() {
    this._mounted = false;
    clearInterval(this.iv); clearInterval(this.csIv); clearInterval(this.dIv);
    this.lsAuto = false;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    clearInterval(this.sbIv);
    if (this.rec) { try { this.rec.abort(); } catch (e) {} }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  // The task follows the WORD, not the round. Receptive knowledge precedes
  // productive knowledge, so asking for a spelling on first contact produces a
  // failure rather than a retrieval (Webb 2009). Stage = successes so far.
  //   0 flash (introduction, never scored) · 1 mcq · 2 listen · 3 type
  //   4+ alternate type / mcq for maintenance
  // «در جمله» only works when the blanked sentence has ONE right answer. Most
  // examples are template filler shared by hundreds of words, so the drill is
  // unanswerable for them — but it becomes the best task in the app for a word
  // whose sentence is its own. Gate per word, so rewritten examples bring the
  // mode back by themselves.
  // Count the BLANKED sentence, not the finished one. A template produces a
  // different string for every word it swallows, so counting finished sentences
  // makes each look unique and lets the whole list through — the blank is what
  // the learner is shown, and it is what has to be unique.
  clozeBlank(w) {
    // \b either side, or "age" blanks the middle of "languages".
    return w.ex.replace(new RegExp('\\b' + w.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'ig'), '~');
  }
  exampleOk(w) {
    if (!w || !w.ex || w.ex.length < 12) return false;
    const x = w.ex.trim();
    const filler = [
      /^This .+ is very important to me\.?$/i,
      /^I need a new .+ for my work\.?$/i,
      /^We talked about the .+ for an hour\.?$/i,
      /^Do you remember that .+\??$/i,
      /^The .+ changed everything for us\.?$/i,
      /^I like to .+ in the morning\.?$/i,
      /^To .+ well, you need patience\.?$/i,
      /^Learning to .+ takes time and practice\.?$/i,
      /^The weather was very .+ yesterday\.?$/i
    ];
    return filler.every(re => !re.test(x)) && this.clozeBlank(w) !== w.ex;
  }
  clozeOk(w) {
    if (!this.exampleOk(w)) return false;
    if (!this._exShared) {
      const n = {};
      this.W.forEach(x => { if (x.ex) { const k = this.clozeBlank(x); n[k] = (n[k] || 0) + 1; } });
      this._exShared = n;
    }
    const blank = this.clozeBlank(w);
    if (blank === w.ex) return false;             // the word is not in its own example
    return (this._exShared[blank] || 0) === 1;
  }
  modeFor(w) {
    if (!w) return 'flash';
    // LEG-003 — a word mid Initial Learning this session takes priority over
    // the normal SRS-phase ladder below: turn A is the introduction (flash),
    // turn B the en->fa recognition MCQ, turn C the fa->en retrieval MCQ.
    // Once the word finishes (or is abandoned as 'unfinished'), ilTurnFor()
    // returns null and this falls straight through to the untouched ladder.
    const ilTurn = this.ilTurnFor(w.i);
    if (ilTurn === 'A') return 'flash';
    if (ilTurn === 'B') return 'mcq';
    if (ilTurn === 'C') return 'fa2en';
    const rec = this.srRec(w.i), st = this.srStage(w.i);
    if (!rec || !rec[4] || st === 0) return 'flash';
    if (st === 1) return 'mcq';
    if (st === 2) return 'listen';
    if (st === 3) return 'type';
    // Maintenance alternates recall and recognition; a word with a real example
    // gets the sentence instead of the weaker multiple-choice.
    return (st % 2) ? 'type' : (this.clozeOk(w) ? 'cloze' : 'mcq');
  }
  mode() { return this.modeFor(this.current()); }
  modeInfo() { const m = this.mode(); return MODES.filter(x => x.mode === m)[0] || MODES[0]; }
  current() { const d = this.state.data; return this.W[d.order[Math.min(d.pos, d.order.length - 1)]] || null; }
  cat(w) { return this.catMeta(w && w.cat); }
  icon(w) { return 'ph ph-' + this.cat(w)[0].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); }
  color(w) { return this.cat(w)[1]; }

  speakWord(text, rate) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = rate || 0.95;
    const vs = window.speechSynthesis.getVoices() || [];
    const v = vs.find(x => /en-US/i.test(x.lang) && /natural|google|samantha|aria/i.test(x.name)) || vs.find(x => /^en/i.test(x.lang));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }




  // LEG-005 — distractor candidates are picked from a tiered "plausible
  // confusion" pool instead of a flat random draw over the 10,524-word
  // catalog. Tiers fall through in priority order (each only runs if the
  // previous ones together didn't reach 3 distractors) so a random garbage
  // option is now the last resort, not the default:
  //   1. words already seen this session (vocab_session_v1 + cards already
  //      shown in d.order up to d.pos) — keeps working memory active.
  //   2. words from the same lesson, or up to 2 lessons before it in the
  //      same unit/level (wordPosition()/lessonWordsOf(), from LEG-002).
  //   3. words the learner has struggled with — not yet srKnown() and with
  //      a low success count (srRec()[0]), i.e. the existing SRS data's own
  //      definition of "weak", not a new one.
  //   4. words from the same category (w.cat) — same part of speech is a
  //      cheap, deliberately-chosen proxy for "plausible confusion" in an
  //      offline app with no embeddings/semantic-similarity infrastructure.
  //   5. fallback: today's old random-over-catalog behaviour, unchanged.
  // Quality filters apply to every candidate in every tier: no identical/
  // near-identical Persian gloss (an unanswerable duplicate-meaning
  // distractor is worse than a random one), no picking the same word twice,
  // and no near-duplicate English headword (e.g. a plural/inflection of the
  // same word) unless nothing else is left after tier 5 — that last case is
  // handled by a final relaxed pass so a question is never short an option.
  buildOptions() {
    const w = this.current(); if (!w) return [];
    const mode = this.mode();
    const d = this.state.data;
    const r = mulberry(w.i * 7919 + d.round);
    // LEG-015 — candidates are drawn only from words the curriculum actually
    // teaches. A word that is never taught must never appear as a wrong answer
    // either: docs/dictionary-audit.md F1/F4 measured that junk distractors do
    // not make a drill harder, they make it FALSELY EASY (the learner eliminates
    // the obvious nonsense), so the SRS then records a success that was never
    // earned and schedules the word further out. Custom user words (which have
    // no curriculum entry but are real vocabulary the learner chose) stay
    // eligible. Falls back to the old pool only if the curriculum is missing
    // entirely, so an older bundle still renders four options.
    const teachable = this.teachableSet();
    const eligible = x => !!x.fa && (!teachable.size || teachable.has(x.i) || x.i >= this.BASE.length);
    const withFa = this.W.filter(eligible);
    // Distractors must differ from the answer by the text SHOWN, not just by
    // index: 883 words share a gloss with another word in the same category, so
    // index-only dedupe put two identical options on screen, one marked wrong.
    const shown = x => (mode === 'cloze' || mode === 'fa2en' ? x.en : x.fa);
    // Near-duplicate checks reuse the app's existing text-normalisation
    // helpers (searchNorm for Persian, norm for English) rather than adding
    // new ones.
    const faNear = fa => {
      const a = searchNorm(fa), b = searchNorm(w.fa);
      return !!a && !!b && (a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0);
    };
    const enNear = en => {
      const a = norm(en), b = norm(w.en);
      if (!a || !b) return false;
      if (a === b) return true;
      const s = a.length <= b.length ? a : b, l = a.length <= b.length ? b : a;
      return l.indexOf(s) === 0 && (l.length - s.length) <= 3;
    };
    const takenIdx = new Set([w.i]);
    const takenShown = new Set([shown(w)]);
    const pool = [];
    const add = (c, allowEnNear) => {
      if (pool.length >= 3 || !c || !c.fa) return;
      // The eligibility gate lives HERE rather than in each tier, because the
      // tiers draw from different places (the session queue, lesson rosters,
      // vocab_sr_v1's own keys, a category scan) and only this is common to all
      // of them. Tier 3 in particular reads an existing learner's SR history,
      // which can still contain words studied before the curriculum switch.
      if (!eligible(c)) return;
      if (takenIdx.has(c.i) || takenShown.has(shown(c))) return;
      if (faNear(c.fa)) return;
      if (!allowEnNear && enNear(c.en)) return;
      pool.push(c); takenIdx.add(c.i); takenShown.add(shown(c));
    };

    // Tier 1 — this session's words: already-shown cards in the current
    // queue plus any word Initial Learning (LEG-003) has touched today.
    if (pool.length < 3) {
      const sessionIdx = new Set();
      (d.order || []).slice(0, d.pos).forEach(i => sessionIdx.add(i));
      Object.keys(this.ilLoad().words || {}).forEach(k => sessionIdx.add(Number(k)));
      sessionIdx.delete(w.i);
      shuffled(Array.from(sessionIdx), w.i + 101).forEach(i => add(this.W[i]));
    }

    // Tier 2 — same lesson, then up to two lessons before it in the same
    // unit/level (falling back across a unit boundary via lessonsInUnit()).
    if (pool.length < 3) {
      const pos = this.wordPosition(w.i);
      if (pos) {
        let cand = this.lessonWordsOf(pos.level, pos.unit, pos.lesson);
        let unit = pos.unit, lesson = pos.lesson;
        for (let back = 0; back < 2 && unit >= 1; back++) {
          lesson -= 1;
          if (lesson < 1) { unit -= 1; if (unit < 1) break; lesson = this.lessonsInUnit(pos.level, unit); }
          cand = cand.concat(this.lessonWordsOf(pos.level, unit, lesson));
        }
        shuffled(cand, w.i + 103).forEach(i => add(this.W[i]));
      }
    }

    // Tier 3 — words the learner has struggled with: not yet srKnown(), with
    // a low success count in their own SRS record. Iterates vocab_sr_v1's own
    // (small) keyset, not the full 10,524-word catalog.
    if (pool.length < 3) {
      const sr = this.srLoad();
      const weak = Object.keys(sr)
        .filter(k => Array.isArray(sr[k]) && sr[k][4] && (sr[k][0] || 0) <= 1 && !this.srKnown(Number(k)))
        .map(Number);
      shuffled(weak, w.i + 107).forEach(i => add(this.W[i]));
    }

    const sameCat = withFa.filter(x => x.cat === w.cat && x.i !== w.i);
    // Tier 4 — same category (part of speech is a cheap proxy for plausible
    // confusion; no semantic-similarity infra exists in this offline app).
    if (pool.length < 3) shuffled(sameCat, w.i + 109).forEach(c => add(c));

    // Tier 5 — fallback: the original random-over-catalog behaviour.
    const src = sameCat.length >= 6 ? sameCat : withFa;
    if (pool.length < 3) {
      let guard = 0;
      while (pool.length < 3 && guard++ < 200) add(src[Math.floor(r() * src.length)]);
    }
    // Last resort so a question is never rendered short an option: relax the
    // English-near-duplicate guard only (the Persian-gloss guard never
    // relaxes — a duplicate-meaning option is unanswerable, not just easy).
    if (pool.length < 3) {
      let guard = 0;
      while (pool.length < 3 && guard++ < 200) add(src[Math.floor(r() * src.length)], true);
    }

    return shuffled(pool.concat([w]), w.i + 13).map(x => ({ i: x.i, label: shown(x), correct: x.i === w.i }));
  }
  prepare() {
    const mode = this.mode();
    const cur = this.current();
    // Turn A is shown fully revealed from the start — no "نمایش معنی" gate,
    // just the single "ادامه" continue button (point 1): English word, IPA,
    // audio, Persian meaning, example sentence and translation together.
    const ilTurn = cur ? this.ilTurnFor(cur.i) : null;
    const st = { showBack: ilTurn === 'A', picked: null, typed: '', checked: false, correct: null, options: [], msText: '', msErr: '', msOpen: false, editEn: null };
    if (mode === 'mcq' || mode === 'cloze' || mode === 'fa2en') st.options = this.buildOptions();
    this.setState(st, () => {
      const w = this.current();
      if (mode === 'listen' && w) setTimeout(() => this.speakWord(w.en), 300);
    });
  }

  intervalLabel(w, rating) {
    if (!w || rating === 0) return 'در همین جلسه';
    const r = this.srRec(w.i), successes = (r ? r[0] : 0) + 1;
    const base = [1, 1, 3, 7, 21, 60][Math.min(successes, 5)];
    const ease = r ? (r[7] || 1) : 1;
    const days = Math.max(1, Math.round(base * (rating === 1 ? .65 : (rating === 3 ? 1.7 : 1)) * ease));
    return days === 1 ? 'فردا' : days + ' روز دیگر';
  }

  advance(wasCorrect, rating) {
    const w = this.current(); if (!w) return;
    const mode = this.mode();
    // flash is an introduction, not a retrieval — its self-rating never scores.
    const wasKnown = this.srKnown(w.i);
    if (mode === 'flash') this.srIntroduce(w.i, rating == null ? 2 : rating);
    const counted = mode !== 'flash' && this.srMark(w.i, wasCorrect, mode, rating == null ? 2 : rating);
    // Announced once, the moment the criterion is actually met.
    const justKnown = counted && wasCorrect && !wasKnown && this.srKnown(w.i);
    this.set(d => {
      const stats = d.dayStats[today()] || (d.dayStats[today()] = { introduced: 0, correct: 0, wrong: 0 });
      if (mode === 'flash') stats.introduced++;
      else {
        d.seen++;
        if (wasCorrect) { d.correct++; stats.correct++; d.mastered[w.i] = (d.mastered[w.i] || 0) + 1; }
        else { d.wrong++; stats.wrong++; }
      }
      if (!wasCorrect || rating === 0) {
        const at = Math.min(d.pos + 6, d.order.length);
        d.order = d.order.slice(0, at).concat([w.i], d.order.slice(at));
      }
      d.days[today()] = (d.days[today()] || 0) + 1;
      d.pos = d.pos + 1;
    }, { justKnown: justKnown ? w.en : '' }, () => this.afterCard());
  }
  // LEG-003 — the shared "what happens after any card is answered" tail,
  // used by both advance() (existing reviews/flash) and ilAdvance() (the new
  // Initial-Learning turns).
  // LEG-009 — the old soft daily card-count goal (kind:'goal', "۲۰ کارت
  // دیگر") is gone entirely: the product owner asked for it removed, not
  // adjusted. A session now runs uninterrupted until the specific lesson the
  // learner picked in the browser (startLessonPractice()) is actually
  // finished — lessonStats().fresh === 0 is exactly LEG-002/003's existing
  // "every word in this lesson finished Initial Learning and is in
  // vocab_sr_v1" definition, reused verbatim, not reinvented. d.goal itself
  // is left in the data shape (load() still defaults it) and still drives
  // the passive "امروز X از Y" home-screen stat (renderVals() below) — only
  // the interruption screen is gone; nothing ever increments d.goal anymore
  // since the "۲۰ کارت دیگر" action that used to do that no longer exists.
  afterCard() {
    const d = this.state.data;
    if (this.lessonStats(d.level, d.unit, d.lesson).fresh === 0) {
      return this.setState({ screen: 'result', result: { kind: 'lesson' } });
    }
    if (d.pos >= d.order.length) return this.extendQueue(() => this.afterCard());
    const mile = Math.floor(d.seen / QUIZ_EVERY);
    if (mile > 0 && d.seen % QUIZ_EVERY === 0 && !d.quizzes['seen:' + mile]) return this.startQuiz(mile);
    this.prepare();
  }
  // LEG-003 — Initial Learning turn completion. Deliberately not advance():
  // Turn A/B never touch vocab_sr_v1 (see srCompleteInitialLearning, called
  // only on a correct Turn C); a wrong Turn B/C never shows "دوباره" (point
  // 3) — it silently reschedules the same turn a few cards later instead,
  // up to IL_MAX_FAILS times before the word is marked 'unfinished' for this
  // lesson (point 4).
  ilAdvance(turn, wasCorrect) {
    const w = this.current(); if (!w) return;
    const il = this.ilLoad();
    const rec = il.words[w.i] || (il.words[w.i] = { turn: turn, fails: 0 });
    let gapMin = 0, gapMax = 0, reschedule = false;
    if (turn === 'A') {
      rec.turn = 'B'; rec.fails = 0;
      gapMin = IL_GAP_B_MIN; gapMax = IL_GAP_B_MAX; reschedule = true;
    } else if (turn === 'B' || turn === 'C') {
      if (wasCorrect) {
        if (turn === 'B') { rec.turn = 'C'; rec.fails = 0; gapMin = IL_GAP_C_MIN; gapMax = IL_GAP_C_MAX; reschedule = true; }
        else { this.srCompleteInitialLearning(w.i); rec.turn = 'done'; }
      } else {
        rec.fails = (rec.fails || 0) + 1;
        if (rec.fails >= IL_MAX_FAILS) { rec.turn = 'unfinished'; }
        else { gapMin = IL_RETRY_GAP_MIN; gapMax = IL_RETRY_GAP_MAX; reschedule = true; }
      }
    }
    this.ilSave();
    this.set(d => {
      const stats = d.dayStats[today()] || (d.dayStats[today()] = { introduced: 0, correct: 0, wrong: 0 });
      if (turn === 'A') stats.introduced++;
      else {
        d.seen++;
        if (wasCorrect) { d.correct++; stats.correct++; d.mastered[w.i] = (d.mastered[w.i] || 0) + 1; }
        else { d.wrong++; stats.wrong++; }
      }
      if (reschedule) this.ilSchedule(d, w.i, gapMin, gapMax);
      d.days[today()] = (d.days[today()] || 0) + 1;
      d.pos = d.pos + 1;
    }, { justKnown: '' }, () => this.afterCard());
  }
  // LEG-002 — replaces nextRound(). Advances lesson -> unit -> level exactly
  // like a textbook's table of contents, using the same "no fresh words left
  // in the current queue" trigger nextRound() used, just scoped to the
  // current LESSON_SIZE-word lesson instead of the whole level band (which
  // word actually gets shown when is still chunkOrder()'s job, unchanged —
  // that is session-engine scope, not this task's).
  // Factored out of nextLesson() so LEG-003's extendQueue() can reuse the
  // exact same "advance lesson -> unit -> level" trigger and math, instead
  // of a second copy that could drift from this one.
  advanceLessonIfDone(d) {
    const stats = this.lessonStats(d.level, d.unit, d.lesson);
    if (!stats.fresh) return;
    const lessonsInUnit = this.lessonsInUnit(d.level, d.unit);
    if (d.lesson < lessonsInUnit) {
      d.lesson += 1;
    } else {
      const unitsInLvl = this.unitsInLevel(d.level), li = LEVELS.indexOf(d.level);
      if (d.unit < unitsInLvl) { d.unit += 1; d.lesson = 1; }
      else if (li < LEVELS.length - 1) { d.level = LEVELS[li + 1]; d.unit = 1; d.lesson = 1; }
      // else: last lesson of the last unit of the last level with nothing
      // fresh left anywhere — hold position, same as nextRound() never
      // advancing band past the final level.
    }
    d.round = this.roundForLevel(d.level);
  }
  // LEG-009 note: the redesigned flow (lesson browser + explicit
  // startLessonPractice() below) no longer calls nextLesson() from live UI —
  // every study session now starts from a learner's explicit lesson pick,
  // never an automatic "whatever is next" jump. Left defined (unmodified)
  // rather than deleted: advanceLessonIfDone() below still backs
  // advanceLevel()'s explicit "go to the next level" action, and removing a
  // still-correct, previously-verified (LEG-002) helper is a separate
  // cleanup this task did not ask for.
  // Scans forward from `fromLevel` (never backward — a learner is never
  // dropped into content easier than what they are already placed at) for
  // the first unlocked, not-yet-complete lesson, crossing level boundaries
  // once a level's own lessons run out. Shared by nextLesson() and
  // startLessonPractice() below so the "nothing left to study" dead end
  // only fires when EVERY level through C2 is genuinely exhausted, not the
  // moment one lesson (or one level) happens to already be fully introduced.
  nextAvailableLesson(fromLevel) {
    for (let li = LEVELS.indexOf(fromLevel); li < LEVELS.length; li++) {
      const L = LEVELS[li];
      const next = this.lessonProgress(L).find(x => x.unlocked && !x.complete);
      if (next) return { level: L, unit: next.u, lesson: next.les };
    }
    return null;
  }
  nextLesson() {
    const n = this.W.length;
    this.set(d => {
      this.advanceLessonIfDone(d);
      d.pos = 0; d.wordCount = n;
      d.order = this.chunkOrder(d, n);
      // Same empty-queue trap startLessonPractice() was patched for: the
      // lesson advanceLessonIfDone() lands on can itself already be fully
      // introduced (e.g. it was studied from the lesson browser earlier),
      // so chunkOrder() comes back empty here too. Fall back to the next
      // unlocked, not-yet-complete lesson — anywhere from here through C2 —
      // instead of sending the home screen's "شروع جلسهٔ امروز" straight to
      // "امروز تموم شده" while thousands of untouched words remain.
      if (!d.order.length) {
        const next = this.nextAvailableLesson(d.level);
        if (next && (next.level !== d.level || next.unit !== d.unit || next.lesson !== d.lesson)) {
          d.level = next.level; d.unit = next.unit; d.lesson = next.lesson;
          d.round = this.roundForLevel(next.level);
          d.order = this.chunkOrder(d, n);
        }
      }
    }, { screen: 'study', result: null }, () => {
      // No more "امروز تموم شد" dead end here — see the kind:'empty' removal
      // note above extendQueue() below for why. Every level through C2 was
      // already searched by nextAvailableLesson() above; if d.order is
      // STILL empty at this point every level really is exhausted for
      // today, so there is nothing to study — quietly return to the lesson
      // browser instead of interrupting with a page that has no action a
      // learner can actually take beyond "go back".
      if (!this.state.data.order.length) this.setState({ screen: 'lessons', result: null });
      else this.prepare();
    });
  }
  // LEG-009 — explicit per-lesson practice start, chosen from the lesson
  // browser. Replaces the old "goal reached" flow's implicit continuation:
  // the learner always picks the exact (level, unit, lesson), the app never
  // silently decides for them. If the chosen lesson is already the active
  // one and mid-session (some cards still unanswered), resume it as-is
  // instead of rebuilding d.order — a rebuild would drop any word already
  // mid Initial-Learning (turn B/C already scheduled by ilSchedule() into
  // the existing order), since chunkOrder()'s fresh-word filter (isFresh())
  // deliberately skips any word that already has a vocab_session_v1 record.
  startLessonPractice(L, unit, lesson) {
    const cur = this.state.data;
    if (cur.level === L && cur.unit === unit && cur.lesson === lesson && cur.order.length && cur.pos < cur.order.length) {
      this.setState({ screen: 'study', result: null }, () => this.prepare());
      return;
    }
    const n = this.W.length;
    this.set(d => {
      d.level = L; d.unit = unit; d.lesson = lesson;
      d.round = this.roundForLevel(L);
      d.pos = 0; d.wordCount = n;
      d.order = this.chunkOrder(d, n);
      // Same bug lbContinueTarget() was patched for (see its comment above):
      // a lesson that is already fully introduced with nothing due yet
      // yields an empty chunkOrder(), even though the level (or a later one)
      // has plenty of untouched lessons left. Fall back to the next
      // unlocked, not-yet-complete lesson anywhere from here through C2
      // instead of stranding the learner on "مرورهای امروز تمام شده" moments
      // after tapping a lesson.
      if (!d.order.length) {
        const next = this.nextAvailableLesson(d.level);
        if (next && (next.level !== d.level || next.unit !== d.unit || next.lesson !== d.lesson)) {
          d.level = next.level; d.unit = next.unit; d.lesson = next.lesson;
          d.round = this.roundForLevel(next.level);
          d.order = this.chunkOrder(d, n);
        }
      }
    }, { screen: 'study', result: null }, () => {
      // Same as nextLesson() above: no dead-end screen, ever. Land back on
      // the lesson browser instead.
      if (!this.state.data.order.length) this.setState({ screen: 'lessons', result: null });
      else this.prepare();
    });
  }
  // LEG-009 — once every lesson of every unit in the current level is
  // complete, the lesson browser has nothing left to offer; this is the one
  // place a level actually advances now, and it is an explicit tap
  // (lbAdvanceLevel in lessonBrowserVals()), never automatic. Reuses
  // advanceLessonIfDone() (LEG-002) exactly as-is — that function already
  // knows how to cascade lesson -> unit -> level when lessonStats().fresh
  // is 0 for the current position, which is guaranteed true here.
  advanceLevel() {
    // LEG-010 — also drop the browser's level-tab selection back to "follow
    // d.level" (null), so advancing lands the view on the newly-current
    // level instead of leaving it stuck on the just-finished one.
    this.set(d => { this.advanceLessonIfDone(d); }, { lbUnit: 0, lbLv: null });
  }
  // LEG-003 point 2 (superseded by LEG-009 — see afterCard()): APPEND more
  // due reviews onto the existing d.order and keep d.pos where it is,
  // instead of ending the session, when the queue runs dry but the active
  // lesson (afterCard() already checked) is not yet complete. Appending
  // rather than replacing is what keeps any Initial-Learning turn already
  // spliced into d.order intact. No longer advances the lesson itself here
  // (that was LEG-003's soft-goal auto-continue) — advanceLessonIfDone() is
  // never called from this path anymore; afterCard() already returns the
  // "این درس تمام شد" result the moment the active lesson finishes, before
  // extendQueue() would ever run for it.
  //
  // Product owner call, 2026-08-18: the kind:'empty' "امروز تموم شد" result
  // card is removed for good — every call site that used to show it (here,
  // startLessonPractice(), nextLesson()) now falls back to the lesson
  // browser silently instead. It kept resurfacing even after two rounds of
  // root-cause fixes (LEG-032/033/034 shrank how OFTEN it fired but could
  // never prove it to zero — extendQueue()'s dry-queue case in particular is
  // a legitimate everyday state, not a bug, so patching root causes forever
  // was the wrong strategy). A dead-end interruption page whose only action
  // is "go back" has no reason to exist when the destination it names can
  // just be the destination.
  extendQueue(done) {
    const n = this.W.length;
    let grew = false;
    this.set(d => {
      const before = d.order.length;
      const more = this.chunkOrder(d, n).filter(i => d.order.indexOf(i) < 0);
      if (more.length) d.order = d.order.concat(more);
      grew = d.order.length > before;
    }, {}, () => {
      if (!grew) return this.setState({ screen: 'lessons', result: null });
      done();
    });
  }

  startQuiz(mile) {
    const d = this.state.data;
    const uniq = Object.keys(this.srLoad()).filter(k => Array.isArray(this.srLoad()[k]))
      .map(Number).filter(wi => this.W[wi] && this.W[wi].fa && this.srRec(wi)[4]);
    const pick = shuffled(uniq, mile * 977 + d.round).slice(0, QUIZ_LEN);
    if (pick.length < 4) return this.prepare();
    const withFa = this.W.filter(x => x.fa);
    const qs = pick.map((wi, k) => {
      const w = this.W[wi];
      const dir = k % 2 === 0 ? 'en2fa' : 'fa2en';
      const src = withFa.filter(x => x.i !== w.i && x.cat === w.cat);
      const pool = src.length >= 5 ? src : withFa;
      const r = mulberry(w.i * 31 + k);
      const dis = []; let guard = 0;
      while (dis.length < 3 && guard++ < 200) { const c = pool[Math.floor(r() * pool.length)]; if (c.i !== w.i && !dis.some(x => x.i === c.i)) dis.push(c); }
      return { wi, dir, opts: shuffled(dis.concat([w]), w.i + k).map(x => ({ i: x.i, label: dir === 'en2fa' ? x.fa : x.en, correct: x.i === w.i })) };
    });
    this.setState({ screen: 'quiz', quiz: { mile, qs, k: 0, picked: null, right: 0, missed: [] } });
  }
  quizPick(oi) {
    const q = this.state.quiz; if (!q || q.picked != null) return;
    const cur = q.qs[q.k], opt = cur.opts[oi];
    const nq = Object.assign({}, q, { picked: oi, right: q.right + (opt.correct ? 1 : 0) });
    if (!opt.correct) nq.missed = q.missed.concat([cur.wi]);
    this.setState({ quiz: nq });
    if (cur.dir === 'fa2en') this.speakWord(this.W[cur.wi].en);
  }
  quizAdvance() {
    const q = this.state.quiz; if (!q || q.picked == null) return;
    if (q.k + 1 < q.qs.length) return this.setState({ quiz: Object.assign({}, q, { k: q.k + 1, picked: null }) });
    const score = q.right / q.qs.length, passed = score >= PASS;
    this.set(d => {
      // Record every attempt, not just passes. The milestone only fires on an
      // exact pos match, so a failed quiz left no trace and the checkpoint was
      // silently lost the moment the learner carried on reviewing.
      const key = 'seen:' + q.mile, pct = Math.round(score * 100);
      d.quizzes[key] = Math.max(d.quizzes[key] || 0, pct);
      q.missed.forEach(wi => { const at = Math.min(d.pos + 5, d.order.length); d.order = d.order.slice(0, at).concat([wi], d.order.slice(at)); });
    }, { screen: 'result', quiz: null, result: { kind: 'quiz', score: Math.round(score * 100), passed, mile: q.mile, missed: q.missed } });
  }

  // ---- level placement ----
  // A short probe per CEFR level: 6 vocabulary items (from the hand-leveled
  // PLACEMENT_WORDS, not the unleveled main word order) + 3 grammar items
  // (GRAM[L].choose — already CEFR-authored, with a Persian `why` rationale
  // shown as feedback on a miss). Levels run in order starting at A1;
  // failing a level's bar stops the test there, rather than making a
  // beginner sit through six levels' worth of items they were never going
  // to know. Every attempt draws a fresh random seed (docs/placement-test-
  // methodology.md §8.7) — a fixed seed meant every learner, forever, saw
  // the exact same 30 items.
  placementVocabQs(L, seed) {
    const bank = (PLACEMENT_WORDS[L] || []).slice();
    if (bank.length < 4) return [];
    const pick = shuffled(bank, seed).slice(0, PLACEMENT_VOCAB_N);
    return pick.map((w, k) => {
      const others = bank.filter(x => x.i !== w.i);
      const r = mulberry(seed + w.i * 17 + k);
      const dis = []; let guard = 0;
      while (dis.length < 3 && guard++ < 200) {
        const c = others[Math.floor(r() * others.length)];
        if (c && !dis.some(d => d.i === c.i)) dis.push(c);
      }
      const opts = shuffled(dis.concat([w]), w.i + k).map(x => ({ label: x.fa, correct: x.i === w.i }));
      return { kind: 'vocab', prompt: w.en, opts };
    });
  }
  placementGramQs(L, seed) {
    const pool = [];
    this.gramLessons(L).forEach(les => (les.choose || []).forEach((c, idx) => pool.push({ les, c, idx })));
    if (!pool.length) return [];
    const pick = shuffled(pool, seed + 91).slice(0, PLACEMENT_GRAM_N);
    return pick.map(({ les, c, idx }) => ({
      kind: 'gram', prompt: c.q, why: c.why || '',
      opts: c.opts.map((label, i) => ({ label, correct: i === c.a })),
      key: les.id + ':' + idx
    }));
  }
  placementQs(L, seed) {
    const items = this.placementVocabQs(L, seed).concat(this.placementGramQs(L, seed));
    return items.length >= 4 ? shuffled(items, seed + 7) : [];
  }
  startPlacement() {
    const seed = Date.now() ^ Math.floor(Math.random() * 1e9);
    const qs = this.placementQs('A1', seed);
    if (!qs.length) return;
    this.setState({ screen: 'placement', placement: { level: 'A1', li: 0, seed, qs, k: 0, picked: null, right: 0, vocabRight: 0, gramRight: 0, results: [] } });
  }
  placementPick(oi) {
    const p = this.state.placement; if (!p || p.picked != null) return;
    const q = p.qs[p.k], opt = q.opts[oi], correct = !!opt.correct;
    // LEG-007: keep the combined right-count (still drives the existing
    // per-level ladder below, unchanged) but also tally vocab/grammar items
    // separately, since q.kind already tells them apart and that is the only
    // thing the split scoring in placementAdvance() needs.
    const patch = { picked: oi, right: p.right + (correct ? 1 : 0) };
    if (q.kind === 'vocab') patch.vocabRight = (p.vocabRight || 0) + (correct ? 1 : 0);
    else patch.gramRight = (p.gramRight || 0) + (correct ? 1 : 0);
    this.setState({ placement: Object.assign({}, p, patch) });
  }
  placementAdvance() {
    const p = this.state.placement; if (!p || p.picked == null) return;
    if (p.k + 1 < p.qs.length) {
      this.setState({ placement: Object.assign({}, p, { k: p.k + 1, picked: null }) });
      return;
    }
    const total = p.qs.length, score = total ? p.right / total : 0;
    const vocabTotal = p.qs.filter(q => q.kind === 'vocab').length;
    const gramTotal = p.qs.filter(q => q.kind === 'gram').length;
    const results = p.results.concat([{
      level: p.level, right: p.right, total,
      vocabRight: p.vocabRight || 0, vocabTotal,
      gramRight: p.gramRight || 0, gramTotal
    }]);
    const nextLi = p.li + 1;
    if (score >= PLACEMENT_PASS && nextLi < LEVELS.length) {
      const qs = this.placementQs(LEVELS[nextLi], p.seed + nextLi * 613);
      if (qs.length) {
        this.setState({ placement: { level: LEVELS[nextLi], li: nextLi, seed: p.seed, qs, k: 0, picked: null, right: 0, vocabRight: 0, gramRight: 0, results } });
        return;
      }
    }
    // LEG-007 — docs/placement-test-methodology.md §6.1/§8.5: report two
    // independent dimensions instead of one combined finalLevel. Each is
    // "the highest tested level that passed on that dimension's own accuracy"
    // — still bounded to the levels the combined ladder actually administered
    // (it never re-tests a level once the ladder stops), exactly like the
    // old finalLevel was. finalLevel itself is kept only for the existing
    // per-level pass/fail breakdown display, which still reflects the
    // combined ladder rule that decided which levels got tested.
    const finalLevel = results.filter(x => x.total && x.right / x.total >= PLACEMENT_PASS).map(x => x.level).pop() || 'A1';
    const finalVocabLevel = results.filter(x => x.vocabTotal && x.vocabRight / x.vocabTotal >= PLACEMENT_VOCAB_PASS).map(x => x.level).pop() || 'A1';
    const finalGramLevel = results.filter(x => x.gramTotal && x.gramRight / x.gramTotal >= PLACEMENT_GRAM_PASS).map(x => x.level).pop() || 'A1';
    this.setState({ placement: Object.assign({}, p, { results, done: true, finalLevel, finalVocabLevel, finalGramLevel, overrideLevel: null }) });
  }
  // A manual, always-available correction to the recommended split (methodology
  // doc §6.2/§8.3/§8.4 "place low, report a range, always offer an override",
  // adapted without the full θ/SE range machinery: here it is simply a level
  // the learner can pick instead of the two computed dimensions). Picking the
  // already-selected level again clears the override and returns to the
  // computed recommendation. A manual choice is a single deliberate decision,
  // not a second measurement, so it applies uniformly to every section below
  // rather than being split/minned like the computed result is.
  placementSetOverride(L) {
    const p = this.state.placement; if (!p || !p.done) return;
    this.setState({ placement: Object.assign({}, p, { overrideLevel: p.overrideLevel === L ? null : L }) });
  }
  applyPlacement() {
    const p = this.state.placement; if (!p || !p.finalVocabLevel || !p.finalGramLevel) return;
    const n = this.W.length;
    const li = L => Math.max(0, LEVELS.indexOf(L));
    // LEG-007 — docs/placement-test-methodology.md §8.5's table, adapted to
    // this app's already-implemented sequential 9-item ladder (no θ/SE
    // estimator, that is explicitly out of scope): vocabulary and grammar are
    // the only two dimensions this test actually collected evidence for, so
    // they drive d.level (+ d.round mirror) and gLv/sbLv independently.
    // Listening, discussion, jobs and free practice get no direct evidence —
    // they are placed at min(vocab, structure) rather than either number
    // alone, so the app never implies a measurement it did not make. A
    // manual override (placementSetOverride) is a single explicit choice and
    // applies the same way everywhere, superseding both computed dimensions.
    const vocabLevel = p.overrideLevel || p.finalVocabLevel;
    const structLevel = p.overrideLevel || p.finalGramLevel;
    const conservLevel = LEVELS[Math.min(li(vocabLevel), li(structLevel))];
    // LEG-011 — product owner: after placement, every level below the placed
    // one must show as fully complete in the lesson browser (LEG-009/010),
    // not just invisible/never-introduced. Bulk-complete Initial Learning for
    // every word below vocabLevel in one batched vocab_sr_v1 write, before
    // building the placed level's own (untouched, normal, locked-by-lesson)
    // queue below. Applies identically whether vocabLevel came from the
    // computed result or the manual override chip (both already collapse to
    // the same `vocabLevel` above).
    const belowWords = this.wordsBelowLevel(vocabLevel);
    if (belowWords.length) this.srBulkCompleteInitialLearning(belowWords);
    this.set(d => {
      d.level = vocabLevel; d.unit = 1; d.lesson = 1;
      d.round = this.roundForLevel(vocabLevel);
      d.pos = 0;
      d.order = this.chunkOrder(d, n);
    }, {
      screen: 'study', placement: null,
      // d.round alone unlocks every section (each *LevelUnlocked() now checks
      // it), but grammar/sentence/listening/discussion/jobs each also
      // remember their own last-viewed level in state — overwrite those too,
      // or a section visited earlier this session would keep showing its old
      // level instead of picking up the placement result.
      gLv: structLevel, sbLv: structLevel, lsLv: conservLevel, dLv: conservLevel,
      jobLevel: conservLevel, practiceLv: conservLevel
    }, () => {
      if (!this.state.data.order.length) this.setState({ screen: 'home' });
      else this.prepare();
    });
  }
  skipPlacement() { this.setState({ screen: 'home', placement: null }); }

  check() {
    const w = this.current(); if (!w) return;
    const ok = norm(this.state.typed) === norm(w.en);
    this.setState({ checked: true, correct: ok, showBack: true });
    if (!ok) this.speakWord(w.en);
  }

  // ===== exercises (speaking / listening / writing) =====
  startEx(type) {
    const cat = this.state.catFilter;
    const pool = this.W.filter(w => w.cat === cat && w.fa);
    if (pool.length < 4) return;
    const items = shuffled(pool, (Date.now() % 100000) + 7).slice(0, 8);
    this.setState({ screen: 'exercise', ex: { type, cat, items, k: 0, picked: null, typed: '', checked: false, correct: null, right: 0, opts: [], recState: 'idle', heard: '', speechScore: null, speechMissing: [], audioUrl: '', done: false } }, () => this.exPrepare());
  }
  exSet(patch, cb) { this.setState(s => ({ ex: Object.assign({}, s.ex, patch) }), cb); }
  exPrepare() {
    const ex = this.state.ex; if (!ex) return;
    const w = ex.items[ex.k];
    let opts = [];
    if (ex.type === 'listen') {
      const same = this.W.filter(x => x.fa && x.cat === ex.cat && x.en !== w.en);
      const pool = same.length >= 6 ? same : this.W.filter(x => x.fa && x.en !== w.en);
      const r = mulberry(w.i * 131 + ex.k + 3);
      const dis = []; let g = 0;
      while (dis.length < 3 && g++ < 300) { const c = pool[Math.floor(r() * pool.length)]; if (c && !dis.some(p => p.en === c.en)) dis.push(c); }
      // Keep "en": without it a wrong answer can never say which word the
      // meaning you picked actually belongs to.
      opts = shuffled(dis.concat([w]), w.i + 17).map(x => ({ label: x.fa, en: x.en, correct: x.en === w.en }));
    }
    this.exSet({ picked: null, typed: '', checked: false, correct: null, opts, recState: 'idle', heard: '', speechScore: null, speechMissing: [], audioUrl: '' }, () => {
      if (ex.type === 'listen') setTimeout(() => this.speakWord(w.en), 350);
    });
  }
  exPick(i) {
    const ex = this.state.ex; if (!ex || ex.picked != null) return;
    const ok = !!ex.opts[i].correct;
    this.exSet({ picked: i, correct: ok, checked: true, right: ex.right + (ok ? 1 : 0) });
    this.speakWord(ex.items[ex.k].en);
  }
  exCheckTyped() {
    const ex = this.state.ex; if (!ex || ex.checked) return;
    const w = ex.items[ex.k];
    const ok = norm(ex.typed) === norm(w.en);
    this.exSet({ checked: true, correct: ok, right: ex.right + (ok ? 1 : 0) });
    if (!ok) this.speakWord(w.en);
  }
  exNext() {
    const ex = this.state.ex; if (!ex || !ex.checked) return;
    if (ex.k + 1 < ex.items.length) this.exSet({ k: ex.k + 1 }, () => this.exPrepare());
    else { this.addXp(ex.right * 5); this.exSet({ done: true }); }
  }
  exRecord() {
    const ex = this.state.ex; if (!ex || ex.checked) return;
    const w = ex.items[ex.k];
    if (this.rec) { try { this.rec.abort(); } catch (e) {} }
    this.exSet({ recState: 'listening', heard: '', speechScore: null, speechMissing: [] });
    let gotText = false, finalized = false;
    const rec = this.startOnlineSpeech({ target: w.en,
      onText: (text, isFinal) => {
        gotText = true;
        const match = this.speechMatch(text, w.en);
        this.exSet({ heard: text, speechScore: match.score, speechMissing: match.missing });
        if (!isFinal) return;
        const exNow = this.state.ex; if (!exNow || exNow.checked) return;
        const ok = match.score >= 75;
        finalized = true;
        this.exSet({ recState: 'done', checked: true, correct: ok, right: exNow.right + (ok ? 1 : 0) });
        if (!ok) this.speakWord(w.en);
      },
      onError: err => {
        if (err === 'not-allowed' || err === 'service-not-allowed') return this.exSet({ recState: 'denied' });
        if (err === 'no-speech') return this.exSet({ recState: 'nospeech' });
        if (!gotText) this.exRecordAudio();
      },
      onEnd: () => {
        const now = this.state.ex; if (!now || now.recState !== 'listening') return;
        if (finalized) return;
        if (!gotText || !now.heard) return this.exSet({ recState: 'nospeech' });
        const match = this.speechMatch(now.heard, w.en), ok = match.score >= 75;
        this.exSet({ recState: 'done', checked: true, correct: ok, speechScore: match.score,
          speechMissing: match.missing, right: now.right + (ok ? 1 : 0) });
        if (!ok) this.speakWord(w.en);
      }
    });
    this.rec = rec;
    if (!rec) this.exRecordAudio();
  }
  exRecordAudio() {
    if (!navigator.mediaDevices || !window.MediaRecorder) return this.exSet({ recState: 'error' });
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mr = new MediaRecorder(stream); this.mr = mr;
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const url = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));
        this.exSet({ recState: 'review', audioUrl: url });
      };
      mr.start();
      this.exSet({ recState: 'recording' });
      setTimeout(() => { if (mr.state !== 'inactive') mr.stop(); }, 4000);
    }).catch(() => this.exSet({ recState: 'error' }));
  }
  exSelf(ok) {
    const ex = this.state.ex; if (!ex || ex.checked) return;
    this.exSet({ checked: true, correct: ok, recState: 'done', right: ex.right + (ok ? 1 : 0) });
  }
  addXp(n) { const g = this.gameLoad(); g.xp = (g.xp || 0) + n; try { localStorage.setItem('vocab_game', JSON.stringify(g)); } catch (e) {} }
  gameLoad() { try { return JSON.parse(localStorage.getItem('vocab_game') || '{}') || {}; } catch (e) { return {}; } }
  gameSaveBest(score) { const g = this.gameLoad(); if (score > (g.best || 0)) { g.best = score; try { localStorage.setItem('vocab_game', JSON.stringify(g)); } catch (e) {} } }

  // ===== matching game =====
  startGame(cat, lv) {
    const g = this.gameLoad();
    this.setState({ screen: 'game', game: { cat: cat || 'all', lv: lv || null, level: 1, score: 0, lives: 3, best: g.best || 0, tiles: [], sel: null, matchedN: 0, over: false, won: false, t0: Date.now() } }, () => this.gameLevel(1, 0, 3));
  }
  gameLevel(level, score, lives) {
    const gm = this.state.game; if (!gm) return;
    const levelWords = gm.lv ? this.levelWordIndices(gm.lv) : null;
    // LEG-015 — an "all levels" game still has to stay inside the taught
    // vocabulary; without this the category-only game drew from the whole
    // 10,524-entry catalog, junk included.
    const teachable = this.teachableSet();
    const pool = this.W.filter(w => w.fa && (gm.cat === 'all' || w.cat === gm.cat)
      && (!levelWords || levelWords.has(w.i))
      && (!teachable.size || teachable.has(w.i) || w.i >= this.BASE.length));
    const pairs = shuffled(pool, (Date.now() % 99991) + level * 13).slice(0, 6);
    const tiles = shuffled(
      pairs.map((w, i) => ({ pair: i, label: w.en, en: true, state: '' })).concat(
      pairs.map((w, i) => ({ pair: i, label: w.fa, en: false, state: '' }))), level * 613 + 7);
    this.setState({ game: Object.assign({}, gm, { level, score, lives, tiles, sel: null, matchedN: 0, over: false, won: false, t0: Date.now() }) });
  }
  gameTap(idx) {
    const gm = this.state.game; if (!gm || gm.over || gm.won) return;
    const tiles = gm.tiles.map(t => Object.assign({}, t));
    const t = tiles[idx];
    if (t.state === 'done' || t.state === 'wrong') return;
    if (gm.sel == null) {
      t.state = 'sel';
      if (t.en) this.speakWord(t.label);
      return this.setState({ game: Object.assign({}, gm, { tiles, sel: idx }) });
    }
    if (idx === gm.sel) { t.state = ''; return this.setState({ game: Object.assign({}, gm, { tiles, sel: null }) }); }
    const prev = tiles[gm.sel];
    if (t.en === prev.en) {
      prev.state = ''; t.state = 'sel';
      if (t.en) this.speakWord(t.label);
      return this.setState({ game: Object.assign({}, gm, { tiles, sel: idx }) });
    }
    if (t.pair === prev.pair) {
      prev.state = 'done'; t.state = 'done';
      const matchedN = gm.matchedN + 1;
      let score = gm.score + 10;
      // Boards are sized from the category, which may hold fewer than 6 pairs.
      const done = matchedN === gm.tiles.length / 2;
      if (done) { const secs = (Date.now() - gm.t0) / 1000; score += Math.max(0, Math.round(40 - secs)); }
      this.setState({ game: Object.assign({}, gm, { tiles, sel: null, matchedN, score, won: done }) }, () => {
        if (done) {
          this.addXp(10); this.gameSaveBest(score);
          setTimeout(() => { const g2 = this.state.game; if (g2 && g2.won && !g2.over) this.gameLevel(g2.level + 1, g2.score, g2.lives); }, 1400);
        }
      });
    } else {
      prev.state = 'wrong'; t.state = 'wrong';
      const lives = gm.lives - 1;
      this.setState({ game: Object.assign({}, gm, { tiles, sel: null, lives, over: lives <= 0 }) }, () => {
        if (lives <= 0) return this.gameSaveBest(this.state.game.score);
        setTimeout(() => {
          const g2 = this.state.game; if (!g2) return;
          const ts = g2.tiles.map(x => x.state === 'wrong' ? Object.assign({}, x, { state: '' }) : x);
          this.setState({ game: Object.assign({}, g2, { tiles: ts }) });
        }, 650);
      });
    }
  }

  exVals() {
    const s = this.state, ex = s.ex, gm = s.game;
    const gInfo = this.gameLoad();
    const btnCard = c => 'display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:11px;background:rgba(233,233,237,.03);border:1px solid ' + c + '3d;cursor:pointer;text-align:right';
    const iconSq = c => 'flex:none;width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:' + c + '1f;border:1px solid ' + c + '44;color:' + c + ';font-size:17px';
    const numS = 'flex:none;width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:rgba(233,233,237,.07);font-size:10.5px;font-family:Inter,sans-serif;color:rgba(233,233,237,.55)';
    const optS = (correct, isPicked, picked) => {
      let bd = 'rgba(233,233,237,.42)', bg = 'rgba(233,233,237,.03)', col = 'rgba(233,233,237,.88)';
      if (picked != null) {
        if (correct) { bd = 'rgba(143,217,193,.6)'; bg = 'rgba(143,217,193,.1)'; col = '#8fd9c1'; }
        else if (isPicked) { bd = 'rgba(217,143,143,.6)'; bg = 'rgba(217,143,143,.1)'; col = '#d98f8f'; }
      }
      return 'display:flex;align-items:center;gap:10px;width:100%;text-align:right;padding:12px 13px;border-radius:10px;background:' + bg + ';border:1px solid ' + bd + ';color:' + col + ';font-size:14px;cursor:pointer';
    };
    const out = {
      isExercise: s.screen === 'exercise' && !!ex,
      isGame: s.screen === 'game' && !!gm,
      goGame: () => this.startGame('all', this.state.practiceLv || 'A1'),
      gameXp: String(gInfo.xp || 0), gameBest: String(gInfo.best || 0),
      showCatPractice: ['all', '__star', '__learned'].indexOf(s.catFilter) < 0,
      catPracticeTitle: 'تمرین دستهٔ «' + this.catLabel(s.catFilter) + '»',
      catPracticeReady: this.W.filter(w => w.cat === s.catFilter && w.fa).length >= 4,
      catPracticeNote: this.W.filter(w => w.cat === s.catFilter && w.fa).length >= 4 ? 'گفتن، شنیدن، نوشتن یا بازی' : 'برای تمرین حداقل ۴ واژه لازم است',
      catPracticeBtns: [
        { label: 'گفتن', icon: 'ph-fill ph-microphone', c: '#e0879e', type: 'speak' },
        { label: 'شنیدن', icon: 'ph-fill ph-ear', c: '#84c5d9', type: 'listen' },
        { label: 'نوشتن', icon: 'ph-fill ph-pencil-line', c: '#8fc7a0', type: 'write' },
        { label: 'بازی', icon: 'ph-fill ph-game-controller', c: '#e0a458', type: 'game' }
      ].map(b => {
        const ready = this.W.filter(w => w.cat === s.catFilter && w.fa).length >= 4;
        return { label: b.label, icon: b.icon,
          style: 'display:flex;align-items:center;justify-content:center;gap:5px;padding:7px 10px;border-radius:8px;background:' + b.c + '12;border:1px solid ' + b.c + '55;color:' + b.c + ';font-size:11px' + (ready ? '' : ';opacity:.35;cursor:not-allowed'),
          go: () => { if (ready) return b.type === 'game' ? this.startGame(this.state.catFilter) : this.startEx(b.type); } };
      })
    };
    if (out.isExercise) {
      const w = ex.items[ex.k] || { en: '', fa: '' };
      const sent = w.ex ? { s: w.ex, fa: w.exfa || '' } : null;
      const names = { speak: 'گفتن', listen: 'شنیدن', write: 'نوشتن' };
      const icons = { speak: 'ph-fill ph-microphone', listen: 'ph-fill ph-ear', write: 'ph-fill ph-pencil-line' };
      out.exTitle = names[ex.type] + ' · ' + this.catLabel(ex.cat);
      out.exIcon = icons[ex.type];
      out.exPos = (ex.k + 1) + ' / ' + ex.items.length;
      out.exBarStyle = 'height:100%;width:' + Math.round(((ex.k + (ex.done ? 1 : 0)) / ex.items.length) * 100) + '%;background:linear-gradient(90deg,#9184d9,#b3a9e6);transition:width .3s';
      out.exQuit = () => this.setState({ screen: 'browse', ex: null });
      out.exDone = !!ex.done; out.exNotDone = !ex.done;
      let p = '', h = '', ltr = false;
      if (ex.type === 'listen') { p = ex.checked ? w.en : '• • • • •'; h = 'گوش کن؛ معنی درست کدام است؟'; ltr = true; }
      if (ex.type === 'speak') { p = w.en; h = 'دکمه‌ی میکروفون را بزن و لغت را بلند و شمرده بگو'; ltr = true; }
      if (ex.type === 'write') {
        const esc = w.en.replace(/[.*+?^$()|[\]\\]/g, m => '\\' + m).replace(/\{/g, '\\{').replace(/\}/g, '\\}');
        if (sent) { p = sent.s.replace(new RegExp('\\b' + esc + '\\b', 'ig'), '_____'); h = 'جای خالی را با املای درست پر کن — معنی: ' + w.fa; ltr = true; }
        else { p = w.fa; h = 'معادل انگلیسی را بنویس'; }
      }
      out.exPrompt = p; out.exHint = h;
      out.exPromptStyle = ltr
        ? 'font-family:Inter,sans-serif;font-size:' + (ex.type === 'write' && sent ? '19px' : '32px') + ';font-weight:600;letter-spacing:-.02em;direction:ltr;line-height:1.5'
        : 'font-size:26px;font-weight:500;line-height:1.5';
      out.exHasOpts = ex.type === 'listen' && ex.opts.length > 0;
      out.exOpts = ex.opts.map((o, i) => ({
        n: String(i + 1), label: o.label, numStyle: numS, style: optS(o.correct, i === ex.picked, ex.picked),
        mark: ex.picked == null ? '' : (o.correct ? 'ph-fill ph-check-circle' : (i === ex.picked ? 'ph-fill ph-x-circle' : '')),
        markStyle: 'font-size:16px;flex:none',
        pick: () => this.exPick(i)
      }));
      out.exHasInput = ex.type === 'write';
      out.exTyped = ex.typed;
      out.exOnType = e => this.exSet({ typed: e.target.value });
      out.exKey = e => { if (e.key === 'Enter') { if (!this.state.ex.checked) this.exCheckTyped(); else this.exNext(); } };
      out.exCheck = () => this.exCheckTyped();
      out.exInputStyle = 'width:100%;padding:13px 15px;border-radius:10px;font-family:Inter,sans-serif;direction:ltr;text-align:left;font-size:17px;background:rgba(233,233,237,.04);border:1px solid ' + (ex.checked ? (ex.correct ? 'rgba(143,217,193,.6)' : 'rgba(217,143,143,.6)') : 'rgba(233,233,237,.42)') + ';color:#e9e9ed;outline:none';
      out.exFeedback = ex.checked ? (ex.correct ? 'درست بود ✓' : 'درستش: ' + w.en) : '·';
      out.exFeedbackStyle = 'margin-top:8px;font-size:12.5px;min-height:18px;color:' + (ex.checked ? (ex.correct ? '#8fd9c1' : '#d98f8f') : 'transparent');
      out.exSpeak = () => this.speakWord(w.en);
      out.exSpeakSlow = () => this.speakWord(w.en, 0.55);
      out.exIsSpeak = ex.type === 'speak';
      out.exRec = () => this.exRecord();
      const busy = ex.recState === 'listening' || ex.recState === 'recording';
      out.exRecBtnStyle = 'width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:26px;cursor:pointer;background:' + (busy ? 'rgba(224,135,158,.25)' : 'rgba(224,135,158,.12)') + ';border:2px solid ' + (busy ? '#e0879e' : 'rgba(224,135,158,.5)') + ';color:#e0879e' + (busy ? ';box-shadow:0 0 0 8px rgba(224,135,158,.12)' : '');
      out.exRecLabel = ({ idle: 'برای ضبط بزن', listening: 'دارم گوش می‌دهم… حالا بگو', recording: 'در حال ضبط (۴ ثانیه)…', review: 'صدای خودت را گوش کن و نمره بده', done: 'ثبت شد', nospeech: 'صدایی نشنیدم — بلندتر و شمرده‌تر بگو', denied: 'اجازه‌ی میکروفون داده نشده — از نوار آدرس مرورگر اجازه بده', error: 'میکروفون در دسترس نیست — خودت نمره بده' })[ex.recState] || '';
      out.exHasHeard = !!ex.heard;
      out.exHeard = 'شنیده شد: «' + ex.heard + '»';
      out.exHeardStyle = 'font-family:Inter,sans-serif;direction:ltr;font-size:13px;color:' + (ex.correct ? '#8fd9c1' : '#e0a458');
      out.exHasSpeechScore = ex.speechScore != null;
      out.exSpeechScore = ex.speechScore != null ? 'تطبیق گفتار: ' + ex.speechScore + '٪' : '';
      out.exSpeechMissing = ex.speechMissing && ex.speechMissing.length ? 'واژه‌های شنیده‌نشده: ' + ex.speechMissing.join(' · ') : '';
      out.exHasSpeechMissing = !!(ex.speechMissing && ex.speechMissing.length);
      out.exHasAudio = !!ex.audioUrl;
      out.exAudioUrl = ex.audioUrl;
      out.exShowSelf = ex.type === 'speak' && !ex.checked && ['review', 'error', 'denied', 'nospeech'].indexOf(ex.recState) >= 0;
      out.exSelfOk = () => this.exSelf(true);
      out.exSelfNo = () => this.exSelf(false);
      out.exAnswered = !!ex.checked;
      out.exWordEn = w.en; out.exWordFa = w.fa;
      out.exHasSent = !!sent && !!ex.checked;
      out.exSentEn = sent ? sent.s : '';
      out.exSentFa = sent ? sent.fa : '';
      out.exHasSentFa = !!(sent && sent.fa);
      out.exNextGo = () => this.exNext();
      out.exNextLabel = ex.k + 1 < ex.items.length ? 'بعدی' : 'پایان و نتیجه';
      out.exNextStyle = 'display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;background:' + (ex.checked ? 'rgba(145,132,217,.14)' : 'transparent') + ';border:1px solid ' + (ex.checked ? '#9184d9' : 'rgba(233,233,237,.42)') + ';color:' + (ex.checked ? '#b3a9e6' : 'rgba(233,233,237,.55)');
      const pctE = ex.items.length ? Math.round((ex.right / ex.items.length) * 100) : 0;
      out.exScoreTitle = ex.right + ' از ' + ex.items.length + ' درست';
      out.exScoreDesc = (pctE >= 70 ? 'عالی! این دسته دارد جا می‌افتد. ' : 'اشکال ندارد — دوباره تمرین کن تا جا بیفتد. ') + (ex.right * 5) + ' امتیاز تجربه گرفتی.';
      out.exResIconStyle = 'width:56px;height:56px;margin:0 auto;border-radius:16px;display:grid;place-items:center;font-size:28px;background:' + (pctE >= 70 ? 'rgba(143,217,193,.12)' : 'rgba(224,164,88,.12)') + ';border:1px solid ' + (pctE >= 70 ? 'rgba(143,217,193,.4)' : 'rgba(224,164,88,.4)') + ';color:' + (pctE >= 70 ? '#8fd9c1' : '#e0a458');
      out.exRetry = () => this.startEx(ex.type);
      out.exBack = () => this.setState({ screen: this.navBack() || 'browse', ex: null });
    }
    if (out.isGame) {
      out.gLevel = 'مرحله ' + gm.level;
      out.gCatLabel = gm.lv ? ('سطح ' + gm.lv + ' · واژه‌های همین سطح') : (gm.cat === 'all' ? 'همه‌ی لغت‌ها' : 'دسته‌ی ' + this.catLabel(gm.cat));
      out.gScore = String(gm.score);
      out.gBest = 'رکورد: ' + Math.max(gm.best || 0, gm.score);
      out.gHearts = [0, 1, 2].map(i => ({ icon: i < gm.lives ? 'ph-fill ph-heart' : 'ph ph-heart', style: 'font-size:15px;color:' + (i < gm.lives ? '#d98f8f' : 'rgba(233,233,237,.2)') }));
      out.gPlaying = !gm.over; out.gOver = !!gm.over; out.gWon = !!gm.won && !gm.over;
      const tileS = t => {
        let bd = 'rgba(233,233,237,.42)', bg = 'rgba(233,233,237,.03)', col = 'rgba(233,233,237,.88)', op = '1';
        if (t.state === 'sel') { bd = '#9184d9'; bg = 'rgba(145,132,217,.14)'; col = '#b3a9e6'; }
        if (t.state === 'done') { bd = 'rgba(143,217,193,.3)'; bg = 'rgba(143,217,193,.05)'; col = 'rgba(143,217,193,.6)'; op = '.5'; }
        if (t.state === 'wrong') { bd = 'rgba(217,143,143,.6)'; bg = 'rgba(217,143,143,.12)'; col = '#d98f8f'; }
        return 'padding:12px 8px;border-radius:10px;min-height:56px;background:' + bg + ';border:1px solid ' + bd + ';color:' + col + ';font-size:' + (t.en ? '13.5px' : '13px') + ';cursor:pointer;opacity:' + op + ';transition:background .15s,border-color .15s,opacity .3s;line-height:1.4;word-break:break-word' + (t.en ? ';font-family:Inter,sans-serif;direction:ltr' : '');
      };
      out.gTiles = gm.tiles.map((t, i) => ({ label: t.label, style: tileS(t), tap: () => this.gameTap(i) }));
      out.gOverTitle = 'بازی تمام شد — امتیاز ' + gm.score;
      out.gOverDesc = gm.score > (gm.best || 0) ? 'رکورد تازه ثبت شد!' : 'رکوردت ' + (gm.best || 0) + ' است — دوباره امتحان کن.';
      out.gRetry = () => this.startGame(gm.cat, gm.lv);
      out.gQuit = () => this.setState({ screen: this.navBack() || 'words', game: null });
    }
    return out;
  }

  // ===== sentence building (جمله‌سازی) =====
  sbLoad() { try { return JSON.parse(localStorage.getItem('vocab_sent') || '{}') || {}; } catch (e) { return {}; } }
  sbSave(p) { try { localStorage.setItem('vocab_sent', JSON.stringify(p)); } catch (e) {} }
  sbLevelUnlocked(L) {
    const at = LEVELS.indexOf(L); if (at <= 0) return true;
    const d = (this.state && this.state.data) || this.load();
    if (at <= this.band(d.round || 1)) return true;
    const scores = (this.sbLoad().s) || {};
    if (Object.keys(scores).some(k => k.indexOf(L + '_') === 0)) return true;
    const required = ['chunk', 'expand', 'combine', 'free'];
    return LEVELS.slice(0, at).every(lv => required.every(mode => (scores[lv + '_' + mode] || 0) >= 70));
  }
  sbMark(key, pct) {
    const p = this.sbLoad(); if (!p.s) p.s = {};
    if (pct >= (p.s[key] || 0)) p.s[key] = pct;
    this.sbSave(p);
  }
  sbLevels() { return LEVELS; }
  goSent(lv) {
    const wanted = lv || this.state.sbLv || this.levelOf((this.load().round) || 1);
    const open = this.sbLevelUnlocked(wanted) ? wanted : (LEVELS.slice().reverse().find(L => this.sbLevelUnlocked(L)) || 'A1');
    this.setState({ screen: 'sent', sbLv: open, sb: null });
  }
  sbData(lv) { return (window.SENT || {})[lv || this.state.sbLv || 'A1'] || null; }

  sbStart(mode) {
    const lv = this.state.sbLv || 'A1', D = this.sbData(lv);
    if (!D) return;
    this.remember('sbrun', 'جمله‌سازی', 'سطح ' + lv + ' · ' + (SB_MODE_FA[mode] || ''));
    if (mode === 'pattern') return this.setState({ screen: 'sbrun', sb: { mode, lv, k: 0, sel: [0, 0, 0, 0] } });
    if (mode === 'chunk') {
      const items = shuffled(D.chunks, Date.now() % 7919);
      return this.setState({ screen: 'sbrun', sb: { mode, lv, items, k: 0, right: 0, done: false } }, () => this.sbPrep());
    }
    if (mode === 'expand') return this.setState({ screen: 'sbrun', sb: { mode, lv, items: D.expand, k: 0, step: 0, picked: null, right: 0, total: 0, done: false } });
    if (mode === 'combine') {
      const items = shuffled(D.combine, Date.now() % 6151);
      return this.setState({ screen: 'sbrun', sb: { mode, lv, items, k: 0, typed: '', checked: false, ok: false, right: 0, ai: '', busy: false, done: false } });
    }
    if (mode === 'free') return this.setState({ screen: 'sbrun', sb: { mode, lv, k: 0, typed: '', busy: false, ai: null, err: '' } });
    if (mode === 'game') return this.sbGameStart(lv);
  }
  sbPrep() {
    const sb = this.state.sb; if (!sb || !sb.items) return;
    const it = sb.items[sb.k]; if (!it) return;
    const pool = shuffled(it.chunks.map((c, i) => ({ c, i })), (it.chunks.length * 977) + sb.k + 5);
    this.sbSet({ pool, picked: [], checked: false, ok: false });
  }
  sbSet(patch, cb) { this.setState(s => ({ sb: Object.assign({}, s.sb, patch) }), cb); }
  sbTakeChunk(id) {
    this.setState(s => {
      const sb = s.sb; if (!sb || sb.checked) return null;
      const pool = (sb.pool || []).slice(), picked = (sb.picked || []).slice();
      const idx = pool.findIndex(p => p && p.i === id);
      if (idx < 0) return null;
      picked.push(pool.splice(idx, 1)[0]);
      return { sb: Object.assign({}, sb, { pool, picked }) };
    });
  }
  sbUndoChunk(id) {
    this.setState(s => {
      const sb = s.sb; if (!sb || sb.checked) return null;
      const picked = (sb.picked || []).slice(), pool = (sb.pool || []).slice();
      const idx = picked.findIndex(p => p && p.i === id);
      if (idx < 0) return null;
      pool.push(picked.splice(idx, 1)[0]);
      return { sb: Object.assign({}, sb, { pool, picked }) };
    });
  }
  sbCheckChunk() {
    const sb = this.state.sb; if (!sb || sb.checked) return;
    const it = sb.items[sb.k];
    if (sb.picked.length !== it.chunks.length) return;
    const ok = sb.picked.filter(Boolean).every((p, i) => p.i === i);
    this.sbSet({ checked: true, ok, right: sb.right + (ok ? 1 : 0) });
    this.speakWord(it.chunks.join(' '));
  }
  sbNextChunk() {
    const sb = this.state.sb; if (!sb || !sb.checked) return;
    if (sb.k + 1 < sb.items.length) return this.sbSet({ k: sb.k + 1 }, () => this.sbPrep());
    const pct = Math.round((sb.right / sb.items.length) * 100);
    this.sbMark(sb.lv + '_chunk', pct); this.addXp(sb.right * 6);
    this.sbSet({ done: true });
  }
  sbExPick(i) {
    const sb = this.state.sb; if (!sb || sb.picked != null) return;
    const it = sb.items[sb.k], st = it.steps[sb.step];
    const ok = i === st.a;
    this.sbSet({ picked: i, right: sb.right + (ok ? 1 : 0), total: sb.total + 1 });
    if (ok) this.speakWord(st.opts[st.a]);
  }
  sbExNext() {
    const sb = this.state.sb; if (!sb || sb.picked == null) return;
    const it = sb.items[sb.k];
    if (sb.step + 1 < it.steps.length) return this.sbSet({ step: sb.step + 1, picked: null });
    this.speakWord(it.final);
    if (sb.k + 1 < sb.items.length) return this.sbSet({ k: sb.k + 1, step: 0, picked: null, showFinal: true }, () => setTimeout(() => this.sbSet({ showFinal: false }), 10));
    const pct = sb.total ? Math.round((sb.right / sb.total) * 100) : 0;
    this.sbMark(sb.lv + '_expand', pct); this.addXp(sb.right * 6);
    this.sbSet({ done: true });
  }
  sbCombineCheck() {
    const sb = this.state.sb; if (!sb || sb.checked) return;
    const it = sb.items[sb.k];
    const n = s => String(s).toLowerCase().replace(/[.,;!?]/g, '').replace(/\s+/g, ' ').trim();
    const ok = (it.answers || []).some(a => n(a) === n(sb.typed));
    this.sbSet({ checked: true, ok, right: sb.right + (ok ? 1 : 0) });
    this.speakWord(it.answers[0]);
  }
  async sbCombineAI() {
    const sb = this.state.sb; if (!sb) return;
    const it = sb.items[sb.k], txt = (sb.typed || '').trim();
    if (!txt) return this.sbSet({ ai: { message: 'اول جمله‌ات را بنویس.', issues: [] } });
    if (sb.busy) return;
    const model = (it.answers || [''])[0];
    const key = (it.hint || '').match(/[a-z]+/i);
    const words = txt.replace(/[^A-Za-z' ]/g, ' ').split(/\s+/).filter(Boolean);
    const notes = [];
    if (key && txt.toLowerCase().indexOf(String(key[0]).toLowerCase()) < 0) notes.push('از حرف ربط «' + key[0] + '» که راهنما گفته استفاده کن.');
    if (words.length < 6) notes.push('جمله‌ی ترکیبی معمولاً بلندتر است — هر دو ایده باید داخلش باشد.');
    if (!/[.!?]$/.test(txt)) notes.push('علامت پایانی جمله را بگذار.');
    if (!/^[A-Z]/.test(txt)) notes.push('با حرف بزرگ شروع کن.');
    const g = this.gradeSentence(txt, words[0] || 'the');
    (g.checks || []).forEach(c => { if (!c.ok && c.label.indexOf('لغت') < 0) notes.push(c.label); });
    const msg = notes.length
      ? 'نکته‌ها: ' + notes.slice(0, 3).join(' · ') + '  |  نمونه‌ی درست: ' + model
      : 'خوب بود! جمله‌ات ساختار درستی دارد. نمونه‌ی دیگر: ' + model;
    this.sbSet({ busy: true, ai: null });
    const online = await this.reviewEnglishText(txt);
    this.sbSet({ busy: false, ai: Object.assign({ message: msg }, online) });
  }
  sbCombineNext() {
    const sb = this.state.sb; if (!sb || !sb.checked) return;
    if (sb.k + 1 < sb.items.length) return this.sbSet({ k: sb.k + 1, typed: '', checked: false, ok: false, ai: '' });
    const pct = Math.round((sb.right / sb.items.length) * 100);
    this.sbMark(sb.lv + '_combine', pct); this.addXp(sb.right * 8);
    this.sbSet({ done: true });
  }
  async sbFreeCheck() {
    const sb = this.state.sb; if (!sb) return;
    const txt = (sb.typed || '').trim();
    const words = txt.replace(/[^A-Za-z' ]/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length < 4) return this.sbSet({ err: 'حداقل یک جمله‌ی کامل بنویس (۴ کلمه یا بیشتر).' });
    if (sb.busy) return;
    const g = this.gradeSentence(txt, words[0]);
    const low = ' ' + words.join(' ').toLowerCase() + ' ';
    const richness = [];
    if (/\b(and|but|so|because|although|while|when|if|which|who|that)\b/i.test(txt)) richness.push('جمله‌ات بیش از یک بخش دارد — این نشانه‌ی پیشرفت است.');
    else richness.push('یک بار دیگر بنویس و با and / because / when آن را گسترش بده.');
    const adv = words.filter(w => /ly$/.test(w.toLowerCase()) && w.length > 4).length;
    if (adv) richness.push('استفاده از قید (' + adv + ' مورد) به جمله جان می‌دهد.');
    else richness.push('یک قید مثل quickly یا usually اضافه کن.');
    if (words.length >= 10) richness.push('طول جمله خوب است (' + words.length + ' کلمه).');
    else richness.push('کمی بلندتر بنویس: کجا؟ کِی؟ چرا؟');
    const bad = (g.checks || []).filter(c => !c.ok && c.label.indexOf('لغت') < 0).map(c => c.label);
    const score = Math.max(20, Math.min(100, 40 + (words.length >= 10 ? 20 : 10) + (adv ? 10 : 0) + (/\b(and|but|because|when|if|which|who)\b/i.test(txt) ? 20 : 0) - bad.length * 10));
    this.sbSet({ busy: true, err: '', ai: null });
    const online = await this.reviewEnglishText(txt);
    const onlinePenalty = Math.min(30, (online.issues || []).length * 7);
    const finalScore = Math.max(0, score - onlinePenalty);
    this.sbMark(sb.lv + '_free', finalScore);
    this.addXp(8);
    // "text" is what was graded — the result panel echoes it back and reads it
    // aloud. It used to look for "fixed" and "why", which this never produced,
    // so the learner got two blank rows and a mute speaker button.
    this.sbSet({ busy: false, err: '', ai: Object.assign({ score: finalScore, text: txt,
      fb: bad.length ? 'اصلاح کن: ' + bad.slice(0, 2).join(' · ') : 'ساختار جمله‌ات سالم است.', tips: richness.slice(0, 3) }, online) });
  }
  sbFreeTask() {
    const sb = this.state.sb, D = this.sbData(sb && sb.lv);
    if (!D) return '';
    const k = (sb && sb.k) || 0;
    const pats = D.patterns || [];
    const p = pats[k % pats.length];
    return 'یک جمله‌ی خودت با الگوی «' + p.name + '» (' + p.formula + ') بنویس — درباره‌ی زندگی خودت.';
  }
  sbFreeNew() { this.sbSet({ k: ((this.state.sb.k || 0) + 1), typed: '', ai: null, err: '' }); }

  // ---- sentence game: timed chunk race ----
  sbGameStart(lv) {
    const all = [];
    const order = LEVELS.slice(0, LEVELS.indexOf(lv) + 1);
    order.forEach(L => { const D = (window.SENT || {})[L]; if (D) D.chunks.forEach(c => all.push(Object.assign({}, c, { lv: L }))); });
    if (!all.length) return;
    const best = (this.sbLoad().gameBest) || 0;
    this.setState({ screen: 'sbrun', sb: { mode: 'game', lv, items: shuffled(all, Date.now() % 9973), k: 0, score: 0, lives: 3, best, over: false, left: 30 } }, () => { this.sbPrep(); this.sbTick(); });
  }
  sbTick() {
    clearInterval(this.sbIv);
    this.sbIv = setInterval(() => {
      const s = this.state, sb = s.sb;
      if (!sb || sb.mode !== 'game' || s.screen !== 'sbrun') return clearInterval(this.sbIv);
      if (sb.checked || sb.over) return;
      const left = sb.left - 1;
      if (left <= 0) return this.sbGameMiss();
      this.sbSet({ left });
    }, 1000);
  }
  sbGameMiss() {
    const sb = this.state.sb; if (!sb) return;
    const lives = sb.lives - 1;
    this.sbSet({ checked: true, ok: false, lives, over: lives <= 0, left: 0 }, () => {
      if (lives <= 0) { const p = this.sbLoad(); if (sb.score > (p.gameBest || 0)) { p.gameBest = sb.score; this.sbSave(p); } }
    });
  }
  sbGameCheck() {
    const sb = this.state.sb; if (!sb || sb.checked) return;
    const it = sb.items[sb.k];
    if (sb.picked.length !== it.chunks.length) return;
    const ok = sb.picked.filter(Boolean).every((p, i) => p.i === i);
    if (ok) {
      const gain = 10 + Math.max(0, sb.left);
      this.sbSet({ checked: true, ok: true, score: sb.score + gain });
      this.speakWord(it.chunks.join(' '));
      this.addXp(4);
    } else {
      const lives = sb.lives - 1;
      this.sbSet({ checked: true, ok: false, lives, over: lives <= 0 }, () => {
        if (lives <= 0) { const p = this.sbLoad(); if (this.state.sb.score > (p.gameBest || 0)) { p.gameBest = this.state.sb.score; this.sbSave(p); } }
      });
      this.speakWord(it.chunks.join(' '));
    }
  }
  sbGameNext() {
    const sb = this.state.sb; if (!sb || sb.over) return;
    const k = (sb.k + 1) % sb.items.length;
    this.sbSet({ k, left: 30 }, () => this.sbPrep());
  }
  sbQuit() { clearInterval(this.sbIv); this.setState({ screen: this.navBack() || 'sent', sb: null }); }

  sentVals() {
    const s = this.state, SD = window.SENT || null;
    const out = { isSent: s.screen === 'sent' && !!SD, isSbRun: s.screen === 'sbrun' && !!s.sb, goSent: () => this.goSent() };
    if (!SD) return out;
    const chip = (on, c) => 'display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:99px;font-size:12.5px;cursor:pointer;background:' + (on ? c + '24' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + (on ? c + '77' : 'rgba(233,233,237,.42)') + ';color:' + (on ? c : 'rgba(233,233,237,.6)');
    const prog = (this.sbLoad().s) || {};
    if (out.isSent) {
      const lv = s.sbLv || 'A1', D = SD[lv];
      out.sbLvChips = LEVELS.map(L => {
        const unlocked = this.sbLevelUnlocked(L);
        return { label: L, icon: unlocked ? (lv === L ? 'ph-fill ph-map-pin' : 'ph ph-circle') : 'ph-fill ph-lock-key', locked: !unlocked,
          style: chip(lv === L, '#84c5d9') + (unlocked ? '' : ';opacity:.38;cursor:not-allowed'),
          pick: () => { if (unlocked) this.setState({ sbLv: L }); } };
      });
      out.sbIntro = D ? D.intro : '';
      out.sbModes = [
        { key: 'pattern', t: 'آزمایشگاه الگو', d: 'ساختِ اسکلت جمله — قطعه‌ها را عوض کن و جمله بساز', icon: 'ph-fill ph-blueprint', c: '#84c5d9' },
        { key: 'chunk', t: 'چیدن بلوک‌ها', d: 'بلوک‌های جمله را به ترتیب درست بچین', icon: 'ph-fill ph-squares-four', c: '#9184d9' },
        { key: 'expand', t: 'گسترش جمله', d: 'از یک جمله‌ی سه‌کلمه‌ای شروع کن و پله‌پله بسازش', icon: 'ph-fill ph-arrows-out-line-horizontal', c: '#8fd9c1' },
        { key: 'combine', t: 'ترکیب جمله‌ها', d: 'چند جمله‌ی کوتاه را یک جمله‌ی حرفه‌ای کن', icon: 'ph-fill ph-git-merge', c: '#e0a458' },
        { key: 'free', t: 'جمله‌ی خودت', d: 'آزاد بنویس؛ هوش مصنوعی ساختارش را اصلاح می‌کند', icon: 'ph-fill ph-pen-nib', c: '#e0879e' },
        { key: 'game', t: 'بازی مسابقه‌ی جمله', d: '۳۰ ثانیه برای هر جمله · جان و امتیاز و رکورد', icon: 'ph-fill ph-game-controller', c: '#e0a458' }
      ].map(m => {
        const pc = prog[lv + '_' + m.key];
        return {
          t: m.t, d: m.d, icon: m.icon,
          badge: m.key === 'game' ? ('رکورد: ' + ((this.sbLoad().gameBest) || 0)) : (pc != null ? 'بهترین نمره ' + pc + '٪' : 'شروع نکرده‌ای'),
          style: 'display:flex;align-items:center;gap:11px;padding:13px;border-radius:12px;background:rgba(233,233,237,.025);border:1px solid ' + m.c + '2e;cursor:pointer;width:100%;text-align:right',
          iconStyle: 'flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:' + m.c + '1f;border:1px solid ' + m.c + '47;color:' + m.c + ';font-size:18px',
          go: () => this.sbStart(m.key)
        };
      });
      out.sbSteps = [
        'یک: هسته را بساز — چه‌کسی، چه‌کار، چه‌چیز. همین سه تا جمله‌ی کامل است.',
        'دو: بلوک اضافه کن — چطور، کجا، کِی، چرا. هر بار یکی.',
        'سه: دو جمله‌ی کوتاه را یکی کن — با who/which، چون، اما، بعد از.',
        'چهار: شروع جمله را عوض کن تا همه‌ی جمله‌ها با فاعل شروع نشوند.',
        'پنج: بلندش را با یک جمله‌ی کوتاه جواب بده — ریتم متن از همین می‌آید.'
      ].map((t, i) => ({ n: String(i + 1), t }));
    }
    if (out.isSbRun) {
      const sb = s.sb, D = SD[sb.lv];
      const names = { pattern: 'آزمایشگاه الگو', chunk: 'چیدن بلوک‌ها', expand: 'گسترش جمله', combine: 'ترکیب جمله‌ها', free: 'جمله‌ی خودت', game: 'مسابقه‌ی جمله' };
      out.sbTitle = names[sb.mode] + ' · ' + sb.lv;
      out.sbQuit = () => this.sbQuit();
      out.sbIsPattern = sb.mode === 'pattern'; out.sbIsChunk = sb.mode === 'chunk';
      out.sbIsExpand = sb.mode === 'expand'; out.sbIsCombine = sb.mode === 'combine';
      out.sbIsFree = sb.mode === 'free'; out.sbIsGame = sb.mode === 'game';

      if (sb.mode === 'pattern') {
        const pats = D.patterns, pk = sb.k % pats.length, p = pats[pk];
        out.spatName = p.name; out.spatFormula = p.formula; out.spatDesc = p.desc;
        out.spatHasNote = !!p.note; out.spatNote = p.note;
        out.spatCols = p.slots.map((col, ci) => ({
          opts: col.map((o, oi) => ({
            label: o,
            style: 'padding:9px 11px;border-radius:9px;font-family:Inter,sans-serif;direction:ltr;text-align:left;font-size:12.5px;cursor:pointer;background:' + ((sb.sel[ci] || 0) === oi ? 'rgba(132,197,217,.16)' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + ((sb.sel[ci] || 0) === oi ? 'rgba(132,197,217,.6)' : 'rgba(233,233,237,.42)') + ';color:' + ((sb.sel[ci] || 0) === oi ? '#84c5d9' : 'rgba(233,233,237,.7)'),
            pick: () => { const sel = (this.state.sb.sel || []).slice(); sel[ci] = oi; this.sbSet({ sel }); }
          }))
        }));
        const built = p.slots.map((col, ci) => col[(sb.sel[ci] || 0)]).join(' ').replace(/\s+([.,!?])/g, '$1');
        out.spatBuilt = built;
        out.spatSay = () => this.speakWord(built);
        out.spatShuffle = () => { const sel = p.slots.map(col => Math.floor(Math.random() * col.length)); this.sbSet({ sel }); };
        out.spatNextP = () => this.sbSet({ k: pk + 1, sel: [0, 0, 0, 0] });
        out.spatPos = (pk + 1) + ' / ' + pats.length;
      }

      if (sb.mode === 'chunk' || sb.mode === 'game') {
        const it = sb.items[sb.k] || { chunks: [], fa: '' };
        out.sbFa = it.fa;
        out.sbTip = it.tip || '';
        out.sbHasTip = !!it.tip && !!sb.checked;
        out.sbPool = (sb.pool || []).filter(Boolean).map(c => ({
          label: c.c,
          style: 'padding:10px 13px;border-radius:10px;font-family:Inter,sans-serif;direction:ltr;font-size:13.5px;cursor:pointer;background:rgba(233,233,237,.04);border:1px solid rgba(233,233,237,.42);color:rgba(233,233,237,.88)',
          tap: () => this.sbTakeChunk(c.i)
        }));
        out.sbPicked = (sb.picked || []).filter(Boolean).map(c => ({
          label: c.c,
          style: 'padding:10px 13px;border-radius:10px;font-family:Inter,sans-serif;direction:ltr;font-size:13.5px;cursor:pointer;background:' + (sb.checked ? (sb.ok ? 'rgba(143,217,193,.12)' : 'rgba(217,143,143,.1)') : 'rgba(145,132,217,.14)') + ';border:1px solid ' + (sb.checked ? (sb.ok ? 'rgba(143,217,193,.5)' : 'rgba(217,143,143,.5)') : 'rgba(145,132,217,.5)') + ';color:' + (sb.checked ? (sb.ok ? '#8fd9c1' : '#d98f8f') : '#b3a9e6'),
          tap: () => this.sbUndoChunk(c.i)
        }));
        out.sbHasPicked = (sb.picked || []).filter(Boolean).length > 0;
        // The else-branch of the box above: with nothing placed yet, the empty
        // dashed area was the only instruction the screen offered.
        out.sbNoPicked = !out.sbHasPicked;
        out.sbEmptyHint = 'بلوک‌ها را به ترتیب بزن تا جمله ساخته شود';
        out.sbCanCheck = (sb.picked || []).filter(Boolean).length === it.chunks.length && !sb.checked;
        out.sbCheckStyle = 'display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;background:' + (out.sbCanCheck ? 'rgba(145,132,217,.14)' : 'transparent') + ';border:1px solid ' + (out.sbCanCheck ? '#9184d9' : 'rgba(233,233,237,.42)') + ';color:' + (out.sbCanCheck ? '#b3a9e6' : 'rgba(233,233,237,.55)');
        out.sbCheckGo = () => (sb.mode === 'game' ? this.sbGameCheck() : this.sbCheckChunk());
        out.sbAnswered = !!sb.checked;
        out.sbCorrect = it.chunks.join(' ');
        out.sbFeedback = sb.checked ? (sb.ok ? 'درست چیدی ✓' : 'ترتیب درست:') : '';
        out.sbFeedbackStyle = 'font-size:12.5px;color:' + (sb.ok ? '#8fd9c1' : '#d98f8f');
        out.sbSayCorrect = () => this.speakWord(it.chunks.join(' '));
      }
      if (sb.mode === 'chunk') {
        out.sbPos = (sb.k + 1) + ' / ' + sb.items.length;
        out.sbBarStyle = 'height:100%;width:' + Math.round(((sb.k + (sb.done ? 1 : 0)) / sb.items.length) * 100) + '%;background:linear-gradient(90deg,#9184d9,#b3a9e6);transition:width .3s';
        out.sbNextGo = () => this.sbNextChunk();
        out.sbNextLabel = sb.k + 1 < sb.items.length ? 'جمله‌ی بعدی' : 'پایان و نتیجه';
        out.sbDone = !!sb.done; out.sbNotDone = !sb.done;
        const pc = sb.items.length ? Math.round((sb.right / sb.items.length) * 100) : 0;
        out.sbResTitle = sb.right + ' از ' + sb.items.length + ' جمله درست';
        out.sbResDesc = (pc >= 70 ? 'ترتیب جمله دستت آمده. ' : 'ترتیب «چه‌کار → چه‌چیز → کجا → کِی» را مرور کن. ') + (sb.right * 6) + ' امتیاز گرفتی.';
        out.sbResIconStyle = 'width:56px;height:56px;margin:0 auto;border-radius:16px;display:grid;place-items:center;font-size:28px;background:' + (pc >= 70 ? 'rgba(143,217,193,.12)' : 'rgba(224,164,88,.12)') + ';border:1px solid ' + (pc >= 70 ? 'rgba(143,217,193,.4)' : 'rgba(224,164,88,.4)') + ';color:' + (pc >= 70 ? '#8fd9c1' : '#e0a458');
        out.sbRetry = () => this.sbStart('chunk');
      }
      if (sb.mode === 'game') {
        out.sbgLeft = String(sb.left);
        out.sbgLeftStyle = 'font-family:Inter,sans-serif;font-size:22px;font-weight:600;color:' + (sb.left <= 8 ? '#d98f8f' : '#e0a458');
        out.sbgScore = String(sb.score);
        out.sbgBest = 'رکورد: ' + Math.max(sb.best || 0, sb.score);
        out.sbgHearts = [0, 1, 2].map(i => ({ icon: i < sb.lives ? 'ph-fill ph-heart' : 'ph ph-heart', style: 'font-size:15px;color:' + (i < sb.lives ? '#d98f8f' : 'rgba(233,233,237,.2)') }));
        out.sbgOver = !!sb.over; out.sbgPlaying = !sb.over;
        out.sbgNextGo = () => this.sbGameNext();
        out.sbgOverTitle = 'بازی تمام شد — امتیاز ' + sb.score;
        out.sbgOverDesc = sb.score > (sb.best || 0) ? 'رکورد تازه ثبت شد!' : 'رکوردت ' + (sb.best || 0) + ' است — دوباره امتحان کن.';
        out.sbgRetry = () => this.sbGameStart(sb.lv);
      }
      if (sb.mode === 'expand') {
        const it = sb.items[sb.k], st = it.steps[sb.step];
        out.sexKernel = it.kernel;
        out.sexStepQ = st.q;
        out.sexPos = 'جمله ' + (sb.k + 1) + ' از ' + sb.items.length + ' · پله ' + (sb.step + 1) + ' از ' + it.steps.length;
        out.sexBarStyle = 'height:100%;width:' + Math.round((((sb.k * 100) + ((sb.step + 1) / it.steps.length) * 100) / (sb.items.length * 100)) * 100) + '%;background:linear-gradient(90deg,#8fd9c1,#b3e6d5);transition:width .3s';
        out.sexOpts = st.opts.map((o, i) => {
          let bd = 'rgba(233,233,237,.42)', bg = 'rgba(233,233,237,.03)', col = 'rgba(233,233,237,.88)';
          if (sb.picked != null) {
            if (i === st.a) { bd = 'rgba(143,217,193,.6)'; bg = 'rgba(143,217,193,.1)'; col = '#8fd9c1'; }
            else if (i === sb.picked) { bd = 'rgba(217,143,143,.6)'; bg = 'rgba(217,143,143,.1)'; col = '#d98f8f'; }
          }
          return {
            label: o,
            style: 'display:flex;align-items:center;gap:9px;width:100%;padding:12px 13px;border-radius:10px;background:' + bg + ';border:1px solid ' + bd + ';color:' + col + ';font-size:13.5px;cursor:pointer;font-family:Inter,sans-serif;direction:ltr;text-align:left;line-height:1.6',
            mark: sb.picked == null ? '' : (i === st.a ? 'ph-fill ph-check-circle' : (i === sb.picked ? 'ph-fill ph-x-circle' : '')),
            markStyle: 'font-size:16px;flex:none',
            pick: () => this.sbExPick(i)
          };
        });
        out.sexAnswered = sb.picked != null;
        // Only after the last step is answered — this ignored sb.picked, so the
        // finished sentence sat on screen while its options were still unpicked.
        out.sexIsLast = sb.step + 1 === it.steps.length && sb.picked != null;
        out.sexFinal = it.final;
        out.sexSayFinal = () => this.speakWord(it.final);
        out.sexNextGo = () => this.sbExNext();
        out.sexNextLabel = sb.step + 1 < it.steps.length ? 'پله‌ی بعد' : (sb.k + 1 < sb.items.length ? 'جمله‌ی بعدی' : 'پایان و نتیجه');
        out.sexNextStyle = 'display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;background:' + (sb.picked != null ? 'rgba(143,217,193,.12)' : 'transparent') + ';border:1px solid ' + (sb.picked != null ? '#8fd9c1' : 'rgba(233,233,237,.42)') + ';color:' + (sb.picked != null ? '#8fd9c1' : 'rgba(233,233,237,.55)');
        out.sexDone = !!sb.done; out.sexNotDone = !sb.done;
        const pc = sb.total ? Math.round((sb.right / sb.total) * 100) : 0;
        out.sexResTitle = sb.right + ' از ' + sb.total + ' پله درست';
        out.sexResDesc = (pc >= 70 ? 'گسترش جمله را خوب فهمیدی. ' : 'یادت باشد هر بلوک جای خودش را دارد. ') + (sb.right * 6) + ' امتیاز گرفتی.';
        out.sexRetry = () => this.sbStart('expand');
      }
      if (sb.mode === 'combine') {
        const it = sb.items[sb.k];
        out.scmPos = (sb.k + 1) + ' / ' + sb.items.length;
        out.scmBarStyle = 'height:100%;width:' + Math.round(((sb.k + (sb.done ? 1 : 0)) / sb.items.length) * 100) + '%;background:linear-gradient(90deg,#e0a458,#eec48c);transition:width .3s';
        out.scmParts = [it.a, it.b, it.c].filter(Boolean).map((p, i) => ({ n: String(i + 1), p }));
        out.scmHint = it.hint;
        out.scmTyped = sb.typed;
        out.scmOnType = e => this.sbSet({ typed: e.target.value });
        out.scmKey = e => { if (e.key === 'Enter') { if (!this.state.sb.checked) this.sbCombineCheck(); else this.sbCombineNext(); } };
        out.scmInputStyle = 'width:100%;min-height:74px;resize:vertical;padding:12px 14px;border-radius:10px;font-family:Inter,sans-serif;direction:ltr;text-align:left;font-size:14px;line-height:1.7;background:rgba(233,233,237,.04);border:1px solid ' + (sb.checked ? (sb.ok ? 'rgba(143,217,193,.6)' : 'rgba(217,143,143,.6)') : 'rgba(233,233,237,.42)') + ';color:#e9e9ed;outline:none';
        out.scmCheckGo = () => this.sbCombineCheck();
        out.scmAnswered = !!sb.checked;
        out.scmOkMsg = sb.ok ? 'دقیقاً همان جمله‌ی الگو ✓' : 'جمله‌ی الگو:';
        out.scmOkStyle = 'font-size:12.5px;color:' + (sb.ok ? '#8fd9c1' : '#e0a458');
        out.scmModel = it.answers[0];
        out.scmSayModel = () => this.speakWord(it.answers[0]);
        out.scmAiGo = () => this.sbCombineAI();
        out.scmAiLabel = sb.busy ? 'در حال بررسی…' : 'بررسی آنلاین + ترجمه';
        const ar = sb.ai;
        out.scmHasAi = !!ar; out.scmAi = ar ? (ar.message || '') : '';
        out.scmAiService = ar ? (ar.service || 'بررسی محلی') : '';
        out.scmAiHasCorrected = !!(ar && ar.corrected); out.scmAiCorrected = ar ? (ar.corrected || '') : '';
        out.scmAiHasTranslation = !!(ar && ar.translation); out.scmAiTranslation = ar ? (ar.translation || '') : '';
        out.scmAiHasIssues = !!(ar && ar.issues && ar.issues.length);
        out.scmAiIssues = ar ? (ar.issues || []).map(x => ({ label: x.label })) : [];
        out.scmNextGo = () => this.sbCombineNext();
        out.scmNextLabel = sb.k + 1 < sb.items.length ? 'تمرین بعدی' : 'پایان و نتیجه';
        out.scmNextStyle = 'display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;background:' + (sb.checked ? 'rgba(224,164,88,.12)' : 'transparent') + ';border:1px solid ' + (sb.checked ? '#e0a458' : 'rgba(233,233,237,.42)') + ';color:' + (sb.checked ? '#e0a458' : 'rgba(233,233,237,.55)');
        out.scmDone = !!sb.done; out.scmNotDone = !sb.done;
        out.scmResTitle = sb.right + ' از ' + sb.items.length + ' مطابق الگو';
        out.scmResDesc = 'ترکیب جمله مهم‌ترین مهارت نوشتنِ حرفه‌ای است — ' + (sb.right * 8) + ' امتیاز گرفتی.';
        out.scmRetry = () => this.sbStart('combine');
      }
      if (sb.mode === 'free') {
        out.sfrTask = this.sbFreeTask();
        out.sfrTyped = sb.typed;
        out.sfrOnType = e => this.sbSet({ typed: e.target.value, err: '' });
        out.sfrInputStyle = 'width:100%;min-height:96px;resize:vertical;padding:13px 15px;border-radius:10px;font-family:Inter,sans-serif;direction:ltr;text-align:left;font-size:14.5px;line-height:1.8;background:rgba(233,233,237,.04);border:1px solid rgba(233,233,237,.42);color:#e9e9ed;outline:none';
        out.sfrGo = () => this.sbFreeCheck();
        out.sfrBtnLabel = sb.busy ? 'در حال بررسی…' : 'بررسی آنلاین + ترجمه';
        out.sfrBtnStyle = 'display:flex;align-items:center;gap:7px;padding:11px 18px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;background:rgba(224,135,158,.1);border:1px solid ' + (sb.busy ? 'rgba(233,233,237,.2)' : '#e0879e') + ';color:' + (sb.busy ? 'rgba(233,233,237,.55)' : '#e0879e');
        out.sfrHasErr = !!sb.err; out.sfrErr = sb.err || '';
        const r = sb.ai;
        out.sfrHasRes = !!r;
        out.sfrScore = r ? 'ساختار: ' + r.score + ' / ۱۰۰' : '';
        out.sfrFixed = r ? (r.corrected || r.text) : '';
        out.sfrSayFixed = () => r && this.speakWord(r.corrected || r.text);
        out.sfrWhy = r ? r.fb : '';
        out.sfrTips = r ? (r.tips || []).map(t => ({ t })) : [];
        out.sfrService = r ? (r.service || 'بررسی محلی') : '';
        out.sfrHasTranslation = !!(r && r.translation); out.sfrTranslation = r ? (r.translation || '') : '';
        out.sfrHasIssues = !!(r && r.issues && r.issues.length);
        out.sfrIssues = r ? (r.issues || []).map(x => ({ label: x.label })) : [];
        out.sfrNew = () => this.sbFreeNew();
      }
    }
    return out;
  }

  // ===== course engine (grammar + collocations) =====
  csLoad() { try { return JSON.parse(localStorage.getItem('vocab_course') || '{}') || {}; } catch (e) { return {}; } }
  csSaveScore(key, pct) {
    const p = this.csLoad(); if (!p.s) p.s = {};
    if (pct >= (p.s[key] || 0)) p.s[key] = pct;
    if (!p.l) p.l = {}; p.l[key] = pct;
    if (!p.a) p.a = {}; p.a[key] = (p.a[key] || 0) + 1;
    if (!p.h) p.h = {}; p.h[key] = (p.h[key] || []).concat([pct]).slice(-5);
    try { localStorage.setItem('vocab_course', JSON.stringify(p)); } catch (e) {}
  }
  csSaveBest(key, score) {
    const p = this.csLoad(); if (!p.b) p.b = {};
    if (score > (p.b[key] || 0)) { p.b[key] = score; try { localStorage.setItem('vocab_course', JSON.stringify(p)); } catch (e) {} }
  }
  csScore(key) { const p = this.csLoad(); return (p.s || {})[key]; }
  csRecent(key) { const p = this.csLoad(); const v = (p.l || {})[key]; return v == null ? (p.s || {})[key] : v; }
  csBest(key) { const p = this.csLoad(); return (p.b || {})[key] || 0; }

  saveGramProduction(les, result) {
    const p = this.csLoad(); if (!p.gp) p.gp = {};
    const old = p.gp[les.id];
    // Keep the best result for progress, but retain the newest text whenever it
    // is at least as good.  This mirrors drill scoring without losing the
    // learner's own sentence.
    if (!old || result.score >= (old.score || 0)) p.gp[les.id] = result;
    try { localStorage.setItem('vocab_course', JSON.stringify(p)); } catch (e) {}
  }
  grammarLessonById(id) {
    const hit = this.gramItems().find(x => x.les.id === id); return hit || null;
  }
  grammarRich(text) {
    const src = String(text || '');
    // Keep Persian prose in the page direction, but isolate Latin grammar
    // tokens and formulas. Without bidi isolation, sequences such as
    // "فاعل + have / has + p.p" are reordered by the browser.
    const re = /([A-Za-z]+(?:[’'][A-Za-z]+)?(?:[ \t]*(?:\/|\+|=|→|-)[ \t]*[A-Za-z0-9.()]+(?:[’'][A-Za-z]+)?|[ \t]+[A-Za-z0-9.()]+(?:[’'][A-Za-z]+)?)*)/g;
    const out = []; let at = 0, m;
    while ((m = re.exec(src))) {
      if (m.index > at) out.push({ text: src.slice(at, m.index), style: '' });
      out.push({ text: m[0].trim(), style: 'display:inline-flex;align-items:center;direction:ltr;unicode-bidi:isolate;font-family:Inter,sans-serif;font-size:.92em;padding:1px 6px;margin:0 3px;border-radius:6px;background:rgba(132,197,217,.09);border:1px solid rgba(132,197,217,.22);color:#cfeaf5' });
      at = m.index + m[0].length;
    }
    if (at < src.length) out.push({ text: src.slice(at), style: '' });
    return out.length ? out : [{ text: src, style: '' }];
  }
  gramGoStep(les, mode) {
    if (!les) return;
    const stats = this.gramStats(les), index = stats.steps.findIndex(x => x.mode === mode);
    const current = stats.next ? stats.steps.findIndex(x => x.mode === stats.next.mode) : stats.steps.length;
    if (!stats.complete && index > current) {
      return this.setState({ gFlowNote: 'اول مرحلهٔ جاری را تمام کن تا مرحلهٔ بعد باز شود.' });
    }
    if (mode === 'produce') {
      const saved = this.gramProduction(les);
      return this.setState({ screen: 'glesson', gLesson: les, gpText: (saved && saved.text) || '',
        gpResult: saved, gpErr: '', gpBusy: false, gpOpen: true, gFlowNote: '' });
    }
    // 'learn' has no drill screen of its own — the rule/formula/example/
    // pitfall content it gates is already laid out inline on this same
    // page (below the step buttons). Landing here just means "make sure
    // the learner is looking at that content", not opening anything new.
    if (mode === 'learn') {
      return this.setState({ screen: 'glesson', gLesson: les, gFlowNote: '' });
    }
    if (this.state.gFlowNote) this.setState({ gFlowNote: '' });
    if (mode === 'input') return this.gramInputDrill(les);
    this.gramDrill(les, mode);
  }
  // Marks the 'learn' step done (score is binary — there is nothing to get
  // wrong reading a rule) and unlocks 'fill', the first real drill.
  gramMarkLearned(les) {
    this.csSaveScore('g_' + les.id + '_learn', 100);
    this.setState({ gFlowNote: '' });
  }
  gramContinue(cs) {
    const hit = this.grammarLessonById(cs && cs.lessonId);
    if (!hit) return this.csQuit();
    const stats = this.gramStats(hit.les);
    const next = stats.next;
    this.setState({ gLv: hit.lv, screen: 'glesson', gLesson: hit.les, cs: null }, () => {
      if (next) this.gramGoStep(hit.les, next.mode);
    });
  }
  async checkGrammarProduction() {
    const les = this.state.gLesson;
    const txt = (this.state.gpText || '').trim();
    const stats = les ? this.gramStats(les) : null;
    if (stats && !stats.complete && stats.next && stats.next.mode !== 'produce') {
      return this.setState({ gpErr: 'این بخش بعد از تمام‌کردن چهار مرحلهٔ قبلی باز می‌شود.', gFlowNote: 'اول مرحلهٔ جاری را تمام کن.' });
    }
    if (!les || !txt) return this.setState({ gpErr: 'اول جملهٔ خودت را بنویس.' });
    if (txt.length > 500) return this.setState({ gpErr: 'متن را کوتاه‌تر از ۵۰۰ نویسه بنویس.' });
    if (this.state.gpBusy) return;
    const prod = les.guide && les.guide.prod;
    const specs = (prod && prod.patterns) || [];
    const wordCount = (txt.match(/[A-Za-z]+(?:[’'][A-Za-z]+)?/g) || []).length;
    const checks = [{ ok: wordCount >= 4, label: wordCount >= 4 ? 'جمله به‌اندازهٔ کافی کامل است' : 'جمله را کامل‌تر کن؛ دست‌کم چهار واژه' }];
    specs.forEach(s => {
      let ok = false; try { ok = new RegExp(s.re, 'i').test(txt); } catch (e) {}
      checks.push({ ok, label: ok ? s.label : 'هنوز لازم است: ' + s.label });
    });
    const targetOk = checks.every(c => c.ok);
    this.setState({ gpBusy: true, gpErr: '' });

    let proof = null, translation = '', proofFailed = false, translationFailed = false;
    try { proof = await this.proofSentence(txt); } catch (e) { proofFailed = true; }
    const corrected = proof ? proof.corrected : txt;
    try { translation = await this.translateSentence(corrected); } catch (e) { translationFailed = true; }
    const online = [];
    (proof ? proof.matches : []).forEach(m => {
      const bad = txt.slice(m.offset, m.offset + m.length);
      const suggestion = m.replacements && m.replacements[0] ? m.replacements[0].value : '';
      let label = (m.rule && m.rule.issueType === 'misspelling' ? 'املای احتمالی' : 'پیشنهاد دستوری') + ': ' + (m.message || bad || 'این بخش را بازبینی کن');
      if (suggestion) label += ' ← ' + suggestion;
      online.push({ ok: false, label });
    });
    if (!proofFailed && !online.length) online.push({ ok: true, label: 'بررسی آنلاین املا و دستور زبان مشکلی پیدا نکرد' });
    if (proofFailed) online.push({ ok: true, label: 'اینترنت در دسترس نبود؛ ساختار هدف به‌صورت محلی بررسی شد' });

    const patternRatio = specs.length ? checks.slice(1).filter(c => c.ok).length / specs.length : 1;
    const score = Math.round((wordCount >= 4 ? 25 : 0) + patternRatio * 55 + (!proofFailed && !online.some(c => !c.ok) ? 20 : 0));
    const passed = targetOk && score >= 70;
    const service = proofFailed
      ? (translationFailed ? 'بررسی محلی' : 'بررسی محلی + ترجمهٔ آنلاین')
      : (translationFailed ? 'بررسی آنلاین' : 'بررسی آنلاین + ترجمه');
    const result = { text: txt, score, passed, corrected: corrected !== txt ? corrected : '', translation,
      checks: checks.concat(online), service, proofFailed, translationFailed, at: Date.now() };
    this.saveGramProduction(les, result);
    if (passed) this.addXp(8);
    this.setState({ gpBusy: false, gpErr: '', gpResult: result, tick: (this.state.tick || 0) + 1 });
  }
  async retryGrammarTranslation() {
    const les = this.state.gLesson, gr = this.state.gpResult;
    if (!les || !gr || this.state.gpBusy) return;
    this.setState({ gpBusy: true, gpErr: '' });
    try {
      const translation = await this.translateSentence(gr.corrected || gr.text || this.state.gpText || '');
      const next = Object.assign({}, gr, { translation, translationFailed: false,
        service: gr.proofFailed ? 'بررسی محلی + ترجمهٔ آنلاین' : 'بررسی آنلاین + ترجمه' });
      this.saveGramProduction(les, next);
      this.setState({ gpBusy: false, gpResult: next });
    } catch (e) {
      this.setState({ gpBusy: false, gpErr: 'ترجمهٔ آنلاین فعلاً پاسخ نداد؛ اتصال اینترنت را بررسی کن و دوباره بزن.' });
    }
  }
  resetGrammarProduction() { this.setState({ gpText: '', gpResult: null, gpErr: '', gpOpen: true }); }

  goGram(lv) {
    const wanted = lv || this.state.gLv || this.levelOf((this.load().round) || 1);
    const open = this.gramLevelUnlocked(wanted) ? wanted : (LEVELS.slice().reverse().find(L => this.gramLevelUnlocked(L)) || 'A1');
    this.setState({ screen: 'gram', gLv: open, gLesson: null, cs: null, gReviewOnly: false });
  }
  goGramReview(lv) {
    const learned = this.gramItems().filter(x => this.gramStats(x.les).passed > 0);
    const target = lv || (learned.length ? learned[learned.length - 1].lv : (this.state.gLv || this.courseLv()));
    this.setState({ screen: 'gram', gLv: target, gLesson: null, cs: null, gReviewOnly: true });
  }
  goColloc(k) { this.setState({ screen: 'colloc', cgKey: k || this.state.cgKey || 'make', cs: null }); }
  gramLessons(lv) { return ((window.GRAM || {})[lv || this.state.gLv || 'A1']) || []; }
  gramLevelUnlocked(L) {
    const at = LEVELS.indexOf(L); if (at <= 0) return true;
    const d = (this.state && this.state.data) || this.load();
    if (at <= this.band(d.round || 1)) return true;
    if (this.gramLessons(L).some(les => this.gramStats(les).attempted > 0)) return true;
    return LEVELS.slice(0, at).every(lv => {
      const lessons = this.gramLessons(lv);
      return lessons.length > 0 && lessons.every(les => this.gramStats(les).complete);
    });
  }
  openGramLesson(les) {
    this.remember('glesson', 'دستور زبان', 'سطح ' + (this.state.gLv || 'A1') + ' · ' + les.t);
    const saved = this.gramProduction(les);
    this.setState({ screen: 'glesson', gLesson: les, gpText: (saved && saved.text) || '', gpResult: saved,
      gpBusy: false, gpErr: '', gpOpen: false, gFlowNote: '' });
  }

  csStart(cfg) {
    if (!cfg || !cfg.items || !cfg.items.length) return;
    this.remember('csrun', cfg.kind === 'gram' ? 'دستور زبان' : 'ترکیب‌های رایج', cfg.title);
    // _rid tags each item with its ORIGINAL position, stable across the
    // requeues csNext() below performs — wrongIds is keyed on _rid, not on
    // array index, since a requeued item's index changes as the set grows.
    const items = cfg.items.map((it, i) => Object.assign({}, it, { _rid: i }));
    const st = { kind: cfg.kind, mode: cfg.mode, title: cfg.title, key: cfg.key, back: cfg.back, lv: cfg.lv || null, items: items,
      total0: cfg.items.length, wrongIds: [], failCounts: {},
      pit: cfg.pit || [], formula: cfg.formula || '', use: cfg.use || '', lessonId: cfg.lessonId || '', step: cfg.step || '',
      k: 0, right: 0, picked: null, typed: '', checked: false, ok: false, done: false, pool: [], seq: [],
      lives: 3, score: 0, left: cfg.mode === 'game' ? 45 : 0, over: false, best: cfg.key ? this.csBest(cfg.key) : 0 };
    this.setState({ screen: 'csrun', cs: st }, () => { this.csPrep(); if (cfg.mode === 'game') this.csTick(); });
  }
  csSet(patch, cb) { this.setState(s => ({ cs: Object.assign({}, s.cs, patch) }), cb); }
  csPrep() {
    const cs = this.state.cs; if (!cs) return;
    const it = cs.items[cs.k]; if (!it) return;
    if (cs.mode === 'order') {
      const pool = shuffled(it.chunks.map((c, i) => ({ c, i })), it.chunks.length * 811 + cs.k + 3);
      return this.csSet({ pool, seq: [], checked: false, ok: false, picked: null, typed: '' });
    }
    this.csSet({ picked: null, typed: '', checked: false, ok: false });
  }
  csTick() {
    clearInterval(this.csIv);
    this.csIv = setInterval(() => {
      const s = this.state;
      if (s.screen !== 'csrun' || !s.cs || s.cs.mode !== 'game') return clearInterval(this.csIv);
      const left = s.cs.left - 1;
      if (left <= 0) { clearInterval(this.csIv); this.csGameOver(); return; }
      this.csSet({ left });
    }, 1000);
  }
  csGameOver() {
    const cs = this.state.cs; if (!cs) return;
    clearInterval(this.csIv);
    if (cs.key) this.csSaveBest(cs.key, cs.score);
    this.addXp(Math.round(cs.score / 2));
    this.csSet({ over: true });
  }
  csPick(i) {
    const cs = this.state.cs; if (!cs || cs.picked != null || cs.over) return;
    const it = cs.items[cs.k];
    const ok = i === it.a;
    if (cs.mode === 'game') {
      const lives = ok ? cs.lives : cs.lives - 1;
      const score = ok ? cs.score + 10 : cs.score;
      this.csSet({ picked: i, ok, score, lives, right: cs.right + (ok ? 1 : 0) }, () => {
        setTimeout(() => {
          const c2 = this.state.cs; if (!c2 || c2.over) return;
          if (lives <= 0) return this.csGameOver();
          const nk = (c2.k + 1) % c2.items.length;
          this.csSet({ k: nk, picked: null, ok: false });
        }, 620);
      });
      return;
    }
    this.csSet({ picked: i, checked: true, ok, right: cs.right + (ok ? 1 : 0) });
    if (it.opts && typeof it.opts[it.a] === 'string' && /[A-Za-z]/.test(it.opts[it.a])) this.speakWord(it.opts[it.a]);
  }
  csCheckTyped() {
    const cs = this.state.cs; if (!cs || cs.checked) return;
    if (!(cs.typed || '').trim()) return this.csSet({ typeNote: 'اول پاسخ خودت را بنویس.' });
    const it = cs.items[cs.k];
    const target = cs.mode === 'error' ? it.fix : it.a;
    const list = [target].concat(it.alts || []);
    const ok = list.some(x => norm(String(x)) === norm(cs.typed));
    this.csSet({ checked: true, ok, right: cs.right + (ok ? 1 : 0), typeNote: '' });
    this.speakWord(String(target));
  }
  csTake(id) {
    this.setState(s => {
      const cs = s.cs; if (!cs || cs.checked) return null;
      const pool = (cs.pool || []).slice(), seq = (cs.seq || []).slice();
      const idx = pool.findIndex(p => p && p.i === id);
      if (idx < 0) return null;
      seq.push(pool.splice(idx, 1)[0]);
      return { cs: Object.assign({}, cs, { pool, seq }) };
    });
  }
  csUndo(id) {
    this.setState(s => {
      const cs = s.cs; if (!cs || cs.checked) return null;
      const seq = (cs.seq || []).slice(), pool = (cs.pool || []).slice();
      const idx = seq.findIndex(p => p && p.i === id);
      if (idx < 0) return null;
      pool.push(seq.splice(idx, 1)[0]);
      return { cs: Object.assign({}, cs, { pool, seq }) };
    });
  }
  csCheckOrder() {
    const cs = this.state.cs; if (!cs || cs.checked) return;
    const it = cs.items[cs.k];
    // Returning silently made the button look broken. Say what is missing.
    if (cs.seq.length !== it.chunks.length) {
      return this.csSet({ orderNote: 'هنوز ' + (it.chunks.length - cs.seq.length) + ' قطعه مانده — همه را بچین.' });
    }
    if (cs.orderNote) this.csSet({ orderNote: '' });
    const ok = cs.seq.filter(Boolean).every((p, i) => p.i === i);
    this.csSet({ checked: true, ok, right: cs.right + (ok ? 1 : 0) });
    this.speakWord(it.chunks.join(' '));
  }
  // Retry-to-criterion (product-owner call, 2026-08-18, from the grammar
  // teaching-method research): a wrong answer used to just cost a point and
  // move on, so "finishing" a drill and "actually knowing every item" were
  // different things. Now a wrong item is requeued to the end of the SAME
  // set instead — the set is not done until every item has been answered
  // correctly at least once. `total0`/`wrongIds` (set in csStart()) track
  // the ORIGINAL items so the score stays "% correct on the first try"
  // (informational) even though `cs.items`/`cs.right` grow past the
  // original count as retries get appended and answered.
  csNext() {
    const cs = this.state.cs; if (!cs || !cs.checked) return;
    const it = cs.items[cs.k];
    let items = cs.items, wrongIds = cs.wrongIds || [], failCounts = cs.failCounts || {};
    if (!cs.ok) {
      const rid = it._rid != null ? it._rid : cs.k;
      if (wrongIds.indexOf(rid) < 0) wrongIds = wrongIds.concat([rid]);
      const fails = (failCounts[rid] || 0) + 1;
      failCounts = Object.assign({}, failCounts, { [rid]: fails });
      // CS_MAX_RETRY caps how many times ONE item can send itself back —
      // past that, a genuine misconception (not a slip) is more likely than
      // luck fixing it, so stop requeueing and let the set finish; the item
      // still counts against the score via wrongIds above.
      if (fails < CS_MAX_RETRY) items = items.concat([it]);
    }
    if (cs.k + 1 < items.length) return this.csSet({ k: cs.k + 1, items, wrongIds, failCounts }, () => this.csPrep());
    const total0 = cs.total0 || items.length;
    const pct = Math.round(((total0 - wrongIds.length) / total0) * 100);
    if (cs.key) this.csSaveScore(cs.key, pct);
    this.addXp(cs.right * 6);
    this.csSet({ items, wrongIds, failCounts, done: true });
  }
  csQuit() { clearInterval(this.csIv); const cs = this.state.cs; this.setState({ screen: this.navBack() || (cs && cs.back) || 'home', cs: null }); }

  // ---- grammar drill builders ----
  // Structured input: meaning cannot be recovered without parsing the
  // target form, which is what makes this different from 'choose' (a
  // discrimination task between competing FORMS, no meaning involved).
  // Prompt is a Persian sentence from this lesson's own examples; the two
  // options are that sentence's real English translation vs a distractor —
  // the matching example from the confusable CONTRAST lesson when one
  // exists (les.contrast, set in data/curricula/grammar.js), otherwise a
  // known wrong-form sentence from this lesson's own `pit`. Either way, no
  // new content had to be authored — see grammar.js's `contrast` map
  // comment for which lessons have a natural partner and why the rest do
  // not need one.
  gramBuildInputItems(les) {
    const ex = les.ex || [];
    if (!ex.length) return [];
    const contrastHit = les.contrast ? this.grammarLessonById(les.contrast) : null;
    const distractors = (contrastHit && (contrastHit.les.ex || []).length)
      ? contrastHit.les.ex.map(e => e.en)
      : (les.pit || []).map(p => p.bad);
    if (!distractors.length) return [];
    const seed = les.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const chosen = shuffled(ex, seed).slice(0, Math.min(4, ex.length));
    return chosen.map((e, i) => {
      const wrong = distractors[i % distractors.length];
      const opts = shuffled([e.en, wrong], seed + i * 977 + 1);
      return { q: e.fa, opts: opts, a: opts.indexOf(e.en) };
    });
  }
  gramInputDrill(les) {
    const items = this.gramBuildInputItems(les);
    if (!items.length) return;
    this.csStart({ kind: 'gram', mode: 'input', title: 'تشخیص معنی · ' + les.t,
      key: 'g_' + les.id + '_input', back: 'glesson', formula: (les.guide && les.guide.formula) || '', lessonId: les.id, step: 'input',
      items: items });
  }
  gramDrill(les, mode) {
    const lv = this.state.gLv || 'A1';
    const names = { choose: 'چهارگزینه‌ای', fill: 'پر کردن جای خالی', err: 'پیدا کردن غلط', order: 'مرتب‌کردن جمله' };
    const map = { choose: les.choose, fill: les.fill, err: les.err, order: les.order };
    const items = (map[mode] || []).slice();
    if (!items.length) return;
    this.csStart({ kind: 'gram', mode: mode === 'err' ? 'error' : mode, title: names[mode] + ' · ' + les.t,
      // fill and order questions carry no per-item explanation, so the
      // lesson's formula (first) and pitfalls (second) are the only things
      // that can explain a wrong answer. They used to be reachable only on
      // the lesson page the learner has already left.
      key: 'g_' + les.id + '_' + mode, back: 'glesson', pit: les.pit || [], formula: (les.guide && les.guide.formula) || '', lessonId: les.id, step: mode,
      items: mode === 'choose' ? shuffled(items, Date.now() % 7919) : items });
  }
  gramGame(lv) {
    const L = lv || this.state.gLv || 'A1';
    const pool = [];
    LEVELS.slice(0, LEVELS.indexOf(L) + 1).forEach(x => this.gramLessons(x)
      .filter(les => this.gramStats(les).passed > 0)
      .forEach(les => (les.choose || []).forEach(q => pool.push(q))));
    if (!pool.length) return;
    this.csStart({ kind: 'gram', mode: 'game', title: 'بازی دستور زبان · تا سطح ' + L, key: 'g_game_' + L, back: 'gram', items: shuffled(pool, Date.now() % 9973) });
  }

  // ---- collocation drill builders ----
  cGroups() { return (typeof window !== 'undefined' && window.COLLOC2) || []; }
  cGroup(k) { const g = this.cGroups(); return g.find(x => x.key === (k || this.state.cgKey || 'make')) || g[0] || null; }
  cFa(s) { return String(s).split(' — ')[0]; }
  cVerbDrill(g, typing) {
    const first = it => it.en.split(' ')[0];
    const others = Array.from(new Set([].concat.apply([], this.cGroups().filter(x => x.key !== g.key).map(x => x.items.map(first)))));
    const mine = Array.from(new Set(g.items.map(first)));
    const r = mulberry(Date.now() % 99991);
    const items = shuffled(g.items, Date.now() % 7919).slice(0, 10).map((it, n) => {
      const f = first(it), rest = it.en.split(' ').slice(1).join(' ');
      if (typing) return { q: '___ ' + rest, a: f, fa: this.cFa(it.fa) };
      let bank = CORE_VERBS.indexOf(f) >= 0 ? CORE_VERBS.filter(x => x !== f) : mine.filter(x => x !== f);
      if (bank.length < 3) bank = bank.concat(others.filter(x => x !== f && bank.indexOf(x) < 0));
      const dis = []; let guard = 0;
      while (dis.length < 3 && guard++ < 200) { const c = bank[Math.floor(r() * bank.length)]; if (c && dis.indexOf(c) < 0) dis.push(c); }
      const opts = shuffled(dis.concat([f]), n + 41);
      return { q: '___ ' + rest + '   (' + this.cFa(it.fa) + ')', opts, a: opts.indexOf(f), why: it.en };
    });
    this.csStart({ kind: 'colloc', mode: typing ? 'fill' : 'choose', title: (typing ? 'تایپ ترکیب · ' : 'انتخاب درست · ') + g.label,
      key: 'c_' + g.key + (typing ? '_fill' : '_choose'), back: 'colloc', use: g.use || g.note || '', items });
  }
  cMeaningDrill(g) {
    const all = [].concat.apply([], this.cGroups().map(x => x.items));
    const r = mulberry(Date.now() % 99991);
    const items = shuffled(g.items, Date.now() % 6151).slice(0, 10).map((it, n) => {
      const dis = []; let guard = 0;
      while (dis.length < 3 && guard++ < 200) { const c = all[Math.floor(r() * all.length)]; if (c && c.en !== it.en && dis.indexOf(this.cFa(c.fa)) < 0) dis.push(this.cFa(c.fa)); }
      const opts = shuffled(dis.concat([this.cFa(it.fa)]), n + 17);
      return { q: it.en, opts, a: opts.indexOf(this.cFa(it.fa)) };
    });
    this.csStart({ kind: 'colloc', mode: 'choose', title: 'معنی ترکیب · ' + g.label, key: 'c_' + g.key + '_mean', back: 'colloc', use: g.use || g.note || '', items });
  }
  cProduceDrill(g) {
    // No "fa" here: csHint renders it as راهنما, and it used to hold the answer.
    const items = shuffled(g.items, Date.now() % 5147).slice(0, 8).map(it => ({ q: this.cFa(it.fa), a: it.en }));
    this.csStart({ kind: 'colloc', mode: 'fill', title: 'از فارسی به ترکیب · ' + g.label, key: 'c_' + g.key + '_prod', back: 'colloc', use: g.use || g.note || '', items });
  }
  cGame(lv) {
    const all = [];
    let groups = this.cGroups();
    if (lv) {
      const sp = levelSpans(groups.length)[Math.max(0, LEVELS.indexOf(lv))] || [0, groups.length];
      const sliced = groups.slice(sp[0], sp[0] + sp[1]);
      if (sliced.length) groups = sliced;
    }
    groups.forEach(g => g.items.forEach(it => all.push({ it, g })));
    const first = s => s.split(' ')[0];
    const verbs = Array.from(new Set(all.map(x => first(x.it.en))));
    const r = mulberry(Date.now() % 99991);
    const items = shuffled(all, Date.now() % 9973).slice(0, 60).map((x, n) => {
      const f = first(x.it.en), rest = x.it.en.split(' ').slice(1).join(' ');
      const dis = []; let guard = 0;
      while (dis.length < 3 && guard++ < 200) { const c = verbs[Math.floor(r() * verbs.length)]; if (c && c !== f && dis.indexOf(c) < 0) dis.push(c); }
      const opts = shuffled(dis.concat([f]), n + 29);
      return { q: '___ ' + rest + '   (' + this.cFa(x.it.fa) + ')', opts, a: opts.indexOf(f) };
    });
    this.csStart({ kind: 'colloc', mode: 'game', title: 'بازی ترکیب‌ها' + (lv ? ' · سطح ' + lv : '') + ' — مسابقه‌ی سرعت', key: lv ? 'c_game_' + lv : 'c_game', back: lv ? 'words' : 'colloc', lv: lv || null, items });
  }

  courseVals() {
    const s = this.state;
    const GR = (typeof window !== 'undefined' && window.GRAM) || null;
    const chip = (on, c) => 'display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:99px;font-size:12.5px;cursor:pointer;background:' + (on ? c + '24' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + (on ? c + '77' : 'rgba(233,233,237,.42)') + ';color:' + (on ? c : 'rgba(233,233,237,.6)');
    const row = 'display:flex;align-items:center;gap:11px;padding:12px 13px;border-radius:11px;background:rgba(233,233,237,.025);border:1px solid rgba(233,233,237,.06);cursor:pointer;width:100%;text-align:right';
    const drillBtn = c => 'display:flex;align-items:center;gap:9px;padding:11px 12px;border-radius:11px;background:rgba(233,233,237,.03);border:1px solid ' + c + '3d;cursor:pointer;text-align:right;width:100%';
    const iconSq = c => 'flex:none;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:' + c + '1f;border:1px solid ' + c + '44;color:' + c + ';font-size:16px';
    const out = {
      isGram: s.screen === 'gram' && !!GR,
      isGLesson: s.screen === 'glesson' && !!s.gLesson,
      isColloc: s.screen === 'colloc',
      isCsRun: s.screen === 'csrun' && !!s.cs,
      goGramHome: () => this.goGram(),
      goCollocHome: () => this.goColloc(),
      gramCardDesc: '۱۸ درس A1 تا C2 — توضیح کاربردی، تمرین مرحله‌ای، جمله‌سازی و بازخورد آنلاین',
      collocCardDesc: '۲۲ گروه موضوعی — کدام کلمه‌ها با هم می‌آیند، با ۳ تمرین و بازی سرعت'
    };
    if (out.isGram) {
      const lv = s.gLv || 'A1', reviewOnly = !!s.gReviewOnly;
      const visibleLevels = reviewOnly ? LEVELS.filter(L => this.gramLessons(L).some(x => this.gramStats(x).passed > 0)) : LEVELS;
      out.gramHeading = reviewOnly ? 'مرور دستور زبان' : 'دستور زبان';
      out.gramIntro = reviewOnly
        ? 'فقط درس‌هایی که دست‌کم یک مرحله‌شان را گذرانده‌ای اینجا هستند. یک درس را باز کن و مرحله‌های سبز را دوباره تمرین کن، یا مرور ترکیبی بزن.'
        : 'مسیر منتخب A1 تا C2؛ هر درس از فهم کاربرد شروع می‌شود، با تمرین مرحله‌ای جلو می‌رود و با جملهٔ خودت تمام می‌شود.';
      out.gramIsReview = reviewOnly;
      out.gramIsPath = !reviewOnly;
      out.gramExitReview = () => this.goGram(lv);
      out.gLvChips2 = (visibleLevels.length ? visibleLevels : [lv]).map(L => {
        const ls = this.gramLessons(L);
        const dn = reviewOnly ? ls.filter(x => this.gramStats(x).passed > 0).length : ls.filter(x => this.gramStats(x).complete).length;
        const unlocked = reviewOnly || this.gramLevelUnlocked(L);
        return { label: L + (ls.length ? ' · ' + dn + '/' + ls.length : ''), icon: unlocked ? (lv === L ? 'ph-fill ph-map-pin' : 'ph ph-circle') : 'ph-fill ph-lock-key', locked: !unlocked,
          style: chip(lv === L, '#9184d9') + (unlocked ? '' : ';opacity:.38;cursor:not-allowed'),
          pick: () => { if (unlocked) this.setState({ gLv: L }); } };
      });
      const shownLessons = this.gramLessons(lv).filter(les => !reviewOnly || this.gramStats(les).passed > 0);
      out.gramHasLessons = shownLessons.length > 0;
      out.gramNoLessons = shownLessons.length === 0;
      out.gramEmptyNote = reviewOnly ? 'هنوز درسی برای مرور نداری. اولین مرحلهٔ یک درس را با حداقل ۷۰٪ بگذران تا اینجا اضافه شود.' : '';
      out.gramList2 = shownLessons.map(les => {
        const st = this.gramStats(les), avg = st.avg;
        return { t: les.t, style: row,
          badge: avg == null ? 'شروع نکرده‌ای · ۵ مرحله' : (st.complete ? 'مسلط · همهٔ ' + st.total + ' مرحله کامل' : st.passed + ' از ' + st.total + ' مرحله گذشته · میانگین ' + avg + '٪'),
          tick: avg == null ? 'ph ph-circle-dashed' : (st.complete ? 'ph-fill ph-check-circle' : 'ph-fill ph-clock-countdown'),
          tickStyle: 'flex:none;font-size:19px;color:' + (avg == null ? 'rgba(233,233,237,.25)' : (st.complete ? '#8fd9c1' : '#e0a458')),
          open: () => this.openGramLesson(les) };
      });
      out.gramGameBest = 'رکورد: ' + this.csBest('g_game_' + lv);
      out.gramGameGo = () => this.gramGame(lv);
      out.gramHasGame = LEVELS.slice(0, LEVELS.indexOf(lv) + 1).some(L => this.gramLessons(L).some(les => this.gramStats(les).passed > 0));
      out.gramGameLabel = reviewOnly ? 'مرور ترکیبی' : 'مرور درس‌های گذرانده‌شده';
      out.gramLvNote = reviewOnly ? shownLessons.length + ' درس قابل مرور در سطح ' + lv : 'سطح ' + lv + ' — ' + this.gramLessons(lv).length + ' درس';
    }
    if (out.isGLesson) {
      const les = s.gLesson, guide = les.guide || {}, st = this.gramStats(les);
      out.glTitle = les.t; out.glWhy = les.why;
      out.glWhyParts = this.grammarRich(les.why);
      const levelLessons = this.gramLessons(s.gLv || 'A1');
      const lessonAt = levelLessons.findIndex(x => x.id === les.id);
      out.glLevel = (s.gLv || 'A1') + ' · درس ' + (Math.max(0, lessonAt) + 1) + ' از ' + levelLessons.length + ' · ' + st.passed + ' از ' + st.total + ' مرحله گذشته';
      out.glProgressStyle = 'height:100%;width:' + Math.round((st.passed / st.total) * 100) + '%;background:linear-gradient(90deg,#9184d9,#8fd9c1);transition:width .3s';
      out.glFormula = guide.formula || ((les.rules || [])[0] || '');
      out.glDecision = guide.decision || les.why;
      out.glMemory = guide.memory || '';
      out.glFormulaParts = this.grammarRich(out.glFormula);
      out.glDecisionParts = this.grammarRich(out.glDecision);
      out.glMemoryParts = this.grammarRich(out.glMemory);
      out.glHasMemory = !!guide.memory;
      out.glRules = (les.rules || []).map(r => ({ r, parts: this.grammarRich(r) }));
      out.glEx = (les.ex || []).map(e => ({ en: e.en, fa: e.fa, say: () => this.speakWord(e.en) }));
      out.glPit = (les.pit || []).map(p => ({ bad: p.bad, good: p.good, fa: p.fa, faParts: this.grammarRich(p.fa), say: () => this.speakWord(p.good) }));
      out.glHasPit = (les.pit || []).length > 0;
      // The 'learn' step (rule/example/pitfall reading, above) has no drill
      // of its own to pass/fail — a single explicit "فهمیدم" tap is what
      // finishes it and unlocks 'fill'. Hidden once already done so a
      // returning learner reviewing the lesson is not asked to re-confirm.
      out.glLearnPending = !st.steps.some(x => x.mode === 'learn' && x.score != null);
      out.glMarkLearnedGo = () => this.gramMarkLearned(les);
      const stepNames = { learn: 'قاعده و مثال‌ها', input: 'تشخیص معنی', choose: 'تشخیص گزینه‌ها', fill: 'ساختار را بساز', order: 'جمله‌سازی', err: 'اصلاح خطا', produce: 'جملهٔ خودم' };
      const stepIcons = { learn: 'ph ph-book-open-text', input: 'ph ph-translate', choose: 'ph ph-list-checks', fill: 'ph ph-pencil-line', order: 'ph ph-arrows-left-right', err: 'ph ph-wrench', produce: 'ph ph-pen-nib' };
      const currentIndex = st.next ? st.steps.findIndex(x => x.mode === st.next.mode) : st.steps.length;
      out.glSteps = st.steps.map((x, i) => {
        const passed = x.score != null, current = i === currentIndex, locked = !st.complete && i > currentIndex;
        return { n: String(i + 1), label: stepNames[x.mode], score: locked ? 'بعد از مرحلهٔ ' + (currentIndex + 1) + ' باز می‌شود' : (x.score == null ? (current ? 'مرحلهٔ جاری' : 'انجام‌نشده') : x.score + '٪ از بار اول'),
          icon: locked ? 'ph-fill ph-lock-key' : (passed ? 'ph-fill ph-check' : stepIcons[x.mode]),
          style: 'display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;background:' + (passed && !locked ? 'rgba(143,217,193,.08)' : (current ? 'rgba(145,132,217,.1)' : 'rgba(233,233,237,.018)')) + ';border:1px solid ' + (passed && !locked ? 'rgba(143,217,193,.32)' : (current ? 'rgba(145,132,217,.5)' : 'rgba(233,233,237,.07)')) + ';color:' + (passed && !locked ? '#8fd9c1' : (current ? '#b3a9e6' : 'rgba(233,233,237,.3)')) + ';cursor:' + (locked ? 'not-allowed' : 'pointer') + ';opacity:' + (locked ? '.7' : '1'),
          go: locked ? (() => this.setState({ gFlowNote: 'اول مرحلهٔ ' + (currentIndex + 1) + ' را تمام کن.' })) : (() => this.gramGoStep(les, x.mode)) };
      });
      out.glHasFlowNote = !!s.gFlowNote; out.glFlowNote = s.gFlowNote || '';
      out.glNextLabel = st.next ? 'ادامهٔ مسیر · ' + stepNames[st.next.mode] : 'درس کامل شد';
      out.glNextGo = () => st.next ? this.gramGoStep(les, st.next.mode) : this.goGram();
      out.glNextIcon = st.complete ? 'ph-fill ph-check-circle' : 'ph-fill ph-play';

      const prod = guide.prod || {};
      const prodIndex = st.steps.findIndex(x => x.mode === 'produce');
      out.glProdLocked = !st.complete && currentIndex < prodIndex;
      out.glProdUnlocked = !out.glProdLocked;
      out.glProdLockText = 'مرحله‌های قبلی را به‌ترتیب تمام کن تا این تمرین باز شود.';
      out.glProdTask = prod.task || 'با ساختار این درس یک جملهٔ شخصی بنویس.';
      out.glProdHint = prod.hint || '';
      out.glProdTaskParts = this.grammarRich(out.glProdTask);
      out.glProdHintParts = this.grammarRich(out.glProdHint);
      out.glProdModel = prod.model || ((les.ex || [])[0] || {}).en || '';
      out.glProdText = s.gpText || '';
      out.glProdOnType = e => this.setState({ gpText: e.target.value, gpErr: '' });
      out.glProdCheck = () => this.checkGrammarProduction();
      out.glProdBtn = s.gpBusy ? 'در حال اتصال…' : 'بررسی آنلاین + ترجمه';
      out.glProdErr = s.gpErr || ''; out.glProdHasErr = !!s.gpErr;
      out.glProdInputStyle = 'width:100%;min-height:80px;resize:vertical;padding:12px 14px;border-radius:10px;font-family:Inter,sans-serif;direction:ltr;text-align:left;font-size:14.5px;line-height:1.8;background:rgba(233,233,237,.04);border:1px solid rgba(233,233,237,.42);color:#e9e9ed;outline:none';
      const gr = s.gpResult;
      out.glProdHasResult = !!gr;
      out.glProdScore = gr ? gr.score + ' / ۱۰۰' : '';
      out.glProdStatus = gr ? (gr.passed ? 'ساختار هدف را درست به کار بردی' : 'یک بار دیگر بازنویسی کن') : '';
      out.glProdResultStyle = 'padding:12px 13px;border-radius:10px;background:' + (gr && gr.passed ? 'rgba(143,217,193,.07)' : 'rgba(224,164,88,.07)') + ';border:1px solid ' + (gr && gr.passed ? 'rgba(143,217,193,.28)' : 'rgba(224,164,88,.28)') + ';margin-top:10px';
      out.glProdChecks = gr ? (gr.checks || []).map(c => ({ label: c.label, icon: c.ok ? 'ph-fill ph-check-circle' : 'ph-fill ph-warning-circle', style: 'display:flex;gap:7px;align-items:flex-start;font-size:11.5px;line-height:1.8;color:' + (c.ok ? '#8fd9c1' : '#e0a458') })) : [];
      out.glProdCorrected = gr ? gr.corrected || '' : ''; out.glProdHasCorrected = !!(gr && gr.corrected);
      out.glProdTranslation = gr ? gr.translation || '' : ''; out.glProdHasTranslation = !!(gr && gr.translation);
      out.glProdTranslationFailed = !!(gr && gr.translationFailed);
      out.glProdRetryTranslation = () => this.retryGrammarTranslation();
      out.glProdRetryTranslationLabel = s.gpBusy ? 'در حال ترجمه…' : 'تلاش دوباره برای ترجمه';
      out.glProdService = gr ? gr.service || '' : '';
      out.glProdUseCorrection = () => gr && gr.corrected && this.setState({ gpText: gr.corrected, gpResult: null, gpOpen: true });
      out.glProdReset = () => this.resetGrammarProduction();
      const allGrammar = this.gramItems(), here = allGrammar.findIndex(x => x.les.id === les.id), after = allGrammar[here + 1];
      out.glProdCanContinue = !!(gr && gr.passed);
      out.glProdNextLabel = after ? 'درس بعد · ' + after.les.t : 'بازگشت به مسیر دستور زبان';
      out.glProdNext = () => after ? this.setState({ gLv: after.lv }, () => this.openGramLesson(after.les)) : this.goGram();
      out.glBack = () => s.gReviewOnly ? this.goGramReview(s.gLv) : this.goGram();
    }
    if (out.isColloc) {
      const G = this.cGroups(), g = this.cGroup();
      out.hasColloc = !!g;
      if (g) {
        // 22 identical chips told the learner nothing about where they had been.
        // The per-drill scores are already stored; grammar shows the same thing.
        const DRILLS = ['_choose', '_fill', '_mean', '_prod'];
        out.cgChips2 = G.map(x => {
          const done = DRILLS.filter(d => this.csScore('c_' + x.key + d) != null).length;
          return { label: x.label + (done ? ' · ' + done + '/' + DRILLS.length : ''), style: chip(g.key === x.key, '#8fd9c1'), pick: () => this.setState({ cgKey: x.key }) };
        });
        out.cgUse = g.use || g.note || '';
        out.cgHasUse = !!(g.use || g.note);
        out.cgLabel = g.label;
        out.cgItems = g.items.map(it => ({ en: it.en, fa: it.fa, say: () => this.speakWord(it.en) }));
        out.cgCount = g.items.length + ' ترکیب در این گروه';
        // Only the verb groups actually ask about a verb; the function groups
        // ("نظر دادن", "سلام و گپ", …) blank out a preposition or an opener.
        const isVerbGroup = g.items.every(it => CORE_VERBS.indexOf(it.en.split(' ')[0]) >= 0);
        const slot = isVerbGroup ? 'فعل' : 'کلمه';
        out.cgDrills = [
          { label: 'کدام ' + slot + ' درست است؟', d: 'انتخاب از بین گزینه‌ها', icon: 'ph ph-list-checks', c: '#8fd9c1', key: '_choose', go: () => this.cVerbDrill(g, false) },
          { label: 'تایپ کن', d: slot + ' درست را بنویس', icon: 'ph ph-keyboard', c: '#9184d9', key: '_fill', go: () => this.cVerbDrill(g, true) },
          { label: 'معنی را بشناس', d: 'انگلیسی → فارسی', icon: 'ph ph-translate', c: '#84c5d9', key: '_mean', go: () => this.cMeaningDrill(g) },
          { label: 'از فارسی بساز', d: 'سخت‌ترین تمرین — کل عبارت را بنویس', icon: 'ph ph-pen-nib', c: '#e0879e', key: '_prod', go: () => this.cProduceDrill(g) }
        ].map(x => {
          const pc = this.csScore('c_' + g.key + x.key);
          return { label: x.label, d: x.d + (pc != null ? ' · بهترین ' + pc + '٪' : ''), icon: x.icon, style: drillBtn(x.c), iconStyle: iconSq(x.c), go: x.go };
        });
      }
      out.cGameBest = 'رکورد: ' + this.csBest('c_game');
      out.cGameGo = () => this.cGame();
    }
    if (out.isCsRun) {
      const cs = s.cs, it = cs.items[cs.k] || {};
      out.csTitle = cs.title;
      out.csIsGame = cs.mode === 'game';
      out.csNotGame = cs.mode !== 'game';
      out.csPos = (cs.k + 1) + ' / ' + cs.items.length;
      out.csBarStyle = 'height:100%;width:' + Math.round(((cs.k + (cs.done ? 1 : 0)) / cs.items.length) * 100) + '%;background:linear-gradient(90deg,#9184d9,#b3a9e6);transition:width .3s';
      out.csQuitGo = () => this.csQuit();
      out.csDone = !!cs.done; out.csRunning = !cs.done && !cs.over;
      // 'input' items are shaped exactly like 'choose' items ({opts, a}) —
      // structured input reuses the same discrimination UI, it is the
      // MEANING-first prompt (Persian, not the target form) that makes it
      // a different task, not different markup.
      out.csIsChoose = cs.mode === 'choose' || cs.mode === 'game' || cs.mode === 'input';
      out.csIsFill = cs.mode === 'fill';
      out.csIsError = cs.mode === 'error';
      out.csIsOrder = cs.mode === 'order';
      // prompt
      let prompt = '', hint = '', ltr = true;
      if (cs.mode === 'choose' || cs.mode === 'game') { prompt = it.q || ''; hint = 'گزینه‌ی درست را انتخاب کن'; }
      if (cs.mode === 'input') { prompt = it.q || ''; hint = 'کدام جمله همین معنی را می‌رساند؟'; ltr = false; }
      if (cs.mode === 'fill') { prompt = it.q || ''; hint = it.fa ? 'راهنما: ' + it.fa : 'جای خالی را پر کن'; }
      if (cs.mode === 'error') { prompt = it.s || ''; hint = 'این جمله یک غلط دارد — شکل درستش را بنویس'; }
      if (cs.mode === 'order') { prompt = it.fa || ''; hint = 'تکه‌ها را به ترتیب درست بچین'; ltr = false; }
      out.csPrompt = prompt; out.csHint = hint;
      out.csPromptStyle = ltr
        ? 'font-family:Inter,sans-serif;font-size:18px;font-weight:500;direction:ltr;line-height:1.8;text-align:center'
        : 'font-size:17px;font-weight:500;line-height:1.9;text-align:center';
      const numS = 'flex:none;width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:rgba(233,233,237,.07);font-size:10.5px;font-family:Inter,sans-serif;color:rgba(233,233,237,.55)';
      out.csOpts = (it.opts || []).map((o, i) => {
        let bd = 'rgba(233,233,237,.42)', bg = 'rgba(233,233,237,.03)', col = 'rgba(233,233,237,.88)';
        if (cs.picked != null) {
          if (i === it.a) { bd = 'rgba(143,217,193,.6)'; bg = 'rgba(143,217,193,.1)'; col = '#8fd9c1'; }
          else if (i === cs.picked) { bd = 'rgba(217,143,143,.6)'; bg = 'rgba(217,143,143,.1)'; col = '#d98f8f'; }
        }
        return { n: String(i + 1), label: o, numStyle: numS,
          style: 'display:flex;align-items:center;gap:10px;width:100%;padding:12px 13px;border-radius:10px;background:' + bg + ';border:1px solid ' + bd + ';color:' + col + ';font-size:14px;cursor:pointer;font-family:Inter,sans-serif;direction:ltr;text-align:left',
          mark: cs.picked == null ? '' : (i === it.a ? 'ph-fill ph-check-circle' : (i === cs.picked ? 'ph-fill ph-x-circle' : '')),
          markStyle: 'font-size:16px;flex:none',
          pick: () => this.csPick(i) };
      });
      // The explanation is called "why" on choose/game items and "fa" on
      // error-hunt items. Gating on mode === 'choose' hid it from the grammar
      // game (whose items ARE choose items) and from every error-hunt question,
      // where it is the only explanation the data has. fill/order items carry
      // no per-item explanation at all, so a wrong answer there falls back to
      // the lesson's own formula card — the same rule shown on the lesson
      // page — before the pitfalls list below as a second-line fallback.
      const why = it.why || (cs.mode === 'error' ? it.fa : '') || (((cs.mode === 'fill' || cs.mode === 'order' || cs.mode === 'input') && !cs.ok) ? cs.formula : '') || '';
      out.csHasWhy = !!why && (cs.picked != null || cs.checked);
      out.csWhy = why;
      // What the group's verb actually means — shown on the collocations hub,
      // then dropped the moment a drill started.
      out.csUse = cs.use || '';
      out.csHasUse = !!cs.use;
      // Fallback explanation for fill/order, which have none of their own.
      out.csHasPit = !cs.ok && !!cs.checked && !why && !!(cs.pit || []).length;
      out.csPit = (cs.pit || []).map(p => ({ bad: p.bad, good: p.good, fa: p.fa }));
      out.csTyped = cs.typed;
      out.csOnType = e => this.csSet({ typed: e.target.value });
      out.csKey = e => { if (e.key === 'Enter') { if (!this.state.cs.checked) this.csCheckTyped(); else this.csNext(); } };
      out.csCheckGo = () => this.csCheckTyped();
      out.csInputStyle = 'width:100%;padding:13px 15px;border-radius:10px;font-family:Inter,sans-serif;direction:ltr;text-align:left;font-size:16px;background:rgba(233,233,237,.04);border:1px solid ' + (cs.checked ? (cs.ok ? 'rgba(143,217,193,.6)' : 'rgba(217,143,143,.6)') : 'rgba(233,233,237,.42)') + ';color:#e9e9ed;outline:none';
      const target = cs.mode === 'error' ? it.fix : it.a;
      out.csFeedback = cs.checked ? (cs.ok ? 'درست بود ✓' : 'درستش: ' + target) : (cs.typeNote || '·');
      out.csFeedbackStyle = 'margin-top:8px;font-size:13px;min-height:20px;line-height:1.7;font-family:Inter,sans-serif;direction:ltr;text-align:left;color:' + (cs.checked ? (cs.ok ? '#8fd9c1' : '#d98f8f') : (cs.typeNote ? '#e0a458' : 'transparent'));
      out.csPool = (cs.pool || []).filter(Boolean).map(p => ({ label: p.c, style: 'padding:9px 13px;border-radius:9px;background:rgba(132,197,217,.08);border:1px solid rgba(132,197,217,.32);color:#cfeaf5;font-size:13.5px;font-family:Inter,sans-serif;direction:ltr;cursor:pointer', tap: () => this.csTake(p.i) }));
      out.csSeq = (cs.seq || []).filter(Boolean).map(p => ({ label: p.c, style: 'padding:9px 13px;border-radius:9px;background:' + (cs.checked ? (cs.ok ? 'rgba(143,217,193,.12)' : 'rgba(217,143,143,.12)') : 'rgba(145,132,217,.14)') + ';border:1px solid ' + (cs.checked ? (cs.ok ? 'rgba(143,217,193,.5)' : 'rgba(217,143,143,.5)') : 'rgba(145,132,217,.5)') + ';color:#e9e9ed;font-size:13.5px;font-family:Inter,sans-serif;direction:ltr;cursor:pointer', tap: () => this.csUndo(p.i) }));
      out.csSeqEmpty = !(cs.seq || []).filter(Boolean).length;
      out.csOrderCheck = () => this.csCheckOrder();
      out.csOrderFeedback = cs.checked ? (cs.ok ? 'ترتیب درست بود ✓' : 'ترتیب درست: ' + (it.chunks || []).join(' ')) : (cs.orderNote || '');
      out.csOrderFbStyle = 'margin-top:9px;font-size:13px;font-family:Inter,sans-serif;line-height:1.7;' + (cs.checked ? 'direction:ltr;text-align:left;' : '') + 'color:' + (cs.checked ? (cs.ok ? '#8fd9c1' : '#d98f8f') : '#e0a458');
      out.csHasOrderFb = !!cs.checked || !!cs.orderNote;
      out.csNextGo = () => this.csNext();
      // A wrong answer always requeues (csNext() above), so there is always
      // a next card after it even on what looks like the last known item —
      // otherwise this button would promise "پایان و نتیجه" and then not end.
      out.csNextLabel = (!cs.ok || cs.k + 1 < cs.items.length) ? 'بعدی' : 'پایان و نتیجه';
      out.csNextStyle = 'display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;background:' + (cs.checked ? 'rgba(145,132,217,.14)' : 'transparent') + ';border:1px solid ' + (cs.checked ? '#9184d9' : 'rgba(233,233,237,.42)') + ';color:' + (cs.checked ? '#b3a9e6' : 'rgba(233,233,237,.55)');
      // Retry-to-criterion (csNext() above) means reaching this screen at
      // all already means every item was eventually answered correctly —
      // there is no more "below 70%, do the whole drill over" outcome, so
      // `pct` (first-try accuracy) is purely informational here, never a
      // pass/fail gate, and the old "همین تمرین را دوباره بده" restart
      // button is gone: there is nothing left to retry.
      const total0 = cs.total0 || cs.items.length;
      const wrongCount = (cs.wrongIds || []).length;
      const pct = Math.round(((total0 - wrongCount) / total0) * 100);
      out.csScoreTitle = (total0 - wrongCount) + ' از ' + total0 + ' از بار اول درست';
      out.csScoreDesc = (wrongCount === 0 ? 'عالی — همه را از بار اول درست زدی. ' : 'این مرحله تمام شد؛ ' + wrongCount + ' مورد به تلاش دوباره نیاز داشت. ') + (cs.right * 6) + ' امتیاز تجربه گرفتی.';
      out.csResIconStyle = 'width:56px;height:56px;margin:0 auto;border-radius:16px;display:grid;place-items:center;font-size:28px;background:rgba(143,217,193,.12);border:1px solid rgba(143,217,193,.4);color:#8fd9c1';
      const csNextIsLesson = cs.kind === 'gram' && !!cs.lessonId;
      const gramHit = csNextIsLesson ? this.grammarLessonById(cs.lessonId) : null;
      const nextGram = gramHit ? this.gramStats(gramHit.les).next : null;
      const nextGramNames = { learn: 'قاعده و مثال‌ها', input: 'تشخیص معنی', choose: 'تشخیص گزینه‌ها', fill: 'جای خالی', order: 'جمله‌سازی', err: 'اصلاح خطا', produce: 'جملهٔ خودم' };
      out.csNextLabel2 = nextGram ? 'مرحلهٔ بعد · ' + nextGramNames[nextGram.mode] : 'بازگشت به درس';
      out.csNextGo2 = csNextIsLesson ? (() => this.gramContinue(cs)) : (() => this.csQuit());
      out.csBackGo = () => this.csQuit();
      // game HUD
      out.csGameOverNow = !!cs.over;
      out.csGamePlaying = cs.mode === 'game' && !cs.over;
      out.csScoreNum = String(cs.score);
      out.csLeft = cs.left + 'ث';
      out.csLeftStyle = 'font-family:Inter,sans-serif;font-size:15px;font-weight:600;color:' + (cs.left <= 10 ? '#d98f8f' : '#e0a458');
      out.csHearts = [0, 1, 2].map(i => ({ icon: i < cs.lives ? 'ph-fill ph-heart' : 'ph ph-heart', style: 'font-size:14px;color:' + (i < cs.lives ? '#d98f8f' : 'rgba(233,233,237,.2)') }));
      out.csGameTitle = 'امتیاز نهایی ' + cs.score;
      out.csGameDesc = cs.score > cs.best ? 'رکورد تازه ثبت شد!' : 'رکوردت ' + cs.best + ' است — دوباره امتحان کن.';
      out.csGameRetry = () => { const b = cs.back; clearInterval(this.csIv); if (cs.kind === 'gram') { this.setState({ screen: b }, () => this.gramGame()); } else { this.setState({ screen: b }, () => this.cGame(cs.lv)); } };
    }
    return out;
  }

  // ===== listening / shadowing =====
  lsAll() { return ((window.LISTEN_1 || []).concat(window.LISTEN_2 || [])); }
  lsProg() { try { return JSON.parse(localStorage.getItem('vocab_listen') || '{}') || {}; } catch (e) { return {}; } }
  lsLevelUnlocked(L) {
    const at = LEVELS.indexOf(L); if (at <= 0) return true;
    const d = (this.state && this.state.data) || this.load();
    if (at <= this.band(d.round || 1)) return true;
    const all = this.lsAll(), p = this.lsProg(), read = p.r || {}, quiz = p.q || {};
    if (all.some(t => t.lv === L && (read[t.id] || quiz[t.id] != null))) return true;
    return LEVELS.slice(0, at).every(lv => {
      const texts = all.filter(t => t.lv === lv);
      return texts.length > 0 && texts.every(t => (quiz[t.id] || 0) >= 70);
    });
  }
  lsSave(p) { try { localStorage.setItem('vocab_listen', JSON.stringify(p)); } catch (e) {} }
  lsMark(id, pct) { const p = this.lsProg(); if (!p.q) p.q = {}; if (pct >= (p.q[id] || 0)) p.q[id] = pct; this.lsSave(p); }
  lsMarkRead(id) { const p = this.lsProg(); if (!p.r) p.r = {}; p.r[id] = 1; this.lsSave(p); }
  goListen(lv) {
    this.lsStop();
    const wanted = lv || this.state.lsLv || this.levelOf((this.load().round) || 1);
    const open = this.lsLevelUnlocked(wanted) ? wanted : (LEVELS.slice().reverse().find(L => this.lsLevelUnlocked(L)) || 'A1');
    this.setState({ screen: 'listen', lsLv: open, lsText: null, lsQuiz: null });
  }
  openText(t) {
    this.lsStop();
    this.remember('ltext', 'شنیدن و بازگویی', 'سطح ' + t.lv + ' · ' + t.titleFa);
    this.setState({ screen: 'ltext', lsText: t, lsLine: 0, lsPlaying: false, lsRate: 0.9, lsShowFa: false,
      lsRec: 'idle', lsUrl: '', lsHeard: '', lsSpeech: null, lsSpeechState: 'idle', lsQuiz: null }, () => this.lsMarkRead(t.id));
  }
  lsStop() {
    this.lsAuto = false;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    try { if (this.lsSR) this.lsSR.abort(); } catch (e) {}
    try { if (this.lsMr && this.lsMr.state !== 'inactive') this.lsMr.stop(); } catch (e) {}
    if (this.state && this.state.lsPlaying) this.setState({ lsPlaying: false });
  }
  lsSpeak(text, cb) {
    if (!window.speechSynthesis) return cb && cb();
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = this.state.lsRate || 0.9;
      // Without an explicit voice the browser may read English with the system
      // default — on a Persian machine that is a Persian voice. speakWord picks
      // one the same way; this section was simply never given the same care.
      const vs = window.speechSynthesis.getVoices() || [];
      const v = vs.find(x => /en-US/i.test(x.lang) && /natural|google|samantha|aria/i.test(x.name)) || vs.find(x => /^en/i.test(x.lang));
      if (v) u.voice = v;
      u.onend = () => { if (cb) cb(); };
      u.onerror = () => { if (cb) cb(); };
      window.speechSynthesis.speak(u);
    } catch (e) { if (cb) cb(); }
  }
  lsPlayLine(i) {
    const t = this.state.lsText; if (!t) return;
    const k = Math.max(0, Math.min(i, t.lines.length - 1));
    this.lsAuto = false;
    this.setState({ lsLine: k, lsPlaying: true, lsHeard: '', lsSpeech: null, lsSpeechState: 'idle' }, () => this.lsSpeak(t.lines[k].en, () => this.setState({ lsPlaying: false })));
  }
  lsPlayAll() {
    const t = this.state.lsText; if (!t) return;
    if (this.lsAuto) return this.lsStop();
    this.lsAuto = true;
    const step = k => {
      if (!this.lsAuto || !this.state.lsText || k >= t.lines.length) { this.lsAuto = false; return this.setState({ lsPlaying: false }); }
      this.setState({ lsLine: k, lsPlaying: true }, () => this.lsSpeak(t.lines[k].en, () => { if (this.lsAuto) setTimeout(() => step(k + 1), 260); }));
    };
    step(this.state.lsLine || 0);
  }
  lsNextLine(d) {
    const t = this.state.lsText; if (!t) return;
    const k = Math.max(0, Math.min((this.state.lsLine || 0) + d, t.lines.length - 1));
    this.lsPlayLine(k);
  }
  lsSetRate(r) { this.setState({ lsRate: r }); }
  lsRecToggle() {
    const st = this.state.lsRec || 'idle';
    if (st === 'recording') {
      try { if (this.lsSR) this.lsSR.stop(); } catch (e) {}
      if (this.lsMr && this.lsMr.state !== 'inactive') this.lsMr.stop();
      return;
    }
    if (!navigator.mediaDevices || !window.MediaRecorder) return this.setState({ lsRec: 'error' });
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mr = new MediaRecorder(stream); this.lsMr = mr;
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(x => x.stop());
        this.setState({ lsRec: 'done', lsUrl: URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' })) });
      };
      mr.start();
      const target = this.state.lsText.lines[this.state.lsLine || 0].en;
      this.setState({ lsRec: 'recording', lsUrl: '', lsHeard: '', lsSpeech: null, lsSpeechState: 'connecting' });
      this.lsSR = this.startOnlineSpeech({ target,
        onText: text => {
          const match = this.speechMatch(text, target);
          this.setState({ lsHeard: text, lsSpeech: match, lsSpeechState: 'online' });
        },
        onError: () => this.setState({ lsSpeechState: 'offline' }),
        onEnd: () => { if (this.state.lsSpeechState === 'connecting') this.setState({ lsSpeechState: 'offline' }); }
      });
      if (!this.lsSR) this.setState({ lsSpeechState: 'offline' });
    }).catch(() => this.setState({ lsRec: 'error' }));
  }
  lsStartQuiz() {
    const t = this.state.lsText; if (!t || !t.q || !t.q.length) return;
    this.lsStop();
    this.setState({ lsQuiz: { k: 0, picked: null, right: 0, done: false } });
  }
  lsQPick(i) {
    const q = this.state.lsQuiz, t = this.state.lsText; if (!q || q.picked != null) return;
    const ok = i === t.q[q.k].a;
    this.setState({ lsQuiz: Object.assign({}, q, { picked: i, right: q.right + (ok ? 1 : 0) }) });
  }
  lsQNext() {
    const q = this.state.lsQuiz, t = this.state.lsText; if (!q || q.picked == null) return;
    if (q.k + 1 < t.q.length) return this.setState({ lsQuiz: Object.assign({}, q, { k: q.k + 1, picked: null }) });
    const pct = Math.round((q.right / t.q.length) * 100);
    this.lsMark(t.id, pct); this.addXp(q.right * 6);
    this.setState({ lsQuiz: Object.assign({}, q, { done: true }) });
  }

  listenVals() {
    const s = this.state, all = this.lsAll();
    const chip = (on, c) => 'display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:99px;font-size:12.5px;cursor:pointer;background:' + (on ? c + '24' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + (on ? c + '77' : 'rgba(233,233,237,.42)') + ';color:' + (on ? c : 'rgba(233,233,237,.6)');
    const out = {
      isListen: s.screen === 'listen' && all.length > 0,
      isLText: s.screen === 'ltext' && !!s.lsText,
      goListen: () => this.goListen(),
      listenCardDesc: all.length + ' متن سطح‌بندی‌شده (A1 تا C2) با صدا، ترجمه‌ی خط‌به‌خط، شدوئینگ و آزمون درک مطلب'
    };
    if (out.isListen) {
      const lv = s.lsLv || 'A1', prog = this.lsProg();
      out.lsLvChips = LEVELS.map(L => {
        const n = all.filter(t => t.lv === L).length;
        const unlocked = this.lsLevelUnlocked(L);
        return { label: L + (n ? ' · ' + n : ' · —'), icon: unlocked ? (lv === L ? 'ph-fill ph-map-pin' : 'ph ph-circle') : 'ph-fill ph-lock-key', locked: !unlocked,
          style: chip(lv === L, '#84c5d9') + (unlocked ? '' : ';opacity:.38;cursor:not-allowed'),
          pick: () => { if (unlocked) this.setState({ lsLv: L }); } };
      });
      const list = all.filter(t => t.lv === lv);
      out.lsHasTexts = list.length > 0;
      out.lsEmptyNote = 'برای این سطح فعلاً متنی نیست — سطح دیگری را انتخاب کن.';
      out.lsTexts = list.map(t => {
        const pc = (prog.q || {})[t.id], read = (prog.r || {})[t.id];
        return {
          title: t.title, fa: t.titleFa,
          meta: t.lines.length + ' خط · موضوع: ' + this.catLabel(t.topic) + (pc != null ? ' · آزمون ' + pc + '٪' : (read ? ' · خوانده‌شده' : '')),
          style: 'display:flex;align-items:center;gap:11px;padding:13px;border-radius:11px;background:rgba(233,233,237,.025);border:1px solid rgba(233,233,237,.06);cursor:pointer;width:100%;text-align:right',
          tick: pc != null ? 'ph-fill ph-check-circle' : (read ? 'ph-fill ph-book-open' : 'ph ph-circle-dashed'),
          tickStyle: 'flex:none;font-size:19px;color:' + (pc != null ? '#8fd9c1' : (read ? '#84c5d9' : 'rgba(233,233,237,.25)')),
          open: () => this.openText(t)
        };
      });
      out.lsCount = all.length + ' متن در ۶ سطح';
    }
    if (out.isLText) {
      const t = s.lsText, k = s.lsLine || 0, q = s.lsQuiz;
      out.ltTitle = t.title; out.ltTitleFa = t.titleFa;
      out.ltMeta = 'سطح ' + t.lv + ' · ' + t.lines.length + ' خط · موضوع: ' + this.catLabel(t.topic);
      out.ltBack = () => { this.lsStop(); this.goListen(t.lv); };
      out.ltShowFa = s.lsShowFa !== false;
      out.ltToggleFa = () => this.setState({ lsShowFa: !(s.lsShowFa !== false) });
      out.ltFaBtnLabel = s.lsShowFa !== false ? 'پنهان کردن ترجمه' : 'نمایش ترجمه';
      out.ltLines = t.lines.map((ln, i) => ({
        en: ln.en, fa: ln.fa, n: String(i + 1),
        style: 'display:flex;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;background:' + (i === k ? 'rgba(132,197,217,.12)' : 'rgba(233,233,237,.02)') + ';border:1px solid ' + (i === k ? 'rgba(132,197,217,.5)' : 'rgba(233,233,237,.05)'),
        numStyle: 'flex:none;width:22px;height:22px;border-radius:7px;display:grid;place-items:center;background:rgba(233,233,237,.06);font-size:10.5px;font-family:Inter,sans-serif;color:rgba(233,233,237,.5);margin-top:2px',
        enStyle: 'font-family:Inter,sans-serif;font-size:14.5px;direction:ltr;text-align:left;line-height:1.7;color:' + (i === k ? '#cfeaf5' : 'rgba(233,233,237,.86)'),
        showFa: s.lsShowFa !== false,
        tap: () => this.lsPlayLine(i)
      }));
      out.ltPlayAll = () => this.lsPlayAll();
      out.ltPlayLabel = s.lsPlaying ? 'توقف' : 'پخش کل متن';
      out.ltPlayIcon = s.lsPlaying ? 'ph-fill ph-pause' : 'ph-fill ph-play';
      out.ltPlayStyle = 'display:flex;align-items:center;gap:7px;padding:10px 16px;border-radius:9px;background:rgba(132,197,217,.12);border:1px solid ' + (s.lsPlaying ? '#84c5d9' : 'rgba(132,197,217,.5)') + ';color:#84c5d9;font-size:12.5px;font-weight:500';
      out.ltRepeat = () => this.lsPlayLine(k);
      out.ltPrev = () => this.lsNextLine(-1);
      out.ltNext = () => this.lsNextLine(1);
      out.ltPos = (k + 1) + ' / ' + t.lines.length;
      out.ltRates = [[0.6, 'آهسته'], [0.9, 'عادی'], [1.15, 'تند']].map(r => ({
        label: r[1], style: chip(Math.abs((s.lsRate || 0.9) - r[0]) < 0.01, '#9184d9'), pick: () => this.lsSetRate(r[0])
      }));
      out.ltCurEn = t.lines[k].en; out.ltCurFa = t.lines[k].fa;
      const rec = s.lsRec || 'idle';
      out.ltRecGo = () => this.lsRecToggle();
      out.ltRecLabel = rec === 'recording' ? 'توقف ضبط' : (rec === 'error' ? 'میکروفون در دسترس نیست' : 'ضبط صدای خودم');
      out.ltRecStyle = 'display:flex;align-items:center;gap:7px;padding:10px 16px;border-radius:9px;font-size:12.5px;cursor:pointer;background:' + (rec === 'recording' ? 'rgba(224,135,158,.22)' : 'rgba(224,135,158,.1)') + ';border:1px solid ' + (rec === 'recording' ? '#e0879e' : 'rgba(224,135,158,.45)') + ';color:#e0879e';
      out.ltHasUrl = !!s.lsUrl; out.ltUrl = s.lsUrl || '';
      out.ltHasHeard = !!s.lsHeard; out.ltHeard = s.lsHeard || '';
      out.ltSpeechOnline = s.lsSpeechState === 'online';
      out.ltSpeechUnavailable = s.lsSpeechState === 'offline';
      out.ltSpeechScore = s.lsSpeech ? 'تطبیق واژه‌ها: ' + s.lsSpeech.score + '٪' : '';
      out.ltSpeechMissing = s.lsSpeech && s.lsSpeech.missing.length ? 'جاافتاده یا نامشخص: ' + s.lsSpeech.missing.join(' · ') : '';
      out.ltHasSpeechMissing = !!(s.lsSpeech && s.lsSpeech.missing.length);
      out.ltQuizGo = () => this.lsStartQuiz();
      out.ltHasQuiz = !!q;
      out.ltNoQuiz = !q;
      if (q) {
        const it = t.q[q.k];
        out.lqrPos = (q.k + 1) + ' / ' + t.q.length;
        out.lqrQ = it.q;
        out.lqrNotDone = !q.done; out.lqrDone = !!q.done;
        out.lqrOpts = it.opts.map((o, i) => {
          let bd = 'rgba(233,233,237,.42)', bg = 'rgba(233,233,237,.03)', col = 'rgba(233,233,237,.88)';
          if (q.picked != null) {
            if (i === it.a) { bd = 'rgba(143,217,193,.6)'; bg = 'rgba(143,217,193,.1)'; col = '#8fd9c1'; }
            else if (i === q.picked) { bd = 'rgba(217,143,143,.6)'; bg = 'rgba(217,143,143,.1)'; col = '#d98f8f'; }
          }
          return { label: o, style: 'display:flex;align-items:center;gap:9px;width:100%;padding:11px 13px;border-radius:10px;background:' + bg + ';border:1px solid ' + bd + ';color:' + col + ';font-size:13.5px;cursor:pointer;font-family:Inter,sans-serif;direction:ltr;text-align:left',
            mark: q.picked == null ? '' : (i === it.a ? 'ph-fill ph-check-circle' : (i === q.picked ? 'ph-fill ph-x-circle' : '')),
            pick: () => this.lsQPick(i) };
        });
        out.lqrNextGo = () => this.lsQNext();
        out.lqrNextLabel = q.k + 1 < t.q.length ? 'سؤال بعدی' : 'نتیجه';
        out.lqrNextStyle = 'display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;background:' + (q.picked != null ? 'rgba(145,132,217,.14)' : 'transparent') + ';border:1px solid ' + (q.picked != null ? '#9184d9' : 'rgba(233,233,237,.42)') + ';color:' + (q.picked != null ? '#b3a9e6' : 'rgba(233,233,237,.55)');
        out.lqrScore = q.right + ' از ' + t.q.length + ' درست';
        out.lqrClose = () => this.setState({ lsQuiz: null });
        const lqPassed = q.right >= Math.ceil(t.q.length * 0.7);
        const nextSes = this.dcSessions().find(x => x.lv === t.lv);
        out.lqrNextLabel = lqPassed && nextSes ? 'جلسه‌ی گفت‌وگو: ' + nextSes.titleFa : 'یک بار دیگر متن را بخوان';
        out.lqrNextGo = lqPassed && nextSes
          ? (() => this.openDisc(nextSes))
          : (() => this.setState({ lsQuiz: null, lsLine: 0, lsShowFa: true }));
      }
    }
    return out;
  }

  // ===== free discussion =====
  dcSessions() { return ((window.DISC && window.DISC.sessions) || []); }
  dcMethods() { return ((window.DISC && window.DISC.methods) || {}); }
  dcProg() { try { return JSON.parse(localStorage.getItem('vocab_disc') || '{}') || {}; } catch (e) { return {}; } }
  dcLevelUnlocked(L) {
    const at = LEVELS.indexOf(L); if (at <= 0) return true;
    const d = (this.state && this.state.data) || this.load();
    if (at <= this.band(d.round || 1)) return true;
    const all = this.dcSessions(), done = (this.dcProg().s) || {};
    if (all.some(x => x.lv === L && done[x.id])) return true;
    return LEVELS.slice(0, at).every(lv => {
      const sessions = all.filter(x => x.lv === lv);
      return sessions.length > 0 && sessions.every(x => !!done[x.id]);
    });
  }
  dcSaveProg(p) { try { localStorage.setItem('vocab_disc', JSON.stringify(p)); } catch (e) {} }
  dcDone(id, checks, secs) {
    const p = this.dcProg(); if (!p.s) p.s = {};
    const prev = p.s[id] || {};
    p.s[id] = { n: (prev.n || 0) + 1, best: Math.max(prev.best || 0, checks), secs: Math.max(prev.secs || 0, secs) };
    p.total = (p.total || 0) + secs;
    this.dcSaveProg(p);
  }
  goDisc(lv) {
    this.dcStop();
    const wanted = lv || this.state.dLv || this.levelOf((this.load().round) || 1);
    const open = this.dcLevelUnlocked(wanted) ? wanted : (LEVELS.slice().reverse().find(L => this.dcLevelUnlocked(L)) || 'A1');
    this.setState({ screen: 'disc', dLv: open, dSes: null });
  }
  openDisc(ses) {
    this.dcStop();
    this.remember('dses', 'گفت‌وگوی آزاد', 'سطح ' + ses.lv + ' · ' + ses.titleFa);
    this.setState({ screen: 'dses', dSes: ses, dTier: 'start', dQ: 0, dPhase: 'idle', dLeft: 0, dSpent: 0,
      dRec: 'idle', dUrl: '', dHeard: '', dSpeechState: 'idle', dSpeechBusy: false, dSpeechReview: null,
      dChecks: {}, dSaved: false, dNote: '' });
  }
  dcStop() {
    clearInterval(this.dIv); this.dIv = null;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    try { if (this.dSR) this.dSR.abort(); } catch (e) {}
    // Leaving the screen must release the microphone — mr.onstop stops the tracks.
    try { if (this.dMr && this.dMr.state !== 'inactive') this.dMr.stop(); } catch (e) {}
  }
  dcQuestions() {
    const s = this.state, ses = s.dSes; if (!ses) return [];
    return (ses.ladder[s.dTier || 'start']) || [];
  }
  dcAsk() {
    const qs = this.dcQuestions(), i = this.state.dQ || 0;
    if (!qs[i]) return;
    this.speakWord(qs[i], 0.88);
  }
  dcGoQ(d) {
    const TIERS = ['start', 'follow', 'deep'];
    const ses = this.state.dSes;
    const tier = this.state.dTier || 'start';
    const qs = this.dcQuestions();
    const i = (this.state.dQ || 0) + d;
    // Past either end, roll into the neighbouring tier. Clamping inside the
    // tier hid 5 of the 8 authored questions from anyone who never noticed the
    // tier chips, and made "بعدی" look broken at the end of the first three.
    if (ses && (i < 0 || i >= qs.length)) {
      const t = TIERS.indexOf(tier) + (i < 0 ? -1 : 1);
      if (t >= 0 && t < TIERS.length) {
        const next = (ses.ladder[TIERS[t]]) || [];
        if (next.length) return this.setState({ dTier: TIERS[t], dQ: i < 0 ? next.length - 1 : 0 }, () => this.dcAsk());
      }
    }
    this.setState({ dQ: Math.max(0, Math.min(i, qs.length - 1)) }, () => this.dcAsk());
  }
  dcTier(t) { this.setState({ dTier: t, dQ: 0 }); }
  dcPrep() {
    const ses = this.state.dSes; if (!ses) return;
    clearInterval(this.dIv);
    this.setState({ dPhase: 'prep', dLeft: 30 }, () => {
      this.dIv = setInterval(() => {
        const st = this.state;
        if (st.screen !== 'dses') { clearInterval(this.dIv); return; }
        const left = st.dLeft - 1;
        if (left <= 0) { clearInterval(this.dIv); this.dcSpeakStart(); return; }
        this.setState({ dLeft: left });
      }, 1000);
    });
  }
  dcSpeakStart() {
    const ses = this.state.dSes; if (!ses) return;
    clearInterval(this.dIv);
    this.speakWord('Start speaking now.', 0.9);
    this.setState({ dPhase: 'talk', dLeft: ses.target }, () => {
      this.dIv = setInterval(() => {
        const st = this.state;
        if (st.screen !== 'dses') { clearInterval(this.dIv); return; }
        const left = st.dLeft - 1, spent = (st.dSpent || 0) + 1;
        if (left <= 0) { clearInterval(this.dIv); this.setState({ dPhase: 'over', dLeft: 0, dSpent: spent }); return; }
        this.setState({ dLeft: left, dSpent: spent });
      }, 1000);
    });
  }
  dcStopTimer() { clearInterval(this.dIv); this.setState({ dPhase: 'idle', dLeft: 0 }); }
  dcRecToggle() {
    const st = this.state.dRec || 'idle';
    if (st === 'recording') {
      try { if (this.dSR) this.dSR.stop(); } catch (e) {}
      if (this.dMr && this.dMr.state !== 'inactive') this.dMr.stop();
      return;
    }
    if (!navigator.mediaDevices || !window.MediaRecorder) return this.setState({ dRec: 'error' });
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mr = new MediaRecorder(stream); this.dMr = mr;
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(x => x.stop());
        this.setState({ dRec: 'done', dUrl: URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' })) }, () => this.dcReviewSpeech());
      };
      mr.start();
      this.setState({ dRec: 'recording', dUrl: '', dHeard: '', dSpeechState: 'connecting', dSpeechReview: null });
      this.dSR = this.startOnlineSpeech({ continuous: true,
        onText: text => this.setState({ dHeard: text, dSpeechState: 'online' }),
        onError: () => this.setState({ dSpeechState: 'offline' }),
        onEnd: () => { if (this.state.dSpeechState === 'connecting') this.setState({ dSpeechState: 'offline' }); }
      });
      if (!this.dSR) this.setState({ dSpeechState: 'offline' });
    }).catch(() => this.setState({ dRec: 'error' }));
  }
  async dcReviewSpeech() {
    const heard = (this.state.dHeard || '').trim();
    if (!heard || this.state.dSpeechBusy) return;
    const sample = heard.slice(0, 450);
    this.setState({ dSpeechBusy: true });
    const review = await this.reviewEnglishText(sample);
    if (this.state.screen === 'dses') this.setState({ dSpeechBusy: false, dSpeechReview: review });
  }
  dcToggleCheck(i) {
    this.setState(s => { const c = Object.assign({}, s.dChecks); if (c[i]) delete c[i]; else c[i] = 1; return { dChecks: c }; });
  }
  dcFinish() {
    const s = this.state, ses = s.dSes; if (!ses) return;
    const n = Object.keys(s.dChecks || {}).length;
    this.dcDone(ses.id, n, s.dSpent || 0);
    this.addXp(10 + n * 5);
    this.dcStop();
    this.setState({ dSaved: true, dPhase: 'idle' });
  }

  discVals() {
    const s = this.state, all = this.dcSessions(), M = this.dcMethods();
    const chip = (on, c) => 'display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:99px;font-size:12.5px;cursor:pointer;background:' + (on ? c + '24' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + (on ? c + '77' : 'rgba(233,233,237,.42)') + ';color:' + (on ? c : 'rgba(233,233,237,.6)');
    const mmss = t => Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2);
    const out = {
      isDisc: s.screen === 'disc' && all.length > 0,
      isDSes: s.screen === 'dses' && !!s.dSes,
      goDisc: () => this.goDisc(),
      discCardDesc: all.length + ' جلسه‌ی گفت‌وگوی آزاد در ۱۰ روش استاندارد — با تایمر آزمون، سؤال‌های پلکانی و ضبط صدا'
    };
    if (out.isDisc) {
      const lv = s.dLv || 'A1', prog = this.dcProg(), done = prog.s || {};
      out.dLvChips = LEVELS.map(L => {
        const n = all.filter(x => x.lv === L).length;
        const dn = all.filter(x => x.lv === L && done[x.id]).length;
        const unlocked = this.dcLevelUnlocked(L);
        return { label: L + ' · ' + dn + '/' + n, icon: unlocked ? (lv === L ? 'ph-fill ph-map-pin' : 'ph ph-circle') : 'ph-fill ph-lock-key', locked: !unlocked,
          style: chip(lv === L, '#e0879e') + (unlocked ? '' : ';opacity:.38;cursor:not-allowed'),
          pick: () => { if (unlocked) this.setState({ dLv: L }); } };
      });
      const list = all.filter(x => x.lv === lv);
      out.dSesList = list.map(x => {
        const m = M[x.method] || { fa: x.method, icon: 'ph ph-chat', c: '#9184d9' };
        const p = done[x.id];
        return {
          title: x.title, fa: x.titleFa, method: m.fa,
          meta: 'روش: ' + m.fa + ' · هدف ' + mmss(x.target) + (p ? ' · ' + p.n + ' بار انجام شده' : ''),
          icon: m.icon,
          iconStyle: 'flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:' + m.c + '1f;border:1px solid ' + m.c + '44;color:' + m.c + ';font-size:17px',
          style: 'display:flex;align-items:center;gap:11px;padding:13px;border-radius:11px;background:rgba(233,233,237,.025);border:1px solid ' + (p ? 'rgba(143,217,193,.22)' : 'rgba(233,233,237,.06)') + ';cursor:pointer;width:100%;text-align:right',
          open: () => this.openDisc(x)
        };
      });
      out.dMethodList = Object.keys(M).map(k => ({
        label: M[k].fa, how: M[k].how, icon: M[k].icon,
        style: 'display:flex;gap:10px;padding:11px 12px;border-radius:10px;background:rgba(233,233,237,.022);border:1px solid rgba(233,233,237,.055)',
        iconStyle: 'flex:none;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:' + M[k].c + '1c;border:1px solid ' + M[k].c + '3d;color:' + M[k].c + ';font-size:15px'
      }));
      out.dShowMethods = !!s.dShowM;
      out.dToggleMethods = () => this.setState({ dShowM: !s.dShowM });
      out.dMethodsLabel = s.dShowM ? 'بستن راهنمای روش‌ها' : 'روش‌های گفت‌وگو چیست؟';
      const prog2 = this.dcProg();
      out.dTotal = 'مجموع زمان صحبت تو: ' + Math.round((prog2.total || 0) / 60) + ' دقیقه';
      out.dCount = all.length + ' جلسه در ۶ سطح';
    }
    if (out.isDSes) {
      const x = s.dSes, m = M[x.method] || { fa: x.method, icon: 'ph ph-chat', c: '#9184d9' };
      const qs = this.dcQuestions(), qi = Math.min(s.dQ || 0, Math.max(0, qs.length - 1));
      out.dTitle = x.title; out.dTitleFa = x.titleFa;
      out.dMeta = 'سطح ' + x.lv + ' · روش: ' + m.fa + ' · زمان هدف: ' + mmss(x.target);
      out.dMethodHow = m.how;
      out.dBrief = x.brief;
      out.dBack = () => { this.dcStop(); this.goDisc(x.lv); };
      out.dPhrases = (x.phrases || []).map(p => ({ en: p.en, fa: p.fa, say: () => this.speakWord(p.en) }));
      out.dTiers = [['start', 'شروع'], ['follow', 'عمیق‌تر'], ['deep', 'چالشی']].map(t => ({
        label: t[1], style: chip((s.dTier || 'start') === t[0], '#e0879e'), pick: () => this.dcTier(t[0])
      }));
      out.dQ = qs[qi] || '';
      // Say which layer this is, or three of eight questions read as "all of them".
      const TIER_N = ['start', 'follow', 'deep'].indexOf(s.dTier || 'start') + 1;
      out.dQPos = (qi + 1) + ' / ' + qs.length + ' · لایه ' + TIER_N + ' از ۳';
      out.dAsk = () => this.dcAsk();
      out.dPrevQ = () => this.dcGoQ(-1);
      out.dNextQ = () => this.dcGoQ(1);
      const ph = s.dPhase || 'idle';
      out.dTimerOn = ph === 'prep' || ph === 'talk';
      out.dTimerLabel = ph === 'prep' ? 'زمان آمادگی — یادداشت بردار' : 'حالا صحبت کن';
      out.dTimerVal = mmss(s.dLeft || 0);
      out.dTimerStyle = 'font-family:Inter,sans-serif;font-size:30px;font-weight:600;color:' + (ph === 'prep' ? '#e0a458' : '#e0879e');
      out.dStartGo = () => this.dcPrep();
      out.dSkipPrep = () => this.dcSpeakStart();
      out.dStopGo = () => this.dcStopTimer();
      out.dOver = ph === 'over';
      out.dSpentLabel = 'زمان صحبت این جلسه: ' + mmss(s.dSpent || 0);
      const rec = s.dRec || 'idle';
      out.dRecGo = () => this.dcRecToggle();
      out.dRecLabel = rec === 'recording' ? 'توقف ضبط' : (rec === 'error' ? 'میکروفون در دسترس نیست' : 'ضبط جواب');
      out.dRecStyle = 'display:flex;align-items:center;gap:7px;padding:10px 16px;border-radius:9px;font-size:12.5px;cursor:pointer;background:' + (rec === 'recording' ? 'rgba(224,135,158,.22)' : 'rgba(224,135,158,.1)') + ';border:1px solid ' + (rec === 'recording' ? '#e0879e' : 'rgba(224,135,158,.45)') + ';color:#e0879e';
      out.dHasUrl = !!s.dUrl; out.dUrl = s.dUrl || '';
      out.dHasHeard = !!s.dHeard; out.dHeard = s.dHeard || '';
      out.dSpeechUnavailable = s.dSpeechState === 'offline';
      out.dSpeechBusy = !!s.dSpeechBusy;
      const dr = s.dSpeechReview;
      out.dHasSpeechReview = !!dr;
      out.dSpeechService = dr ? (dr.service || 'بررسی محلی') : '';
      out.dSpeechHasCorrected = !!(dr && dr.corrected); out.dSpeechCorrected = dr ? (dr.corrected || '') : '';
      out.dSpeechHasTranslation = !!(dr && dr.translation); out.dSpeechTranslation = dr ? (dr.translation || '') : '';
      out.dSpeechHasIssues = !!(dr && dr.issues && dr.issues.length);
      out.dSpeechIssues = dr ? (dr.issues || []).map(i => ({ label: i.label })) : [];
      out.dTask = x.task; out.dTaskFa = x.taskFa;
      out.dChecks = (x.check || []).map((c, i) => ({
        label: c,
        icon: (s.dChecks || {})[i] ? 'ph-fill ph-check-square' : 'ph ph-square',
        style: 'display:flex;align-items:flex-start;gap:8px;padding:9px 11px;border-radius:9px;cursor:pointer;font-size:12.5px;line-height:1.8;background:' + ((s.dChecks || {})[i] ? 'rgba(143,217,193,.07)' : 'rgba(233,233,237,.022)') + ';border:1px solid ' + ((s.dChecks || {})[i] ? 'rgba(143,217,193,.3)' : 'rgba(233,233,237,.06)') + ';color:' + ((s.dChecks || {})[i] ? '#8fd9c1' : 'rgba(233,233,237,.7)'),
        tap: () => this.dcToggleCheck(i)
      }));
      out.dTips = ((window.DISC.tips || {})[x.lv] || []).map(t => ({ t }));
      out.dFinishGo = () => this.dcFinish();
      out.dSaved = !!s.dSaved;
      out.dNotSaved = !s.dSaved;
      const p = (this.dcProg().s || {})[x.id];
      out.dSavedLabel = p ? 'ثبت شد — ' + p.n + ' بار انجام شده، بهترین خودارزیابی ' + p.best + ' مورد' : 'ثبت شد';
    }
    return out;
  }

  // ---- Lesson browser (LEG-009, revised LEG-010) ----
  // LEG-002 built lessonsInLevel()/unitsInLevel()/lessonsInUnit()/
  // lessonWordsOf()/lessonStats() purely as backend grouping math — nothing
  // ever showed a learner this Level -> Unit -> Lesson structure before now.
  // Unlock/complete reuse lessonStats() exactly as LEG-002/LEG-003 already
  // defined it (fresh === 0 means every word in the lesson finished Initial
  // Learning and is in vocab_sr_v1) — no new "is this lesson done" rule.
  //
  // LEG-010 pulled the per-lesson unlock/complete/in-progress walk out into
  // lessonProgress(L) below so both the browser's own rendering (grouped
  // into units here) and the new "ادامهٔ تمرین" button's target lookup
  // (lbContinueTarget()) share exactly one implementation of the lock rule
  // — no risk of the two ever disagreeing about what is unlocked.
  lessonProgress(L) {
    const unitCount = this.unitsInLevel(L);
    let prevComplete = true; // lesson 1 of unit 1 is always unlocked
    const out = [];
    for (let u = 1; u <= unitCount; u++) {
      const lessonsCount = this.lessonsInUnit(L, u);
      for (let les = 1; les <= lessonsCount; les++) {
        const stats = this.lessonStats(L, u, les);
        const complete = stats.total > 0 && stats.fresh === 0;
        const unlocked = prevComplete;
        const started = unlocked && stats.fresh > 0 && stats.fresh < stats.total;
        out.push({ u: u, les: les, stats: stats, complete: complete, unlocked: unlocked, started: started });
        prevComplete = complete;
      }
    }
    return out;
  }
  // LEG-010 — resolves the single lesson "ادامهٔ تمرین" should jump into:
  // the learner's actual active lesson (d.level/unit/lesson) if it is
  // genuinely mid-way (some words introduced, not all — the same fresh>0 &&
  // fresh<total reading lessonProgress() uses for "started"), otherwise the
  // earliest unlocked, not-yet-complete lesson in their current level.
  // Deliberately keyed off d.level (real progress), not state.lbLv (whichever
  // level the tabs happen to be browsing) — this button is a fast path back
  // into the learner's own progress, not into whatever they are currently
  // looking at.
  //
  // Bug fix (reported after LEG-010 shipped): the original "next" search
  // additionally required stats.fresh === stats.total ("completely
  // untouched"), so any unlocked lesson that had partial-but-not-matching
  // progress fell through the cracks and this whole function silently
  // returned d.level/unit/lesson unchanged — even when that exact lesson was
  // already fully complete. startLessonPractice() then rebuilt d.order for
  // an already-finished lesson, chunkOrder() found no fresh words and no due
  // reviews, and the learner landed on the "مرورهای امروز تمام شد" screen
  // moments after tapping "ادامهٔ تمرین" on an account that very much still
  // had lessons left. Any unlocked-and-not-complete lesson is a valid
  // continue target — "untouched" was an unnecessarily narrow requirement.
  lbContinueTarget() {
    const d = this.state.data;
    const cur = this.lessonStats(d.level, d.unit, d.lesson);
    if (cur.total > 0 && cur.fresh > 0 && cur.fresh < cur.total) return { level: d.level, unit: d.unit, lesson: d.lesson };
    const next = this.lessonProgress(d.level).find(x => x.unlocked && !x.complete);
    return next ? { level: d.level, unit: next.u, lesson: next.les } : { level: d.level, unit: d.unit, lesson: d.lesson };
  }
  // Guarded like courseVals()/sentVals() etc.: the per-lesson loop below is
  // real work (re-derives word position from VOCAB_ORDER for every lesson in
  // the level), so it only runs while the screen is actually open.
  lessonBrowserVals() {
    const s = this.state;
    const out = { isLessons: s.screen === 'lessons' };
    if (!out.isLessons) return out;
    const d = s.data;
    const chip = (on, c) => 'display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:99px;font-size:12.5px;cursor:pointer;background:' + (on ? c + '24' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + (on ? c + '77' : 'rgba(233,233,237,.42)') + ';color:' + (on ? c : 'rgba(233,233,237,.6)');
    // LEG-010 point 2 — level tabs let the learner browse/practice any level
    // they have already reached (index <= d.level's index), not just the one
    // they are currently placed at; a tab beyond d.level stays locked and
    // unclickable, same visual language as every other level-tab row in this
    // app (sbLvChips/gramLvChips/lsLvChips/dLvChips). state.lbLv is which
    // level the browser is currently *displaying*, defaulting to d.level on
    // first entry — it never changes d.level itself, so it cannot be used to
    // skip ahead into a level not yet reached.
    const dLi = LEVELS.indexOf(d.level);
    const viewLevel = (s.lbLv && LEVELS.indexOf(s.lbLv) >= 0 && LEVELS.indexOf(s.lbLv) <= dLi) ? s.lbLv : d.level;
    const L = viewLevel;
    out.lbLevelTabs = LEVELS.map(tabLevel => {
      const unlocked = LEVELS.indexOf(tabLevel) <= dLi;
      const active = tabLevel === viewLevel;
      return {
        label: tabLevel,
        icon: unlocked ? (active ? 'ph-fill ph-map-pin' : 'ph ph-circle') : 'ph-fill ph-lock-key',
        locked: !unlocked,
        style: chip(active, '#9184d9') + (unlocked ? '' : ';opacity:.38;cursor:not-allowed'),
        pick: () => { if (unlocked) this.setState({ lbLv: tabLevel, lbUnit: null }); }
      };
    });
    // LEG-010 point 8 — one prominent, always-available way to jump straight
    // into practice without expanding accordions. Reuses startLessonPractice()
    // exactly as every per-lesson "شروع تمرین" button already does; this is
    // just one more caller, not new session-start logic.
    const cont = this.lbContinueTarget();
    out.lbContinueLabel = 'ادامهٔ تمرین';
    out.lbContinueSub = 'سطح ' + cont.level + ' · بخش ' + cont.unit + ' · درس ' + cont.lesson;
    out.lbContinueGo = () => this.startLessonPractice(cont.level, cont.unit, cont.lesson);
    const unitCount = this.unitsInLevel(L);
    // Same accordion convention as the rest of the app (one section open at
    // a time): default to the learner's current unit only while viewing
    // their actual current level — a past level's unit numbers do not line
    // up with d.unit, so default those to unit 1. 0/null means "nothing
    // open" so tapping the already-open unit's header collapses it.
    const defaultUnit = viewLevel === d.level ? (d.unit || 1) : 1;
    const openUnit = s.lbUnit != null ? s.lbUnit : defaultUnit;
    // LEG-010 point 6 — flattened from three nested bordered/backgrounded
    // boxes (unit card > per-lesson bordered pill > per-word bordered chip)
    // down to one: the unit card stays (it is the actual grouping, same
    // weight as every other accordion in this app), lessons below it are
    // plain rows separated by a hairline (matches the example-sentence rows
    // in the grammar lesson screen), and words are plain inline text (matches
    // the plain word list used elsewhere) instead of individually bordered
    // pills. Locked state is now communicated by icon + dimmed opacity only,
    // not by a whole extra box per row.
    const lessonRowStyle = unlocked => 'display:flex;align-items:flex-start;gap:10px;padding:11px 2px;border-bottom:1px solid rgba(233,233,237,.06)' + (unlocked ? '' : ';opacity:.5');
    const progress = this.lessonProgress(L);
    const units = [];
    for (let u = 1; u <= unitCount; u++) {
      const lessonsCount = this.lessonsInUnit(L, u);
      let unitComplete = 0;
      const lessons = [];
      for (let les = 1; les <= lessonsCount; les++) {
        const p = progress.find(x => x.u === u && x.les === les);
        const stats = p.stats, complete = p.complete, unlocked = p.unlocked, started = p.started;
        if (complete) unitComplete++;
        // LEG-010 point 3 — a locked lesson shows only its status and word
        // count, never the words themselves; lessonWordsOf() is only called
        // (and the array only built) once the lesson is actually unlocked,
        // so nothing "spoils" vocabulary the learner has not earned yet.
        const words = unlocked ? this.lessonWordsOf(L, u, les).map(i => ({ en: this.W[i].en, fa: this.W[i].fa || '—' })) : [];
        const color = complete ? '#8fd9c1' : (started ? '#e0a458' : '#9184d9');
        lessons.push({
          n: les, complete: complete, locked: !unlocked, hasWords: unlocked && words.length > 0,
          title: 'درس ' + les,
          wordCountLabel: stats.total + ' واژه',
          words: words,
          statusLabel: complete ? 'کامل شد' : (started ? 'در حال یادگیری' : (unlocked ? 'باز — شروع‌نشده' : 'قفل')),
          statusIcon: complete ? 'ph-fill ph-check-circle' : (unlocked ? (started ? 'ph-fill ph-clock-countdown' : 'ph ph-circle') : 'ph-fill ph-lock-key'),
          statusColor: unlocked ? color : 'rgba(233,233,237,.32)',
          rowStyle: lessonRowStyle(unlocked),
          btnLabel: complete ? 'مرور دوباره' : 'شروع تمرین',
          canStart: unlocked,
          start: () => { if (unlocked) this.startLessonPractice(L, u, les); }
        });
      }
      const unitLocked = lessons.length > 0 && lessons[0].locked;
      const unitAllComplete = lessons.length > 0 && lessons.every(x => x.complete);
      units.push({
        n: u, title: 'بخش ' + u,
        summary: unitComplete + ' از ' + lessonsCount + ' درس کامل',
        icon: unitLocked ? 'ph-fill ph-lock-key' : (unitAllComplete ? 'ph-fill ph-check-circle' : 'ph ph-circle'),
        iconColor: unitLocked ? 'rgba(233,233,237,.32)' : (unitAllComplete ? '#8fd9c1' : '#9184d9'),
        locked: unitLocked,
        // LEG-010 point 5 — the disclosure caret itself becomes the lock icon
        // when the unit cannot be opened, instead of a caret that silently
        // does nothing when tapped.
        caretIcon: unitLocked ? 'ph-fill ph-lock-key' : 'ph ph-caret-down',
        expanded: !unitLocked && u === openUnit,
        caretStyle: unitLocked
          ? 'font-size:14px;color:rgba(233,233,237,.32)'
          : 'font-size:14px;color:rgba(233,233,237,.5);transition:transform .2s;transform:rotate(' + (u === openUnit ? 180 : 0) + 'deg)',
        lockedHint: unitLocked ? 'با تمام‌شدن بخش قبلی باز می‌شود' : '',
        lessons: lessons,
        // LEG-010 point 4 — a locked unit's header click is a no-op; it can
        // never reveal its lesson list (lockedHint above is the only
        // feedback), matching the lesson-level lock which already refuses
        // startLessonPractice() the same way.
        toggle: () => { if (unitLocked) return; this.setState({ lbUnit: openUnit === u ? 0 : u }); }
      });
    }
    // LEG-009 — prevComplete inside lessonProgress() ends up holding whether
    // the very last lesson of the very last unit of this level is complete,
    // i.e. whether the whole level is done. Without an explicit way forward
    // here, a learner who actually finished every lesson of a level would be
    // stuck looking at an all-complete list forever, since nothing else in
    // the redesigned flow advances d.level automatically anymore (see
    // nextLesson()'s comment). advanceLevel() reuses LEG-002's
    // already-verified advanceLessonIfDone() cascade, just behind an
    // explicit tap instead of a silent auto-continue. This banner only makes
    // sense while viewing the learner's actual current level — a past,
    // already-passed level always reads as "complete" and has no next level
    // to advance into from here.
    const li = LEVELS.indexOf(L);
    out.lbLevel = L;
    out.lbIntro = 'سطح ' + L + ' — هر درس ' + LESSON_SIZE + ' واژهٔ تازه دارد؛ درس بعدی وقتی باز می‌شود که همهٔ واژه‌های درس فعلی یادگیری اولیه‌شان تمام شده باشد.';
    out.lbUnits = units;
    out.lbLevelComplete = viewLevel === d.level && progress.length > 0 && progress[progress.length - 1].complete;
    out.lbHasNextLevel = li >= 0 && li < LEVELS.length - 1;
    out.lbNextLevel = li >= 0 ? LEVELS[Math.min(li + 1, LEVELS.length - 1)] : '';
    out.lbAdvanceLevel = () => this.advanceLevel();
    out.lbGoHome = () => this.setState({ screen: 'home' });
    return out;
  }

  renderVals() {
    const d = this.state.data, W = this.W, s = this.state;
    const ui = this.uiLoad();
    const total = W.length;
    const info = this.modeInfo(), mode = info.mode;
    const w = this.current() || { en: '', fa: '', cat: 'general', i: 0 };
    const faShown = w.fa || 'ترجمه در راه است…';
    const accent = this.color(w);
    const pct = d.order.length ? Math.min(100, Math.round((d.pos / d.order.length) * 100)) : 0;
    const t = today();
    const progressRaw = (done, total) => total ? Math.min(100, (done / total) * 100) : 0;
    const progressLabel = (done, total) => {
      const p = progressRaw(done, total);
      return done > 0 && p < 1 ? 'کمتر از ۱٪' : Math.round(p) + '٪';
    };
    const progressWidth = (done, total) => done > 0 ? Math.max(1, progressRaw(done, total)) : 0;
    const btn = (bg, bd, col) => 'display:flex;align-items:center;gap:7px;padding:10px 17px;border-radius:9px;background:' + bg + ';border:1px solid ' + bd + ';color:' + col + ';font-size:13px;font-weight:500;cursor:pointer';
    const numS = 'flex:none;width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:rgba(233,233,237,.07);font-size:10.5px;font-family:Inter,sans-serif;color:rgba(233,233,237,.55)';
    const optS = (correct, isPicked, picked) => {
      let bd = 'rgba(233,233,237,.42)', bg = 'rgba(233,233,237,.03)', col = 'rgba(233,233,237,.88)';
      if (picked != null) {
        if (correct) { bd = 'rgba(143,217,193,.6)'; bg = 'rgba(143,217,193,.1)'; col = '#8fd9c1'; }
        else if (isPicked) { bd = 'rgba(217,143,143,.6)'; bg = 'rgba(217,143,143,.1)'; col = '#d98f8f'; }
      }
      return 'display:flex;align-items:center;gap:10px;width:100%;text-align:right;padding:12px 13px;border-radius:10px;background:' + bg + ';border:1px solid ' + bd + ';color:' + col + ';font-size:14px;cursor:pointer';
    };

    const isCloze = mode === 'cloze';
    const isFa2en = mode === 'fa2en';
    // fa2en (LEG-003 Turn C) reuses the exact same rendering as mcq/cloze —
    // options grid, picked/correct marking, everything below — only the
    // prompt direction and option source differ (see buildOptions()).
    const isMcqLike = mode === 'mcq' || isCloze || isFa2en;
    const sent = this.exampleOk(w) ? { s: w.ex, fa: w.exfa || '' } : null;
    const answered = mode === 'flash' ? s.showBack : (isMcqLike ? s.picked != null : s.checked);
    const myS = this.mySent[w.en];
    // LEG-003: which Initial-Learning turn (if any) is driving the current
    // card. null for every normal/already-tracked word — untouched below.
    const ilTurn = this.ilTurnFor(w.i);
    let promptText = w.en, promptHint = 'معنی را به یاد بیاور', ltr = true;
    if (mode === 'mcq') promptHint = 'معنی درست را انتخاب کن';
    if (mode === 'type') { promptText = faShown; promptHint = 'املای انگلیسی را بنویس'; ltr = false; }
    if (mode === 'listen') { promptText = s.checked ? w.en : '• • • • •'; promptHint = 'به تلفظ گوش کن و لغت را بنویس'; }
    if (isCloze) {
      if (sent) { promptText = this.clozeBlank(w).replace(/~/g, '_____'); promptHint = 'کدام لغت جای خالی می‌نشیند؟'; }
      else { promptText = faShown; promptHint = 'معادل انگلیسی را انتخاب کن'; ltr = false; }
    }
    if (isFa2en) { promptText = faShown; promptHint = 'معادل انگلیسی را انتخاب کن'; ltr = false; }
    const promptStyle = ltr
      ? 'font-family:Inter,sans-serif;font-size:' + (isCloze ? '20px' : '34px') + ';font-weight:600;letter-spacing:-.02em;direction:ltr;line-height:1.4'
      : 'font-size:28px;font-weight:500;line-height:1.5';

    const options = (s.options || []).map((o, i) => ({
      n: String(i + 1), label: o.label, numStyle: numS, style: optS(o.correct, i === s.picked, s.picked),
      textStyle: 'flex:1;' + ((isCloze || isFa2en) ? 'font-family:Inter,sans-serif;direction:ltr;text-align:left;' : ''),
      mark: s.picked == null ? '' : (o.correct ? 'ph-fill ph-check-circle' : (i === s.picked ? 'ph-fill ph-x-circle' : '')),
      markStyle: 'font-size:16px;flex:none',
      pick: () => { if (this.state.picked != null) return; this.setState({ picked: i, showBack: true }); if (isCloze) this.speakWord(w.en); }
    }));

    // No self-rating: level/mastery comes only from whether the exercise itself
    // was answered correctly (see ARC-002, docs/architecture/user-state-model.md,
    // D-011). A single neutral "continue" always advances with rating 2 — the
    // former three-way easy/good/hard choice asked the learner to judge their
    // own recall, which is unreliable and was explicitly rejected as a pattern.
    const continueStyle = btn('rgba(143,217,193,.11)', 'rgba(143,217,193,.62)', '#8fd9c1');
    const againAction = { label: 'دوباره', sub: 'در همین جلسه', icon: 'ph ph-arrow-counter-clockwise', style: btn('rgba(217,143,143,.08)', 'rgba(217,143,143,.45)', '#d98f8f'), go: () => this.advance(false, 0) };
    const continueAction = { label: 'ادامه', sub: this.intervalLabel(w, 2), icon: 'ph ph-check', style: continueStyle, go: () => this.advance(true, 2) };
    // LEG-003 point 3 — Initial-Learning Turn B/C never show "دوباره", right
    // or wrong: the scheduler (ilAdvance) silently reschedules a wrong turn
    // a few cards later on its own, invisible to the user beyond the card
    // reappearing. A single neutral "ادامه" is the only action either way.
    const ilContinueAction = ok => ({ label: 'ادامه', icon: 'ph ph-check', style: continueStyle, go: () => this.ilAdvance(ilTurn, ok) });
    const actions = [];
    if (mode === 'flash') {
      if (!s.showBack) actions.push({ label: 'نمایش معنی', icon: 'ph ph-eye', style: btn('rgba(145,132,217,.12)', accent, accent), go: () => this.setState({ showBack: true }) });
      else if (ilTurn === 'A') actions.push({ label: 'ادامه', icon: 'ph ph-check', style: continueStyle, go: () => this.ilAdvance('A', true) });
      else { actions.push(continueAction); actions.push(againAction); }
    } else if (isMcqLike) {
      if (s.picked != null) {
        const ok = !!s.options[s.picked].correct;
        if (ilTurn === 'B' || ilTurn === 'C') actions.push(ilContinueAction(ok));
        else actions.push(ok ? continueAction : againAction);
      }
    } else if (!s.checked) actions.push({ label: 'بررسی', icon: 'ph ph-check', style: btn('rgba(145,132,217,.12)', accent, accent), go: () => this.check() });
    else actions.push(s.correct ? continueAction : againAction);

    const q = s.quiz;
    let qPrompt = '', qHint = '', qOptions = [], quizPos = '', quizBarStyle = 'height:100%;width:0%;background:#e0a458', qPromptStyle = 'font-size:26px;font-weight:500';
    if (q) {
      const cur = q.qs[q.k], qw = W[cur.wi];
      qPrompt = cur.dir === 'en2fa' ? qw.en : qw.fa;
      qHint = cur.dir === 'en2fa' ? 'معنی فارسی کدام است؟' : 'معادل انگلیسی کدام است؟';
      quizPos = (q.k + 1) + ' / ' + q.qs.length;
      quizBarStyle = 'height:100%;width:' + Math.round((q.k / q.qs.length) * 100) + '%;background:#e0a458;transition:width .3s';
      qPromptStyle = cur.dir === 'en2fa' ? 'font-family:Inter,sans-serif;font-size:30px;font-weight:600;direction:ltr;letter-spacing:-.02em' : 'font-size:26px;font-weight:500';
      qOptions = cur.opts.map((o, i) => ({
        n: String(i + 1), label: o.label, numStyle: numS, style: optS(o.correct, i === q.picked, q.picked),
        textStyle: 'flex:1;' + (cur.dir === 'fa2en' ? 'font-family:Inter,sans-serif;direction:ltr;text-align:left;' : ''),
        mark: q.picked == null ? '' : (o.correct ? 'ph-fill ph-check-circle' : (i === q.picked ? 'ph-fill ph-x-circle' : '')),
        markStyle: 'font-size:16px;flex:none', pick: () => this.quizPick(i)
      }));
    }

    const pl = s.placement;
    let plPrompt = '', plHint = 'معنی فارسی کدام است؟', plPromptStyle = 'font-family:Inter,sans-serif;font-size:30px;font-weight:600;direction:ltr;letter-spacing:-.02em',
      plOptions = [], plPos = '', plBarStyle = 'height:100%;width:0%;background:#84c5d9',
      plLevelLabel = '', plBreakdown = [], plResultTitle = '', plResultDesc = '', plShowWhy = false, plWhy = '',
      plOverrideChips = [], plApplyLabel = 'شروع تمرین از این سطح';
    if (pl) {
      plLevelLabel = 'در حال آزمون سطح ' + pl.level;
      if (!pl.done) {
        const cur = pl.qs[pl.k];
        plPrompt = cur.prompt;
        plPos = (pl.k + 1) + ' / ' + pl.qs.length;
        plBarStyle = 'height:100%;width:' + Math.round((pl.k / pl.qs.length) * 100) + '%;background:#84c5d9;transition:width .3s';
        if (cur.kind === 'gram') {
          plHint = 'کدام گزینه جای خالی را درست پر می‌کند؟';
          plPromptStyle = 'font-family:Inter,sans-serif;font-size:19px;font-weight:600;direction:ltr;line-height:1.5';
        }
        plShowWhy = cur.kind === 'gram' && pl.picked != null && !!cur.why;
        plWhy = plShowWhy ? cur.why : '';
        plOptions = cur.opts.map((o, i) => ({
          n: String(i + 1), label: o.label, numStyle: numS, style: optS(o.correct, i === pl.picked, pl.picked),
          textStyle: 'flex:1;' + (cur.kind === 'gram' ? 'font-family:Inter,sans-serif;direction:ltr;text-align:left;' : ''),
          mark: pl.picked == null ? '' : (o.correct ? 'ph-fill ph-check-circle' : (i === pl.picked ? 'ph-fill ph-x-circle' : '')),
          markStyle: 'font-size:16px;flex:none', pick: () => this.placementPick(i)
        }));
      } else {
        // LEG-007 — report per-item-type accuracy per level, not just the
        // combined pass/fail the ladder used to decide which levels to test.
        plBreakdown = pl.results.map(r => {
          const passed = r.total > 0 && r.right / r.total >= PLACEMENT_PASS;
          return {
            level: r.level, label: r.level + ' · واژگان ' + r.vocabRight + '/' + r.vocabTotal + ' · دستور ' + r.gramRight + '/' + r.gramTotal,
            passedIcon: passed ? 'ph-fill ph-check-circle' : 'ph-fill ph-x-circle',
            passedStyle: 'font-size:15px;color:' + (passed ? '#8fd9c1' : '#d98f8f')
          };
        });
        const li = L => Math.max(0, LEVELS.indexOf(L));
        const conservLevel = LEVELS[Math.min(li(pl.finalVocabLevel), li(pl.finalGramLevel))];
        // Manual override chips (methodology doc §6.2/§8.3/§8.4 "always offer
        // an override", the simple non-statistical version this task scopes):
        // always visible on the result screen, never buried behind a menu.
        plOverrideChips = LEVELS.map(L => {
          const on = pl.overrideLevel === L;
          return {
            label: L, active: on,
            style: 'display:flex;align-items:center;gap:4px;padding:6px 13px;border-radius:99px;font-size:12px;font-family:Inter,sans-serif;cursor:pointer;background:' + (on ? 'rgba(224,164,88,.16)' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + (on ? '#e0a458' : 'rgba(233,233,237,.42)') + ';color:' + (on ? '#e0a458' : 'rgba(233,233,237,.65)'),
            pick: () => this.placementSetOverride(L)
          };
        });
        if (pl.overrideLevel) {
          plResultTitle = 'شروع از سطح ' + pl.overrideLevel + ' (انتخاب خودت)';
          plResultDesc = 'این سطح را خودت انتخاب کردی؛ واژگان، دستور زبان، جمله‌سازی، شنیدن، گفت‌وگو و بخش مشاغل همه از همین سطح شروع می‌شوند. پیشرفت و واژه‌هایی که قبلاً دیده‌ای دست‌نخورده می‌مانند.';
          plApplyLabel = 'شروع از سطح ' + pl.overrideLevel;
        } else {
          // Reframed as a recommended starting point with a range across two
          // measured dimensions, not one flat "level" assertion — the test
          // only ever measured vocabulary and grammar, so it says so instead
          // of implying it measured listening/discussion/jobs too.
          plResultTitle = 'نقطه‌ی شروع پیشنهادی — واژگان ' + pl.finalVocabLevel + ' · دستور ' + pl.finalGramLevel;
          plResultDesc = 'این یک پیشنهاد است، نه نمره‌ی قطعی. واژه‌ها از سطح ' + pl.finalVocabLevel + ' و دستور زبان/جمله‌سازی از سطح ' + pl.finalGramLevel + ' شروع می‌شود. این آزمون شنیدن و گفت‌وگو را مستقیم نسنجیده، برای همین آن‌ها و بخش مشاغل با احتیاط از سطح ' + conservLevel + ' شروع می‌شوند. اگر حس می‌کنی سطح دیگری مناسب‌تر است، از پایین انتخابش کن — پیشرفت و واژه‌هایی که قبلاً دیده‌ای دست‌نخورده می‌مانند.';
          plApplyLabel = 'شروع از سطح‌های پیشنهادی';
        }
      }
    }

    const res = s.result || {};
    let resultTitle = '', resultDesc = '', resultIcon = 'ph-fill ph-trophy', resultCol = '#e0a458', resultActions = [], missed = [];
    // LEG-009 — replaces the removed kind:'goal' card-count interruption.
    // Fires from afterCard() the moment the lesson the learner explicitly
    // chose (lesson browser -> startLessonPractice()) is actually finished —
    // never on a timer or a count, and never auto-continuing into the next
    // lesson: the learner goes back to the browser and picks it themselves.
    if (res.kind === 'lesson') {
      resultCol = '#8fd9c1';
      resultIcon = 'ph-fill ph-seal-check';
      resultTitle = 'این درس تمام شد';
      resultDesc = 'هر ' + LESSON_SIZE + ' واژهٔ این درس را با موفقیت یاد گرفتی؛ حالا طبق زمان‌بندی مرور فاصله‌دار برمی‌گردند. درس بعدی الان در فهرست درس‌ها باز شده.';
      resultActions = [
        { label: 'بازگشت به فهرست درس‌ها', style: btn('rgba(143,217,193,.14)', '#8fd9c1', '#8fd9c1'), go: () => this.setState({ screen: 'lessons', result: null }) },
        { label: 'بازگشت به خانه', style: btn('transparent', 'rgba(233,233,237,.42)', 'rgba(233,233,237,.75)'), go: () => this.setState({ screen: 'home', result: null }) }
      ];
    } else if (res.kind === 'quiz') {
      resultCol = res.passed ? '#8fd9c1' : '#d98f8f';
      resultIcon = res.passed ? 'ph-fill ph-seal-check' : 'ph-fill ph-arrow-counter-clockwise';
      resultTitle = res.passed ? 'قبول شدی — ' + res.score + '٪' : 'نمره‌ات ' + res.score + '٪ شد';
      resultDesc = res.passed
        ? 'آزمون ' + (res.mile * QUIZ_EVERY) + ' لغت اول را رد کردی. لغت‌های اشتباه دوباره وارد صف مرور شدند.'
        : 'برای عبور حداقل ۷۰٪ لازم است. لغت‌های اشتباه به صف مرور برگشتند؛ می‌توانی دوباره آزمون بدهی یا کمی بیشتر مرور کنی.';
      missed = (res.missed || []).map(i => ({ en: W[i].en, fa: W[i].fa }));
      resultActions = [
        { label: 'ادامه‌ی مرور', style: btn('rgba(145,132,217,.12)', '#9184d9', '#b3a9e6'), go: () => this.setState({ screen: 'study', result: null }, () => this.prepare()) },
        { label: res.passed ? 'بازگشت به خانه' : 'آزمون دوباره', style: btn('transparent', 'rgba(233,233,237,.16)', 'rgba(233,233,237,.75)'), go: () => res.passed ? this.setState({ screen: 'home', result: null }) : this.startQuiz(res.mile) }
      ];
    }
    // kind:'empty' ("مرورهای امروز تمام شد") removed for good — see the
    // comment above extendQueue() for why. Every former call site now
    // routes straight to the lesson browser instead of rendering a result
    // card here, so this branch has no caller left; kept out entirely
    // rather than left as dead code that could get wired up again.

    const qy = (s.query || '').trim();
    const qlow = searchNorm(qy);
    const starMap = d.starred || {};
    const catW = s.catFilter === 'all' ? W
      : (s.catFilter === '__star' ? W.filter(x => starMap[x.i])
        : (s.catFilter === '__learned' ? W.filter(x => { const r = this.srRec(x.i); return this.srKnown(x.i) || !!(r && r[4]); }) : W.filter(x => x.cat === s.catFilter)));
    const matched = qy ? catW.filter(x => searchNorm([x.en, x.fa, x.ipa, (x.syn || []).join(' ')].join(' ')).includes(qlow)) : catW;
    const filtered = matched.slice();
    if (s.dictSort === 'en') filtered.sort((a, b) => a.en.localeCompare(b.en, 'en'));
    if (s.dictSort === 'fa') filtered.sort((a, b) => (a.fa || '').localeCompare(b.fa || '', 'fa'));
    if (s.dictSort === 'status') filtered.sort((a, b) => {
      const rank = x => { const r = this.srRec(x.i); return this.srKnown(x.i) ? 0 : (this.srDue(x.i, currentDayNo()) ? 1 : (r && r[4] ? 2 : 3)); };
      return rank(a) - rank(b) || a.en.localeCompare(b.en, 'en');
    });
    const countBy = {}; W.forEach(x => countBy[x.cat] = (countBy[x.cat] || 0) + 1);
    const chipS = (on, c) => 'display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:99px;font-size:12px;cursor:pointer;background:' + (on ? c + '24' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + (on ? c + '77' : 'rgba(233,233,237,.42)') + ';color:' + (on ? c : 'rgba(233,233,237,.6)');
    const catChips = [{
      key: 'all', label: 'همه', count: String(W.length), icon: 'ph ph-squares-four',
      style: chipS(s.catFilter === 'all', '#9184d9'), pick: () => this.setState({ catFilter: 'all', limit: 60, dictToolsOpen: false, wordMoreEn: null })
    }].concat(this.allCatKeys().filter(k => (countBy[k] || 0) > 0 || this.myCats.some(c => c.key === k)).map(k => {
      const meta = this.catMeta(k);
      return {
        key: k, label: this.catLabel(k), count: String(countBy[k] || 0),
        icon: 'ph ph-' + meta[0].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
        style: chipS(s.catFilter === k, meta[1]), pick: () => this.setState({ catFilter: k, limit: 60, dictToolsOpen: false, wordMoreEn: null })
      };
    }));
    const browseList = filtered.slice(0, s.limit).map(x => {
      const c = this.color(x), rec = this.srRec(x.i);
      const status = this.srKnown(x.i) ? 'بلد' : (this.srDue(x.i, currentDayNo()) ? 'موعد مرور' : (rec && rec[4] ? 'در حال یادگیری' : 'جدید'));
      const statusColor = status === 'بلد' ? '#8fd9c1' : (status === 'موعد مرور' ? '#e0a458' : (status === 'جدید' ? '#84c5d9' : '#b3a9e6'));
      const catMeta = this.catMeta(x.cat), catIcon = 'ph ph-' + catMeta[0].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      return {
        en: x.en, fa: x.fa || 'ترجمه در راه است…', icon: this.icon(x),
        category: this.catLabel(x.cat), categoryIcon: catIcon,
        categoryStyle: 'display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:99px;background:' + c + '15;border:1px solid ' + c + '55;color:' + c + ';font-size:10.5px',
        pronunciation: x.ipa || 'آوانویسی ثبت نشده',
        // Synonyms and pronunciation are part of a dictionary entry, not extras.
        hasSyn: !!(x.syn && x.syn.length), syn: (x.syn || []).join(' · '),
        hasIpa: !!x.ipa, ipa: x.ipa || '',
        editing: s.editEn === x.en, notEditing: s.editEn !== x.en,
        edit: () => this.setState({ wordMoreEn: x.en }, () => this.editStart(x.en, x.fa)),
        moreOpen: s.wordMoreEn === x.en,
        moreGo: () => this.setState({ wordMoreEn: s.wordMoreEn === x.en ? null : x.en, editEn: null, editVal: '' }),
        picking: s.catPickEn === x.en,
        move: () => this.setState({ catPickEn: s.catPickEn === x.en ? null : x.en, editEn: null }),
        picker: this.allCatKeys().map(k => {
          const meta = this.catMeta(k);
          return { label: this.catLabel(k), style: chipS(x.cat === k, meta[1]), go: () => this.setCat(x.en, k) };
        }),
        dot: 'flex:none;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:' + c + '1f;border:1px solid ' + c + '44;color:' + c + ';font-size:15px',
        say: () => this.speakWord(x.en),
        star: starMap[x.i] ? 'ph-fill ph-star' : 'ph ph-star',
        starStyle: 'flex:none;width:38px;height:38px;min-width:38px;min-height:38px;border-radius:9px;display:grid;place-items:center;background:' + (starMap[x.i] ? 'rgba(224,164,88,.12)' : 'transparent') + ';border:1px solid ' + (starMap[x.i] ? 'rgba(224,164,88,.45)' : 'rgba(233,233,237,.16)') + ';font-size:15px;color:' + (starMap[x.i] ? '#e0a458' : 'rgba(233,233,237,.5)'),
        starGo: () => this.toggleStar(x.i),
        status, statusStyle: 'display:inline-flex;align-items:center;padding:3px 7px;border-radius:99px;font-size:10px;background:' + statusColor + '18;border:1px solid ' + statusColor + '55;color:' + statusColor
      };
    });

    const srn = this.srCounts();
    const sortOptions = [
      { key: 'course', label: 'ترتیب دوره', icon: 'ph ph-list-numbers' },
      { key: 'en', label: 'الفبای انگلیسی', icon: 'ph ph-sort-a-ascending' },
      { key: 'fa', label: 'الفبای فارسی', icon: 'ph ph-translate' },
      { key: 'status', label: 'وضعیت یادگیری', icon: 'ph ph-brain' }
    ].map(o => {
      const on = (s.dictSort || 'course') === o.key;
      return { label: o.label, icon: o.icon,
        style: 'display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 9px;border-radius:8px;background:' + (on ? 'rgba(145,132,217,.14)' : 'transparent') + ';border:1px solid ' + (on ? 'rgba(145,132,217,.55)' : 'rgba(233,233,237,.12)') + ';color:' + (on ? '#c8bef1' : 'rgba(233,233,237,.58)') + ';font-size:10.5px',
        pick: () => this.setState({ dictSort: o.key, limit: 60, dictToolsOpen: false }) };
    });
    const qstats = this.queueStats(d, total);
    const lvstats = this.levelStats(d.round, total);
    const levelPctRaw = lvstats.total ? Math.min(100, (lvstats.introduced / lvstats.total) * 100) : 0;
    const rawWordPhase = this.srKnown(w.i) ? 4 : Math.min(3, this.srStage(w.i));
    const wordPhase = Math.max(0, rawWordPhase);
    const coverageTarget = srn.introduced < STAGES.core ? STAGES.core : (srn.introduced < STAGES.periphery ? STAGES.periphery : STAGES.total);
    // Today's lesson: what is ticked, what is planned, and which step is next.
    const nextMile = (Math.floor(d.seen / QUIZ_EVERY) + 1) * QUIZ_EVERY;
    const job = s.job || JOBS[0];
    const jobColors = ['#84c5d9', '#8fd9c1', '#b3a9e6', '#e0a458', '#e0879e', '#9fc98f', '#d9a38f'];
    const jobLv = s.jobLevel || 'A1', jobLesson = jobLevelLesson(job, jobLv);
    const jobTerms = jobLesson.terms.map((x, i) => Object.assign({}, x, { n: String(i + 1), color: jobColors[i % jobColors.length] }));
    const jobArticleParts = highlightedJobParts(jobLesson.text, jobTerms, jobColors);

    const vals = Object.assign(this.exVals(), this.courseVals(), this.listenVals(), this.discVals(), this.sentVals(), this.lessonBrowserVals(), {
      totalWords: String(total), roundNum: String(d.round), roundName: info.name, streak: String(d.streak || 1),
      cardStarIcon: (this.current() && (d.starred || {})[this.current().i]) ? 'ph-fill ph-star' : 'ph ph-star',
      cardStarStyle: 'display:flex;align-items:center;gap:6px;padding:8px 13px;border-radius:9px;font-size:12.5px;cursor:pointer;background:' + ((this.current() && (d.starred || {})[this.current().i]) ? 'rgba(224,164,88,.14)' : 'transparent') + ';border:1px solid ' + ((this.current() && (d.starred || {})[this.current().i]) ? '#e0a458' : 'rgba(233,233,237,.42)') + ';color:' + ((this.current() && (d.starred || {})[this.current().i]) ? '#e0a458' : 'rgba(233,233,237,.6)'),
      cardStarLabel: (this.current() && (d.starred || {})[this.current().i]) ? 'نشان‌دار' : 'نشان‌گذاری',
      cardStarGo: () => { const c = this.current(); if (c) this.toggleStar(c.i); },
      isHome: s.screen === 'home', isStudy: s.screen === 'study', isQuiz: s.screen === 'quiz', isResult: s.screen === 'result', isBrowse: s.screen === 'browse',
      isWords: s.screen === 'words', isJobs: s.screen === 'jobs', isJobDetail: s.screen === 'jobdetail' && !!s.job,
      isSettings: s.screen === 'settings',
      navTabs: NAV.map(t => {
        const active = t.screen === s.screen || (t.owns || []).indexOf(s.screen) >= 0;
        return {
          label: t.label, icon: active ? t.icon.replace('ph ph-', 'ph-fill ph-') : t.icon,
          ariaCurrent: active ? 'page' : 'false',
          style: 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:56px;border-radius:10px;cursor:pointer;border:1px solid ' +
            (active ? '#9184d9' : 'transparent') + ';background:' + (active ? 'rgba(145,132,217,.16)' : 'transparent') +
            ';color:' + (active ? '#b3a9e6' : 'rgba(233,233,237,.5)'),
          go: () => this.setState({ screen: t.screen })
        };
      }),
      // Runners fill the screen: an activity should not compete with navigation.
      navDisplay: RUNNERS.indexOf(s.screen) >= 0 ? 'none' : 'block',
      goSettings: () => this.setState({ screen: 'settings', settingsFrom: s.screen === 'settings' ? (s.settingsFrom || 'home') : s.screen, confirmReset: false }),
      isHub: s.screen === 'words',
      practiceLevel: s.practiceLv || 'A1',
      practiceLevelTabs: LEVELS.map(L => {
        const unlocked = this.practiceLevelUnlocked(L), on = (s.practiceLv || 'A1') === L;
        return {
          label: L, icon: unlocked ? (on ? 'ph-fill ph-check-circle' : 'ph ph-circle') : 'ph ph-lock-key',
          style: 'display:flex;align-items:center;justify-content:center;gap:5px;min-width:58px;padding:8px 12px;border-radius:9px;font-family:Inter,sans-serif;font-size:12px;background:' + (on ? 'rgba(145,132,217,.15)' : 'transparent') + ';border:1px solid ' + (on ? 'rgba(145,132,217,.65)' : 'rgba(233,233,237,.14)') + ';color:' + (unlocked ? (on ? '#d7d1f5' : 'rgba(233,233,237,.62)') : 'rgba(233,233,237,.28)') + (unlocked ? '' : ';cursor:not-allowed'),
          pick: () => { if (unlocked) this.setState({ practiceLv: L }); }
        };
      }),
      wordStatCards: [
        { label: 'آشناشده', value: String(srn.introduced), desc: 'حداقل یک بار دیده‌ای', color: '#84c5d9', icon: 'ph ph-eye' },
        { label: 'در حال یادگیری', value: String(srn.learning), desc: 'در مسیر مرور فعال', color: '#b3a9e6', icon: 'ph ph-brain' },
        { label: 'موعد مرور', value: String(srn.due), desc: 'الان باید مرور شوند', color: '#e0a458', icon: 'ph ph-clock-countdown' },
        { label: 'بلد', value: String(srn.known), desc: 'تثبیت‌شده در چند روز', color: '#8fd9c1', icon: 'ph ph-seal-check' }
      ].map(x => ({ label: x.label, value: x.value, desc: x.desc, icon: x.icon,
        style: 'min-width:0;padding:13px 14px;background:transparent', iconStyle: 'color:' + x.color + ';font-size:16px' })),
      jobsCount: JOBS.length + ' شغل پرکاربرد',
      jobs: JOBS.map((j, i) => {
        const colors = ['#84c5d9', '#8fd9c1', '#b3a9e6', '#e0a458', '#e0879e'];
        const c = colors[i % colors.length];
        return { en: j.en, fa: j.fa, group: j.group, icon: j.icon,
          style: 'display:flex;align-items:center;gap:11px;width:100%;text-align:right;padding:14px 13px;border-radius:0;background:transparent;border:0;border-bottom:1px solid rgba(233,233,237,.065)',
          iconStyle: 'flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:' + c + '18;border:1px solid ' + c + '3d;color:' + c + ';font-size:18px',
          // LEG-008 — do not reset jobLevel to A1 on open: it discarded
          // whatever level placement (LEG-007) or a previous jobLevelChips
          // pick had already set. jobLv (line ~4321) already falls back to
          // 'A1' when state.jobLevel is genuinely unset, so nothing here
          // needs a forced default.
          open: () => this.setState({ screen: 'jobdetail', job: j }) };
      }),
      jobTitle: job.en,
      jobTitleFa: job.fa,
      jobGroup: job.group,
      jobIcon: job.icon,
      jobLevel: jobLv,
      jobLevelFocus: jobLesson.meta.focus,
      jobLevelRange: jobLesson.meta.range,
      jobWordCount: String((jobLesson.text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length),
      jobLevelChips: LEVELS.map(L => {
        const on = (s.jobLevel || 'A1') === L;
        return { label: L, pick: () => this.setState({ jobLevel: L }),
          style: 'min-width:52px;padding:9px 12px;border-radius:0;font-family:Inter,sans-serif;font-size:12.5px;font-weight:600;background:transparent;border:0;border-bottom:2px solid ' + (on ? '#9184d9' : 'transparent') + ';color:' + (on ? '#d7d1f5' : 'rgba(233,233,237,.48)') };
      }),
      jobArticleParts,
      jobTranslation: jobLesson.translation,
      jobWords: jobTerms.map(x => ({ en: x.en, fa: x.fa, n: x.n,
        badgeStyle: 'flex:none;width:25px;height:25px;border-radius:7px;display:grid;place-items:center;background:' + x.color + '20;border:1px solid ' + x.color + '66;color:' + x.color + ';font-family:Inter,sans-serif;font-size:10px',
        style: 'display:flex;align-items:center;gap:10px;padding:12px 5px;border-radius:0;background:transparent;border:0;border-bottom:1px solid rgba(233,233,237,.07)' })),
      hubTitle: HUBS[s.screen] ? HUBS[s.screen].title : '',
      hubDesc: HUBS[s.screen] ? HUBS[s.screen].desc : '',
      hubCards: this.hubCards(s.screen),
      goHome: () => this.setState({ screen: 'home' }),
      goBrowse: () => this.setState({ screen: 'browse', limit: 60 }),
      startStudy: () => {
        this.remember('study', 'واژه‌ها · جلسهٔ مرور', qstats.due + ' مرور موعددار · ' + Math.min(MAX_NEW, qstats.fresh) + ' تازه');
        if (!d.order.length || d.pos >= d.order.length) this.nextLesson();
        else this.setState({ screen: 'study' }, () => this.prepare());
      },
      startLabel: d.pos > 0 && d.pos < d.order.length ? 'ادامهٔ جلسه از کارت ' + (d.pos + 1) : 'شروع جلسهٔ امروز',
      // One card, two states. A first-time learner gets a single action with
      // nothing competing; a returning one is told where they left off, across
      // sections, instead of the same undifferentiated wall.
      // The home screen is now four tracks side by side, each at its own
      // position. No day, no ticks that reset at midnight, no order imposed.
      trackCards: this.tracks().map(t => ({
        label: t.label, icon: t.icon, sub: t.sub,
        pct: t.total ? progressLabel(t.done, t.total) : '',
        barStyle: 'height:100%;width:' + progressWidth(t.done, t.total) + '%;background:' + t.color + ';transition:width .35s',
        style: cardBtn(t.color) + (t.locked ? ';opacity:.55' : ''),
        iconStyle: iconSq(t.color),
        go: t.go
      })),
      levelLabel: this.levelOf(d.round),
      levelWordProgress: lvstats.introduced + ' از ' + lvstats.total + ' آشناشده',
      levelKnown: lvstats.known + ' بلد',
      levelPctLabel: lvstats.introduced > 0 && levelPctRaw < 1 ? 'کمتر از ۱٪' : Math.round(levelPctRaw) + '٪',
      levelBarStyle: 'height:100%;width:' + (lvstats.introduced > 0 ? Math.max(1, levelPctRaw) : 0) + '%;background:linear-gradient(90deg,#84c5d9,#9184d9);transition:width .35s',
      sessionPosition: 'کارت ' + (d.order.length ? Math.min(d.pos + 1, d.order.length) : 0) + ' از ' + d.order.length,
      todayShort: 'امروز ' + Math.min(d.goal || 20, d.days[t] || 0) + ' از ' + (d.goal || 20),
      // Coverage moves immediately; mastery stays a strict separate number.
      stageLabel: srn.introduced < STAGES.core ? 'هسته‌ی دوره' : (srn.introduced < STAGES.periphery ? 'واژه‌های دوره' : 'گنجینه'),
      stageCount: srn.introduced + ' آشناشده از ' + coverageTarget + ' · ' + srn.known + ' بلد',
      knownCount: String(srn.known),
      progressSummary: srn.introduced + ' آشناشده · ' + srn.known + ' بلد',
      wordStageLabel: 'مرحلهٔ ' + (wordPhase + 1) + ' از ۵ · ' + WORD_LADDER[wordPhase].name,
      wordStageStyle: 'padding:3px 8px;border-radius:99px;background:rgba(132,197,217,.1);border:1px solid rgba(132,197,217,.35);color:#84c5d9',
      dueToday: String(qstats.due),
      sessionMix: Math.min(MAX_REVIEWS, qstats.due) + ' مرور · ' + Math.min(MAX_NEW, qstats.fresh) + ' تازه',
      sessionEta: 'حدود ' + Math.max(1, Math.ceil((Math.min(MAX_REVIEWS, qstats.due) + Math.min(MAX_NEW, qstats.fresh)) * .45)) + ' دقیقه',
      dayProgress: Math.min(d.goal || 20, d.days[t] || 0) + ' از ' + (d.goal || 20) + ' کارت امروز',
      justKnownMsg: s.justKnown ? '«' + s.justKnown + '» بلد شد — سه بار، در سه روز مختلف، یک بارش هم با نوشتن خودت.' : '',
      hasJustKnown: !!s.justKnown,
      roundInLevel: String(((d.round - 1) % PER_LEVEL) + 1),
      levelChips: LEVELS.map((L, i) => {
        const cur = Math.min(this.band(d.round), LEVELS.length - 1);
        const st = i < cur ? 'done' : (i === cur ? 'cur' : 'todo');
        const c = st === 'cur' ? '#b3a9e6' : (st === 'done' ? '#8fd9c1' : 'rgba(233,233,237,.55)');
        return { label: L + ' · ' + this.levelSize(L), icon: st === 'done' ? 'ph-fill ph-check-circle' : (st === 'cur' ? 'ph-fill ph-map-pin' : 'ph ph-circle'), style: 'display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:99px;font-size:11px;font-family:Inter,sans-serif;background:' + (st === 'cur' ? 'rgba(145,132,217,.14)' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + (st === 'cur' ? 'rgba(145,132,217,.5)' : (st === 'done' ? 'rgba(143,217,193,.35)' : 'rgba(233,233,237,.42)')) + ';color:' + c };
      }),
      barStyle: 'height:100%;width:' + pct + '%;background:linear-gradient(90deg,#9184d9,#b3a9e6);transition:width .35s',
      posLabel: (d.order.length ? Math.min(d.pos + 1, d.order.length) : 0) + ' / ' + d.order.length,
      pctLabel: pct + '٪',
      todayCount: String(d.days[t] || 0),
      accuracy: d.seen ? Math.round((d.correct / d.seen) * 100) + '٪' : '—',
      accuracySub: d.seen ? d.correct + ' درست از ' + d.seen : 'هنوز شروع نکرده‌ای',
      exportData: () => this.exportBackup(),
      importFile: e => this.importBackupFile(e),
      resetLabel: s.confirmReset ? 'مطمئنی؟ دوباره بزن' : 'پاک کردن پیشرفت',
      resetAll: () => {
        if (!s.confirmReset) return this.setState({ confirmReset: true });
        ['vocab_game', 'vocab_sent', 'vocab_course', 'vocab_listen', 'vocab_disc', 'vocab_ui_v1', 'vocab_sr_v1', 'vocab_mysent']
          .forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
        // srLoad() caches vocab_sr_v1 in this._sr for the component's lifetime;
        // clearing the key above does nothing on screen until this in-memory
        // cache is dropped too, so "known" state and the review schedule kept
        // showing pre-reset values until a full page reload.
        this._sr = {};
        this.mySent = {};
        const nd = this.blank(total); this.save(nd);
        this.setState({ data: nd, confirmReset: false, screen: 'home', msText: '', gpText: '', gpResult: null });
      },

      card: { en: w.en, fa: faShown, icon: this.icon(w), bigIcon: this.icon(w).replace('ph ph-', 'ph-fill ph-'), cat: w.cat, catFa: this.catLabel(w.cat) },
      cardStyle: 'border-radius:16px;overflow:hidden;background:rgba(233,233,237,.035);border:1px solid ' + accent + '33;box-shadow:0 18px 44px rgba(0,0,0,.35)',
      artStyle: 'position:relative;height:84px;display:grid;place-items:center;color:' + accent + ';background:radial-gradient(300px 100px at 30% 0%,' + accent + '26,transparent 70%),linear-gradient(160deg,' + accent + '14,rgba(18,20,31,0))',
      chipStyle: 'position:absolute;top:11px;right:12px;display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:99px;font-size:11px;background:' + accent + '1f;border:1px solid ' + accent + '3d;color:' + accent,
      promptText, promptHint, promptStyle,
      speak: () => this.speakWord(w.en), speakSlow: () => this.speakWord(w.en, 0.55),
      showAnswer: answered,
      editVal: s.editVal, onEditVal: e => this.setState({ editVal: e.target.value }),
      editKey: e => { if (e.key === 'Enter') this.editSave(); if (e.key === 'Escape') this.setState({ editEn: null, editVal: '' }); },
      editSave: () => this.editSave(),
      editCancel: () => this.setState({ editEn: null, editVal: '' }),
      hasOptions: isMcqLike && options.length > 0, options,
      hasInput: mode === 'type' || mode === 'listen',
      typed: s.typed,
      onType: e => this.setState({ typed: e.target.value }),
      onKey: e => { if (e.key === 'Enter') { if (!this.state.checked) this.check(); else this.advance(!!this.state.correct); } },
      inputStyle: 'width:100%;padding:13px 15px;border-radius:10px;font-family:Inter,sans-serif;direction:ltr;text-align:left;font-size:17px;background:rgba(233,233,237,.04);border:1px solid ' + (s.checked ? (s.correct ? 'rgba(143,217,193,.6)' : 'rgba(217,143,143,.6)') : 'rgba(233,233,237,.42)') + ';color:#e9e9ed;outline:none',
      feedbackStyle: 'margin-top:8px;font-size:12.5px;min-height:18px;color:' + (s.checked ? (s.correct ? '#8fd9c1' : '#d98f8f') : 'transparent'),
      feedbackText: s.checked ? (s.correct ? 'درست بود ✓' : 'پاسخ تو: ' + (s.typed || '—') + ' · پاسخ درست: ' + w.en) : '·',
      liveStatus: s.checked ? (s.correct ? 'پاسخ درست بود.' : 'پاسخ نادرست بود. پاسخ درست ' + w.en + ' است.') : (s.showBack ? 'پاسخ نمایش داده شد.' : ''),
      // cloze used to be excluded — the one mode built on the example sentence
      // was the only one that never revealed it, or its Persian translation.
      showSentence: !!sent && answered,
      // Shown once the answer is revealed: a near-synonym is the cheapest way to
      // place a new word next to one already known.
      hasSyn: !!(w.syn && w.syn.length) && answered,
      synList: (w.syn || []).join(' · '),
      hasIpa: !!w.ipa, ipaText: w.ipa || '',
      showMyBlock: answered,
      // Collapsed by default so the rating buttons — the action every card
      // actually needs — are never competing with an optional exercise for
      // attention. A word with an already-saved sentence opens automatically
      // so past work isn't hidden behind an extra tap.
      msExpanded: !!(s.msOpen || myS),
      msToggle: () => this.setState({ msOpen: !s.msOpen }),
      msToggleLabel: (s.msOpen || myS) ? 'بستن جمله‌سازی' : '+ جمله بساز با این واژه',
      msToggleIcon: (s.msOpen || myS) ? 'ph ph-caret-up' : 'ph ph-pencil-line',
      msToggleStyle: 'display:flex;align-items:center;gap:6px;padding:8px 13px;border-radius:9px;font-size:12px;cursor:pointer;background:transparent;border:1px solid rgba(233,233,237,.16);color:rgba(233,233,237,.65)',
      hasMyRes: !!myS,
      mySavedS: myS ? myS.s : '',
      mySavedLabel: 'آخرین تمرین شما با «' + w.en + '»',
      hasMyCorrected: !!(myS && myS.corrected), myCorrected: myS && myS.corrected ? myS.corrected : '',
      hasMyTranslation: !!(myS && myS.translation), myTranslation: myS && myS.translation ? myS.translation : '',
      myService: myS && myS.service ? myS.service : 'بررسی محلی',
      myServiceStyle: 'display:inline-flex;align-items:center;gap:5px;padding:3px 7px;border-radius:99px;font-size:9.5px;margin-top:7px;background:' + (myS && myS.online ? 'rgba(132,197,217,.1)' : 'rgba(233,233,237,.04)') + ';border:1px solid ' + (myS && myS.online ? 'rgba(132,197,217,.35)' : 'rgba(233,233,237,.12)') + ';color:' + (myS && myS.online ? '#84c5d9' : 'rgba(233,233,237,.5)'),
      myFb: myS ? myS.fb : '',
      myFbIcon: myS && myS.ok ? 'ph-fill ph-check-circle' : 'ph-fill ph-warning-circle',
      myFbStyle: 'display:flex;align-items:flex-start;gap:6px;font-size:12px;line-height:1.7;margin-top:6px;color:' + (myS && myS.ok ? '#8fd9c1' : '#e0a458'),
      hasMyChecks: !!(myS && myS.checks && myS.checks.length),
      myChecks: (myS && myS.checks ? myS.checks : []).map(c => ({
        label: c.label,
        icon: c.ok ? 'ph-fill ph-check-circle' : 'ph-fill ph-x-circle',
        style: 'display:flex;align-items:flex-start;gap:6px;font-size:11.5px;line-height:1.8;color:' + (c.ok ? 'rgba(143,217,193,.85)' : '#e0a458')
      })),
      myScoreLabel: myS && myS.score != null ? 'نمره‌ی ساختار: ' + myS.score + '٪' : '',
      msText: s.msText, onMs: e => this.setState({ msText: e.target.value, msErr: '' }),
      msKey: e => { if (e.key === 'Enter') this.checkMy(); },
      checkMy: () => this.checkMy(),
      msBusy: !!s.msBusy,
      msBtnLabel: s.msBusy ? 'در حال بررسی…' : 'بررسی تمرین من',
      msPlaceholder: 'یک جملهٔ تازه با “' + w.en + '” بنویس…',
      msBtnStyle: 'flex:none;padding:10px 15px;border-radius:9px;font-size:12.5px;cursor:pointer;background:rgba(145,132,217,.12);border:1px solid ' + (s.msBusy ? 'rgba(233,233,237,.2)' : 'rgba(145,132,217,.5)') + ';color:' + (s.msBusy ? 'rgba(233,233,237,.55)' : '#b3a9e6'),
      msInputStyle: 'flex:1;min-width:0;padding:10px 13px;border-radius:9px;background:rgba(233,233,237,.04);border:1px solid rgba(233,233,237,.13);color:#e9e9ed;font-size:14px;outline:none;font-family:Inter,sans-serif;direction:ltr;text-align:left',
      hasMsErr: !!s.msErr, msErr: s.msErr,
      sentenceEn: sent ? sent.s : '', sentenceFa: sent ? sent.fa : '', hasSentenceFa: !!(sent && sent.fa),
      actions,
      hintLine: answered ? '' : (mode === 'flash' ? 'دکمهٔ «نمایش معنی» را بزن' : (isMcqLike ? 'گزینه‌ی درست را انتخاب کن' : 'Enter = بررسی')),
      nextQuizIn: String(Math.max(0, nextMile - d.seen)),

      qPrompt, qHint, qOptions, quizPos, quizBarStyle, qPromptStyle,
      quizNext: () => this.quizAdvance(),
      quizNextLabel: q && q.k + 1 >= q.qs.length ? 'دیدن نتیجه' : 'سؤال بعدی',
      quizNextStyle: btn('transparent', q && q.picked != null ? '#e0a458' : 'rgba(233,233,237,.42)', q && q.picked != null ? '#e0a458' : 'rgba(233,233,237,.55)'),

      isPlacement: s.screen === 'placement', showPlacementBtn: s.screen === 'home',
      startPlacement: () => this.startPlacement(), skipPlacement: () => this.skipPlacement(),
      plDone: !!(pl && pl.done), plNotDone: !!(pl && !pl.done), plLevelLabel, plPrompt, plPromptStyle, plOptions, plPos, plBarStyle,
      plHint, plShowWhy, plWhy,
      plNext: () => this.placementAdvance(),
      plNextLabel: pl && pl.k + 1 >= pl.qs.length ? 'دیدن نتیجه' : 'سؤال بعدی',
      plNextStyle: btn('transparent', pl && pl.picked != null ? '#84c5d9' : 'rgba(233,233,237,.42)', pl && pl.picked != null ? '#84c5d9' : 'rgba(233,233,237,.55)'),
      plResultTitle, plResultDesc, plBreakdown, plOverrideChips, plApplyLabel,
      plApply: () => this.applyPlacement(),

      resultTitle, resultDesc, resultIcon, resultActions,
      resultIconStyle: 'width:56px;height:56px;margin:0 auto;border-radius:16px;display:grid;place-items:center;font-size:28px;background:' + resultCol + '1f;border:1px solid ' + resultCol + '44;color:' + resultCol,
      hasMissed: missed.length > 0, missed,

      isAdd: s.screen === 'add',
      goAdd: () => this.setState({ screen: 'add', nErr: '', justAdded: '' }),
      nEn: s.nEn, nFa: s.nFa, nEx: s.nEx,
      onNEn: e => this.setState({ nEn: e.target.value, nErr: '' }),
      onNFa: e => this.setState({ nFa: e.target.value, nErr: '' }),
      onNEx: e => this.setState({ nEx: e.target.value, nReview: null, nErr: '' }),
      onNKey: e => { if (e.key === 'Enter') this.addWord(); },
      fieldStyle: 'width:100%;padding:11px 14px;border-radius:10px;background:rgba(233,233,237,.04);border:1px solid rgba(233,233,237,.13);color:#e9e9ed;font-size:14px;outline:none',
      enFieldStyle: 'width:100%;padding:11px 14px;border-radius:10px;background:rgba(233,233,237,.04);border:1px solid rgba(233,233,237,.13);color:#e9e9ed;font-size:15px;outline:none;font-family:Inter,sans-serif;direction:ltr;text-align:left',
      catChoices: this.allCatKeys().map(k => {
        const on = s.nCat === k, meta = this.catMeta(k), c = meta[1];
        return {
          key: k, label: this.catLabel(k), icon: 'ph ph-' + meta[0].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
          style: 'display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:99px;font-size:12px;cursor:pointer;background:' + (on ? c + '24' : 'rgba(233,233,237,.03)') + ';border:1px solid ' + (on ? c + '77' : 'rgba(233,233,237,.42)') + ';color:' + (on ? c : 'rgba(233,233,237,.6)'),
          pick: () => this.setState({ nCat: k })
        };
      }),
      previewSpeak: () => this.speakWord((this.state.nEn || '').trim()),
      checkNEx: () => this.checkNewExample(),
      nReviewBusy: !!s.nBusy,
      nReviewBtnLabel: s.nBusy ? 'در حال بررسی…' : 'بررسی مثال + ترجمه',
      hasNReview: !!s.nReview,
      nReviewService: s.nReview ? s.nReview.service : '',
      nReviewHasCorrected: !!(s.nReview && s.nReview.corrected),
      nReviewCorrected: s.nReview ? (s.nReview.corrected || '') : '',
      nReviewHasTranslation: !!(s.nReview && s.nReview.translation),
      nReviewTranslation: s.nReview ? (s.nReview.translation || '') : '',
      nReviewHasIssues: !!(s.nReview && s.nReview.issues && s.nReview.issues.length),
      nReviewIssues: s.nReview ? (s.nReview.issues || []).map(i => ({ label: i.label })) : [],
      acceptNReview: () => this.acceptNewExample(),
      submitAdd: () => this.addWord(),
      addErr: s.nErr || '', hasAddErr: !!s.nErr,
      addedMsg: s.justAdded ? '«' + s.justAdded + '» اضافه شد و به انتهای صف مرور رفت.' : '',
      hasAdded: !!s.justAdded,
      customCount: this.custom.length,
      hasCustom: this.custom.length > 0,
      customList: this.custom.map(c => ({
        en: c.en, fa: c.fa,
        say: () => this.speakWord(c.en),
        del: () => this.removeWord(c.en)
      })),

      query: s.query, onQuery: e => this.setState({ query: e.target.value, limit: 60, dictTrResult: null, dictTrErr: '' }),
      queryKey: e => { if (e.key === 'Enter') this.translateDictionaryQuery(); },
      dictSort: s.dictSort || 'course',
      onDictSort: e => this.setState({ dictSort: e.target.value, limit: 60 }),
      dictSortOptions: sortOptions,
      dictToolsOpen: !!s.dictToolsOpen,
      toggleDictTools: () => this.setState({ dictToolsOpen: !s.dictToolsOpen }),
      dictTranslate: () => this.translateDictionaryQuery(),
      dictTrBusy: !!s.dictTrBusy,
      dictTrBtnLabel: s.dictTrBusy ? 'در حال ترجمه…' : 'ترجمه',
      hasDictTrResult: !!s.dictTrResult,
      dictTrSource: s.dictTrResult ? s.dictTrResult.source : '',
      dictTrText: s.dictTrResult ? s.dictTrResult.text : '',
      dictTrDirection: s.dictTrResult ? (s.dictTrResult.from === 'fa' ? 'فارسی ← انگلیسی' : 'English → فارسی') : '',
      hasDictTrErr: !!s.dictTrErr, dictTrErr: s.dictTrErr || '',
      catChips,
      addingCat: s.addingCat, toggleAddCat: () => this.setState({ addingCat: !s.addingCat, newCatName: '' }),
      newCatName: s.newCatName, onNewCat: e => this.setState({ newCatName: e.target.value }),
      newCatKey: e => { if (e.key === 'Enter') this.addCategory(); },
      saveCat: () => this.addCategory(),
      starTotal: String(Object.keys(starMap).length),
      hasStars: Object.keys(starMap).length > 0,
      goStars: () => this.goStars(),
      learnedTotal: String((srn.known || 0) + (srn.learning || 0)),
      learnedActive: s.catFilter === '__learned',
      learnedQuickStyle: 'background:' + (s.catFilter === '__learned' ? 'rgba(143,217,193,.15)' : 'rgba(233,233,237,.025)') + ';border-color:' + (s.catFilter === '__learned' ? 'rgba(143,217,193,.62)' : 'rgba(233,233,237,.15)') + ';color:' + (s.catFilter === '__learned' ? '#8fd9c1' : 'rgba(233,233,237,.65)'),
      starsQuickStyle: 'background:' + (s.catFilter === '__star' ? 'rgba(224,164,88,.14)' : 'rgba(233,233,237,.025)') + ';border-color:' + (s.catFilter === '__star' ? 'rgba(224,164,88,.58)' : 'rgba(233,233,237,.15)') + ';color:' + (s.catFilter === '__star' ? '#e0a458' : 'rgba(233,233,237,.65)'),
      toolsQuickStyle: 'background:' + (s.dictToolsOpen ? 'rgba(132,197,217,.13)' : 'rgba(233,233,237,.025)') + ';border-color:' + (s.dictToolsOpen ? 'rgba(132,197,217,.55)' : 'rgba(233,233,237,.15)') + ';color:' + (s.dictToolsOpen ? '#84c5d9' : 'rgba(233,233,237,.65)'),
      goLearned: () => this.setState({ screen: 'browse', catFilter: s.catFilter === '__learned' ? 'all' : '__learned', limit: 60, query: '', dictTrResult: null, dictTrErr: '', wordMoreEn: null }),
      hasBrowseFilter: s.catFilter !== 'all',
      browseFilterLabel: s.catFilter === '__star' ? 'واژه‌های نشان‌دار' : (s.catFilter === '__learned' ? 'بلد و در حال یادگیری' : this.catLabel(s.catFilter)),
      clearBrowseFilter: () => this.setState({ catFilter: 'all', limit: 60, wordMoreEn: null, dictToolsOpen: false }),
      browseCount: (s.catFilter === '__star' ? 'واژه‌های نشان‌دار — ' : (s.catFilter === '__learned' ? 'واژه‌های بلد و در حال یادگیری — ' : '')) + filtered.length + ' واژه' + (srn.known || srn.learning ? ' · ' + srn.known + ' واژه بلد · ' + srn.learning + ' در حال یادگیری' : ''),
      browseList, hasMore: filtered.length > s.limit, showMore: () => this.setState({ limit: s.limit + 60 })
    });

    // One location strip for every screen below a hub, rather than seventeen
    // hand-placed ones. The trail is the path through the three sections; the
    // counter reuses whichever position value that screen already computes; and
    // «بستن» always goes exactly one level up — the same gesture used to land
    // in four different places depending on which curriculum you were inside.
    const CRUMB = {
      home:     ['', '', null],
      // LEG-010 — the lesson browser used to have no crumb at all (no way
      // back to home through the header's back-navigation chrome), same
      // pattern every other "یادگیری" sub-screen (gram/sent/colloc/listen/
      // disc) already uses.
      lessons:  ['واژه‌ها', '', 'home'],
      words:    ['', '', null],
      jobs:     ['', '', null],
      jobdetail:[s.job ? s.job.fa : 'جزئیات شغل', '', 'jobs'],
      settings: ['تنظیمات', '', 'home'],
      // LEG-009 — a study session is now always entered from the lesson
      // browser, so «بستن» falls back there (real navigation history via
      // navBack() already does the right thing whenever it exists; this is
      // only the static fallback for when it does not).
      study:    ['یادگیری · واژه‌ها', 'posLabel', 'lessons'],
      quiz:     ['یادگیری · آزمون واژه', 'quizPos', 'home'],
      placement:['تعیین سطح', 'plPos', 'home'],
      result:   ['یادگیری · نتیجه', '', 'home'],
      browse:   ['', '', null],
      add:      ['واژه‌نامه · افزودن واژه', '', 'browse'],
      exercise: ['تمرین · تمرین این دسته', 'exPos', 'browse'],
      game:     ['تمرین · بازی جفت‌سازی', '', 'words'],
      sent:     ['جمله‌سازی', '', 'home'],
      sbrun:    [s.sb ? (({ pattern:'آزمایشگاه الگو', chunk:'چیدن بلوک‌ها', expand:'گسترش جمله', combine:'ترکیب جمله‌ها', free:'جمله‌ی خودت', game:'مسابقه‌ی جمله' })[s.sb.mode] || 'تمرین جمله‌سازی') : 'تمرین جمله‌سازی', 'sbPos', 'sent'],
      gram:     ['دستور زبان', '', 'home'],
      glesson:  [s.gLesson ? s.gLesson.t : 'درس دستور زبان', '', 'gram'],
      colloc:   ['ترکیب‌های رایج', '', 'home'],
      csrun:    [s.cs ? s.cs.title : 'تمرین', 'csPos', null],
      listen:   ['شنیدن و بازگویی', '', 'home'],
      ltext:    [s.lsText ? s.lsText.titleFa : 'متن شنیداری', 'ltPos', 'listen'],
      disc:     ['گفت‌وگوی آزاد', '', 'home'],
      dses:     [s.dSes ? s.dSes.titleFa : 'جلسه گفت‌وگو', '', 'disc']
    };
    const c = CRUMB[s.screen];
    vals.hasCrumb = !!(c && c[0]);
    vals.headerRoot = !vals.hasCrumb;
    vals.showGear = s.screen !== 'settings';
    vals.crumb = c ? c[0] : '';
    vals.crumbPos = c && c[1] ? (vals[c[1]] || '') : '';
    // csrun is shared by grammar and collocations, so its parent depends on why
    // it was opened — cs.back already records that.
    const up = s.screen === 'settings' && s.settingsFrom
      ? s.settingsFrom
      : (c && (c[2] || (s.cs && s.cs.back) || 'home'));
    // «بستن» returns you to where you actually came from, not to a fixed
    // parent. Entering a grammar lesson from the home tracks and closing it
    // used to drop you on the grammar hub — somewhere you had never been.
    // The static parent stays as the fallback for a first screen with no
    // history behind it.
    vals.crumbUp = () => {
      const dest = this.navBack() || up;
      this.leaveScreen(s.screen);
      this.setState({ screen: dest });
    };
    return vals;
  }
}
