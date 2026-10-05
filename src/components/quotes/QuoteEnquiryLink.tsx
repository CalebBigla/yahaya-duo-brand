/**
 * Quote Enquiry Link Component
 * Displays the linked enquiry information on quote detail page
 */

import { useState, useEffect } from 'react';
import { MessageSquare, User, Mail, Phone, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { queueQuery } from '@/lib/queryQueue';

interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  form_type: 'travel' | 'trade' | 'contact';
  service: string | null;
  destination: string | null;
  division: string | null;
  message: string | null;
  created_at: string;
}

interface QuoteEnquiryLinkProps {
  enquiryId: string;
}

export function QuoteEnquiryLink({ enquiryId }: QuoteEnquiryLinkProps) {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEnquiry();
  }, [enquiryId]);

  const loadEnquiry = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', enquiryId)
          .single();

        if (error) throw error;
        return data;
      });

      setEnquiry(data);
    } catch (error) {
      console.error('Error loading enquiry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading enquiry...</span>
        </div>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Original enquiry not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Linked to Enquiry
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Submitted {format(new Date(enquiry.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-blue-200 dark:border-blue-800 p-4 space-y-3">
          {/* Contact Info */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white font-medium">{enquiry.name}</span>
            </div>
            {enquiry.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${enquiry.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {enquiry.email}
                </a>
              </div>
            )}
            {enquiry.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${enquiry.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {enquiry.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {format(new Date(enquiry.created_at), 'MMM d, yyyy • HH:mm')}
              </span>
            </div>
          </div>

          {/* Service/Destination */}
          {(enquiry.service || enquiry.destination || enquiry.division) && (
            <div className="rounded-lg bg-white dark:bg-gray-900/50 p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Service Requested
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {enquiry.service || enquiry.destination || enquiry.division}
              </p>
            </div>
          )}

          {/* Original Message */}
          {enquiry.message && (
            <div className="rounded-lg bg-white dark:bg-gray-900/50 p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Original Enquiry
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {enquiry.message}
              </p>
            </div>
          )}

          {/* Link to Enquiry */}
          <div className="pt-2">
            <a
              href={`/admin/enquiries`}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View full enquiry details →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
