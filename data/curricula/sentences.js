// Sentence-building curriculum: patterns, chunking, expansion, combining, per CEFR level.
window.SENT = {
A1: {
  intro: 'اول از همه: هر جمله‌ی انگلیسی یک ترتیب ثابت دارد — چه‌کسی + چه‌کار + چه‌چیز. فارسی فعل را آخر می‌گذارد، انگلیسی وسط. همین یک عادت را که عوض کنی، نیمی از راه را رفته‌ای.',
  patterns: [
    {name:'فاعل مفرد + فعل', formula:'S + V', desc:'کوتاه‌ترین جمله‌ی کامل. فعل بی‌مفعول (بخواب، بدو، بخند). اینجا همه‌ی فاعل‌ها مفردند.', slots:[['My brother','She','My friend','The teacher'],['sings','sleeps','is running','laughed']], note:'با he/she/it فعل s می‌گیرد: she sings ✓ / she sing ✗'},
    {name:'فاعل + فعل + مفعول', formula:'S + V + O', desc:'پرکاربردترین الگوی انگلیسی. مفعول بلافاصله بعد از فعل می‌آید — هرگز قبل از آن.', slots:[['I','We','My mother','The students'],['bought','wanted','needed','sold'],['tea','a new phone','some bread','two books']], note:'غلط رایج فارسی‌زبان‌ها: «I tea drink» ✗ — فعل‌های اینجا گذشته‌اند تا فقط روی ترتیب تمرکز کنی.'},
    {name:'فاعل + فعل ربطی + توصیف', formula:'S + be + C', desc:'برای گفتن «چه‌کسی/چه‌چیزی چگونه است». be به فاعل چسبیده تا شکل درستش را کنار هم ببینی.', slots:[['My room is','My bag is','This book is','These shoes are'],['very small','new','interesting','expensive']], note:'مفرد → is، جمع → are؛ و be هرگز حذف نمی‌شود: «She happy» ✗'},
    {name:'فاعل جمع + فعل', formula:'S(جمع) + V', desc:'همان الگوی اول، این‌بار با فاعل جمع — فعل s نمی‌گیرد.', slots:[['Birds','The children','My friends','Those boys'],['sing','sleep','are running','are hungry']], note:'فاعل جمع: فعل s نمی‌گیرد و be می‌شود are: the children sleep ✓ / the children sleeps ✗'}
  ],
  chunks: [
    {fa:'من هر روز صبح قهوه می‌نوشم.', chunks:['I drink','coffee','every morning'], tip:'ترتیب طلایی: چه‌کار → چه‌چیز → کِی'},
    {fa:'او در یک بیمارستان کار می‌کند.', chunks:['She works','in a hospital'], tip:'مکان بعد از فعل می‌آید: چه‌کار → کجا'},
    {fa:'ما دیشب فیلم خوبی تماشا کردیم.', chunks:['We watched','a good film','last night'], tip:'زمان معمولاً آخر جمله می‌آید'},
    {fa:'پدرم ماشین جدیدی خرید.', chunks:['My father','bought','a new car'], tip:'فاعل → فعل → مفعول؛ صفت قبل از اسم می‌آید: a new car'},
    {fa:'بچه‌ها در پارک بازی می‌کنند.', chunks:['The children','are playing','in the park'], tip:'حال استمراری: are + فعلing، و مکان بعد از آن'},
    {fa:'من صبح‌ها انگلیسی می‌خوانم.', chunks:['I study','English','in the morning'], tip:'چه‌کار → چه‌چیز → کِی؛ زمان آخر می‌ماند'}
  ],
  expand: [
    {kernel:'The girl sings.', steps:[
      {q:'چه‌جور دختری؟ (صفت)', opts:['The little girl sings.','The girl small sings.'], a:0},
      {q:'چطور می‌خواند؟ (قید)', opts:['The little girl sings beautifully.','The little girl beautifully sings.'], a:0},
      {q:'کجا؟', opts:['The little girl sings beautifully in the garden.','The little girl in the garden sings beautifully.'], a:0},
      {q:'کِی؟ (زمان آخر می‌آید)', opts:['The little girl sings beautifully in the garden every evening.','The little girl every evening sings beautifully in the garden.'], a:0}
    ], final:'The little girl sings beautifully in the garden every evening.'},
    {kernel:'I eat.', steps:[
      {q:'چه‌چیزی؟ (مفعول)', opts:['I eat breakfast.','I breakfast eat.'], a:0},
      {q:'کِی؟', opts:['I eat breakfast at seven.','I at seven eat breakfast.'], a:0},
      {q:'با کی؟', opts:['I eat breakfast at seven with my family.','I eat with my family breakfast at seven.'], a:0},
      {q:'هر روز است یا فقط امروز؟', opts:['I eat breakfast at seven with my family every day.','I every day eat breakfast at seven with my family.'], a:0}
    ], final:'I eat breakfast at seven with my family every day.'},
    {kernel:'He drives.', steps:[
      {q:'چه‌چیزی؟', opts:['He drives a taxi.','He a taxi drives.'], a:0},
      {q:'کجا؟', opts:['He drives a taxi in Tehran.','He drives in Tehran a taxi.'], a:0},
      {q:'کِی؟', opts:['He drives a taxi in Tehran every night.','He drives every night a taxi in Tehran.'], a:0}
    ], final:'He drives a taxi in Tehran every night.'}
  ],
  combine: [
    {a:'I was tired.', b:'I went to bed.', hint:'با so (پس، بنابراین)', answers:['I was tired so I went to bed.','I went to bed because I was tired.','I was tired, so I went to bed early.']},
    {a:'She is short.', b:'She plays basketball.', hint:'با but (اما)', answers:['She is short but she plays basketball.','She is short but plays basketball.','Although she is short she plays basketball.']},
    {a:'I like tea.', b:'I like coffee.', hint:'با and — تکرار I like را حذف کن', answers:['I like tea and coffee.','I like both tea and coffee.','I like tea and I like coffee.']},
    {a:'It was raining.', b:'We stayed home.', hint:'با because (چون) — جای جمله‌ها را عوض کن', answers:['We stayed home because it was raining.','We stayed at home because it was raining.','Because it was raining we stayed home.']}
  ]
},
A2: {
  intro: 'در این سطح جمله‌ات را «بسط» می‌دهی: زمان، مکان، دلیل و توصیف اضافه می‌کنی — اما ترتیب هسته (فاعل، فعل، مفعول) دست‌نخورده می‌ماند.',
  patterns: [
    {name:'فاعل + فعل + دو مفعول', formula:'S + V + O + O', desc:'give، send، tell، show، buy: اول «به کی»، بعد «چه‌چیز».', slots:[['I','She','My uncle'],['gave','sent','showed'],['my friends','my sister','the teacher'],['a present','a letter','the photos']], note:'یا با to: I gave a present to my sister.'},
    {name:'ترتیب قیدها', formula:'S + V + O + چطور + کجا + کِی', desc:'اگر چند قید داری، این ترتیب طبیعی‌ترین است.', slots:[['We played','She studied','They worked'],['well','quietly','hard'],['at school','at home','in the classroom'],['yesterday','last week','all day']], note:'هرگز قید را بین فعل و مفعول نگذار.'},
    {name:'جمله با there is / there are', formula:'There + be + اسم + مکان', desc:'برای گفتن «چیزی وجود دارد». be با اسم یک‌جا آمده تا شکل درستش را کنار هم ببینی.', slots:[['There is a bank','There are two parks','There is a good school','There are a few shops'],['near my house','in this city','on our street']], note:'مفرد → is، جمع → are: there is a bank ✓ / there is two parks ✗'}
  ],
  chunks: [
    {fa:'او دیروز یک نامه به مادرش نوشت.', chunks:['She wrote','a letter','to her mother','yesterday'], tip:'با to اول «چه‌چیز» بعد «به کی»؛ زمان آخرِ همه'},
    {fa:'ما هفته‌ی پیش با اتوبوس به شیراز رفتیم.', chunks:['We went','to Shiraz','by bus','last week'], tip:'مکان قبل از زمان'},
    {fa:'نزدیک خانه‌ی ما دو مغازه هست.', chunks:['There are','two shops','near our house'], tip:'اسم جمع → are؛ مکان بعد از اسم می‌آید'},
    {fa:'معلم عکس‌ها را به ما نشان داد.', chunks:['The teacher','showed','us','the photos'], tip:'اول «به کی»، بعد «چه‌چیز»'},
    {fa:'آن‌ها تمام روز در اداره سخت کار کردند.', chunks:['They worked','hard','at the office','all day'], tip:'ترتیب قیدها: چطور → کجا → کِی'},
    {fa:'من به خواهرم یک هدیه دادم.', chunks:['I gave','my sister','a present'], tip:'بدون to: اول «به کی» بعد «چه‌چیز»'}
  ],
  expand: [
    {kernel:'We travelled.', steps:[
      {q:'کجا؟', opts:['We travelled to Isfahan.','We travelled Isfahan to.'], a:0},
      {q:'چطور؟', opts:['We travelled to Isfahan by train.','We travelled by train to Isfahan.'], a:0},
      {q:'کِی؟', opts:['We travelled to Isfahan by train last summer.','Last summer we to Isfahan travelled by train.'], a:0},
      {q:'با کی؟', opts:['We travelled to Isfahan by train last summer with my cousins.','We with my cousins travelled to Isfahan by train last summer.'], a:0}
    ], final:'We travelled to Isfahan by train last summer with my cousins.'},
    {kernel:'She sent an email.', steps:[
      {q:'به کی؟', opts:['She sent her boss an email.','She sent an email her boss.'], a:0},
      {q:'کِی؟', opts:['She sent her boss an email this morning.','She this morning sent her boss an email.'], a:0},
      {q:'چه‌جور ایمیلی و درباره‌ی چه؟', opts:['She sent her boss a long email this morning about the project.','She sent her boss an email long this morning about the project.'], a:0}
    ], final:'She sent her boss a long email this morning about the project.'},
    {kernel:'There is a park.', steps:[
      {q:'چه‌جور پارکی؟', opts:['There is a big park.','There is park big.'], a:0},
      {q:'کجا؟', opts:['There is a big park near my school.','Near my school there is a big park.'], a:0},
      {q:'داخلش چه هست؟', opts:['There is a big park near my school with a small lake.','There is with a small lake a big park near my school.'], a:0}
    ], final:'There is a big park near my school with a small lake.'}
  ],
  combine: [
    {a:'I finished my homework.', b:'I watched a film.', hint:'با after — با ing هم می‌شود', answers:['After I finished my homework I watched a film.','After finishing my homework I watched a film.','I watched a film after I finished my homework.','I watched a film after finishing my homework.']},
    {a:'The film was long.', b:'The film was boring.', hint:'با and — فاعل را تکرار نکن', answers:['The film was long and boring.','The film was both long and boring.']},
    {a:'He missed the bus.', b:'He woke up late.', hint:'با because', answers:['He missed the bus because he woke up late.','Because he woke up late he missed the bus.','He woke up late so he missed the bus.']},
    {a:'My phone is old.', b:'My phone works well.', hint:'با although (هرچند) در ابتدای جمله', answers:['Although my phone is old it works well.','Even though my phone is old it works well.','My phone is old but it works well.']}
  ]
},
B1: {
  intro: 'حالا از جمله‌های کوتاه به جمله‌های پیوسته می‌رسی. کلید حرفه‌ای‌شدن: به‌جای پنج جمله‌ی کوتاه، دو جمله‌ی خوش‌ساخت بنویس — با who/which، وقتی/چون، و ing.',
  patterns: [
    {name:'جمله‌ی موصولی', formula:'اسم + who/which/that + فعل', desc:'دو جمله را در یک جمله جا می‌دهی و توضیح را می‌چسبانی به اسم.', slots:[['The man','The woman','The person'],['who','that'],['called you','lives next door','I met yesterday'],['is a doctor.','works with me.','moved to Canada last year.']], note:'who برای آدم؛ برای شیء which یا that: The book which I bought was expensive.'},
    {name:'قید زمان در ابتدا', formula:'When/While + جمله، + جمله‌ی اصلی', desc:'برای شروع جذاب‌تر جمله — با کاما.', slots:[['When I arrived,','While she was cooking,','As soon as we left,'],['the meeting had started.','the phone rang.','it began to rain.']], note:'کاما فقط وقتی لازم است که با قید شروع کنی.'},
    {name:'ساختار ing برای هم‌زمانی', formula:'Verb-ing…, + جمله‌ی اصلی', desc:'دو کارِ هم‌زمانِ یک فاعل را یکی می‌کند.', slots:[['Walking home,','Feeling tired,','Having finished work,'],['I saw an old friend.','she went to bed early.','he took a long shower.']], note:'فاعل هر دو بخش باید یکی باشد.'}
  ],
  chunks: [
    {fa:'مردی که به تو زنگ زد عموی من است.', chunks:['The man','who called you','is my uncle'], tip:'توضیح موصولی بلافاصله به اسم می‌چسبد، بعد فعل اصلی می‌آید'},
    {fa:'وقتی رسیدم، جلسه شروع شده بود.', chunks:['When I arrived,','the meeting','had started'], tip:'وقتی با قید زمان شروع کنی، بعدش کاما لازم است'},
    {fa:'کتابی که دیروز خریدم خیلی گران بود.', chunks:['The book','I bought yesterday','was very expensive'], tip:'ضمیر موصولی مفعولی حذف‌شدنی است'},
    {fa:'در حالِ برگشت به خانه، دوست قدیمی‌ام را دیدم.', chunks:['Walking home,','I saw','an old friend'], tip:'فاعل بعد از کاما باید همان کسی باشد که walking را انجام می‌دهد'},
    {fa:'او چون خسته بود زود خوابید.', chunks:['She went to bed early','because','she was tired'], tip:'because وسط می‌آید و علت را به جمله‌ی اول وصل می‌کند'},
    {fa:'شهری که در آن بزرگ شدم کنار دریاست.', chunks:['The city','where I grew up','is by the sea'], tip:'برای مکان از where استفاده کن، نه which'}
  ],
  expand: [
    {kernel:'The man works here.', steps:[
      {q:'کدام مرد؟ (موصولی)', opts:['The man who lives next door works here.','The man works here who lives next door.'], a:0},
      {q:'چه‌کاری؟', opts:['The man who lives next door works here as a security guard.','The man who lives next door as a security guard works here.'], a:0},
      {q:'کِی؟', opts:['The man who lives next door works here as a security guard at night.','The man who lives next door works here as at night a security guard.'], a:0}
    ], final:'The man who lives next door works here as a security guard at night.'},
    {kernel:'I bought a laptop.', steps:[
      {q:'چه‌جور لپ‌تاپی؟', opts:['I bought a second-hand laptop.','I bought a laptop second-hand.'], a:0},
      {q:'کجا و چرا؟', opts:['I bought a second-hand laptop online because it was cheaper.','I bought because it was cheaper a second-hand laptop online.'], a:0},
      {q:'کِی؟ و چقدر ارزان‌تر؟', opts:['Last month I bought a second-hand laptop online because it was much cheaper.','Last month I bought a second-hand laptop online because it was cheaper much.'], a:0}
    ], final:'Last month I bought a second-hand laptop online because it was much cheaper.'},
    {kernel:'She passed the exam.', steps:[
      {q:'چطور؟ (با ing در ابتدا)', opts:['Studying every night, she passed the exam.','She passed studying every night the exam.'], a:0},
      {q:'با چه نتیجه‌ای؟', opts:['Studying every night, she passed the exam with a high score.','Studying every night with a high score she passed the exam.'], a:0},
      {q:'چه مدت؟', opts:['Studying every night for two months, she passed the exam with a high score.','Studying every night two months for, she passed the exam with a high score.'], a:0}
    ], final:'Studying every night for two months, she passed the exam with a high score.'}
  ],
  combine: [
    {a:'The hotel was cheap.', b:'The hotel was clean.', c:'We stayed there for a week.', hint:'هر سه را در یک جمله — با and و which/where', answers:['The hotel where we stayed for a week was cheap and clean.','We stayed for a week in a hotel which was cheap and clean.','We stayed for a week in a hotel that was cheap and clean.','The hotel we stayed in for a week was cheap and clean.']},
    {a:'I met a woman.', b:'She speaks five languages.', hint:'با who', answers:['I met a woman who speaks five languages.','I met a woman that speaks five languages.','I met a woman who can speak five languages.']},
    {a:'He lost his keys.', b:'He could not open the door.', hint:'با so یا Having lost…', answers:['He lost his keys so he could not open the door.','Having lost his keys he could not open the door.','Because he lost his keys he could not open the door.','He could not open the door because he had lost his keys.']},
    {a:'The project was difficult.', b:'We finished it on time.', hint:'با Although در ابتدا', answers:['Although the project was difficult we finished it on time.','Even though the project was difficult we finished it on time.','The project was difficult but we finished it on time.']}
  ]
},
B2: {
  intro: 'در این سطح یاد می‌گیری جمله‌ات را «متنوع» کنی: بلند و کوتاه را در هم بیامیزی، جمله را با چیزی جز فاعل شروع کنی، و اسم‌سازی کنی. این همان چیزی است که در آیلتس «Grammatical Range» نام دارد.',
  patterns: [
    {name:'شروع با عبارت قیدی', formula:'قید/عبارت، + S + V', desc:'شروع نکردن همه‌ی جمله‌ها با فاعل، اولین نشانه‌ی نویسنده‌ی حرفه‌ای است.', slots:[['In recent years,','Despite the cost,','As a result,'],['many families','more students','several companies'],['have moved to big cities.','have changed their habits.','have started working online.']], note:'بعد از عبارت ابتدایی کاما بگذار.'},
    {name:'اسم‌سازی (Nominalisation)', formula:'فعل → اسم + فعل رسمی', desc:'سبک آکادمیک: به‌جای «Prices rose, so people complained» بنویس «The rise in prices led to complaints».', slots:[['The increase in','The decline in','The rise in'],['fuel prices','birth rates','online shopping'],['has affected','has reduced','has changed'],['family budgets.','school enrolment.','high-street sales.']], note:'در رایتینگ آیلتس نمره‌آور است.'},
    {name:'جمله‌ی مجهول برای فرایند', formula:'مفعول + be + p.p (+ by …)', desc:'وقتی عاملِ کار مهم نیست — قلب Writing Task 1.', slots:[['The raw material','The mixture','The sample'],['is collected','is processed','was analysed'],['in a large tank.','at the factory.','by researchers.']], note:'زمان را فعل be نشان می‌دهد.'}
  ],
  chunks: [
    {fa:'در سال‌های اخیر، خانواده‌های زیادی به شهرهای بزرگ نقل مکان کرده‌اند.', chunks:['In recent years,','many families','have moved','to big cities'], tip:'عبارت قیدی در ابتدا + کاما، بعد فاعل و فعل'},
    {fa:'افزایش قیمت سوخت بر بودجه‌ی خانوارها تأثیر گذاشته است.', chunks:['The increase in fuel prices','has affected','household budgets'], tip:'اسم‌سازی: increase به‌جای increased'},
    {fa:'با وجود هزینه‌ی بالا، دولت این طرح را تأیید کرد.', chunks:['Despite the high cost,','the government','approved','the plan'], tip:'بعد از despite اسم می‌آید نه جمله: despite the cost ✓ / despite it was costly ✗'},
    {fa:'مواد اولیه در مخزن بزرگی جمع‌آوری می‌شود.', chunks:['The raw material','is collected','in a large tank'], tip:'مجهول: be + قسمت سوم'},
    {fa:'آنچه بیشتر مردم نمی‌دانند این است که این فرایند دو هفته طول می‌کشد.', chunks:['What most people do not know','is that','this process','takes two weeks'], tip:'جمله‌ی شکافته با What'},
    {fa:'در نتیجه، دانشجویان بیشتری آنلاین درس می‌خوانند.', chunks:['As a result,','more students','study','online'], tip:'حرف ربط نتیجه در ابتدا + کاما؛ قید شیوه آخر می‌ماند'}
  ],
  expand: [
    {kernel:'Prices rose.', steps:[
      {q:'اسم‌سازی کن', opts:['There was a rise in prices.','Prices was rise.'], a:0},
      {q:'چقدر و کِی؟', opts:['There was a sharp rise in prices between 2010 and 2020.','There was in prices a sharp rise between 2010 and 2020.'], a:0},
      {q:'نتیجه‌اش؟', opts:['There was a sharp rise in prices between 2010 and 2020, which reduced household spending.','There was a sharp rise in prices between 2010 and 2020, which household spending reduced.'], a:0},
      {q:'با بازه‌ی زمانی شروع کن و شدت را اضافه کن', opts:['Between 2010 and 2020 there was a sharp rise in prices, which significantly reduced household spending.','Between 2010 and 2020 there was a sharp rise in prices, which reduced significantly household spending.'], a:0}
    ], final:'Between 2010 and 2020 there was a sharp rise in prices, which significantly reduced household spending.'},
    {kernel:'The government built schools.', steps:[
      {q:'مجهولش کن', opts:['Schools were built by the government.','Schools was build by the government.'], a:0},
      {q:'کجا و کِی؟', opts:['Schools were built by the government in rural areas last decade.','Schools were built in rural areas by last decade the government.'], a:0},
      {q:'زمان را به ابتدا ببر و تعداد را بگو', opts:['Over the last decade, hundreds of schools were built by the government in rural areas.','Over the last decade, hundreds of schools was built by the government in rural areas.'], a:0}
    ], final:'Over the last decade, hundreds of schools were built by the government in rural areas.'},
    {kernel:'Students use phones.', steps:[
      {q:'شروع را عوض کن (عبارت قیدی)', opts:['Nowadays, students use phones.','Students nowadays use phones nowadays.'], a:0},
      {q:'برای چه‌کاری؟', opts:['Nowadays, students use phones to access learning materials.','Nowadays, students to access learning materials use phones.'], a:0},
      {q:'دقیق‌ترش کن: چه کسانی و چه زمانی؟', opts:['Nowadays, the majority of students use their phones to access learning materials at any time.','Nowadays, the majority of students use at any time their phones to access learning materials.'], a:0}
    ], final:'Nowadays, the majority of students use their phones to access learning materials at any time.'}
  ],
  combine: [
    {a:'The city has grown quickly.', b:'Public transport cannot meet the demand.', hint:'با so… that یا As a result', answers:['The city has grown so quickly that public transport cannot meet the demand.','The city has grown quickly; as a result, public transport cannot meet the demand.','The city has grown quickly and as a result public transport cannot meet the demand.','Because the city has grown so quickly public transport cannot meet the demand.']},
    {a:'Many people work from home.', b:'This reduces traffic.', hint:'با which — بعد از کاما', answers:['Many people work from home, which reduces traffic.','The fact that many people work from home reduces traffic.','Many people work from home and this reduces traffic.']},
    {a:'The report was published in 2020.', b:'It changed government policy.', hint:'با موصولی کوتاه‌شده (published…)', answers:['The report, published in 2020, changed government policy.','Published in 2020, the report changed government policy.','The report which was published in 2020 changed government policy.']},
    {a:'Fuel prices increased.', b:'Airlines raised ticket prices.', hint:'با اسم‌سازی: The increase in… led to…', answers:['The increase in fuel prices led to higher ticket prices.','The rise in fuel prices led airlines to raise ticket prices.','The increase in fuel prices led airlines to raise ticket prices.','The rise in fuel prices led to higher ticket prices.']}
  ]
},
C1: {
  intro: 'حالا روی «آهنگ» جمله کار می‌کنی: اطلاعِ کهنه اول، اطلاعِ نو آخر (end-focus)؛ تأکید با وارونگی و جمله‌ی شکافته؛ و جمله‌های بلند با یک نکته‌ی روشن.',
  patterns: [
    {name:'جمله‌ی شکافته', formula:'It is/was … that … | What … is …', desc:'برای تأکید روی یک بخش خاص جمله.', slots:[['It was','It is'],['her patience that','the delay that','the new manager who'],['impressed everyone.','caused the problem.','changed the whole plan.']], note:'شکل دوم با What: What I need most is a clear plan. — در اسپیکینگ هم مؤثر است.'},
    {name:'وارونگی برای تأکید', formula:'قید منفی + فعل کمکی + فاعل', desc:'لحن رسمی و ادبی — نه در همه‌جا، فقط برای تأکید.', slots:[['Never','Rarely','Seldom'],['have I seen such a result.','does she make mistakes.','did they finish on time.']], note:'شکل‌های دیگر: Under no circumstances… / No sooner … than… / Not only did they finish early, but they also cut costs.'},
    {name:'اطلاع نو در انتها', formula:'کهنه → نو', desc:'جمله را با چیزی که خواننده می‌داند شروع کن و نکته‌ی تازه را آخر بگذار — متن روان می‌شود.', slots:[['This problem was first reported','This method was introduced','This idea was suggested'],['by a small research team','after years of public pressure','in a leading journal'],['in 2015.','last year.','only recently.']], note:'کلید انسجام (Coherence) در آیلتس.'}
  ],
  chunks: [
    {fa:'این صبرِ او بود که همه را تحت تأثیر قرار داد.', chunks:['It was','her patience','that','impressed everyone'], tip:'جمله‌ی شکافته'},
    {fa:'آنچه بیش از همه لازم دارم یک برنامه‌ی روشن است.', chunks:['What I need most','is','a clear plan'], tip:'در جمله‌ی شکافته، بند What… خودش فاعل است و is بعد از آن می‌آید'},
    {fa:'هرگز چنین نتیجه‌ای ندیده بودم.', chunks:['Never','have I seen','such a result'], tip:'وارونگی: فعل کمکی قبل از فاعل'},
    {fa:'این مسئله نخستین‌بار در سال ۲۰۱۵ توسط یک تیم کوچک گزارش شد.', chunks:['This problem','was first reported','by a small research team','in 2015'], tip:'اطلاع نو در انتها'},
    {fa:'نه‌تنها زودتر تمام کردند، بلکه هزینه‌ها را هم کم کردند.', chunks:['Not only','did they finish early,','but they also','cut costs'], tip:'بعد از Not only وارونگی لازم است و نیمه‌ی دوم با but … also قرینه می‌شود'},
    {fa:'تا رسیدیم، جلسه تمام شده بود.', chunks:['No sooner','had we arrived','than','the meeting ended'], tip:'No sooner با than جفت می‌شود (نه با when)؛ فعل کمکی قبل از فاعل'}
  ],
  expand: [
    {kernel:'The team solved the problem.', steps:[
      {q:'تأکید روی تیم (شکافته)', opts:['It was the team that solved the problem.','It was solved the team the problem.'], a:0},
      {q:'چطور؟', opts:['It was the team that solved the problem by rewriting the whole system.','It was the team by rewriting the whole system that solved the problem.'], a:0},
      {q:'تیم را دقیق‌تر کن و قید را جا بده', opts:['It was a small in-house team that finally solved the problem by rewriting the whole system.','It was a small in-house team that solved finally the problem by rewriting the whole system.'], a:0}
    ], final:'It was a small in-house team that finally solved the problem by rewriting the whole system.'},
    {kernel:'I have never seen such a mistake.', steps:[
      {q:'وارونه کن', opts:['Never have I seen such a mistake.','Never I have seen such a mistake.'], a:0},
      {q:'در چه بافتی؟', opts:['Never have I seen such a mistake in a published report.','Never in a published report I have seen such a mistake.'], a:0},
      {q:'بازه‌ی زمانی را بعد از Never جا بده', opts:['Never in twenty years of teaching have I seen such a mistake in a published report.','Never in twenty years of teaching I have seen such a mistake in a published report.'], a:0}
    ], final:'Never in twenty years of teaching have I seen such a mistake in a published report.'},
    {kernel:'The findings suggest something different.', steps:[
      {q:'نکته‌ی نو را آخر بگذار', opts:['These findings suggest a completely different explanation.','A completely different explanation these findings suggest.'], a:0},
      {q:'با احتیاط علمی بگو', opts:['These findings appear to suggest a completely different explanation.','These findings suggest surely a completely different explanation.'], a:0},
      {q:'با یک عبارت آغازین شروع کن و موضوع را آخر بگذار', opts:['Taken together, these findings appear to suggest a completely different explanation for the decline.','Taken together, these findings appear to suggest for the decline a completely different explanation.'], a:0}
    ], final:'Taken together, these findings appear to suggest a completely different explanation for the decline.'}
  ],
  combine: [
    {a:'The policy was introduced in 2018.', b:'It failed within two years.', c:'The government did not consult experts.', hint:'یک جمله‌ی روان با موصولی و because/without', answers:['The policy, introduced in 2018 without consulting experts, failed within two years.','Introduced in 2018 without expert consultation, the policy failed within two years.','The policy, which was introduced in 2018 without consulting experts, failed within two years.','The policy, introduced in 2018 without expert consultation, failed within two years.']},
    {a:'She apologised immediately.', b:'This surprised everyone.', hint:'با What… — جمله‌ی شکافته', answers:['What surprised everyone was that she apologised immediately.','What surprised everyone was the fact that she apologised immediately.','What surprised everyone was her immediate apology.']},
    {a:'We had just sat down.', b:'The power went off.', hint:'با No sooner … than', answers:['No sooner had we sat down than the power went off.','Hardly had we sat down when the power went off.','No sooner had we sat down than the power cut out.']},
    {a:'The data is incomplete.', b:'We can still draw a conclusion.', hint:'با Even though / Despite', answers:['Even though the data is incomplete we can still draw a conclusion.','Despite the incomplete data we can still draw a conclusion.','Although the data is incomplete we can still draw a conclusion.','Despite the fact that the data is incomplete we can still draw a conclusion.']}
  ]
},
C2: {
  intro: 'در بالاترین سطح، جمله ابزار سبک است: طول را عوض می‌کنی تا ریتم بسازی، جمله‌های موصولی را می‌فشری، و با یک جمله‌ی کوتاه ضربه می‌زنی. جمله‌ی بلند برای استدلال، جمله‌ی کوتاه برای حکم.',
  patterns: [
    {name:'موصولی فشرده', formula:'اسم + ing / p.p + …', desc:'کوتاه‌ترین راه برای افزودن اطلاعات — متن آکادمیک پر از آن است.', slots:[['The results','The figures','The numbers'],['published last year','appearing in the report','collected in 2020'],['contradict earlier work.','have not been checked.','support this view.']], note:'معلوم → ing، مجهول → قسمت سوم'},
    {name:'جمله‌ی موازی', formula:'not only … but also | both … and', desc:'ساختار قرینه — دو بخش باید هم‌شکل باشند.', slots:[['The plan aims','The project aims','The new policy aims'],['not only to cut costs','not only to save time','not only to raise standards'],['but also to improve quality.','but also to reduce waste.','but also to build trust.']], note:'قرینگی را نشکن: to… / to…؛ شکل دیگر: both to write clearly and to speak confidently.'},
    {name:'ضربه‌ی کوتاه بعد از جمله‌ی بلند', formula:'جمله‌ی بلند. جمله‌ی کوتاه.', desc:'تکنیک سبکی: بعد از یک استدلال طولانی، یک جمله‌ی سه‌کلمه‌ای حکم را می‌کوبد.', slots:[['Although the committee spent two years reviewing the evidence and consulting every stakeholder,','After months of negotiation and three rejected drafts,'],['nothing changed.','the deal collapsed.']], note:'در حد یک بار در هر پاراگراف — نه بیشتر.'}
  ],
  chunks: [
    {fa:'دانشجویانی که در طرح شرکت کردند همه داوطلب بودند.', chunks:['The students','taking part in the project','were all volunteers'], tip:'موصولی فشرده با ing'},
    {fa:'نتایجی که سال گذشته منتشر شد با کارهای پیشین در تناقض است.', chunks:['The results','published last year','contradict','earlier work'], tip:'موصولی فشرده با قسمت سوم'},
    {fa:'این طرح نه‌تنها کاهش هزینه، بلکه بهبود کیفیت را هدف گرفته است.', chunks:['The plan aims','not only to cut costs','but also','to improve quality'], tip:'قرینگی: to… / to…'},
    {fa:'با وجود دو سال بررسی و مشورت با همه‌ی ذی‌نفعان، هیچ چیز تغییر نکرد.', chunks:['Although the committee spent two years','reviewing the evidence','and consulting every stakeholder,','nothing changed'], tip:'ضربه‌ی کوتاه در انتها'},
    {fa:'ساختمان‌هایی که در سیل آسیب دیدند هنوز تعمیر نشده‌اند.', chunks:['The buildings','damaged in the flood','have not been repaired'], tip:'موصولی فشرده‌ی مجهول: which were حذف می‌شود و فقط قسمت سوم می‌ماند'},
    {fa:'این سیستم هم داده را ذخیره می‌کند و هم آن را تحلیل می‌کند.', chunks:['The system','both stores data','and','analyses it'], tip:'both و and باید دو چیز هم‌شکل را وصل کنند: stores… / analyses…'}
  ],
  expand: [
    {kernel:'The committee reviewed the evidence.', steps:[
      {q:'مدت و دامنه را اضافه کن', opts:['The committee reviewed the evidence for two years.','The committee for two years the evidence reviewed.'], a:0},
      {q:'با تضاد ببند (ضربه‌ی کوتاه)', opts:['Although the committee reviewed the evidence for two years, nothing changed.','The committee reviewed the evidence for two years nothing changed although.'], a:0},
      {q:'بخش دوم را قرینه اضافه کن', opts:['Although the committee reviewed the evidence for two years and consulted every stakeholder, nothing changed.','Although the committee reviewed the evidence for two years and consulting every stakeholder, nothing changed.'], a:0}
    ], final:'Although the committee reviewed the evidence for two years and consulted every stakeholder, nothing changed.'},
    {kernel:'The study contradicts earlier work.', steps:[
      {q:'موصولی فشرده اضافه کن', opts:['The study, published last year, contradicts earlier work.','The study contradicts published last year earlier work.'], a:0},
      {q:'محدودش کن (hedging)', opts:['The study, published last year, appears to contradict much of the earlier work.','The study, published last year, contradicts definitely all earlier work.'], a:0},
      {q:'محل انتشار و موضوع را اضافه کن', opts:['The study, published last year in a leading journal, appears to contradict much of the earlier work on the subject.','The study, published in a leading journal last year, appears to contradict on the subject much of the earlier work.'], a:0}
    ], final:'The study, published last year in a leading journal, appears to contradict much of the earlier work on the subject.'},
    {kernel:'The course teaches writing.', steps:[
      {q:'قرینه‌سازی کن', opts:['The course teaches both writing and speaking.','The course teaches both writing and to speak.'], a:0},
      {q:'دقیق‌ترش کن', opts:['The course teaches students both to write clearly and to speak confidently.','The course teaches students both writing clearly and to speak confidently.'], a:0},
      {q:'به هر دو بخش یک قید اضافه کن — قرینگی نشکند', opts:['The course teaches students both to write clearly under pressure and to speak confidently in public.','The course teaches students both to write clearly under pressure and speaking confidently in public.'], a:0}
    ], final:'The course teaches students both to write clearly under pressure and to speak confidently in public.'}
  ],
  combine: [
    {a:'The negotiations lasted for months.', b:'Three drafts were rejected.', c:'The deal collapsed.', hint:'یک جمله‌ی بلند + یک ضربه‌ی کوتاه', answers:['After months of negotiation and three rejected drafts, the deal collapsed.','After months of negotiation and three rejected drafts the deal finally collapsed.','Months of negotiation and three rejected drafts later, the deal collapsed.']},
    {a:'The results were published last year.', b:'They contradict earlier work.', hint:'موصولی فشرده با کاما', answers:['The results, published last year, contradict earlier work.','Published last year, the results contradict earlier work.','The results, which were published last year, contradict earlier work.']},
    {a:'The system stores data.', b:'The system analyses data.', hint:'با both … and', answers:['The system both stores and analyses data.','The system both stores data and analyses it.','The system not only stores data but also analyses it.']},
    {a:'Many researchers accepted the theory.', b:'The evidence was weak.', hint:'با despite + اسم‌سازی', answers:['Despite the weakness of the evidence many researchers accepted the theory.','Many researchers accepted the theory despite the weak evidence.','Despite the weak evidence many researchers accepted the theory.','Many researchers accepted the theory despite the weakness of the evidence.']}
  ]
}
};
