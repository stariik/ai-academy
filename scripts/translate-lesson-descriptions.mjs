// Backfills lessons.description_en and lessons.learning_objectives_en from the
// Georgian source, one course per Claude call. Only rows whose EN column is
// empty are touched, so it is safe to re-run after new lessons are added.
//
//   node --env-file=.env.local scripts/translate-lesson-descriptions.mjs [--dry-run]

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const MODEL = process.env.CLAUDE_FAST_MODEL ?? 'claude-sonnet-5';
const DRY_RUN = process.argv.includes('--dry-run');
const GEORGIAN = /[Ⴀ-ჿ]/;

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

const isBlank = (value) => !value || (typeof value === 'string' && !value.trim());
const needsObjectives = (lesson) =>
  (lesson.learning_objectives?.length ?? 0) > 0 && !lesson.learning_objectives_en?.length;

function prompt(course, lessons) {
  return `You are a professional Georgian-to-English translator for an online AI course catalog.

Translate each lesson's description and learning objectives from Georgian into natural US English.
- Be faithful: keep the meaning, scope and tone; do not add claims, tools or outcomes.
- Keep product names, protocols and abbreviations as they are (ChatGPT, Claude, API, SEO, ...).
- Use the English lesson title for consistent terminology.
- Return one objectivesEn entry per objective, in the same order. If an objective was
  split into fragments mid-sentence, rejoin them into one entry.
- Output must contain no Georgian characters.

Course: ${course.title_en ?? course.title}

Lessons:
${JSON.stringify(
    lessons.map((lesson) => ({
      id: lesson.id,
      titleEn: lesson.title_en,
      description: lesson.description,
      objectives: lesson.learning_objectives ?? [],
    })),
  )}`;
}

async function translateCourse(anthropic, course, lessons) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 16000,
        tools: [
          {
            name: 'submit_translations',
            description: 'Submit the English lesson descriptions and learning objectives.',
            input_schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                lessons: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      id: { type: 'string' },
                      descriptionEn: { type: 'string' },
                      objectivesEn: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['id', 'descriptionEn', 'objectivesEn'],
                  },
                },
              },
              required: ['lessons'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'submit_translations' },
        messages: [{ role: 'user', content: prompt(course, lessons) }],
      });
      const toolUse = response.content.find(
        (block) => block.type === 'tool_use' && block.name === 'submit_translations',
      );
      if (!toolUse) throw new Error('Response did not call submit_translations.');
      return validate(toolUse.input.lessons, lessons);
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

function validate(translated, lessons) {
  const byId = new Map((translated ?? []).map((lesson) => [lesson.id, lesson]));
  return lessons.map((lesson) => {
    const out = byId.get(lesson.id);
    if (!out) throw new Error(`Missing translation for ${lesson.id}`);
    // Some source objectives were split mid-sentence at a quote when they were
    // generated; the model rejoins those fragments, so fewer is fine.
    const source = lesson.learning_objectives ?? [];
    if (out.objectivesEn.length > source.length || (source.length && !out.objectivesEn.length)) {
      throw new Error(`${lesson.id}: ${out.objectivesEn.length} objectives, expected ${source.length}`);
    }
    for (const text of [out.descriptionEn, ...out.objectivesEn]) {
      if (GEORGIAN.test(text)) throw new Error(`${lesson.id}: translation still contains Georgian`);
    }
    if (lesson.description?.trim() && !out.descriptionEn.trim()) {
      throw new Error(`${lesson.id}: empty descriptionEn`);
    }
    return out;
  });
}

async function main() {
  const db = getDb();
  const [coursesResult, lessonsResult] = await Promise.all([
    db.from('courses').select('id,title,title_en'),
    db
      .from('lessons')
      .select(
        'id,course_id,title_en,description,description_en,learning_objectives,learning_objectives_en',
      ),
  ]);
  if (coursesResult.error) throw coursesResult.error;
  if (lessonsResult.error) throw lessonsResult.error;

  const pending = lessonsResult.data.filter(
    (lesson) =>
      lesson.course_id &&
      ((isBlank(lesson.description_en) && !isBlank(lesson.description)) || needsObjectives(lesson)),
  );
  const courses = coursesResult.data.filter((course) =>
    pending.some((lesson) => lesson.course_id === course.id),
  );
  console.log(`${pending.length} lessons across ${courses.length} courses need translation.`);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let done = 0;
  let failed = 0;
  await mapConcurrent(courses, 4, async (course) => {
    const lessons = pending.filter((lesson) => lesson.course_id === course.id);
    let translated;
    try {
      translated = await translateCourse(anthropic, course, lessons);
    } catch (error) {
      failed += 1;
      console.error(`[fail] ${course.title_en ?? course.title}: ${error.message}`);
      return;
    }

    await mapConcurrent(translated, 8, async (out, index) => {
      const lesson = lessons[index];
      const values = {};
      if (isBlank(lesson.description_en) && !isBlank(lesson.description)) {
        values.description_en = out.descriptionEn.trim();
      }
      if (needsObjectives(lesson)) {
        values.learning_objectives_en = out.objectivesEn.map((text) => text.trim());
      }
      if (DRY_RUN) {
        if (index === 0) console.log(`[dry-run] ${lesson.id}`, values);
        return;
      }
      const { error } = await db.from('lessons').update(values).eq('id', lesson.id);
      if (error) throw new Error(`lessons/${lesson.id}: ${error.message}`);
    });
    done += 1;
    console.log(`[ok] ${done}/${courses.length} ${course.title_en ?? course.title} (${lessons.length})`);
  });

  if (failed) {
    console.error(`${failed} course(s) failed; re-run to retry only the missing rows.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
