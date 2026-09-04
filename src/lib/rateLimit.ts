/**
 * Rate limiting utilities
 * Prevents abuse of public forms
 */
import { supabase } from './supabase';
import { hashIP } from './security';

/**
 * Check if an IP has exceeded rate limit for a specific form
 * @param ip IP address (will be hashed before storage)
 * @param formType Form type (travel, trade, contact)
 * @returns true if rate limit exceeded
 */
export async function checkRateLimit(
  ip: string,
  formType: string
): Promise<boolean> {
  const ipHash = hashIP(ip);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('rate_limit_log')
      .select('id')
      .eq('ip_hash', ipHash)
      .eq('form_type', formType)
      .gte('created_at', oneHourAgo);

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open to not block legitimate users on error
      return false;
    }

    // Max 5 submissions per hour per form type
    return (data?.length || 0) >= 5;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return false;
  }
}

/**
 * Log a submission attempt for rate limiting
 * @param ip IP address (will be hashed)
 * @param formType Form type
 */
export async function logSubmissionAttempt(
  ip: string,
  formType: string
): Promise<void> {
  const ipHash = hashIP(ip);

  try {
    await supabase.from('rate_limit_log').insert({
      ip_hash: ipHash,
      form_type: formType,
    });
  } catch (error) {
    console.error('Error logging submission attempt:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Get client IP address (for client-side rate limiting check)
 * Note: In production, IP should be obtained server-side via edge function
 * This is a fallback/placeholder
 */
export async function getClientIP(): Promise<string> {
  try {
    // In production, use a server-side endpoint to get real IP
    // For now, return a placeholder
    return '0.0.0.0';
  } catch {
    return '0.0.0.0';
  }
}
