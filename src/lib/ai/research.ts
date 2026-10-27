// ============================================================
// Web-grounded generation — Claude + Anthropic's server-side web_search.
// Entry points:
//   - researchCourse   tool + field → course Markdown (lesson notes) the
//                      existing outline → generate-lesson pipeline expands
//   - scanNewTools     daily radar: AI tools launched/updated this week
// ============================================================

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { logAiUsage, type AiFeature } from '@/lib/ai/usage';
import { CATEGORIES } from '@/lib/constants/categories';

const anthropic = new Anthropic();
const MODEL = process.env.CLAUDE_CONTENT_MODEL ?? 'claude-sonnet-4-6';

export type Source = { title: string; url: string };

async function searchAndWrite(
  system: string,
  prompt: string,
  maxSearches: number,
  feature: AiFeature,
  extraTools: Anthropic.Tool[] = []
): Promise<{ text: string; sources: Source[]; content: Anthropic.ContentBlock[] }> {
  const startedAt = Date.now();
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];
  const content: Anthropic.ContentBlock[] = [];
  let usage = { input: 0, output: 0, searches: 0 };

  // Server-tool turns can stop with `pause_turn`; resend to let it finish.
  for (let turn = 0; turn < 3; turn++) {
    const res = await anthropic.messages
      .stream({
        model: MODEL,
        max_tokens: 32_000,
        system,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: maxSearches }, ...extraTools],
        messages,
      })
      .finalMessage();
    content.push(...res.content);
    usage = {
      input: usage.input + res.usage.input_tokens,
      output: usage.output + res.usage.output_tokens,
      searches: usage.searches + (res.usage.server_tool_use?.web_search_requests ?? 0),
    };
    if (res.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: res.content });
  }

  void logAiUsage({
    feature,
    provider: 'anthropic',
    model: MODEL,
    inputTokens: usage.input,
    outputTokens: usage.output,
    webSearches: usage.searches,
    durationMs: Date.now() - startedAt,
  });

  const text = content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const seen = new Map<string, Source>();
  for (const b of content) {
    if (b.type !== 'text') continue;
    for (const c of b.citations ?? []) {
      if (c.type === 'web_search_result_location' && !seen.has(c.url)) {
        seen.set(c.url, { title: c.title ?? c.url, url: c.url });
      }
    }
  }
  return { text, sources: [...seen.values()], content };
}

// ---- Course research ----

export type ResearchInput = {
  tool: string;
  field: string;
  level: string;
  audience?: string;
  lessons?: number;
};

const COURSE_SYSTEM = `You write COURSE SOURCE NOTES for AI Academy, a Georgian e-learning
platform for working professionals. A downstream pipeline splits your output
by lesson headings and expands each lesson into full tutor-led pages, so you
write dense, factual notes — not polished prose.

Research first: use web_search to confirm the tool's CURRENT features, UI,
pricing/plans, limits and launch date. Never rely on memory for anything that
changes. If a fact can't be confirmed, leave it out.

Output: Georgian Markdown only, no preamble, exactly this shape:

# <course title>

## გაკვეთილი 01 — <specific title naming a tool, action or artifact>

**კონცეფცია:** 2–3 sentences.
**მაგალითი:** one concrete end-to-end example for the target field: the exact prompt/clicks, what the tool returns, what the student does with it.
**ვარჯიში:** one 5–10 minute imperative exercise.
**მცდარი წარმოდგენები:**
- 2–3 bullets
**რეალური გამოყენება:**
- 2–3 bullets specific to the field
**ხიდი წინა გაკვეთილიდან:** 1 sentence (omit in lesson 01)
**გასაღები:** one sentence.

Rules: headings use "გაკვეთილი NN — " with zero-padded NN and an em-dash;
no ### subheadings; each lesson ~200–300 words; lessons never repeat content;
keep tool/product names in their original Latin spelling.`;

export async function researchCourse(input: ResearchInput) {
  const prompt = `Tool(s): ${input.tool}
Field / category: ${input.field}
Level: ${input.level}
Audience: ${input.audience || 'working professionals in this field'}
Lessons: ${input.lessons ?? 6}
Today: ${new Date().toISOString().slice(0, 10)}`;
  const { text, sources } = await searchAndWrite(COURSE_SYSTEM, prompt, 8, 'course_research');
  // Drop anything the model said before the course title.
  const start = text.indexOf('# ');
  return { markdown: start >= 0 ? text.slice(start) : text, sources };
}

// ---- Tool radar ----

export type RadarItem = {
  name: string;
  field: string;
  summary: string;
  url: string;
  why: string;
};

const RADAR_SYSTEM = `You scout new AI tools for an academy that teaches AI tools to
professionals. Use web_search to find AI tools that LAUNCHED or shipped a MAJOR
update in the last 7 days. Skip minor patches, rumours and funding news.

When done searching, call report_tools ONCE with at most 15 items.`;

// A typed tool call instead of free-text JSON: the API hands back parsed
// input, so quotes or prose around the answer can't break parsing.
const REPORT_TOOL: Anthropic.Tool = {
  name: 'report_tools',
  description: 'Report the new AI tools found.',
  input_schema: {
    type: 'object',
    properties: {
      tools: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            field: { type: 'string', description: 'One category from the list, exactly as written' },
            summary: { type: 'string', description: 'One sentence, English' },
            url: { type: 'string', description: 'Official page' },
            why: { type: 'string', description: 'One sentence: why professionals in that field should learn it' },
          },
          required: ['name', 'field', 'summary', 'url', 'why'],
        },
      },
    },
    required: ['tools'],
  },
};

export async function scanNewTools(known: string[]): Promise<RadarItem[]> {
  const prompt = `Today: ${new Date().toISOString().slice(0, 10)}
Categories:
${CATEGORIES.map((c) => `- ${c}`).join('\n')}

Already tracked (skip unless a major new version): ${known.slice(0, 200).join(', ') || 'none'}`;
  const { text, content } = await searchAndWrite(RADAR_SYSTEM, prompt, 10, 'tool_radar', [REPORT_TOOL]);
  const call = content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'report_tools'
  );
  if (!call) throw new Error(`Radar: model did not call report_tools. Reply: ${text.slice(0, 300)}`);
  const parsed = (call.input as { tools?: unknown }).tools;
  if (!Array.isArray(parsed)) return [];
  const fields = new Set<string>(CATEGORIES);
  return parsed
    .filter((i): i is RadarItem => typeof i?.name === 'string' && i.name.trim() !== '')
    .map((i) => ({
      name: i.name.trim(),
      field: fields.has(i.field) ? i.field : '',
      summary: String(i.summary ?? ''),
      url: String(i.url ?? ''),
      why: String(i.why ?? ''),
    }));
}
