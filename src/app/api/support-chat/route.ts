// ============================================================
// Support Chat API Route - General Support Assistant
// POST /api/support-chat
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { streamChat, type TutorLocale } from '@/lib/ai/claude';

export const runtime = 'nodejs';

function coerceLocale(raw: unknown): TutorLocale {
  return raw === 'en' ? 'en' : 'ka';
}

const SYSTEM_PROMPTS = {
  en: `You are Walle, a friendly and helpful AI support assistant for an AI Academy learning platform.

Your role is to:
- Help users understand our courses and what they'll learn
- Guide new users on how to get started
- Answer questions about the platform features
- Provide support for any issues users encounter
- Be encouraging and supportive

Keep your responses:
- Friendly and conversational
- Concise but helpful (2-3 sentences when possible)
- Clear and easy to understand
- Encouraging and positive

If asked about courses, you can explain that we offer AI courses designed to help people learn practical AI skills.
If you don't know something specific, be honest and offer to help in other ways.`,

  ka: `შენ ხარ Walle, მეგობრული და სასარგებლო AI ასისტენტი AI აკადემიის სასწავლო პლატფორმისთვის.

შენი როლია:
- დაეხმარო მომხმარებლებს გაიგონ ჩვენი კურსები და რას ისწავლიან
- დაამხარი ახალი მომხმარებლები როგორ დაიწყონ
- უპასუხო კითხვებს პლატფორმის ფუნქციებზე
- მხარი დაუჭირო მომხმარებლებს პრობლემებში
- იყო წამახალისებელი და მხარდამჭერი

შენი პასუხები უნდა იყოს:
- მეგობრული და საუბრისეული
- მოკლე მაგრამ სასარგებლო (2-3 წინადადება როდესაც შესაძლებელია)
- მკაფიო და გასაგები
- წამახალისებელი და პოზიტიური

თუ შეკითხავენ კურსებზე, ახსენი რომ ჩვენ გვაქვს AI კურსები რომლებიც დაეხმარება ადამიანებს AI-ის პრაქტიკული უნარების სწავლაში.
თუ რაღაცას არ იცი, იყავ გულწრფელი და შესთავაზე დახმარება სხვა გზით.`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, locale: rawLocale } = body as {
      message: string;
      locale?: string;
    };
    const locale = coerceLocale(rawLocale);

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[locale];

    const claudeMessages = [
      {
        role: 'user' as const,
        content: message.trim(),
      },
    ];

    const usageMeta = {
      feature: 'support_chat' as const,
      sessionId: null,
      lessonId: null,
      locale,
    };

    // Stream the response
    let fullResponse = '';

    for await (const chunk of streamChat(claudeMessages, systemPrompt, { enabled: false }, usageMeta)) {
      fullResponse += chunk;
    }

    return NextResponse.json({ reply: fullResponse });
  } catch (err) {
    console.error('Support chat API error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
