import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { queueQuery } from '@/lib/queryQueue';
import { X, Inbox, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'enquiry' | 'quote_accepted' | 'quote_rejected';
  title: string;
  message: string;
  link: string;
  created_at: string;
  isNew: boolean;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const notificationsList: Notification[] = [];

      // Load new enquiries (created in last 7 days, status: new)
      const enquiriesResult = await queueQuery(async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data, error } = await supabase
          .from('submissions')
          .select('id, name, email, form_type, created_at, status')
          .eq('status', 'new')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        return data || [];
      });

      enquiriesResult.forEach((enquiry) => {
        notificationsList.push({
          id: `enquiry-${enquiry.id}`,
          type: 'enquiry',
          title: 'New Enquiry',
          message: `${enquiry.name} sent a ${enquiry.form_type} enquiry`,
          link: '/admin/enquiries',
          created_at: enquiry.created_at,
          isNew: enquiry.status === 'new',
        });
      });

      // Load recently accepted quotes (updated in last 7 days, status: accepted)
      const acceptedQuotesResult = await queueQuery(async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data, error } = await supabase
          .from('quotes')
          .select('id, quote_number, client_name, title, updated_at')
          .eq('status', 'accepted')
          .gte('updated_at', sevenDaysAgo.toISOString())
          .order('updated_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        return data || [];
      });

      acceptedQuotesResult.forEach((quote) => {
        notificationsList.push({
          id: `quote-accepted-${quote.id}`,
          type: 'quote_accepted',
          title: 'Quote Accepted',
          message: `${quote.client_name} accepted ${quote.quote_number}`,
          link: '/admin/quotes',
          created_at: quote.updated_at,
          isNew: true,
        });
      });

      // Load recently rejected quotes (updated in last 7 days, status: rejected)
      const rejectedQuotesResult = await queueQuery(async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data, error } = await supabase
          .from('quotes')
          .select('id, quote_number, client_name, title, updated_at')
          .eq('status', 'rejected')
          .gte('updated_at', sevenDaysAgo.toISOString())
          .order('updated_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        return data || [];
      });

      rejectedQuotesResult.forEach((quote) => {
        notificationsList.push({
          id: `quote-rejected-${quote.id}`,
          type: 'quote_rejected',
          title: 'Quote Rejected',
          message: `${quote.client_name} rejected ${quote.quote_number}`,
          link: '/admin/quotes',
          created_at: quote.updated_at,
          isNew: true,
        });
      });

      // Sort by date (newest first)
      notificationsList.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'enquiry':
        return <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'quote_accepted':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'quote_rejected':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'enquiry':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'quote_accepted':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'quote_rejected':
        return 'bg-red-100 dark:bg-red-900/30';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-16 right-6 z-50 w-96 max-h-[calc(100vh-5rem)] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last 7 days
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-3">
                <Inbox className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">No new notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link}
                  onClick={onClose}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getNotificationBg(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        {notification.isNew && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(notification.created_at), 'MMM dd, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <Link
              to="/admin/enquiries"
              onClick={onClose}
              className="block text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View all activity
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
