/**
 * Quote Response Management
 * Handles recording and retrieving client responses to quotations
 */

import { supabase } from './supabase';
import type {
  QuoteResponse,
  RecordResponseRequest,
  ClientQuoteResponse,
  ResponseType,
} from './types/quotes';

/**
 * Record a customer response (manually by admin)
 * Used when response is received via phone, WhatsApp, email, etc.
 * @param request The response details
 * @param recordedBy The admin user ID
 */
export async function recordCustomerResponse(
  request: RecordResponseRequest,
  recordedBy: string
): Promise<{ success: boolean; response_id?: string; error?: string }> {
  try {
    // Validate quote exists
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, status, client_name')
      .eq('id', request.quote_id)
      .single();

    if (quoteError) throw quoteError;

    // Insert response
    const { data, error } = await supabase
      .from('quote_responses')
      .insert([
        {
          quote_id: request.quote_id,
          response_type: request.response_type,
          response_method: request.response_method,
          response_notes: request.response_notes || null,
          requested_changes: request.requested_changes || null,
          decline_reason: request.decline_reason || null,
          responded_at: request.responded_at || new Date().toISOString(),
          recorded_by: recordedBy,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update quote status based on response type
    const newStatus = getStatusFromResponseType(request.response_type);
    
    await supabase
      .from('quotes')
      .update({ status: newStatus })
      .eq('id', request.quote_id);

    return { success: true, response_id: data.id };
  } catch (error) {
    console.error('Error recording customer response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record response',
    };
  }
}

/**
 * Submit a client response (online via public page)
 * @param quoteId The quote ID
 * @param token The access token (for validation)
 * @param response The client's response
 * @param ipHash Optional IP hash for tracking
 */
export async function submitClientResponse(
  quoteId: string,
  token: string,
  response: ClientQuoteResponse,
  ipHash?: string
): Promise<{ success: boolean; response_id?: string; error?: string }> {
  try {
    // Call the secure RPC function that handles validation, insertion, and status update
    const { data, error } = await supabase.rpc('submit_public_quote_response', {
      p_quote_id: quoteId,
      p_token: token,
      p_response_type: response.response_type,
      p_response_notes: response.response_notes || null,
      p_requested_changes: response.requested_changes || null,
      p_decline_reason: response.decline_reason || null,
      p_client_ip_hash: ipHash || null,
    });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    // The RPC function returns JSON with { success, response_id?, error? }
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from server');
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to submit response',
      };
    }

    return {
      success: true,
      response_id: data.response_id,
    };
  } catch (error) {
    console.error('Error submitting client response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit response',
    };
  }
}

/**
 * Get all responses for a quote
 * @param quoteId The quote ID
 * @returns Array of responses, ordered by most recent first
 */
export async function getQuoteResponses(
  quoteId: string
): Promise<{ success: boolean; responses?: QuoteResponse[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('quote_responses')
      .select('*')
      .eq('quote_id', quoteId)
      .order('responded_at', { ascending: false });

    if (error) throw error;

    return { success: true, responses: data || [] };
  } catch (error) {
    console.error('Error fetching quote responses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch responses',
    };
  }
}

/**
 * Get the most recent response for a quote
 * @param quoteId The quote ID
 * @returns The latest response or null
 */
export async function getLatestQuoteResponse(
  quoteId: string
): Promise<{ success: boolean; response?: QuoteResponse | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('quote_responses')
      .select('*')
      .eq('quote_id', quoteId)
      .order('responded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = no rows, which is okay
      if (error.code === 'PGRST116') {
        return { success: true, response: null };
      }
      throw error;
    }

    return { success: true, response: data };
  } catch (error) {
    console.error('Error fetching latest response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch response',
    };
  }
}

/**
 * Check if a quote has already been responded to
 * Prevents duplicate responses
 * @param quoteId The quote ID
 */
export async function hasQuoteBeenResponded(
  quoteId: string
): Promise<{ responded: boolean; response?: QuoteResponse }> {
  try {
    const { data, error } = await supabase
      .from('quote_responses')
      .select('*')
      .eq('quote_id', quoteId)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { responded: false };
      }
      throw error;
    }

    return { responded: true, response: data };
  } catch (error) {
    console.error('Error checking response status:', error);
    return { responded: false };
  }
}

/**
 * Map response type to quote status
 * @param responseType The type of response
 */
function getStatusFromResponseType(responseType: ResponseType): string {
  switch (responseType) {
    case 'accepted':
      return 'accepted';
    case 'declined':
      return 'rejected';
    case 'revision_requested':
      return 'revision_requested';
    default:
      return 'pending';
  }
}

/**
 * Get human-readable response method label
 * @param method The response method
 */
export function getResponseMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    online: 'Online (Website)',
    phone: 'Phone Call',
    whatsapp: 'WhatsApp',
    email: 'Email',
    in_person: 'In Person',
    other: 'Other',
  };

  return labels[method] || method;
}

/**
 * Get response type label and color
 * @param responseType The response type
 */
export function getResponseTypeBadge(responseType: ResponseType): {
  label: string;
  className: string;
} {
  const badges = {
    accepted: {
      label: 'Accepted',
      className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    },
    declined: {
      label: 'Declined',
      className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    },
    revision_requested: {
      label: 'Changes Requested',
      className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    },
  };

  return badges[responseType];
}
