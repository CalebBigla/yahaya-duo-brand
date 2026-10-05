/**
 * TypeScript types for quotation workflow
 */

// ============================================================================
// Quote Types
// ============================================================================

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'revision_requested';

export type ServiceType = 'travel' | 'trade' | 'both';

export interface Quote {
  id: string;
  quote_number: string;
  
  // Client details
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  
  // Enquiry link
  enquiry_id: string | null;
  
  // Quote content
  title: string;
  description: string | null;
  service_type: ServiceType;
  items: LineItem[];
  
  // Amounts
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  
  // Status & validity
  status: QuoteStatus;
  valid_until: string | null;
  
  // Additional info
  notes: string | null;
  terms: string | null;
  
  // Versioning
  version_number: number;
  parent_quote_id: string | null;
  superseded_by_quote_id: string | null;
  is_current_version: boolean;
  
  // Send tracking
  sent_at: string | null;
  sent_by: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ============================================================================
// Quote Response Types
// ============================================================================

export type ResponseType = 'accepted' | 'declined' | 'revision_requested';

export type ResponseMethod = 
  | 'online'
  | 'phone'
  | 'whatsapp'
  | 'email'
  | 'in_person'
  | 'other';

export interface QuoteResponse {
  id: string;
  quote_id: string;
  
  // Response details
  response_type: ResponseType;
  response_method: ResponseMethod;
  
  // Response content
  response_notes: string | null;
  requested_changes: string | null;
  decline_reason: string | null;
  
  // Tracking
  responded_at: string;
  recorded_by: string | null; // NULL = online submission
  client_ip_hash: string | null;
  
  // Metadata
  created_at: string;
}

// ============================================================================
// Quote Access Token Types
// ============================================================================

export interface QuoteAccessToken {
  id: string;
  quote_id: string;
  token: string;
  expires_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
  access_count: number;
}

export interface TokenValidation {
  quote_id: string | null;
  is_valid: boolean;
  is_expired: boolean;
  token_id: string | null;
}

// ============================================================================
// Extended Types (with relations)
// ============================================================================

export interface QuoteWithResponses extends Quote {
  responses: QuoteResponse[];
  latest_response?: QuoteResponse;
}

export interface QuoteWithVersions extends Quote {
  parent_quote?: Quote;
  revisions?: Quote[]; // All child versions
}

export interface QuoteWithToken extends Quote {
  access_token?: string;
  access_url?: string;
}

// ============================================================================
// Form Types
// ============================================================================

export interface CreateQuoteRequest {
  enquiry_id?: string;
  client_id?: string;
  client_name: string;
  client_email?: string;
  title: string;
  description?: string;
  service_type: ServiceType;
  items: LineItem[];
  tax_rate?: number;
  valid_until?: string;
  notes?: string;
  terms?: string;
}

export interface RecordResponseRequest {
  quote_id: string;
  response_type: ResponseType;
  response_method: ResponseMethod;
  response_notes?: string;
  requested_changes?: string;
  decline_reason?: string;
  responded_at?: string; // Defaults to now if not provided
}

export interface ClientQuoteResponse {
  response_type: ResponseType;
  response_notes?: string;
  requested_changes?: string;
  decline_reason?: string;
}

// ============================================================================
// Display/UI Types
// ============================================================================

export interface QuoteStats {
  total: number;
  draft: number;
  sent: number;
  pending: number;
  accepted: number;
  rejected: number;
  expired: number;
  revision_requested: number;
  total_value: number;
}

export interface QuoteStatusBadge {
  label: string;
  className: string;
  icon: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SendQuoteResult {
  success: boolean;
  token?: string;
  access_url?: string;
  whatsapp_url?: string;
  error?: string;
}

export interface CreateRevisionResult {
  success: boolean;
  new_quote_id?: string;
  new_quote_number?: string;
  error?: string;
}

// ============================================================================
// Filter Types
// ============================================================================

export type QuoteFilterStatus = 'all' | QuoteStatus;

export interface QuoteFilters {
  status?: QuoteFilterStatus;
  service_type?: ServiceType | 'all';
  client_id?: string;
  enquiry_id?: string;
  has_responses?: boolean;
  is_current?: boolean;
  date_from?: string;
  date_to?: string;
}
