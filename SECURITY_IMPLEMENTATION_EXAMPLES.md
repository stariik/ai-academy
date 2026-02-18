# Security Implementation Examples

This document provides complete, production-ready examples for implementing the security middleware in your Next.js API routes.

---

## Example 1: File Upload API Route (`/api/analyze`)

This route handles PDF/DOCX uploads for AI analysis with Gemini.

### File: `src/app/api/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  validateUploadedFile,
  createRateLimiter,
  getClientIdentifier,
  validateApiKeys,
} from '@/lib/security';
import { extractText } from '@/lib/document-parser';

// Rate limiter: 5 uploads per 15 minutes per IP
const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API keys are configured
    const apiKeys = validateApiKeys();
    if (!apiKeys.gemini) {
      return NextResponse.json(
        { error: 'Document analysis service is not configured' },
        { status: 503 }
      );
    }

    // 2. Apply rate limiting
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = uploadLimiter(clientId);

    if (!rateLimit.allowed) {
      const resetInSeconds = rateLimit.resetAt
        ? Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        : 900; // 15 minutes

      return NextResponse.json(
        {
          error: 'Upload limit exceeded. Please try again later.',
          retryAfter: resetInSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(resetInSeconds),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    // 3. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 4. Validate uploaded file
    const validation = await validateUploadedFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 5. File is safe - proceed with processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from document
    const { text, pageCount, wordCount } = await extractText(
      buffer,
      file.type
    );

    // Validate extracted content
    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: 'Document contains insufficient text for analysis' },
        { status: 400 }
      );
    }

    // Limit document size (prevent excessive API costs)
    const MAX_WORDS = 10000;
    if (wordCount > MAX_WORDS) {
      return NextResponse.json(
        {
          error: `Document too large (${wordCount} words). Maximum ${MAX_WORDS} words allowed.`,
        },
        { status: 400 }
      );
    }

    // 6. Call Gemini AI for analysis
    // (Implementation depends on your AI service integration)
    const analysisResult = await analyzeWithGemini(text, file.name);

    return NextResponse.json({
      success: true,
      lesson: analysisResult.lesson,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        wordCount,
        pageCount,
        processingTime: analysisResult.processingTimeMs,
      },
    });

  } catch (error) {
    console.error('File analysis error:', error);

    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Failed to process document. Please try again.' },
      { status: 500 }
    );
  }
}

// Placeholder for Gemini integration
async function analyzeWithGemini(text: string, fileName: string) {
  // Your Gemini API integration here
  throw new Error('Not implemented');
}
```

---

## Example 2: Chat Streaming API Route (`/api/chat`)

This route handles streaming chat responses from Claude AI.

### File: `src/app/api/chat/route.ts`

```typescript
import { NextRequest } from 'next/server';
import {
  sanitizeUserInput,
  createRateLimiter,
  getClientIdentifier,
  validateApiKeys,
  validateContentType,
} from '@/lib/security';
import { z } from 'zod';

// Rate limiter: 20 messages per minute
const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
});

// Input validation schema
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  lessonId: z.string().regex(/^[a-zA-Z0-9-_]{1,50}$/),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API keys
    const apiKeys = validateApiKeys();
    if (!apiKeys.claude) {
      return new Response(
        JSON.stringify({ error: 'Chat service not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!validateContentType(contentType, 'application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Apply rate limiting
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = chatLimiter(clientId);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many messages. Please slow down.',
          retryAfter: 60,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = ChatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message, lessonId, conversationHistory } = validationResult.data;

    // 5. Sanitize user input
    const sanitizedMessage = sanitizeUserInput(message);

    if (!sanitizedMessage || sanitizedMessage.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Sanitize conversation history
    const sanitizedHistory = conversationHistory.map((msg) => ({
      ...msg,
      content: sanitizeUserInput(msg.content),
    }));

    // 7. Create streaming response with Claude
    const stream = await createClaudeStream(
      sanitizedMessage,
      lessonId,
      sanitizedHistory
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Placeholder for Claude streaming integration
async function createClaudeStream(
  message: string,
  lessonId: string,
  history: Array<{ role: string; content: string }>
): Promise<ReadableStream> {
  // Your Claude API streaming integration here
  throw new Error('Not implemented');
}
```

---

## Example 3: CRUD API Route (`/api/lessons`)

This route handles creating, reading, updating, and deleting lessons.

### File: `src/app/api/lessons/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  createRateLimiter,
  getClientIdentifier,
  sanitizeUserInput,
  generateSecureId,
} from '@/lib/security';
import { z } from 'zod';
import type { Lesson } from '@/types';

// Rate limiter: 30 requests per minute
const crudLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
});

// Lesson creation schema
const CreateLessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  learningObjectives: z.array(z.string().max(500)).min(1).max(10),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceDocument: z.string().max(255),
});

// GET - List lessons
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = crudLimiter(clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const difficulty = searchParams.get('difficulty');

    // Validate query parameters
    if (status && !['draft', 'published'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter' },
        { status: 400 }
      );
    }

    if (
      difficulty &&
      !['beginner', 'intermediate', 'advanced'].includes(difficulty)
    ) {
      return NextResponse.json(
        { error: 'Invalid difficulty parameter' },
        { status: 400 }
      );
    }

    // Fetch lessons from database (Supabase)
    const lessons = await fetchLessons({ status, difficulty });

    return NextResponse.json({
      lessons,
      count: lessons.length,
    });

  } catch (error) {
    console.error('Fetch lessons error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST - Create lesson
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = crudLimiter(clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = CreateLessonSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid lesson data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Sanitize text fields
    const sanitizedLesson = {
      id: generateSecureId(16),
      title: sanitizeUserInput(data.title),
      description: sanitizeUserInput(data.description),
      learningObjectives: data.learningObjectives.map((obj) =>
        sanitizeUserInput(obj)
      ),
      difficulty: data.difficulty,
      sourceDocument: sanitizeUserInput(data.sourceDocument),
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      contentBlocks: [],
      keyConcepts: [],
      summary: '',
      quizQuestions: [],
      estimatedDurationMinutes: 0,
    };

    // Save to database
    const savedLesson = await createLesson(sanitizedLesson);

    return NextResponse.json(
      { lesson: savedLesson },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create lesson error:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}

// Placeholder database functions
async function fetchLessons(filters: {
  status?: string | null;
  difficulty?: string | null;
}): Promise<Lesson[]> {
  // Your Supabase query here
  throw new Error('Not implemented');
}

async function createLesson(lesson: Partial<Lesson>): Promise<Lesson> {
  // Your Supabase insert here
  throw new Error('Not implemented');
}
```

---

## Example 4: Individual Lesson API Route (`/api/lessons/[id]`)

### File: `src/app/api/lessons/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  createRateLimiter,
  getClientIdentifier,
  sanitizeUserInput,
} from '@/lib/security';
import { z } from 'zod';

const crudLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
});

// Update lesson schema
const UpdateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  status: z.enum(['draft', 'published']).optional(),
}).strict(); // Reject unknown fields

// GET - Fetch single lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = crudLimiter(clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Validate lesson ID format (prevent injection)
    if (!/^[a-zA-Z0-9-_]{1,50}$/.test(params.id)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const lesson = await fetchLessonById(params.id);

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ lesson });

  } catch (error) {
    console.error('Fetch lesson error:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 });
  }
}

// PATCH - Update lesson
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = crudLimiter(clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Validate lesson ID
    if (!/^[a-zA-Z0-9-_]{1,50}$/.test(params.id)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    // Validate request body
    const body = await request.json();
    const validationResult = UpdateLessonSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Sanitize text fields
    const sanitizedUpdates: typeof updates = {};
    if (updates.title) {
      sanitizedUpdates.title = sanitizeUserInput(updates.title);
    }
    if (updates.description) {
      sanitizedUpdates.description = sanitizeUserInput(updates.description);
    }
    if (updates.status) {
      sanitizedUpdates.status = updates.status;
    }

    // Update in database
    const updatedLesson = await updateLesson(params.id, sanitizedUpdates);

    if (!updatedLesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ lesson: updatedLesson });

  } catch (error) {
    console.error('Update lesson error:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

// DELETE - Remove lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = crudLimiter(clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Validate lesson ID
    if (!/^[a-zA-Z0-9-_]{1,50}$/.test(params.id)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const deleted = await deleteLesson(params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete lesson error:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}

// Placeholder database functions
async function fetchLessonById(id: string) {
  throw new Error('Not implemented');
}

async function updateLesson(id: string, updates: any) {
  throw new Error('Not implemented');
}

async function deleteLesson(id: string): Promise<boolean> {
  throw new Error('Not implemented');
}
```

---

## Example 5: Security Middleware for Next.js

### File: `src/middleware.ts`

Apply global security headers and basic protections:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.anthropic.com https://generativelanguage.googleapis.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

// Apply to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## Testing Security Controls

### File: `tests/security.test.ts` (Example)

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  validateUploadedFile,
  sanitizeUserInput,
  createRateLimiter,
  validateApiKeys,
} from '@/lib/security';

describe('Security Module', () => {
  describe('sanitizeUserInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('onerror');
    });

    it('should preserve markdown', () => {
      const input = '**bold** and *italic* and `code`';
      const result = sanitizeUserInput(input);
      expect(result).toBe(input);
    });

    it('should enforce length limit', () => {
      const input = 'a'.repeat(10000);
      const result = sanitizeUserInput(input);
      expect(result.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('createRateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 3 });

      expect(limiter('user1').allowed).toBe(true);
      expect(limiter('user1').allowed).toBe(true);
      expect(limiter('user1').allowed).toBe(true);
    });

    it('should block requests over limit', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });

      limiter('user2');
      limiter('user2');

      const result = limiter('user2');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track users separately', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 });

      expect(limiter('user3').allowed).toBe(true);
      expect(limiter('user4').allowed).toBe(true);
      expect(limiter('user3').allowed).toBe(false);
    });
  });
});
```

---

## Environment Setup

### File: `.env.example`

```bash
# AI API Keys (Required)
GEMINI_API_KEY=your_gemini_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Required for auth and database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Rate Limiting (Optional - defaults shown)
RATE_LIMIT_UPLOAD_MAX=5
RATE_LIMIT_UPLOAD_WINDOW_MINUTES=15
RATE_LIMIT_CHAT_MAX=20
RATE_LIMIT_CHAT_WINDOW_MINUTES=1
RATE_LIMIT_CRUD_MAX=30
RATE_LIMIT_CRUD_WINDOW_MINUTES=1

# File Upload (Optional - defaults shown)
MAX_FILE_SIZE_MB=20
MAX_DOCUMENT_WORDS=10000

# Security (Production only)
NODE_ENV=production
```

---

## Quick Start Checklist

- [ ] Copy `.env.example` to `.env.local` and fill in real API keys
- [ ] Add `.env.local` to `.gitignore`
- [ ] Install dependencies: `npm install`
- [ ] Implement API routes using examples above
- [ ] Test file upload with PDF/DOCX
- [ ] Test rate limiting by sending rapid requests
- [ ] Test XSS prevention in chat
- [ ] Add security headers via middleware
- [ ] Set up Supabase authentication
- [ ] Review security checklist in `SECURITY_REVIEW.md`

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All API keys configured in production environment
- [ ] `.env.local` never committed to git
- [ ] Security middleware enabled
- [ ] HTTPS enforced (handled by hosting platform)
- [ ] Rate limiting configured appropriately
- [ ] Supabase RLS policies enabled
- [ ] Error logging configured (no sensitive data)
- [ ] Security headers verified with https://securityheaders.com
- [ ] CORS properly configured
- [ ] File upload virus scanning implemented (optional but recommended)
- [ ] Monitor for unusual API usage patterns
- [ ] Backup and disaster recovery plan in place

---

## Support Resources

- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/security
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- Supabase Security: https://supabase.com/docs/guides/auth
- API Security Best Practices: https://owasp.org/www-project-api-security/
