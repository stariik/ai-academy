// Storefront card copy per course: [headline, subtitle (why learn it), role (who you become)].
// The card leads with this; the DB title stays the course page H1 and the SEO
// title, because that's what people search for. URLs are unchanged.
// ponytail: static map keyed by courses.id, move to DB columns if admins need to edit it.

type Pitch = [headline: string, subtitle: string, role: string];

export const COURSE_PITCH: Record<string, { ka: Pitch; en: Pitch }> = {
  // ── AI საფუძვლები ──
  'eb2fec58-1b2d-4009-9751-1256204825fd': {
    ka: ['გაიცანი შენი ახალი ასისტენტი', 'მეილი, შეხვედრის შეჯამება, დოკუმენტის გეგმა — ChatGPT-სა და Claude-ს უკვე პირველ დღეს გადასცემ რუტინას', 'AI-ით მომუშავე თანამშრომელი'],
    en: ['Meet Your New Assistant', 'Emails, meeting summaries, document outlines — hand your routine to ChatGPT and Claude from day one', 'AI-Enabled Professional'],
  },
  '9e6a3836-d91e-4130-aecf-5e50b25b4295': {
    ka: ['ChatGPT × Claude × Gemini', 'სამი ყველაზე ძლიერი AI ერთ კურსში და ზუსტი პასუხი კითხვაზე: რომელი რა საქმისთვის', 'AI Power User — ის, ვისაც გუნდში რჩევისთვის მიმართავენ'],
    en: ['ChatGPT × Claude × Gemini', 'The three most powerful AIs in one course — and a clear answer to which one fits which job', 'AI Power User — the one your team asks for advice'],
  },
  '4681709e-b308-475b-948e-1852ff5b9d23': {
    ka: ['AI ყველა კაბინეტში', 'HR, მარკეტინგი, ფინანსები, გაყიდვები, იურიდიული ტექსტები — 14 რეალური სამსახურეობრივი ამოცანა', 'ოფისის AI-სპეციალისტი'],
    en: ['AI in Every Office', 'HR, marketing, finance, sales, legal texts — 14 real workplace tasks', 'Office AI Specialist'],
  },
  '54fb4dc8-3b9c-4006-ba3f-eeaf9d6d3c80': {
    ka: ['მანქანის გონება', 'როგორ სწავლობს AI, სად ცდება და როგორ შეაფასო მისი გადაწყვეტილება — კოდის გარეშე', 'AI-ში გათვითცნობიერებული მენეჯერი'],
    en: ['The Machine Mind', 'How AI learns, where it goes wrong, and how to judge its decisions — no code required', 'AI-Literate Manager'],
  },
  'cd07471e-95a9-42c0-a832-ac648402f89c': {
    ka: ['ChatGPT-ის ტვინის ანატომია', 'ნეირონული ქსელი, Transformer, ტოკენები: გაიგებ, როგორ „ფიქრობს“ AI, და ბიზნეს-გადაწყვეტილებას ცოდნით მიიღებ', 'AI-ს მცოდნე ბიზნეს/პროდუქტ-ლიდერი'],
    en: ['Inside ChatGPT’s Brain', 'Neural networks, Transformers, tokens: learn how AI “thinks” and make business decisions from real knowledge', 'AI-Savvy Business/Product Leader'],
  },

  // ── პრომპტ ინჟინერია ──
  '42abcb4a-a6b2-4855-8a32-d32158f7b952': {
    ka: ['პრომპტის ანბანი', '5 ელემენტი, რომლის შემდეგაც AI ზუსტად გიგებს, და ბოლოს შენი პირადი პრომპტ-ბიბლიოთეკა', 'AI-ს თავდაჯერებული მომხმარებელი'],
    en: ['The ABCs of Prompting', '5 elements that make AI understand you exactly — and your own prompt library at the end', 'Confident AI User'],
  },
  '3def4208-171a-41a1-92b6-7e1b9e7c4a1e': {
    ka: ['AI-ს მართვის ხელოვნება', 'როლი, კონტექსტი, შეზღუდვები, მრავალსაფეხურიანი პრომპტი — ზოგადი იდეიდან მკაფიო ბრიფამდე', 'პრომპტ-ინჟინერი · საწყისი დონე'],
    en: ['The Art of Steering AI', 'Role, context, constraints, multi-step prompts — from a vague idea to a clear brief', 'Prompt Engineer · Entry Level'],
  },
  'e0bc1ba1-b969-46a7-8c11-e2884aabc97c': {
    ka: ['პრომპტების რეცეპტების წიგნი', 'RTF, CO-STAR, CRISPE: მზა ფორმულები ყველა ამოცანისთვის და ჩეკლისტი, რომელიც სუსტ პრომპტს იჭერს', 'პრომპტ-დიზაინერი'],
    en: ['The Prompt Cookbook', 'RTF, CO-STAR, CRISPE: ready-made formulas for every task and a checklist that catches weak prompts', 'Prompt Designer'],
  },
  '76c00eef-665e-45c0-a7a8-df33e7b6a1e1': {
    ka: ['კალამი, რომელიც არასდროს იღლება', 'მეილი, ანგარიში, LinkedIn პოსტი, პრეზენტაცია — სწრაფად და შენი ბრენდის ტონით', 'კონტენტ-ავტორი / კომუნიკაციის სპეციალისტი'],
    en: ['The Pen That Never Tires', 'Emails, reports, LinkedIn posts, presentations — fast and in your brand’s voice', 'Content Writer / Communications Specialist'],
  },
  'b4cf4dd1-b7f8-4196-8d43-7c85a59d0e92': {
    ka: ['ტექნიკური სუპერძალა — კოდის გარეშე', 'Excel ფორმულა, SQL, Python სკრიპტი, CSV-ის ანალიზი: დაწერ ქართულად, AI გადააქცევს ფორმულად', 'მონაცემების ანალიტიკოსი · საწყისი დონე'],
    en: ['Technical Superpowers — No Code Needed', 'Excel formulas, SQL, Python scripts, CSV analysis: describe it in plain words and AI turns it into a formula', 'Data Analyst · Entry Level'],
  },
  '81740784-a939-47a3-a04f-8ce57192d064': {
    ka: ['ვიზუალის რეჟისორი', 'ბრენდის გმირი, პროდუქტის კადრი, კამპანიის ვიზუალები — განათებას, კომპოზიციას და სტილს შენ მართავ', 'AI ვიზუალ-კონტენტის შემქმნელი'],
    en: ['Director of Visuals', 'Brand heroes, product shots, campaign visuals — you control the lighting, composition and style', 'AI Visual Content Creator'],
  },

  // ── AI მარკეტინგი ──
  'cfa4ce55-415d-4997-97bc-fa6364141449': {
    ka: ['მარკეტინგის გუნდი შენს ლეპტოპში', 'პერსონა, კონკურენტები, კონტენტი, რეკლამა, მეილი, A/B ტესტი — და ბოლოს შენი 30-დღიანი გეგმა', 'AI მარკეტოლოგი · საწყისი დონე'],
    en: ['A Marketing Team on Your Laptop', 'Personas, competitors, content, ads, email, A/B tests — and your own 30-day plan at the end', 'AI Marketer · Entry Level'],
  },
  '9a2724c7-b5c7-4daf-bf8d-eaea92501a21': {
    ka: ['კონტენტ-მანქანა', 'ერთი იდეა → Instagram, Facebook, LinkedIn, TikTok. აღარასდროს: „ხვალ რა დავდო?“', 'SMM / კონტენტ-მენეჯერი'],
    en: ['The Content Machine', 'One idea → Instagram, Facebook, LinkedIn, TikTok. Never again: “What do I post tomorrow?”', 'SMM / Content Manager'],
  },
  'f8b74c63-2978-4d82-9c03-baed62126964': {
    ka: ['რეკლამა, რომელიც ციფრებით ლაპარაკობს', 'Meta, Google, TikTok: ჰუკები, UGC სკრიპტები, A/B ვარიაციები და კამპანიის ანალიზი — ბიუჯეტი ტესტზე და არა გამოცნობაზე', 'Performance მარკეტოლოგი · საწყისი დონე'],
    en: ['Ads That Speak in Numbers', 'Meta, Google, TikTok: hooks, UGC scripts, A/B variations and campaign analysis — budget spent on tests, not guesses', 'Performance Marketer · Entry Level'],
  },
  'e173b4c0-cf0c-44f4-963b-d1d34ebacc8f': {
    ka: ['გზა Google-ის პირველი გვერდისკენ', 'საკვანძო სიტყვები, კონტენტ-ბრიფი, შიდა ბმულები, Search Console — სრული SEO პროცესი AI-ით', 'SEO სპეციალისტი'],
    en: ['The Road to Google’s First Page', 'Keywords, content briefs, internal links, Search Console — the full SEO process with AI', 'SEO Specialist'],
  },
  'f31bf824-c0f1-4a68-a17e-3e92a974b978': {
    ka: ['ინბოქსის არქიტექტორი', 'Welcome სერია, მიტოვებული კალათა, სეგმენტაცია Klaviyo-თი — მეილები, რომლებიც თავად იგზავნება', 'Email / CRM მარკეტოლოგი'],
    en: ['Inbox Architect', 'Welcome series, abandoned carts, segmentation with Klaviyo — emails that send themselves', 'Email / CRM Marketer'],
  },
  '66ff4675-229d-430e-8f7d-066853c92084': {
    ka: ['ტექსტი-მაგნიტი', 'AIDA, PAS, BAB: რეკლამა, მეილი და ლენდინგის სათაური, რომელსაც ბოლომდე კითხულობენ', 'კოპირაიტერი'],
    en: ['Magnetic Copy', 'AIDA, PAS, BAB: ads, emails and landing-page headlines people read to the end', 'Copywriter'],
  },

  // ── პროგრამირება AI-ით ──
  '50fde266-a5a8-40da-9f2f-575386648993': {
    ka: ['Vibe Coding: კოდი შენი სიტყვებით', 'შენ აღწერ, AI წერს: ვებგვერდი, ფორმა, სკრიპტი და შენი პირველი მინი-პროექტი — წინასწარი ცოდნის გარეშე', 'AI-ასისტირებული დეველოპერი · დამწყები'],
    en: ['Vibe Coding: Code in Your Own Words', 'You describe, AI writes: a website, a form, a script and your first mini-project — no prior knowledge needed', 'AI-Assisted Developer · Beginner'],
  },
  'e8877f46-cfd7-49d6-bf8d-77cf9e827e43': {
    ka: ['სქრინშოტიდან ცოცხალ საიტამდე', 'v0, bolt, Lovable, Cursor: Hero სექცია, დეშბორდი, ლენდინგი და Next.js გვერდის დეპლოი', 'ფრონტენდ დეველოპერი · Junior-ის უნარები'],
    en: ['From Screenshot to Live Site', 'v0, bolt, Lovable, Cursor: a hero section, a dashboard, a landing page and a deployed Next.js page', 'Front-End Developer · Junior Skills'],
  },
  'e43a9a74-ff93-4059-905a-9b4ac3f8bc0a': {
    ka: ['ძრავის ოთახი', 'API, ავთენტიფიკაცია, ვებჰუკები, რიგები და ტესტები — ის, რაც საიტს კულისებში ამუშავებს', 'ბექენდ დეველოპერი · Junior-ის უნარები'],
    en: ['The Engine Room', 'APIs, authentication, webhooks, queues and tests — what runs a site behind the scenes', 'Back-End Developer · Junior Skills'],
  },
  'cdb1964a-5ea2-46ab-ab5d-75f6c80e264b': {
    ka: ['მონაცემების არქიტექტორი', 'PostgreSQL, Supabase, RLS, ინდექსები და ბექაპი: ბაზა, რომელიც ზრდას უძლებს', 'მონაცემთა ბაზის დეველოპერი · Junior-ის უნარები'],
    en: ['Data Architect', 'PostgreSQL, Supabase, RLS, indexes and backups: a database built to grow', 'Database Developer · Junior Skills'],
  },

  // ── AI ბავშვებისთვის ──
  '603686bf-5d2b-487f-93f5-1868880e7a89': {
    ka: ['პატარა AI მკვლევარი · 6–9 წ.', 'ბავშვი იგებს, რომ AI-ც ცდება: ამოწმებს პასუხს ორი წყაროთი და პირად ინფორმაციას იცავს', 'AI-უსაფრთხოების პატარა ექსპერტი'],
    en: ['Little AI Explorer · Ages 6–9', 'Kids learn that AI makes mistakes too: they check answers against two sources and protect personal information', 'Little AI Safety Expert'],
  },
  '1ecb1aa8-03ce-46be-ab80-0bf426b46541': {
    ka: ['ლაპარაკი მანქანასთან · 6–9 წ.', 'სწორი კითხვის დასმა, ხმოვანი საუბარი და „გაჩერების წესი“ — როდის უნდა დაასრულოს საუბარი', 'ჭკვიანი და ფრთხილი AI-მოსაუბრე'],
    en: ['Talking to Machines · Ages 6–9', 'Asking the right question, voice chat and the “stop rule” — knowing when to end the conversation', 'Smart & Careful AI Talker'],
  },
  'd38bce0b-7594-43b0-96f8-fa187bc91456': {
    ka: ['ჯადოსნური არსებების ფაბრიკა · 8–12 წ.', 'საკუთარი პერსონაჟები, სამკადრიანი კომიქსი და პორტფოლიო — საავტორო უფლებების პატივისცემით', 'პატარა ციფრული ილუსტრატორი'],
    en: ['The Magic Creature Factory · Ages 8–12', 'Original characters, a three-panel comic and a portfolio — with respect for copyright', 'Little Digital Illustrator'],
  },
  'a9b0b43f-3727-4b2a-9fc8-ebc7c15bbda4': {
    ka: ['ისტორია, რომელიც ხმას იღებს · 8–12 წ.', 'გმირი, სამყარო, სიუჟეტი — AI ეხმარება, მაგრამ ავტორის ხმა ბავშვს რჩება. ბოლოს გახმოვანება და სიმღერა', 'პატარა ავტორი'],
    en: ['A Story That Finds Its Voice · Ages 8–12', 'Hero, world, plot — AI helps, but the author’s voice stays the child’s. Finishing with narration and a song', 'Young Author'],
  },
  '22580bf7-2ba3-4956-a1c7-185ff28d1f06': {
    ka: ['Python-ის თავგადასავალი · 10–14 წ.', 'ნამდვილი კოდი, AI დამხმარედ, და ბოლოს — საკუთარი Quiz თამაში, რომელსაც მეგობრებს გაუზიარებს', 'დამწყები პროგრამისტი'],
    en: ['The Python Adventure · Ages 10–14', 'Real code with AI as a helper — and at the end, their own quiz game to share with friends', 'Beginner Programmer'],
  },

  // ── AI შემოქმედება და დიზაინი ──
  '82f9dbc0-1dd2-4ce4-b71d-eabea2578ff7': {
    ka: ['კრეატორის არსენალი', 'ტექსტი, სურათი, ვიდეო, ხმა: რომელი AI რისთვის, რომელი ღირს გადახდად და შენი პირადი AI Stack', 'AI-ით მომუშავე კრეატორი'],
    en: ['The Creator’s Arsenal', 'Text, image, video, voice: which AI for what, which is worth paying for, and your personal AI stack', 'AI-Powered Creator'],
  },
  'd2f930a7-6daa-45d8-b1c9-57f53b4f728e': {
    ka: ['წარმოსახვიდან კადრამდე', 'Midjourney და DALL·E: პრომპტის ანატომია, სტილისა და პერსონაჟის თანმიმდევრულობა და 10-ნამუშევრიანი პორტფოლიო', 'AI ვიზუალ-არტისტი'],
    en: ['From Imagination to Image', 'Midjourney and DALL·E: prompt anatomy, consistent style and characters, and a 10-piece portfolio', 'AI Visual Artist'],
  },
  '87779dee-71e0-49e7-ac15-934261bc0353': {
    ka: ['დიზაინის სტუდია ჯიბეში', 'Canva და Adobe Firefly: პოსტი, ბანერი, ფოტოს რედაქტირება და ბრენდის ერთიანი სტილი', 'გრაფიკული / SMM დიზაინერი · საწყისი დონე'],
    en: ['A Design Studio in Your Pocket', 'Canva and Adobe Firefly: posts, banners, photo editing and one consistent brand style', 'Graphic / SMM Designer · Entry Level'],
  },
  '0c25caf6-ff30-4950-8d5b-f71c7a7eed9c': {
    ka: ['ეკრანების არქიტექტორი', 'Figma, v0, Maze: მომხმარებლის კვლევიდან პროტოტიპამდე და დეველოპერზე გადაცემამდე — ერთი სრული სპრინტი', 'UI/UX დიზაინერი · Junior-ის უნარები'],
    en: ['Screen Architect', 'Figma, v0, Maze: from user research to prototype to developer handoff — one full sprint', 'UI/UX Designer · Junior Skills'],
  },
  'b008957e-bcdb-4aca-93ba-7c134a7b4c81': {
    ka: ['ხმის სტუდია ლეპტოპში', 'Suno ჯინგლი, ElevenLabs გახმოვანება, ხმაურის გაწმენდა და ლიცენზიები — 60-წამიანი სარეკლამო აუდიო', 'აუდიო-კონტენტის / პოდკასტის პროდიუსერი · საწყისი დონე'],
    en: ['A Sound Studio on Your Laptop', 'A Suno jingle, ElevenLabs voice-over, noise cleanup and licensing — a 60-second audio ad', 'Audio Content / Podcast Producer · Entry Level'],
  },

  // ── AI ბიზნესისთვის ──
  'ef80e0f7-2281-40fe-b6c9-69b4d9cb881e': {
    ka: ['ბიზნესის AI-სტარტი', 'იდეის კრიტიკული შემოწმება, კონკურენტის ანალიზი, რისკები — და ბოლოს შენი პირველი AI სამოქმედო გეგმა', 'AI-ცვლილების ინიციატორი გუნდში'],
    en: ['AI Kickstart for Business', 'Stress-test the idea, analyze competitors, map the risks — and finish with your first AI action plan', 'AI Change Champion on Your Team'],
  },
  'fde05b1d-775f-43d2-9ba6-cc0a189ddd60': {
    ka: ['საათები, რომლებიც გიბრუნდება', 'მეილი, კვლევა, შეხვედრები, კვირის პრიორიტეტები: ჯერ შენს სამუშაო დღეს აუდიტს უკეთებ, მერე რუტინას AI-ს გადასცემ', 'AI-ით გაძლიერებული პროფესიონალი'],
    en: ['Win Back Your Hours', 'Email, research, meetings, weekly priorities: audit your workday first, then hand the routine to AI', 'AI-Augmented Professional'],
  },
  '33605902-db0a-4b3a-94b6-ba2216ac8aae': {
    ka: ['რობოტები სამუშაოზე', 'Zapier, Make, n8n: ინვოისი, onboarding, მხარდაჭერა ავტომატურად. ბოლოს 5 ავტომატიზაციის პორტფოლიო', 'ავტომატიზაციის სპეციალისტი (No-code)'],
    en: ['Robots at Work', 'Zapier, Make, n8n: invoices, onboarding and support on autopilot. Finish with a 5-automation portfolio', 'Automation Specialist (No-Code)'],
  },
  '1775b015-4948-4b3a-a1df-e649d99d2780': {
    ka: ['გუნდის მართვის პულტი', 'Notion, ClickUp, Linear, Asana, Jira: სტატუსები, სპრინტები, რისკები და ვადები ერთ სისტემაში', 'AI-ით მომუშავე პროექტ-მენეჯერი'],
    en: ['Team Control Panel', 'Notion, ClickUp, Linear, Asana, Jira: statuses, sprints, risks and deadlines in one system', 'AI-Powered Project Manager'],
  },
  '5cafd49f-f45e-4404-be48-b29d58745af0': {
    ka: ['ტალანტების რადარი', 'ვაკანსიიდან onboarding-მდე: CV-ს სამართლიანი შეფასება, ინტერვიუ, ჩართულობა — მიკერძოებისა და GDPR-ის კონტროლით', 'AI-ით მომუშავე HR / რეკრუტერი'],
    en: ['Talent Radar', 'From job posting to onboarding: fair CV screening, interviews, engagement — with bias and GDPR under control', 'AI-Powered HR / Recruiter'],
  },
  'de5119c6-9ad9-465a-ba87-4f0538b02859': {
    ka: ['CFO-ს მარჯვენა ხელი', 'Cash flow, სცენარები, P&L-ის გადახრები, KPI დეშბორდი და Board-ის ანგარიში — Excel Copilot-ით, Claude-ით და Power BI-ით', 'ფინანსური ანალიტიკოსი'],
    en: ['The CFO’s Right Hand', 'Cash flow, scenarios, P&L variances, KPI dashboards and board reports — with Excel Copilot, Claude and Power BI', 'Financial Analyst'],
  },
  '6e2c14f9-ae63-4d4e-b2f6-be5577f8d1a9': {
    ka: ['გაყიდვების ძრავა', 'ICP, lead list, პერსონალიზებული cold მეილი, CRM, ზარების ანალიზი — lead-იდან deal-მდე', 'Sales Ops / B2B გაყიდვების სპეციალისტი'],
    en: ['The Sales Engine', 'ICP, lead lists, personalized cold emails, CRM, call analysis — from lead to deal', 'Sales Ops / B2B Sales Specialist'],
  },
  '9476783a-173b-42d2-9e12-df50892d451a': {
    ka: ['AI-ს უსაფრთხოების ფარი', 'AI პოლიტიკა, რისკების რეესტრი, EU AI Act, GDPR, ინციდენტის გეგმა — და 90-დღიანი სამოქმედო გეგმა', 'AI Governance / Compliance სპეციალისტი'],
    en: ['The AI Safety Shield', 'AI policy, risk register, EU AI Act, GDPR, incident plan — and a 90-day action plan', 'AI Governance / Compliance Specialist'],
  },
};
