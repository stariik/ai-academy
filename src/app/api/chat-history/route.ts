// ============================================================
// API: GET /api/chat-history?lessonId=xxx - Load chat messages
//       POST /api/chat-history - Save chat messages
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getChatHistory, upsertChatHistory, getPageChatHistory } from '@/lib/supabase/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const pageNumberStr = searchParams.get('pageNumber');

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
    }

    const { sessionId } = await getSession();
    const supabase = await createClient();

    let history;
    if (pageNumberStr !== null) {
      const pageNumber = parseInt(pageNumberStr, 10);
      history = await getPageChatHistory(supabase, sessionId, lessonId, pageNumber);
    } else {
      history = await getChatHistory(supabase, sessionId, lessonId);
    }

    return NextResponse.json({ messages: history?.messages ?? [] });
  } catch (err) {
    console.error('Chat history GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, messages } = body as {
      lessonId: string;
      messages: { id: string; role: string; content: string; timestamp: string }[];
    };

    if (!lessonId || !messages) {
      return NextResponse.json({ error: 'lessonId and messages are required' }, { status: 400 });
    }

    const { sessionId } = await getSession();
    const supabase = await createClient();
    await upsertChatHistory(supabase, sessionId, lessonId, messages);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Chat history POST error:', err);
    return NextResponse.json({ error: 'Failed to save chat history' }, { status: 500 });
  }
}
