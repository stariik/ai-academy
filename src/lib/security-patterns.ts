// ============================================================
// Security Patterns - Reusable rate limiters and validators
// ============================================================

import { createRateLimiter } from './security';

/**
 * Pre-configured rate limiters for different API endpoints
 */
export const RateLimiters = {
  /**
   * File upload limiter: 5 uploads per 15 minutes
   * Use for: /api/analyze and similar document processing endpoints
   */
  fileUpload: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  }),

  /**
   * Chat message limiter: 20 messages per minute
   * Use for: /api/chat and streaming endpoints
   */
  chat: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 20,
  }),

  /**
   * CRUD operations limiter: 30 requests per minute
   * Use for: /api/lessons and similar data endpoints
   */
  crud: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
  }),

  /**
   * Strict limiter for sensitive operations: 3 requests per 5 minutes
   * Use for: Authentication, password reset, etc.
   */
  strict: createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 3,
  }),

  /**
   * Promo redemption: 10 attempts per 5 minutes
   * Tight enough to make brute-force scanning impractical, loose enough
   * that a confused user retyping a code does not get locked out.
   */
  promoRedeem: createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 10,
  }),

  /**
   * Generous limiter for public endpoints: 100 requests per minute
   * Use for: Public lesson lists, search, etc.
   */
  public: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
  }),
};

/**
 * Common validation patterns
 */
export const Validators = {
  /**
   * Validate UUID format (common for database IDs)
   */
  isValidUuid: (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    );
  },

  /**
   * Validate alphanumeric ID (for custom IDs)
   */
  isValidId: (id: string, maxLength: number = 50): boolean => {
    return /^[a-zA-Z0-9-_]+$/.test(id) && id.length <= maxLength && id.length > 0;
  },

  /**
   * Validate email format (basic)
   */
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Validate URL format
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if string contains only safe characters (no special chars)
   */
  isSafeString: (str: string): boolean => {
    return /^[a-zA-Z0-9\s.,!?-]+$/.test(str);
  },
};

/**
 * Common error responses for API routes
 */
export const ErrorResponses = {
  /**
   * Rate limit exceeded response
   */
  rateLimitExceeded: (retryAfter: number) => {
    return {
      status: 429,
      body: {
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
      },
    };
  },

  /**
   * Invalid input response
   */
  invalidInput: (message: string = 'Invalid input') => {
    return {
      status: 400,
      body: { error: message },
    };
  },

  /**
   * Unauthorized response
   */
  unauthorized: (message: string = 'Unauthorized') => {
    return {
      status: 401,
      body: { error: message },
    };
  },

  /**
   * Forbidden response
   */
  forbidden: (message: string = 'Forbidden') => {
    return {
      status: 403,
      body: { error: message },
    };
  },

  /**
   * Not found response
   */
  notFound: (resource: string = 'Resource') => {
    return {
      status: 404,
      body: { error: `${resource} not found` },
    };
  },

  /**
   * Service unavailable response
   */
  serviceUnavailable: (message: string = 'Service temporarily unavailable') => {
    return {
      status: 503,
      body: { error: message },
    };
  },

  /**
   * Internal server error (never expose details)
   */
  internalError: () => {
    return {
      status: 500,
      body: { error: 'An unexpected error occurred. Please try again.' },
    };
  },
};

/**
 * Security constants and configuration
 */
export const SecurityConfig = {
  /**
   * File upload limits
   */
  FILE_UPLOAD: {
    MAX_SIZE_BYTES: 20 * 1024 * 1024, // 20MB
    MAX_SIZE_MB: 20,
    ALLOWED_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALLOWED_EXTENSIONS: ['.pdf', '.docx'],
  },

  /**
   * Text input limits
   */
  TEXT_INPUT: {
    MAX_MESSAGE_LENGTH: 5000,
    MAX_TITLE_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 1000,
    MAX_NAME_LENGTH: 100,
  },

  /**
   * Document processing limits
   */
  DOCUMENT: {
    MAX_WORD_COUNT: 10000,
    MIN_WORD_COUNT: 100,
    MAX_PAGES: 50,
  },

  /**
   * Rate limit windows (in milliseconds)
   */
  RATE_LIMITS: {
    ONE_MINUTE: 60 * 1000,
    FIVE_MINUTES: 5 * 60 * 1000,
    FIFTEEN_MINUTES: 15 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000,
  },
};

/**
 * Helper function to create standardized API response
 */
export function createApiResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  return new Response(JSON.stringify(data), {
    status,
    headers: defaultHeaders,
  });
}

/**
 * Helper function to handle API errors consistently
 */
export function handleApiError(error: unknown, context: string = 'API') {
  // Log error server-side (without exposing to client)
  console.error(`${context} error:`, error);

  // Determine error type and return appropriate response
  if (error instanceof SyntaxError) {
    return createApiResponse(
      { error: 'Invalid JSON in request body' },
      400
    );
  }

  if (error instanceof TypeError) {
    return createApiResponse(
      { error: 'Invalid request format' },
      400
    );
  }

  // Default: generic error (never expose internal details)
  return createApiResponse(
    { error: 'An unexpected error occurred. Please try again.' },
    500
  );
}
