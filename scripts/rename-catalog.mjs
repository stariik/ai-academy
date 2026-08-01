import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_DIR = path.join(process.cwd(), 'scripts', '.catalog-renames');
const PLAN_PATH = path.join(ARTIFACT_DIR, 'plan.json');
const MODEL = process.env.CLAUDE_FAST_MODEL ?? 'claude-sonnet-4-6';

const CATEGORY_RENAMES = [
  {
    oldKa: 'AI საფუძვლები',
    titleKa: 'ხელოვნური ინტელექტის საფუძვლები',
    titleEn: 'AI Fundamentals',
  },
  {
    oldKa: 'AI პრომპტის ინჟინერია',
    titleKa: 'პრომპტ ინჟინერია',
    titleEn: 'Prompt Engineering',
  },
  {
    oldKa: 'AI მარკეტინგი',
    titleKa: 'AI მარკეტინგი',
    titleEn: 'AI Marketing',
  },
  {
    oldKa: 'AI და კიბერუსაფრთხოება',
    titleKa: 'AI და კიბერუსაფრთხოება',
    titleEn: 'AI & Cybersecurity',
  },
  {
    oldKa: 'AI კოდინგი და პროგრამირება',
    titleKa: 'პროგრამირება AI-ით',
    titleEn: 'AI Coding & Development',
  },
  {
    oldKa: 'AI ბავშვებისთვის',
    titleKa: 'AI ბავშვებისთვის',
    titleEn: 'AI for Kids',
  },
  {
    oldKa: 'AI შემოქმედებისთვის და დიზაინი',
    titleKa: 'AI შემოქმედება და დიზაინი',
    titleEn: 'AI Creativity & Design',
  },
  {
    oldKa: 'AI აგენტები და ჩატბოტების არქიტექტურა',
    titleKa: 'AI აგენტები და ჩატბოტები',
    titleEn: 'AI Agents & Chatbots',
  },
  {
    oldKa: 'AI ბიზნეს-სტრატეგია და სამუშაო პროცესები',
    titleKa: 'AI ბიზნესისა და პროდუქტიულობისთვის',
    titleEn: 'AI for Business & Productivity',
  },
];

const COURSE_RENAMES = [
  {
    id: '9e6a3836-d91e-4130-aecf-5e50b25b4295',
    titleKa: 'AI ინსტრუმენტები პრაქტიკაში: ChatGPT, Claude და Gemini',
    titleEn: 'AI Tools in Practice: ChatGPT, Claude & Gemini',
  },
  {
    id: '4681709e-b308-475b-948e-1852ff5b9d23',
    titleKa: 'AI ყოველდღიურ ცხოვრებასა და სამსახურში',
    titleEn: 'AI for Everyday Life & Work',
  },
  {
    id: 'eb2fec58-1b2d-4009-9751-1256204825fd',
    titleKa: 'რა არის AI? მარტივი შესავალი',
    titleEn: 'What Is AI? A Beginner’s Guide',
  },
  {
    id: '54fb4dc8-3b9c-4006-ba3f-eeaf9d6d3c80',
    titleKa: 'მანქანური სწავლების საფუძვლები',
    titleEn: 'Machine Learning Fundamentals',
  },
  {
    id: 'cd07471e-95a9-42c0-a832-ac648402f89c',
    titleKa: 'ღრმა სწავლების საფუძვლები',
    titleEn: 'Deep Learning Fundamentals',
  },
  {
    id: '3def4208-171a-41a1-92b6-7e1b9e7c4a1e',
    titleKa: 'პრომპტ ინჟინერია: საფუძვლებიდან პრაქტიკამდე',
    titleEn: 'Prompt Engineering: From Fundamentals to Practice',
  },
  {
    id: 'e0bc1ba1-b969-46a7-8c11-e2884aabc97c',
    titleKa: 'ეფექტური პრომპტის სტრუქტურები და ფრეიმვორქები',
    titleEn: 'Effective Prompt Structures & Frameworks',
  },
  {
    id: '42abcb4a-a6b2-4855-8a32-d32158f7b952',
    titleKa: 'პირველი ეფექტური პრომპტების შექმნა',
    titleEn: 'Write Your First Effective Prompts',
  },
  {
    id: '76c00eef-665e-45c0-a7a8-df33e7b6a1e1',
    titleKa: 'AI პრომპტები ტექსტისა და წერისთვის',
    titleEn: 'AI Prompts for Writing & Text',
  },
  {
    id: 'b4cf4dd1-b7f8-4196-8d43-7c85a59d0e92',
    titleKa: 'AI პრომპტები კოდისა და ტექნიკური ამოცანებისთვის',
    titleEn: 'AI Prompts for Coding & Technical Tasks',
  },
  {
    id: '81740784-a939-47a3-a04f-8ce57192d064',
    titleKa: 'AI პრომპტები სურათებისა და ვიზუალური კონტენტისთვის',
    titleEn: 'AI Prompts for Images & Visual Content',
  },
  {
    id: '66ff4675-229d-430e-8f7d-066853c92084',
    titleKa: 'AI კოპირაიტინგი: რეკლამა, ელფოსტა და ლენდინგები',
    titleEn: 'AI Copywriting for Ads, Emails & Landing Pages',
  },
  {
    id: 'f31bf824-c0f1-4a68-a17e-3e92a974b978',
    titleKa: 'ელფოსტის მარკეტინგის ავტომატიზაცია AI-ით',
    titleEn: 'AI Email Marketing Automation',
  },
  {
    id: 'e173b4c0-cf0c-44f4-963b-d1d34ebacc8f',
    titleKa: 'SEO AI-ით: კვლევა, კონტენტი და ოპტიმიზაცია',
    titleEn: 'SEO with AI: Research, Content & Optimization',
  },
  {
    id: 'f8b74c63-2978-4d82-9c03-baed62126964',
    titleKa: 'ფასიანი რეკლამა AI-ით: Meta, Google და TikTok',
    titleEn: 'AI for Paid Ads: Meta, Google & TikTok',
  },
  {
    id: 'cfa4ce55-415d-4997-97bc-fa6364141449',
    titleKa: 'AI მარკეტინგის საფუძვლები',
    titleEn: 'AI Marketing Fundamentals',
  },
  {
    id: '9a2724c7-b5c7-4daf-bf8d-eaea92501a21',
    titleKa: 'სოციალური მედიის კონტენტი AI-ით',
    titleEn: 'AI Content Creation for Social Media',
  },
  {
    id: 'e8877f46-cfd7-49d6-bf8d-77cf9e827e43',
    titleKa: 'ფრონტენდ დეველოპმენტი AI-ით',
    titleEn: 'AI-Powered Front-End Development',
  },
  {
    id: '50fde266-a5a8-40da-9f2f-575386648993',
    titleKa: 'Vibe Coding: პროგრამირება AI-ით ნულიდან',
    titleEn: 'Vibe Coding for Beginners: Build with AI',
  },
  {
    id: 'cdb1964a-5ea2-46ab-ab5d-75f6c80e264b',
    titleKa: 'მონაცემთა ბაზების დიზაინი AI-ით',
    titleEn: 'AI-Assisted Database Design',
  },
  {
    id: 'e43a9a74-ff93-4059-905a-9b4ac3f8bc0a',
    titleKa: 'ბექენდ და API დეველოპმენტი AI-ით',
    titleEn: 'AI-Assisted Back-End & API Development',
  },
  {
    id: '603686bf-5d2b-487f-93f5-1868880e7a89',
    titleKa: 'რა არის AI? 6–9 წლის ბავშვებისთვის',
    titleEn: 'What Is AI? For Ages 6–9',
  },
  {
    id: '1ecb1aa8-03ce-46be-ab80-0bf426b46541',
    titleKa: 'საუბარი AI-სთან: ჩატბოტები 6–9 წლისთვის',
    titleEn: 'Talk to AI: Chatbots for Ages 6–9',
  },
  {
    id: 'd38bce0b-7594-43b0-96f8-fa187bc91456',
    titleKa: 'ხატვა და AI ხელოვნება 8–12 წლისთვის',
    titleEn: 'AI Art & Drawing for Ages 8–12',
  },
  {
    id: '22580bf7-2ba3-4956-a1c7-185ff28d1f06',
    titleKa: 'პროგრამირება AI-სთან ერთად 10–14 წლისთვის',
    titleEn: 'Coding with AI for Ages 10–14',
  },
  {
    id: 'a9b0b43f-3727-4b2a-9fc8-ebc7c15bbda4',
    titleKa: 'ისტორიების შექმნა AI-ით 8–12 წლისთვის',
    titleEn: 'AI Storytelling for Ages 8–12',
  },
  {
    id: '82f9dbc0-1dd2-4ce4-b71d-eabea2578ff7',
    titleKa: 'AI ინსტრუმენტები შემოქმედებისთვის',
    titleEn: 'Essential AI Tools for Creators',
  },
  {
    id: 'd2f930a7-6daa-45d8-b1c9-57f53b4f728e',
    titleKa: 'AI სურათების გენერაცია: Midjourney და DALL·E',
    titleEn: 'AI Image Generation with Midjourney & DALL·E',
  },
  {
    id: '87779dee-71e0-49e7-ac15-934261bc0353',
    titleKa: 'გრაფიკული დიზაინი AI-ით: Canva და Adobe Firefly',
    titleEn: 'AI Graphic Design with Canva & Adobe Firefly',
  },
  {
    id: 'b008957e-bcdb-4aca-93ba-7c134a7b4c81',
    titleKa: 'მუსიკისა და აუდიოს შექმნა AI-ით',
    titleEn: 'AI Music & Audio Production',
  },
  {
    id: '0c25caf6-ff30-4950-8d5b-f71c7a7eed9c',
    titleKa: 'UI/UX დიზაინი AI-ით: Figma და AI ინსტრუმენტები',
    titleEn: 'AI-Powered UI/UX Design with Figma',
  },
  {
    id: 'ef80e0f7-2281-40fe-b6c9-69b4d9cb881e',
    titleKa: 'AI ბიზნესისთვის: საიდან დავიწყოთ',
    titleEn: 'AI for Business: Where to Start',
  },
  {
    id: 'fde05b1d-775f-43d2-9ba6-cc0a189ddd60',
    titleKa: 'პროდუქტიულობა AI-ით: ინსტრუმენტები ყოველდღიური სამუშაოსთვის',
    titleEn: 'AI Productivity Tools for Daily Work',
  },
  {
    id: 'de5119c6-9ad9-465a-ba87-4f0538b02859',
    titleKa: 'ფინანსური პროგნოზირება და ანგარიშგება AI-ით',
    titleEn: 'AI for Financial Forecasting & Reporting',
  },
  {
    id: '5cafd49f-f45e-4404-be48-b29d58745af0',
    titleKa: 'AI ადამიანური რესურსებისა და ტალანტების მართვაში',
    titleEn: 'AI for HR & Talent Management',
  },
  {
    id: '1775b015-4948-4b3a-a1df-e649d99d2780',
    titleKa: 'AI პროექტებისა და გუნდების მართვისთვის',
    titleEn: 'AI for Project Management & Teams',
  },
  {
    id: '33605902-db0a-4b3a-94b6-ba2216ac8aae',
    titleKa: 'ბიზნეს-პროცესების ავტომატიზაცია AI-ით',
    titleEn: 'Automate Business Workflows with AI',
  },
  {
    id: '6e2c14f9-ae63-4d4e-b2f6-be5577f8d1a9',
    titleKa: 'გაყიდვებისა და CRM-ის ოპტიმიზაცია AI-ით',
    titleEn: 'AI for Sales & CRM Optimization',
  },
  {
    id: '9476783a-173b-42d2-9e12-df50892d451a',
    titleKa: 'AI მმართველობა, რისკები და შესაბამისობა',
    titleEn: 'AI Governance, Risk & Compliance',
  },
];

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials are missing.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function mapConcurrent(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchCatalog(db) {
  const [coursesResult, lessonsResult] = await Promise.all([
    db
      .from('courses')
      .select('id,title,title_en,description,description_en,tags,created_at')
      .order('created_at'),
    db
      .from('lessons')
      .select(
        'id,course_id,title,title_en,description,description_en,position_in_course,status',
      )
      .order('position_in_course'),
  ]);
  if (coursesResult.error) throw coursesResult.error;
  if (lessonsResult.error) throw lessonsResult.error;
  return { courses: coursesResult.data, lessons: lessonsResult.data };
}

function lessonPrompt(course, lessons) {
  return `You are a bilingual Georgian-English curriculum editor and ethical education marketer.

Rename every supplied lesson and write one short, useful course description in both languages.
Return JSON only in this exact shape:
{"descriptionKa":"...","descriptionEn":"...","lessons":[{"id":"unchanged","titleKa":"...","titleEn":"..."}]}

Naming requirements:
- Preserve each lesson's actual subject and learning sequence. Do not invent tools, claims, or outcomes.
- Georgian must be idiomatic, grammatically correct modern Georgian.
- Use Georgian forms for ordinary terms: პრომპტი, ელფოსტა, სამუშაო პროცესი, სამოქმედო გეგმა, დეშბორდი, კოდის გამართვა, მმართველობა, ანგარიშგება, შეჯამება.
- Keep only established product names, protocols, and abbreviations in Latin script, including ChatGPT, Claude, Gemini, Midjourney, DALL·E, Canva, Adobe Firefly, Figma, API, SEO, CRM, GDPR, GRC, DPIA, UI/UX, SQL, Python, JavaScript, Copilot Studio, and Human-in-the-Loop.
- English must be a faithful natural equivalent in US English and sentence case.
- Optimize for human scanning and genuine search intent: put the concrete concept, tool, or task early.
- Aim for 4–9 words and keep each title under 78 characters when possible.
- Prefer a concrete outcome or concept over hype.
- No clickbait, unverifiable promises, keyword stuffing, lesson numbers, trailing periods, or repeated boilerplate such as "practical guide", "masterclass", "fundamentals", or "for effective results".
- Do not put quotation marks or quoted example phrases inside a title; describe the skill instead.
- Use a colon only when it materially improves clarity.
- Every title must be distinct within its course.

Description requirements:
- Write 1–2 natural, specific sentences that accurately summarize this course.
- State what the learner will understand or create; no hype or ranking claims.
- Include the main search phrase once, naturally.
- Aim for 120–190 characters per language and never exceed 240 characters.

Curated course names:
${JSON.stringify({ titleKa: course.titleKa, titleEn: course.titleEn })}

Current course record:
${JSON.stringify(course.current)}

Lessons:
${JSON.stringify(
    lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      position: lesson.position_in_course,
    })),
  )}`;
}

async function generateCoursePlan(anthropic, course, lessons) {
  let response;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 7000,
        temperature: 0.15,
        tools: [
          {
            name: 'submit_catalog_names',
            description: 'Submit the final bilingual course description and lesson names.',
            input_schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                descriptionKa: { type: 'string' },
                descriptionEn: { type: 'string' },
                lessons: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      id: { type: 'string' },
                      titleKa: { type: 'string' },
                      titleEn: { type: 'string' },
                    },
                    required: ['id', 'titleKa', 'titleEn'],
                  },
                },
              },
              required: ['descriptionKa', 'descriptionEn', 'lessons'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'submit_catalog_names' },
        messages: [{ role: 'user', content: lessonPrompt(course, lessons) }],
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  if (!response) throw lastError ?? new Error('No naming response received.');
  const toolUse = response.content.find(
    (block) => block.type === 'tool_use' && block.name === 'submit_catalog_names',
  );
  if (!toolUse || toolUse.type !== 'tool_use') {
    const raw = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');
    throw new Error(
      `The naming response did not call submit_catalog_names: ${raw.slice(0, 300)}`,
    );
  }
  const generated = toolUse.input;
  return {
    id: course.id,
    titleKa: course.titleKa,
    titleEn: course.titleEn,
    descriptionKa: generated.descriptionKa,
    descriptionEn: generated.descriptionEn,
    lessons: generated.lessons,
  };
}

function normalizeTitle(value) {
  return value.trim().toLocaleLowerCase('ka-GE').replace(/\s+/g, ' ');
}

function normalizeGeneratedCourse(generated, curated, sourceLessons) {
  let generatedLessons = generated.lessons;
  if (typeof generatedLessons === 'string') {
    generatedLessons = JSON.parse(generatedLessons);
  }
  if (!Array.isArray(generatedLessons)) {
    throw new Error(`${curated.id} returned lessons in an invalid format.`);
  }
  if (generatedLessons.length !== sourceLessons.length) {
    throw new Error(
      `${curated.id} returned ${generatedLessons.length} lessons; expected ${sourceLessons.length}.`,
    );
  }
  return {
    ...generated,
    id: curated.id,
    titleKa: curated.titleKa,
    titleEn: curated.titleEn,
    lessons: generatedLessons.map((lesson, index) => ({
      ...lesson,
      // The source order is authoritative. This also repairs occasional
      // one-character ID transcription errors without changing the title's
      // association with its lesson.
      id: sourceLessons[index].id,
    })),
  };
}

function validatePlan(plan, catalog) {
  const errors = [];
  const expectedCourseIds = new Set(catalog.courses.map((course) => course.id));
  const expectedLessonIds = new Set(catalog.lessons.map((lesson) => lesson.id));
  const actualCourseIds = new Set(plan.courses.map((course) => course.id));
  const actualLessons = plan.courses.flatMap((course) =>
    Array.isArray(course.lessons) ? course.lessons : [],
  );
  const actualLessonIds = new Set(actualLessons.map((lesson) => lesson.id));

  if (expectedCourseIds.size !== COURSE_RENAMES.length) {
    errors.push(
      `The database has ${expectedCourseIds.size} courses, but the curated map has ${COURSE_RENAMES.length}.`,
    );
  }
  for (const id of expectedCourseIds) {
    if (!actualCourseIds.has(id)) errors.push(`Missing course ${id}.`);
  }
  for (const id of expectedLessonIds) {
    if (!actualLessonIds.has(id)) errors.push(`Missing lesson ${id}.`);
  }
  for (const id of actualLessonIds) {
    if (!expectedLessonIds.has(id)) errors.push(`Unexpected lesson ${id}.`);
  }
  if (actualLessons.length !== actualLessonIds.size) {
    errors.push('The plan contains duplicate lesson IDs.');
  }

  const hasGeorgian = /[\u10A0-\u10FF]/;
  for (const course of plan.courses) {
    for (const field of ['titleKa', 'titleEn', 'descriptionKa', 'descriptionEn']) {
      if (typeof course[field] !== 'string' || !course[field].trim()) {
        errors.push(`${course.id} has an empty ${field}.`);
      }
    }
    if (!hasGeorgian.test(course.titleKa)) {
      errors.push(`${course.id} has no Georgian text in titleKa.`);
    }
    if (hasGeorgian.test(course.titleEn)) {
      errors.push(`${course.id} has Georgian text in titleEn.`);
    }
    if (!Array.isArray(course.lessons)) {
      errors.push(`${course.id} has an invalid lessons value.`);
      continue;
    }

    const kaTitles = new Set();
    const enTitles = new Set();
    for (const lesson of course.lessons) {
      let validTitles = true;
      for (const field of ['titleKa', 'titleEn']) {
        if (typeof lesson[field] !== 'string' || !lesson[field].trim()) {
          errors.push(`${lesson.id} has an empty ${field}.`);
          validTitles = false;
          continue;
        }
        if (lesson[field].length > 105) {
          errors.push(`${lesson.id} ${field} exceeds 105 characters.`);
        }
      }
      if (!validTitles) continue;
      if (!hasGeorgian.test(lesson.titleKa)) {
        errors.push(`${lesson.id} has no Georgian text in titleKa.`);
      }
      if (hasGeorgian.test(lesson.titleEn)) {
        errors.push(`${lesson.id} has Georgian text in titleEn.`);
      }
      const ka = normalizeTitle(lesson.titleKa);
      const en = normalizeTitle(lesson.titleEn);
      if (kaTitles.has(ka)) errors.push(`${course.id} repeats Georgian title "${lesson.titleKa}".`);
      if (enTitles.has(en)) errors.push(`${course.id} repeats English title "${lesson.titleEn}".`);
      kaTitles.add(ka);
      enTitles.add(en);
    }
  }

  if (errors.length) {
    const shown = errors.slice(0, 80);
    const remainder =
      errors.length > shown.length ? `\n- …and ${errors.length - shown.length} more.` : '';
    throw new Error(`Catalog plan validation failed:\n- ${shown.join('\n- ')}${remainder}`);
  }
}

async function generatePlan() {
  const db = getDb();
  const catalog = await fetchCatalog(db);
  const coursesById = new Map(catalog.courses.map((course) => [course.id, course]));
  const missingCurated = COURSE_RENAMES.filter((course) => !coursesById.has(course.id));
  if (missingCurated.length) {
    throw new Error(`Curated course IDs not found: ${missingCurated.map((c) => c.id).join(', ')}`);
  }
  if (catalog.courses.length !== COURSE_RENAMES.length) {
    throw new Error(
      `Refusing partial generation: found ${catalog.courses.length} courses and ${COURSE_RENAMES.length} curated names.`,
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  await mkdir(ARTIFACT_DIR, { recursive: true });
  let completed = 0;
  const courses = await mapConcurrent(COURSE_RENAMES, 3, async (curated) => {
    const lessons = catalog.lessons.filter((lesson) => lesson.course_id === curated.id);
    const cachePath = path.join(ARTIFACT_DIR, `course-${curated.id}.json`);
    let generated;
    try {
      generated = JSON.parse(await readFile(cachePath, 'utf8'));
    } catch (error) {
      if (error?.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
      generated = await generateCoursePlan(
        anthropic,
        { ...curated, current: coursesById.get(curated.id) },
        lessons,
      );
    }
    generated = normalizeGeneratedCourse(generated, curated, lessons);
    await writeFile(cachePath, `${JSON.stringify(generated, null, 2)}\n`, 'utf8');
    completed += 1;
    console.log(`[generate] ${completed}/${COURSE_RENAMES.length} ${curated.titleEn}`);
    return generated;
  });

  const plan = {
    version: 1,
    generatedAt: new Date().toISOString(),
    model: MODEL,
    categories: CATEGORY_RENAMES,
    courses,
  };
  validatePlan(plan, catalog);
  await writeFile(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  console.log(
    `[generate] Valid plan saved: ${plan.courses.length} courses, ${catalog.lessons.length} lessons.`,
  );
  console.log(`[generate] ${PLAN_PATH}`);
}

async function updateOne(db, table, id, values) {
  const { error } = await db.from(table).update(values).eq('id', id);
  if (error) throw new Error(`${table}/${id}: ${error.message}`);
}

async function restoreSnapshot(db, snapshot) {
  await mapConcurrent(snapshot.courses, 8, (course) =>
    updateOne(db, 'courses', course.id, {
      title: course.title,
      title_en: course.title_en,
      description: course.description,
      description_en: course.description_en,
      tags: course.tags,
    }),
  );
  await mapConcurrent(snapshot.lessons, 12, (lesson) =>
    updateOne(db, 'lessons', lesson.id, {
      title: lesson.title,
      title_en: lesson.title_en,
    }),
  );
}

async function applyPlan() {
  const db = getDb();
  const [planRaw, catalog] = await Promise.all([
    readFile(PLAN_PATH, 'utf8'),
    fetchCatalog(db),
  ]);
  const plan = JSON.parse(planRaw);
  validatePlan(plan, catalog);

  await mkdir(ARTIFACT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(ARTIFACT_DIR, `backup-${stamp}.json`);
  await writeFile(
    backupPath,
    `${JSON.stringify({ version: 1, createdAt: new Date().toISOString(), ...catalog }, null, 2)}\n`,
    'utf8',
  );
  console.log(`[apply] Rollback snapshot saved: ${backupPath}`);

  const categoriesByOld = new Map(
    plan.categories.map((category) => [category.oldKa, category]),
  );
  const categoriesByNew = new Map(
    plan.categories.map((category) => [category.titleKa, category]),
  );
  const coursePlanById = new Map(plan.courses.map((course) => [course.id, course]));
  try {
    await mapConcurrent(catalog.courses, 8, (current) => {
      const course = coursePlanById.get(current.id);
      const tags = [
        ...new Set(
          current.tags.flatMap((tag) => {
            const category = categoriesByOld.get(tag) ?? categoriesByNew.get(tag);
            // Keep the previous canonical tag as a hidden compatibility alias.
            // The currently deployed app recognizes the old value; the new build
            // recognizes the new value. This makes the database rename safe
            // across a rolling deployment without changing displayed names.
            return category ? [category.titleKa, category.oldKa] : [tag];
          }),
        ),
      ];
      return updateOne(db, 'courses', current.id, {
        title: course.titleKa,
        title_en: course.titleEn,
        description: course.descriptionKa,
        description_en: course.descriptionEn,
        tags,
      });
    });
    console.log(`[apply] Updated ${catalog.courses.length} courses and their category tags.`);

    const lessonPlans = plan.courses.flatMap((course) => course.lessons);
    await mapConcurrent(lessonPlans, 12, (lesson) =>
      updateOne(db, 'lessons', lesson.id, {
        title: lesson.titleKa,
        title_en: lesson.titleEn,
      }),
    );
    console.log(`[apply] Updated ${lessonPlans.length} bilingual lesson titles.`);
    console.log(`[apply] Complete. Roll back with: node scripts/rename-catalog.mjs --rollback "${backupPath}"`);
  } catch (error) {
    console.error(`[apply] Update failed; restoring ${backupPath}`);
    await restoreSnapshot(db, catalog);
    throw error;
  }
}

async function rollback(snapshotPath) {
  if (!snapshotPath) throw new Error('--rollback requires a snapshot path.');
  const db = getDb();
  const snapshot = JSON.parse(await readFile(path.resolve(snapshotPath), 'utf8'));
  if (!Array.isArray(snapshot.courses) || !Array.isArray(snapshot.lessons)) {
    throw new Error('Invalid catalog snapshot.');
  }
  await restoreSnapshot(db, snapshot);
  console.log(
    `[rollback] Restored ${snapshot.courses.length} courses and ${snapshot.lessons.length} lessons.`,
  );
}

const [command, argument] = process.argv.slice(2);
if (command === '--generate') {
  await generatePlan();
} else if (command === '--apply') {
  await applyPlan();
} else if (command === '--rollback') {
  await rollback(argument);
} else {
  console.log(`Usage:
  node scripts/rename-catalog.mjs --generate
  node scripts/rename-catalog.mjs --apply
  node scripts/rename-catalog.mjs --rollback <snapshot-path>`);
}
