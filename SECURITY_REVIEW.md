# Security Review - AI Academy Demo App

**Date:** 2026-02-11
**Reviewer:** Security Analysis
**Application:** AI Academy Next.js Demo

---

## Executive Summary

This document provides a security review of the AI Academy demo application and introduces the new security middleware module at `/src/lib/security.ts`. The module implements critical security controls for file uploads, rate limiting, input sanitization, and API key validation.

---

## Security Module Overview

### File Path
`/home/caesar/Desktop/ai-academy/src/lib/security.ts`

### Implemented Security Features

#### 1. File Upload Validation (`validateUploadedFile`)

**Purpose:** Prevent malicious file uploads and ensure only legitimate PDF/DOCX files are processed.

**Security Controls:**
- **File Size Limit:** Maximum 20MB to prevent denial-of-service via large uploads
- **MIME Type Allowlist:** Only `application/pdf` and DOCX MIME types accepted
- **Magic Bytes Verification:** Validates file signatures to prevent type spoofing
  - PDF: Checks for `%PDF` header (0x25504446)
  - DOCX: Checks for ZIP headers (0x504B0304)
  - DOC: Checks for OLE2 headers (0xD0CF11E0)
- **Filename Validation:**
  - Max 255 characters
  - Rejects null bytes (directory traversal protection)
  - Rejects path separators (`..`, `/`, `\`)

**Attack Scenarios Prevented:**
1. **File Type Spoofing:** Attacker renames malicious.exe to malicious.pdf
   - **Blocked by:** Magic bytes verification detects mismatch
2. **Zip Bomb / Billion Laughs:** Compressed file expands to massive size
   - **Blocked by:** 20MB size limit (should also add decompressed size check in parser)
3. **Path Traversal:** Filename like `../../etc/passwd`
   - **Blocked by:** Path separator validation
4. **Null Byte Injection:** Filename like `file.pdf\0.exe`
   - **Blocked by:** Null byte detection

**Usage Example:**
```typescript
// In /api/analyze route handler
import { validateUploadedFile } from '@/lib/security';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  const validation = await validateUploadedFile(file);
  if (!validation.valid) {
    return Response.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // Safe to process file...
}
```

---

#### 2. Rate Limiting (`createRateLimiter`)

**Purpose:** Prevent API abuse, brute force attacks, and resource exhaustion.

**Security Controls:**
- **Sliding Window:** Tracks requests in time-based windows
- **In-Memory Store:** Suitable for demo; uses Map with automatic cleanup
- **Per-Identifier Tracking:** Supports IP-based or user-based limiting
- **Memory Leak Prevention:** Auto-cleanup of old entries every 60 seconds

**Limitations (Demo Mode):**
- ⚠️ **NOT suitable for production multi-server deployments**
- State is in-memory only (resets on restart)
- No persistence across server instances
- **Production Alternative:** Use Redis-backed rate limiter or Upstash

**Attack Scenarios Prevented:**
1. **Brute Force API Key Guessing:** Attacker tries thousands of API calls
   - **Blocked by:** Rate limit prevents excessive requests
2. **Resource Exhaustion:** Malicious user floods expensive AI endpoints
   - **Blocked by:** Limited requests per time window
3. **Credential Stuffing:** Automated login attempts
   - **Blocked by:** Rate limiting on auth endpoints

**Usage Example:**
```typescript
import { createRateLimiter, getClientIdentifier } from '@/lib/security';

// Create rate limiter: 10 requests per minute
const limiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request.headers);
  const rateLimit = limiter(clientId);

  if (!rateLimit.allowed) {
    const resetInSeconds = rateLimit.resetAt
      ? Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      : 60;

    return Response.json(
      { error: `Rate limit exceeded. Try again in ${resetInSeconds}s` },
      {
        status: 429,
        headers: {
          'Retry-After': String(resetInSeconds),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  // Process request...
}
```

---

#### 3. Input Sanitization (`sanitizeUserInput`)

**Purpose:** Prevent XSS attacks in chat messages while preserving markdown formatting.

**Security Controls:**
- **Script Tag Removal:** Strips `<script>` tags and content
- **Event Handler Removal:** Removes `onclick`, `onerror`, etc.
- **Protocol Filtering:** Blocks `javascript:` and dangerous `data:` URLs
- **Dangerous Tag Removal:**
  - `<iframe>` - can load malicious content
  - `<object>`, `<embed>` - can execute plugins
  - `<form>` - phishing vectors
  - `<meta>` - can redirect or set headers
  - `<link>` - can load malicious stylesheets
  - `<base>` - can hijack relative URLs
  - `<style>` - can contain expressions
- **Length Limit:** Max 5000 characters to prevent DoS
- **Markdown Preservation:** Doesn't strip markdown syntax (`**`, `#`, etc.)

**Attack Scenarios Prevented:**
1. **Stored XSS:** User submits `<script>alert('XSS')</script>` in chat
   - **Blocked by:** Script tag removal
2. **Event Handler XSS:** User sends `<img src=x onerror=alert(1)>`
   - **Blocked by:** Event handler attribute stripping
3. **JavaScript Protocol:** `<a href="javascript:alert(1)">Click</a>`
   - **Blocked by:** Protocol filtering
4. **Message Flooding:** Massive 10MB message crashes browser
   - **Blocked by:** 5000 character limit

**Usage Example:**
```typescript
import { sanitizeUserInput } from '@/lib/security';

export async function POST(request: Request) {
  const { message } = await request.json();

  const sanitized = sanitizeUserInput(message);

  // Store and display sanitized message
  await storeMessage({
    content: sanitized,
    role: 'user',
    timestamp: new Date().toISOString(),
  });

  // Pass to AI for response...
}
```

---

#### 4. API Key Validation (`validateApiKeys`)

**Purpose:** Ensure required API keys are configured before app starts.

**Security Controls:**
- **Existence Check:** Verifies environment variables are set
- **Placeholder Detection:** Rejects common placeholder patterns
  - `your_`, `your-`, `placeholder`, `example`, `test`, `xxx`
- **Non-Empty Validation:** Ensures keys aren't blank strings

**Usage Example:**
```typescript
import { validateApiKeys } from '@/lib/security';

// In middleware or API route
export async function GET(request: Request) {
  const keys = validateApiKeys();

  if (!keys.gemini && !keys.claude) {
    return Response.json(
      { error: 'No AI providers configured. Please set API keys.' },
      { status: 503 }
    );
  }

  if (!keys.gemini) {
    // Fallback to Claude only
  }

  // Proceed with available providers...
}
```

---

#### 5. Additional Utilities

**`getClientIdentifier(headers)`**
- Extracts IP address for rate limiting
- Checks `x-real-ip`, `x-forwarded-for` headers
- Falls back to 'anonymous' for demo mode

**`validateContentType(contentType, expected)`**
- Validates Content-Type header matches expected
- Prevents content type confusion attacks

**`generateSecureId(length)`**
- Generates cryptographically secure random IDs
- Uses `crypto.getRandomValues()` for unpredictability

---

## Recommended API Route Security Patterns

### Pattern 1: File Upload Endpoint (`/api/analyze`)

```typescript
import { validateUploadedFile, createRateLimiter, getClientIdentifier, validateApiKeys } from '@/lib/security';

const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 uploads per 15 min
});

export async function POST(request: Request) {
  // 1. Check API keys
  const keys = validateApiKeys();
  if (!keys.gemini) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  // 2. Rate limiting
  const clientId = getClientIdentifier(request.headers);
  const rateLimit = uploadLimiter(clientId);
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many uploads' }, { status: 429 });
  }

  // 3. File validation
  const formData = await request.formData();
  const file = formData.get('file') as File;

  const validation = await validateUploadedFile(file);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  // 4. Process file safely
  const buffer = Buffer.from(await file.arrayBuffer());
  // ... extract text and analyze
}
```

### Pattern 2: Chat Streaming Endpoint (`/api/chat`)

```typescript
import { sanitizeUserInput, createRateLimiter, getClientIdentifier } from '@/lib/security';

const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 messages per minute
});

export async function POST(request: Request) {
  // 1. Rate limiting
  const clientId = getClientIdentifier(request.headers);
  const rateLimit = chatLimiter(clientId);
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many messages' }, { status: 429 });
  }

  // 2. Parse and sanitize input
  const { message, lessonId } = await request.json();

  const sanitized = sanitizeUserInput(message);
  if (!sanitized) {
    return Response.json({ error: 'Invalid message' }, { status: 400 });
  }

  // 3. Validate lesson ID format (prevent injection)
  if (!/^[a-zA-Z0-9-_]{1,50}$/.test(lessonId)) {
    return Response.json({ error: 'Invalid lesson ID' }, { status: 400 });
  }

  // 4. Stream AI response safely
  // ... create streaming response
}
```

### Pattern 3: CRUD Endpoint (`/api/lessons`)

```typescript
import { createRateLimiter, getClientIdentifier, sanitizeUserInput } from '@/lib/security';

const crudLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
});

export async function POST(request: Request) {
  // 1. Rate limiting
  const clientId = getClientIdentifier(request.headers);
  const rateLimit = crudLimiter(clientId);
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 2. Validate input structure with Zod
  // (You have Zod installed - use it!)
  const body = await request.json();

  // 3. Sanitize text fields
  const sanitized = {
    ...body,
    title: sanitizeUserInput(body.title || ''),
    description: sanitizeUserInput(body.description || ''),
  };

  // 4. Validate against schema and save
  // ... use Zod schema validation
}
```

---

## Additional Security Recommendations

### Critical (Implement Before Production)

1. **HTTPS Enforcement**
   - Use HTTPS in production (handled by Vercel/hosting)
   - Set `Strict-Transport-Security` header

2. **CSRF Protection**
   - Next.js API routes are somewhat protected by SameSite cookies
   - Consider adding CSRF tokens for state-changing operations
   - Use double-submit cookie pattern or synchronizer tokens

3. **Authentication & Authorization**
   - Currently no auth layer mentioned
   - Implement Supabase Auth as planned
   - Use Row Level Security (RLS) in Supabase
   - Validate JWT tokens on every API request
   - Implement proper session management

4. **Content Security Policy**
   - Add CSP headers to prevent XSS
   ```typescript
   headers: {
     'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
   }
   ```

5. **Secure Headers**
   - Add in `next.config.js`:
   ```javascript
   headers: [
     { key: 'X-Frame-Options', value: 'DENY' },
     { key: 'X-Content-Type-Options', value: 'nosniff' },
     { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
     { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
   ]
   ```

6. **File Upload Enhancements**
   - Add virus scanning (ClamAV or cloud service)
   - Implement file storage with random filenames
   - Store files outside webroot
   - Add decompression bomb protection for PDFs
   - Consider PDF content validation (malicious JavaScript in PDFs)

7. **Rate Limiter Production Upgrade**
   - Replace in-memory limiter with Redis/Upstash
   - Implement distributed rate limiting
   - Add different rate limits per endpoint
   - Consider using `@upstash/ratelimit` package

8. **API Key Security**
   - Never expose API keys to client
   - Rotate keys periodically
   - Use separate keys for dev/staging/prod
   - Monitor API usage for anomalies
   - Consider API key rotation mechanism

9. **Input Validation with Zod**
   - Create schemas for all API inputs
   - Validate request bodies before processing
   - Example:
   ```typescript
   import { z } from 'zod';

   const MessageSchema = z.object({
     message: z.string().min(1).max(5000),
     lessonId: z.string().uuid(),
   });

   const { message, lessonId } = MessageSchema.parse(await request.json());
   ```

10. **Error Handling**
    - Never expose stack traces in production
    - Log errors server-side with correlation IDs
    - Return generic error messages to clients
    - Implement proper error boundaries

### High Priority

11. **Database Security (Supabase)**
    - Enable Row Level Security (RLS) on all tables
    - Use parameterized queries (already safe with Supabase client)
    - Validate all database inputs
    - Implement proper permission checks

12. **Dependency Security**
    - Run `npm audit` regularly
    - Keep dependencies updated
    - Review security advisories
    - Consider using Snyk or Dependabot

13. **Logging & Monitoring**
    - Log all security events (failed auth, rate limits, validation failures)
    - Don't log sensitive data (passwords, API keys, PII)
    - Implement anomaly detection
    - Set up alerts for suspicious patterns

14. **AI Provider Security**
    - Implement prompt injection protection
    - Validate AI responses before displaying
    - Set token/cost limits per request
    - Monitor for abuse patterns
    - Add content filtering for inappropriate AI outputs

### Medium Priority

15. **CORS Configuration**
    - Properly configure CORS headers
    - Whitelist only trusted origins
    - Don't use `*` in production

16. **Secrets Management**
    - Use environment variables (already doing)
    - Consider secrets management service
    - Never commit `.env` files
    - Implement key rotation

17. **Session Security**
    - Use secure, httpOnly cookies
    - Implement session timeout
    - Validate session on every request
    - Implement logout functionality

---

## Vulnerability Assessment - Current Codebase

### Files Reviewed
- `/src/lib/document-parser.ts`
- `/src/types/index.ts`
- `package.json`
- `.env.local`

### Findings

#### INFORMATIONAL: API Keys in Example .env
**File:** `.env.local`
**Lines:** 2-3

**Issue:** Placeholder API keys in repository
```
GEMINI_API_KEY=your_gemini_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

**Impact:** Low - These are placeholders, but the file shouldn't be committed.

**Remediation:**
1. Add `.env.local` to `.gitignore`
2. Create `.env.example` with placeholders
3. Document environment setup in README

#### LOW: No Input Validation in Document Parser
**File:** `/src/lib/document-parser.ts`
**Function:** `extractText()`

**Issue:** Function trusts MIME type from caller without validation.

**Impact:** If called directly without file validation, could process unexpected file types.

**Remediation:** Add guard clause:
```typescript
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export async function extractText(buffer: Buffer, mimeType: string) {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
  // ... rest of function
}
```

**Note:** This is already mitigated if always used after `validateUploadedFile()`.

---

## Security Testing Checklist

Before deploying to production, test:

- [ ] Upload files >20MB (should reject)
- [ ] Upload .exe renamed to .pdf (should reject - magic bytes mismatch)
- [ ] Upload file with path traversal in name: `../../etc/passwd.pdf`
- [ ] Upload file with null byte: `file.pdf\0.exe`
- [ ] Trigger rate limit and verify 429 response
- [ ] Submit XSS payloads in chat: `<script>alert(1)</script>`
- [ ] Submit event handler XSS: `<img src=x onerror=alert(1)>`
- [ ] Submit 10,000 character message (should truncate to 5000)
- [ ] Test with missing API keys
- [ ] Test concurrent uploads from same IP
- [ ] Test CORS with unauthorized origin
- [ ] Verify secure headers in production
- [ ] Test authentication bypass attempts
- [ ] Test SQL injection in lesson CRUD (should be safe with Supabase)
- [ ] Test CSRF on state-changing endpoints

---

## Conclusion

The new security module at `/home/caesar/Desktop/ai-academy/src/lib/security.ts` provides essential security controls for the AI Academy demo application:

1. **File Upload Protection** - Prevents malicious file uploads
2. **Rate Limiting** - Mitigates abuse and resource exhaustion
3. **XSS Prevention** - Sanitizes user input while preserving markdown
4. **API Key Validation** - Ensures proper configuration

These controls are appropriate for a demo/development environment. Before production deployment, implement the Critical and High Priority recommendations listed above, particularly:
- Authentication & authorization with Supabase
- Production-grade rate limiting with Redis
- Comprehensive security headers
- CSRF protection
- Monitoring and logging

The application has a solid security foundation. With the additional production hardening, it will be ready for real-world use.

---

**Next Steps:**
1. Integrate security functions into API routes
2. Add Zod schemas for input validation
3. Implement Supabase authentication
4. Configure security headers in `next.config.js`
5. Set up monitoring and alerting
