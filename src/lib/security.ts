// ============================================================
// Security Utilities - File validation, rate limiting, sanitization
// ============================================================

// ============================================================
// 1. FILE VALIDATION
// ============================================================

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Allowed MIME types for file uploads
 */
const ALLOWED_MIME_TYPES = {
  'application/pdf': {
    extensions: ['.pdf'],
    magicBytes: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extensions: ['.docx'],
    magicBytes: [
      [0x50, 0x4b, 0x03, 0x04], // PK.. (ZIP header for DOCX)
      [0x50, 0x4b, 0x05, 0x06], // PK.. (Empty ZIP)
      [0x50, 0x4b, 0x07, 0x08], // PK.. (Spanned ZIP)
    ],
  },
  'application/msword': {
    extensions: ['.doc'],
    magicBytes: [
      [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // OLE2 header
    ],
  },
} as const;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

/**
 * Check if byte array starts with magic bytes signature
 */
function hasValidMagicBytes(
  buffer: ArrayBuffer,
  magicBytesList: readonly (readonly number[])[]
): boolean {
  const bytes = new Uint8Array(buffer);

  return magicBytesList.some((magicBytes) => {
    if (bytes.length < magicBytes.length) return false;

    return magicBytes.every((byte, index) => bytes[index] === byte);
  });
}

/**
 * Validate uploaded file for security
 *
 * Checks:
 * - File size limits (max 20MB)
 * - MIME type allowlist (PDF, DOCX only)
 * - Magic bytes verification to prevent file type spoofing
 *
 * @param file - File object from browser upload
 * @returns Validation result with error details if invalid
 */
export async function validateUploadedFile(
  file: File
): Promise<FileValidationResult> {
  // 1. Check file size
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size of 20MB`,
    };
  }

  // 2. Check MIME type against allowlist
  const mimeType = file.type;
  if (!mimeType || !(mimeType in ALLOWED_MIME_TYPES)) {
    return {
      valid: false,
      error: `Invalid file type. Only PDF and DOCX files are allowed. Received: ${mimeType || 'unknown'}`,
    };
  }

  // 3. Verify magic bytes to prevent file type spoofing
  // Read first 8 bytes (enough for all our file type signatures)
  try {
    const slice = file.slice(0, 8);
    const arrayBuffer = await slice.arrayBuffer();

    const mimeConfig =
      ALLOWED_MIME_TYPES[mimeType as keyof typeof ALLOWED_MIME_TYPES];

    if (!hasValidMagicBytes(arrayBuffer, mimeConfig.magicBytes)) {
      return {
        valid: false,
        error: `File content does not match declared type (${mimeType}). File may be corrupted or disguised.`,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: `Failed to read file for validation: ${error instanceof Error ? error.message : 'unknown error'}`,
    };
  }

  // 4. Check filename for suspicious patterns
  const fileName = file.name;
  if (!fileName || fileName.length > 255) {
    return {
      valid: false,
      error: 'Invalid filename length',
    };
  }

  // Check for null bytes (directory traversal attempts)
  if (fileName.includes('\0')) {
    return {
      valid: false,
      error: 'Invalid filename: contains null bytes',
    };
  }

  // Check for path traversal patterns
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid filename: contains path traversal characters',
    };
  }

  return { valid: true };
}

// ============================================================
// 2. RATE LIMITING
// ============================================================

/**
 * Rate limit entry tracking request count and window start time
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Rate limiter configuration options
 */
export interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: number; // Unix timestamp when limit resets
}

/**
 * Create an in-memory rate limiter (suitable for demo/development)
 *
 * WARNING: This is NOT suitable for production with multiple servers
 * as it stores state in memory. For production, use Redis or similar.
 *
 * @param options - Rate limit configuration
 * @returns Function to check rate limits
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests } = options;
  const store = new Map<string, RateLimitEntry>();

  // Cleanup old entries every 60 seconds to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    const entries = Array.from(store.entries());
    for (const [key, entry] of entries) {
      if (now - entry.windowStart > windowMs * 2) {
        store.delete(key);
      }
    }
  }, 60000);

  // Allow cleanup on process exit
  if (typeof process !== 'undefined') {
    process.on('exit', () => clearInterval(cleanupInterval));
  }

  /**
   * Check if request should be rate limited
   *
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @returns Rate limit result with allowed status and remaining count
   */
  return function checkRateLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = store.get(identifier);

    // No previous entry or window expired - create new window
    if (!entry || now - entry.windowStart > windowMs) {
      store.set(identifier, {
        count: 1,
        windowStart: now,
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs,
      };
    }

    // Within current window - check if over limit
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.windowStart + windowMs,
      };
    }

    // Increment count and allow
    entry.count++;
    store.set(identifier, entry);

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.windowStart + windowMs,
    };
  };
}

// ============================================================
// 3. INPUT SANITIZATION
// ============================================================

const MAX_MESSAGE_LENGTH = 5000;

/**
 * Sanitize user input to prevent XSS attacks
 *
 * This function removes dangerous HTML/JavaScript patterns while
 * preserving markdown formatting for chat messages.
 *
 * Security measures:
 * - Removes <script> tags and content
 * - Removes event handlers (onclick, onerror, etc.)
 * - Removes javascript: protocol URLs
 * - Removes data: URLs (can contain scripts)
 * - Enforces maximum message length
 * - Preserves markdown syntax for legitimate formatting
 *
 * @param text - User input text to sanitize
 * @returns Sanitized text safe for display
 */
export function sanitizeUserInput(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Enforce length limit
  let sanitized = text.slice(0, MAX_MESSAGE_LENGTH);

  // Remove script tags and their content (case-insensitive)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handler attributes
  // Matches: onclick, onload, onerror, onmouseover, etc.
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URLs (can contain base64 encoded scripts)
  sanitized = sanitized.replace(/data:text\/html[^"'\s]*/gi, '');

  // Remove style tags (can contain expression() for XSS in older browsers)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove object and embed tags
  sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');

  // Remove form tags (can be used for phishing)
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

  // Remove meta tags (can redirect or set harmful headers)
  sanitized = sanitized.replace(/<meta\b[^>]*>/gi, '');

  // Remove link tags (can load malicious stylesheets)
  sanitized = sanitized.replace(/<link\b[^>]*>/gi, '');

  // Remove base tags (can hijack relative URLs)
  sanitized = sanitized.replace(/<base\b[^>]*>/gi, '');

  return sanitized.trim();
}

// ============================================================
// 4. API KEY VALIDATION
// ============================================================

/**
 * API key validation result
 */
export interface ApiKeyValidation {
  gemini: boolean;
  claude: boolean;
}

/**
 * Validate that required API keys are configured
 *
 * Checks environment variables for API key presence.
 * Does NOT validate the keys are correct, only that they exist
 * and are not placeholder values.
 *
 * @returns Object indicating which API keys are properly configured
 */
export function validateApiKeys(): ApiKeyValidation {
  const geminiKey = process.env.GEMINI_API_KEY;
  const claudeKey = process.env.CLAUDE_API_KEY;

  const placeholderPatterns = [
    'your_',
    'your-',
    'placeholder',
    'example',
    'test',
    'xxx',
  ];

  /**
   * Check if key exists and is not a placeholder
   */
  const isValidKey = (key: string | undefined): boolean => {
    if (!key || key.trim().length === 0) {
      return false;
    }

    const lowerKey = key.toLowerCase();
    return !placeholderPatterns.some((pattern) => lowerKey.includes(pattern));
  };

  return {
    gemini: isValidKey(geminiKey),
    claude: isValidKey(claudeKey),
  };
}

// ============================================================
// 5. ADDITIONAL SECURITY UTILITIES
// ============================================================

/**
 * Extract IP address from Next.js request headers
 *
 * Checks common headers in order of reliability:
 * 1. x-real-ip (set by nginx)
 * 2. x-forwarded-for (standard proxy header)
 * 3. Falls back to 'anonymous' for demo purposes
 *
 * @param headers - Next.js request headers
 * @returns IP address or identifier for rate limiting
 */
export function getClientIdentifier(headers: Headers): string {
  // Check x-real-ip header (most reliable)
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Check x-forwarded-for header (may contain multiple IPs)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // For demo purposes, use a global identifier
  // In production, you'd want to handle this more carefully
  return 'anonymous';
}

/**
 * Validate that content type header matches expected type
 *
 * @param contentType - Content-Type header value
 * @param expected - Expected content type
 * @returns True if content type matches
 */
export function validateContentType(
  contentType: string | null,
  expected: string
): boolean {
  if (!contentType) {
    return false;
  }

  // Handle content type with charset (e.g., "application/json; charset=utf-8")
  const type = contentType.split(';')[0].trim().toLowerCase();
  return type === expected.toLowerCase();
}

/**
 * Generate secure random identifier
 *
 * @param length - Length of the identifier
 * @returns Random hex string
 */
export function generateSecureId(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
