/**
 * Send Quote Modal Component
 * Allows admin to generate secure link and share with client
 */

import { useState, useEffect } from 'react';
import { X, Send, Copy, CheckCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { getOrCreateQuoteToken, generateQuoteAccessUrl, generateWhatsAppShareLink } from '@/lib/quoteTokens';
import { supabase } from '@/lib/supabase';
import { queueQuery } from '@/lib/queryQueue';
import type { Quote } from '@/lib/types/quotes';

interface SendQuoteModalProps {
  quote: Quote;
  onClose: () => void;
  onSent?: () => void;
}

export function SendQuoteModal({ quote, onClose, onSent }: SendQuoteModalProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    generateLink();
  }, []);

  const generateLink = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Calculate valid until date (30 days from now if not set)
      const validDays = quote.valid_until 
        ? Math.ceil((new Date(quote.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30;

      // Generate or get existing token
      const result = await getOrCreateQuoteToken(quote.id, Math.max(validDays, 1));

      if (!result.success || !result.token) {
        throw new Error(result.error || 'Failed to generate access token');
      }

      setToken(result.token);
      
      // Generate URLs
      const url = generateQuoteAccessUrl(result.token);
      setQuoteUrl(url);

      // Generate WhatsApp link
      const waUrl = generateWhatsAppShareLink(result.token, quote.client_name);
      setWhatsappUrl(waUrl);

    } catch (err) {
      console.error('Error generating link:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate quote link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!quoteUrl) return;

    try {
      await navigator.clipboard.writeText(quoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  const handleMarkAsSent = async () => {
    try {
      setIsSending(true);

      // Update quote status and sent timestamp
      await queueQuery(async () => {
        const { error } = await supabase
          .from('quotes')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq('id', quote.id);

        if (error) throw error;
      });

      if (onSent) {
        onSent();
      }

      onClose();
    } catch (error) {
      console.error('Error marking as sent:', error);
      alert('Failed to update quote status');
    } finally {
      setIsSending(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
      // Don't automatically mark as sent - user might not complete the WhatsApp send
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl flex flex-col max-h-[90vh] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send Quote to Client</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {quote.quote_number} for {quote.client_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading State */}
          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Generating secure link...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-bold text-red-900 dark:text-red-100">Failed to Generate Link</h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                  <button
                    onClick={generateLink}
                    className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {!isGenerating && !error && quoteUrl && (
            <>
              {/* Info Banner */}
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="flex items-start gap-3">
                  <Send className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium">Secure link generated successfully!</p>
                    <p className="mt-1 text-blue-700 dark:text-blue-300">
                      Share this link with your client. They can view the quote and respond without creating an account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quotation Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quoteUrl}
                    readOnly
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  This link will be valid for {quote.valid_until 
                    ? `until ${new Date(quote.valid_until).toLocaleDateString()}` 
                    : '30 days'}
                </p>
              </div>

              {/* Sharing Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Share via
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* WhatsApp Button */}
                  {quote.client_email || true ? (
                    <button
                      onClick={handleWhatsAppShare}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-medium text-white hover:bg-[#20BA5A] transition-colors"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Share via WhatsApp
                    </button>
                  ) : null}

                  {/* Open in Browser */}
                  <button
                    onClick={() => window.open(quoteUrl, '_blank')}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Preview Quote Page
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Next Steps:</h3>
                <ol className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>Copy the link or share via WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>Send the link to your client through your preferred method</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    <span>Click "Mark as Sent" to update the quote status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">4.</span>
                    <span>You'll be notified when the client responds</span>
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer Actions */}
        {!isGenerating && !error && (
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 rounded-b-lg">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkAsSent}
              disabled={isSending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Mark as Sent
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
