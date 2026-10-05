/**
 * Create Quote from Enquiry Component
 * Button that appears on enquiry detail modal to quickly create a linked quote
 */

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

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
}

interface CreateQuoteFromEnquiryProps {
  enquiry: Enquiry;
  onClose?: () => void;
}

export function CreateQuoteFromEnquiry({ enquiry, onClose }: CreateQuoteFromEnquiryProps) {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreateQuote = () => {
    setIsCreating(true);

    // Determine service type from enquiry
    let serviceType: 'travel' | 'trade' | 'both' = 'travel';
    if (enquiry.form_type === 'trade') {
      serviceType = 'trade';
    } else if (enquiry.division?.toLowerCase().includes('trade')) {
      serviceType = 'trade';
    } else if (enquiry.division?.toLowerCase().includes('both')) {
      serviceType = 'both';
    }

    // Build quote data from enquiry
    const quoteData = {
      enquiry_id: enquiry.id,
      client_name: enquiry.name,
      client_email: enquiry.email || '',
      service_type: serviceType,
      title: `${enquiry.service || enquiry.destination || 'Service Request'} - ${enquiry.name}`,
      description: enquiry.message || '',
      from_enquiry: true,
    };

    // Store in sessionStorage to pre-fill the form
    sessionStorage.setItem('quote_from_enquiry', JSON.stringify(quoteData));

    // Close the modal if callback provided
    if (onClose) {
      onClose();
    }

    // Navigate to quotes page with create flag
    setTimeout(() => {
      navigate({ to: '/admin/quotes', search: { action: 'create', from: enquiry.id } });
    }, 100);
  };

  return (
    <button
      onClick={handleCreateQuote}
      disabled={isCreating}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isCreating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating Quote...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Create Quote from This Enquiry
        </>
      )}
    </button>
  );
}
