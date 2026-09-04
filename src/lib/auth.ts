/**
 * Authentication Utilities
 * Security-first implementation with proper session management
 */

import { supabase, type Database } from './supabase';

export type AdminUser = Database['public']['Tables']['admin_users']['Row'];

/**
 * Check if the current user is authenticated and is an admin
 * @returns Admin user record if authorized, null otherwise
 */
export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  user: AdminUser | null;
  session: any | null;
  error?: 'NO_SESSION' | 'DATABASE_ERROR' | 'NOT_ADMIN';
}> {
  try {
    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { isAdmin: false, user: null, session: null, error: 'NO_SESSION' };
    }

    // Check if user is in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    // Distinguish between database errors and "user not found"
    if (adminError) {
      // PGRST116 = no rows returned (user is not an admin)
      if (adminError.code === 'PGRST116') {
        console.log('User is not in admin_users table');
        return { isAdmin: false, user: null, session, error: 'NOT_ADMIN' };
      }
      
      // Any other error is a database/server error
      console.error('Database error checking admin access:', adminError);
      return { isAdmin: false, user: null, session, error: 'DATABASE_ERROR' };
    }

    if (!adminUser) {
      return { isAdmin: false, user: null, session, error: 'NOT_ADMIN' };
    }

    return { isAdmin: true, user: adminUser, session };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return { isAdmin: false, user: null, session: null, error: 'DATABASE_ERROR' };
  }
}

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 * @returns Session data or error
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return {
        success: false,
        error: `Authentication failed: ${error.message}`,
      };
    }

    // Check if user is an admin
    const adminCheck = await checkAdminAccess();

    if (adminCheck.error === 'DATABASE_ERROR') {
      // Database error - don't sign them out, show proper error
      return {
        success: false,
        error: 'Unable to verify admin privileges due to a database error. Please try again or contact support.',
      };
    }

    if (!adminCheck.isAdmin) {
      // Sign them out immediately if not an admin
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Access denied. You do not have admin privileges.',
      };
    }

    // Log successful login to audit log
    await logAuditEvent('LOGIN', 'auth', data.session?.user.id || null, {
      success: true,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      session: data.session,
      user: data.user,
    };
  } catch (error) {
    console.error('Sign in error:', error);

    // Log failed login attempt
    await logAuditEvent('LOGIN_FAILED', 'auth', null, {
      success: false,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: 'An error occurred during sign in. Please try again.',
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Failed to sign out' };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: 'An error occurred during sign out' };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (session: any | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

/**
 * Log an audit event (for security-critical actions)
 * Note: This is a client-side helper - actual audit logs are created via database triggers
 */
async function logAuditEvent(
  action: string,
  targetTable: string,
  targetId: string | null,
  details: Record<string, unknown>
) {
  try {
    // Get current session to identify actor
    const session = await getCurrentSession();

    if (!session) {
      // Can't log without a session for most actions
      return;
    }

    // Insert into audit_log via RPC or direct insert if permitted
    // Note: In production, this should ideally be handled server-side via edge function
    const { error } = await supabase.from('audit_log').insert({
      actor_id: session.user.id,
      action,
      target_table: targetTable,
      target_id: targetId,
      new_value: details,
      ip_hash: null, // Would be set server-side
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

/**
 * Check if user has owner role (for sensitive operations)
 */
export async function isOwner(): Promise<boolean> {
  const adminCheck = await checkAdminAccess();
  return adminCheck.isAdmin && adminCheck.user?.role === 'owner';
}

/**
 * Inactivity timeout manager for admin sessions
 * Auto-logout after 30 minutes of inactivity
 */
export class InactivityManager {
  private timeout: NodeJS.Timeout | null = null;
  private readonly TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor() {
    if (typeof window !== 'undefined') {
      this.resetTimer();
      this.attachListeners();
    }
  }

  private resetTimer() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(async () => {
      // Check if we're on an admin route
      if (window.location.pathname.startsWith('/admin')) {
        await signOut();
        window.location.href = '/admin/login?timeout=true';
      }
    }, this.TIMEOUT_DURATION);
  }

  private attachListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      document.addEventListener(event, () => this.resetTimer(), true);
    });
  }

  public destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}
