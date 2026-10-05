/**
 * Quote Token Management
 * Handles generation and validation of secure access tokens
 */

import { supabase } from './supabase';
import type { TokenValidation, QuoteAccessToken } from './types/quotes';

/**
 * Generate a secure access token for a quote
 * @param quoteId The quote ID
 * @param daysValid Number of days the token is valid (0 = no expiry)
 * @returns The generated token string
 */
export async function generateQuoteToken(
  quoteId: string,
  daysValid: number = 30
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('generate_quote_access_token', {
      p_quote_id: quoteId,
      p_days_valid: daysValid,
    });

    if (error) throw error;

    return { success: true, token: data };
  } catch (error) {
    console.error('Error generating quote token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate token',
    };
  }
}

/**
 * Validate a quote access token
 * @param token The token to validate
 * @returns Validation result with quote_id if valid
 */
export async function validateQuoteToken(
  token: string
): Promise<{ success: boolean; validation?: TokenValidation; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('validate_quote_token', {
      p_token: token,
    });

    if (error) throw error;

    // RPC returns an array, take first result
    const validation = Array.isArray(data) ? data[0] : data;

    return { success: true, validation };
  } catch (error) {
    console.error('Error validating token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate token',
    };
  }
}

/**
 * Get quote ID from a valid token
 * @param token The access token
 * @returns Quote ID or null if invalid
 */
export async function getQuoteIdFromToken(token: string): Promise<string | null> {
  const result = await validateQuoteToken(token);
  
  if (!result.success || !result.validation?.is_valid) {
    return null;
  }
  
  return result.validation.quote_id;
}

/**
 * Get or create an access token for a quote
 * Reuses existing valid token if available
 * @param quoteId The quote ID
 * @param daysValid Days until expiry
 */
export async function getOrCreateQuoteToken(
  quoteId: string,
  daysValid: number = 30
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Check for existing valid token
    const { data: existingTokens, error: fetchError } = await supabase
      .from('quote_access_tokens')
      .select('*')
      .eq('quote_id', quoteId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    if (existingTokens && existingTokens.length > 0) {
      return { success: true, token: existingTokens[0].token };
    }

    // No valid token exists, generate new one
    return await generateQuoteToken(quoteId, daysValid);
  } catch (error) {
    console.error('Error getting/creating token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get token',
    };
  }
}

/**
 * Generate public access URL for a quote
 * @param token The access token
 * @returns Full URL to public quote page
 */
export function generateQuoteAccessUrl(token: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.VITE_PUBLIC_URL || 'https://yahayatravelandtrade.com';
  
  return `${baseUrl}/quote/view/${token}`;
}

/**
 * Generate WhatsApp share link with quote
 * @param token The access token
 * @param clientName Client's name for personalization
 * @returns WhatsApp URL
 */
export function generateWhatsAppShareLink(token: string, clientName: string): string {
  const quoteUrl = generateQuoteAccessUrl(token);
  const whatsappNumber = '2349127650968'; // From site config
  
  const message = `Hello ${clientName},

Thank you for your enquiry. We've prepared a detailed quotation for you.

Please review it here:
${quoteUrl}

You can accept the quote, request changes, or decline directly through the link.

If you have any questions, feel free to reach out.

Best regards,
Yahaya Travel and Trade Co Ltd`;

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Revoke a quote access token
 * @param tokenId The token ID to revoke
 */
export async function revokeQuoteToken(
  tokenId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('quote_access_tokens')
      .update({ expires_at: new Date().toISOString() })
      .eq('id', tokenId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error revoking token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke token',
    };
  }
}

/**
 * Get all tokens for a quote (for admin view)
 * @param quoteId The quote ID
 */
export async function getQuoteTokens(
  quoteId: string
): Promise<{ success: boolean; tokens?: QuoteAccessToken[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('quote_access_tokens')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, tokens: data || [] };
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tokens',
    };
  }
}
