/**
 * Security utilities for input validation and sanitization
 * All user input MUST pass through these functions
 */
import DOMPurify from 'dompurify';
import { createHash } from 'crypto';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Default: strips ALL HTML tags and attributes
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed by default
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content, just remove tags
  });
}

/**
 * Sanitize HTML but allow safe formatting (for rich text fields if needed)
 * Use sparingly and only where absolutely necessary
 */
export function sanitizeHtmlAllowBasic(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href'],
    ALLOWED_URI_REGEXP: /^https?:/,
  });
}

/**
 * Validate email format using RFC 5322 compliant regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 max length
}

/**
 * Validate phone format (international format)
 * Accepts various formats, validates length
 */
export function isValidPhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Must be 10-15 digits, optionally starting with +
  return /^\+?\d{10,15}$/.test(cleaned);
}

/**
 * Detect malicious patterns that could indicate an attack
 * Returns true if suspicious patterns are found
 */
export function containsMaliciousPatterns(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const maliciousPatterns = [
    // Script injection
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,

    // Event handlers
    /on\w+\s*=/gi, // onclick=, onerror=, etc.

    // Dangerous HTML elements
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
    /<applet/gi,
    /<meta/gi,
    /<link/gi,

    // Data URIs that could contain scripts
    /data:text\/html/gi,

    // SQL injection attempts (basic)
    /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b)/gi,
    /(\bDROP\b.*\bTABLE\b)|(\bDELETE\b.*\bFROM\b)/gi,

    // Command injection attempts
    /[;&|`$()]/g,

    // Path traversal
    /\.\.[\/\\]/g,
  ];

  return maliciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Hash an IP address with salt for privacy-preserving rate limiting
 * Never stores raw IP addresses
 */
export function hashIP(ip: string): string {
  // Get salt from environment, fail loudly if not set in production
  const salt = import.meta.env.VITE_IP_SALT;

  if (!salt || salt === 'change-this-to-a-random-string-in-production') {
    if (import.meta.env.PROD) {
      throw new Error('IP_SALT must be set in production environment');
    }
    console.warn('Using default IP salt - this is insecure for production!');
  }

  const saltToUse = salt || 'development-only-salt';

  // Use SHA-256 for hashing
  return createHash('sha256')
    .update(ip + saltToUse)
    .digest('hex');
}

/**
 * Validate that a form submission doesn't exceed size limits
 * Prevents DoS attacks via oversized payloads
 */
export function validateSubmissionSize(data: Record<string, any>): {
  valid: boolean;
  error?: string;
} {
  const MAX_FIELD_LENGTH = 5000; // Max characters per field
  const MAX_TOTAL_SIZE = 10000; // Max total characters across all fields
  const MAX_FIELDS = 20; // Max number of fields

  // Check number of fields
  if (Object.keys(data).length > MAX_FIELDS) {
    return {
      valid: false,
      error: 'Too many fields in submission',
    };
  }

  let totalSize = 0;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Check individual field length
      if (value.length > MAX_FIELD_LENGTH) {
        return {
          valid: false,
          error: `Field "${key}" exceeds maximum length of ${MAX_FIELD_LENGTH} characters`,
        };
      }
      totalSize += value.length;
    }
  }

  // Check total size
  if (totalSize > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: 'Total submission size exceeds maximum allowed',
    };
  }

  return { valid: true };
}

/**
 * Check honeypot field (anti-bot measure)
 * Honeypot field should be invisible to real users but filled by bots
 * @param value Value of honeypot field
 * @returns true if legitimate (honeypot is empty), false if bot detected
 */
export function checkHoneypot(value: string | undefined): boolean {
  return !value || value.trim() === '';
}

/**
 * Validate that required fields are present and non-empty
 */
export function validateRequiredFields(
  data: Record<string, any>,
  required: string[]
): {
  valid: boolean;
  missing?: string[];
} {
  const missing: string[] = [];

  for (const field of required) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Escape special characters for safe inclusion in HTML attributes
 */
export function escapeHtmlAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Validate URL to ensure it's safe (no javascript:, data:, etc.)
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Truncate string to maximum length
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Generate a secure random string (for tokens, etc.)
 * Note: For production use, consider using a server-side implementation
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
