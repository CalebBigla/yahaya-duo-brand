/**
 * Public Quotation View Page
 * Clients access this via secure token link to view and respond to quotes
 * Route: /quote/view/[token]
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Calendar,
  Building2,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { validateQuoteToken } from '@/lib/quoteTokens';
import { submitClientResponse } from '@/lib/quoteResponses';
import { hasQuoteBeenResponded } from '@/lib/quoteResponses';
import { PageHero } from '@/components/site/PageHero';
import { site } from '@/lib/site';

export const Route = createFileRoute('/quote/view/$token')({
  component: PublicQuoteView,
});

interface Quote {
  id: string;
  quote_number: string;
  client_name: string;
  client_email: string | null;
  title: string;
  description: string | null;
  service_type: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  valid_until: string | null;
  terms: string | null;
  status: string;
  created_at: string;
}

type ResponseType = 'accepted' | 'declined' | 'revision_requested';

function PublicQuoteView() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [existingResponse, setExistingResponse] = useState<any>(null);
  
  // Response flow state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<ResponseType | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [token]);

  const loadQuote = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate token
      const validation = await validateQuoteToken(token);
      
      if (!validation.success || !validation.validation?.is_valid) {
        if (validation.validation?.is_expired) {
          setError('This quotation link has expired. Please contact us for an updated quote.');
        } else {
          setError('Invalid quotation link. Please check the URL and try again.');
        }
        setIsLoading(false);
        return;
      }

      const quoteId = validation.validation.quote_id;

      // Check if already responded
      const responseCheck = await hasQuoteBeenResponded(quoteId);
      if (responseCheck.responded) {
        setHasResponded(true);
        setExistingResponse(responseCheck.response);
      }

      // Fetch quote details
      const { data, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      setQuote(data);
    } catch (err) {
      console.error('Error loading quote:', err);
      setError('Failed to load quotation. Please try again or contact us.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseClick = (type: ResponseType) => {
    setSelectedResponse(type);
    setResponseNotes('');
    setRequestedChanges('');
    setDeclineReason('');
    setShowConfirmModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!quote || !selectedResponse) return;

    setIsSubmitting(true);

    try {
      const response = {
        response_type: selectedResponse,
        response_notes: responseNotes || undefined,
        requested_changes: selectedResponse === 'revision_requested' ? requestedChanges : undefined,
        decline_reason: selectedResponse === 'declined' ? declineReason : undefined,
      };

      const result = await submitClientResponse(quote.id, token, response);

      if (result.success) {
        setSubmitSuccess(true);
        setHasResponded(true);
        setShowConfirmModal(false);
        
        // Reload quote to get updated status
        setTimeout(() => {
          loadQuote();
        }, 1000);
      } else {
        alert(result.error || 'Failed to submit response. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('An error occurred. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your quotation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quote) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center bg-secondary/30 px-4 py-16">
          <div className="max-w-md text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 p-4">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Unable to Load Quotation</h1>
            <p className="mt-3 text-muted-foreground">{error}</p>
            <div className="mt-6 space-y-3">
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Mail className="h-4 w-4" />
                Contact Us
              </a>
              <p className="text-xs text-muted-foreground">
                Or call us at {site.phones[0]}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if quote is expired
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container-page py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">{site.name}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{site.addressLine}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Quotation</div>
              <div className="text-lg font-bold text-foreground">{quote.quote_number}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container-page py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          
          {/* Success Message */}
          {submitSuccess && (
            <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-bold text-green-900 dark:text-green-100">Response Submitted Successfully!</h3>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    Thank you for your response. We've received it and will get back to you shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Already Responded Message */}
          {hasResponded && !submitSuccess && existingResponse && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
              <div className="flex items-start gap-4">
                <FileText className="h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-100">You've Already Responded</h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    You {existingResponse.response_type === 'accepted' ? 'accepted' : 
                         existingResponse.response_type === 'declined' ? 'declined' :
                         'requested changes to'} this quotation on{' '}
                    {format(new Date(existingResponse.responded_at), 'MMM d, yyyy')}
                  </p>
                  {existingResponse.response_notes && (
                    <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                      Your note: "{existingResponse.response_notes}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Expiry Warning */}
          {isExpired && (
            <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  This quotation expired on {format(new Date(quote.valid_until!), 'MMMM d, yyyy')}. 
                  Please contact us for an updated quote.
                </p>
              </div>
            </div>
          )}

          {/* Quote Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-8">
            {/* Client Info */}
            <div className="mb-6 border-b border-border pb-6">
              <h2 className="text-sm font-medium text-muted-foreground">Prepared for:</h2>
              <p className="mt-1 text-lg font-bold text-foreground">{quote.client_name}</p>
              {quote.client_email && (
                <p className="text-sm text-muted-foreground">{quote.client_email}</p>
              )}
            </div>

            {/* Quote Details */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{quote.title}</h1>
                {quote.description && (
                  <p className="mt-2 text-muted-foreground">{quote.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Issued: {format(new Date(quote.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                {quote.valid_until && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Valid until: {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="mt-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Items
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Qty</th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Price</th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quote.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 text-sm text-foreground">{item.description}</td>
                        <td className="py-3 text-right text-sm text-muted-foreground">{item.quantity}</td>
                        <td className="py-3 text-right text-sm text-muted-foreground">
                          ₦{item.unit_price.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-sm font-medium text-foreground">
                          ₦{item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-border">
                    <tr>
                      <td colSpan={3} className="pt-4 text-right text-sm font-medium text-foreground">
                        Subtotal:
                      </td>
                      <td className="pt-4 text-right text-sm font-medium text-foreground">
                        ₦{quote.subtotal.toLocaleString()}
                      </td>
                    </tr>
                    {quote.tax_rate > 0 && (
                      <tr>
                        <td colSpan={3} className="pt-2 text-right text-sm text-muted-foreground">
                          Tax ({quote.tax_rate}%):
                        </td>
                        <td className="pt-2 text-right text-sm text-muted-foreground">
                          ₦{quote.tax_amount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="pt-3 text-right text-lg font-bold text-foreground">
                        Total:
                      </td>
                      <td className="pt-3 text-right text-2xl font-bold text-primary">
                        ₦{quote.total_amount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Terms */}
            {quote.terms && (
              <div className="mt-8 rounded-lg bg-secondary/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Terms & Conditions</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{quote.terms}</p>
              </div>
            )}
          </div>

          {/* Response Actions */}
          {!hasResponded && !isExpired && (
            <div className="rounded-lg border border-border bg-card p-6 shadow-card">
              <h3 className="mb-4 text-lg font-bold text-foreground">Your Response</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Please review the quotation above and let us know your decision:
              </p>
              
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={() => handleResponseClick('accepted')}
                  className="flex flex-col items-center gap-3 rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 transition-all hover:border-green-400 hover:shadow-md"
                >
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div className="text-center">
                    <div className="font-bold text-green-900 dark:text-green-100">Accept Quote</div>
                    <div className="text-xs text-green-700 dark:text-green-300">Proceed with this offer</div>
                  </div>
                </button>

                <button
                  onClick={() => handleResponseClick('revision_requested')}
                  className="flex flex-col items-center gap-3 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 transition-all hover:border-blue-400 hover:shadow-md"
                >
                  <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div className="text-center">
                    <div className="font-bold text-blue-900 dark:text-blue-100">Request Changes</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">Modify this quote</div>
                  </div>
                </button>

                <button
                  onClick={() => handleResponseClick('declined')}
                  className="flex flex-col items-center gap-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-4 transition-all hover:border-gray-400 hover:shadow-md"
                >
                  <XCircle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                  <div className="text-center">
                    <div className="font-bold text-gray-900 dark:text-gray-100">Decline Quote</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300">Not interested</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Questions about this quotation?</p>
            <div className="mt-3 flex flex-wrap justify-center gap-4">
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                {site.email}
              </a>
              <a
                href={`tel:${site.phones[0]}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {site.phones[0]}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-xl">
            <div className="border-b border-border p-6">
              <h2 className="text-xl font-bold text-foreground">
                {selectedResponse === 'accepted' && 'Confirm Acceptance'}
                {selectedResponse === 'declined' && 'Confirm Decline'}
                {selectedResponse === 'revision_requested' && 'Request Changes'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {selectedResponse === 'accepted' && (
                <p className="text-sm text-muted-foreground">
                  By accepting this quotation, you're indicating your interest to proceed with these services. 
                  We'll contact you to finalize the details.
                </p>
              )}

              {selectedResponse === 'declined' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    We're sorry this quotation doesn't meet your needs. Would you like to tell us why?
                  </p>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Reason for declining (optional)"
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              )}

              {selectedResponse === 'revision_requested' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Please describe the changes you'd like us to make:
                  </p>
                  <textarea
                    value={requestedChanges}
                    onChange={(e) => setRequestedChanges(e.target.value)}
                    placeholder="What would you like us to change?"
                    rows={4}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Additional Notes (Optional)</label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Any other comments..."
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border p-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || (selectedResponse === 'revision_requested' && !requestedChanges.trim())}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Confirm
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container-page text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
