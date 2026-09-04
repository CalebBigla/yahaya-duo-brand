/**
 * Supabase Client Configuration
 * Security: Only uses anon key (safe for client-side), RLS enforces all access control
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables - NEVER commit actual values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Create Supabase client with security options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage (considered safe for this use case)
    // Alternative: use 'cookie' for SSR apps
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      // Add custom headers if needed
    },
  },
});

/**
 * Database types for TypeScript safety
 */
export type Database = {
  public: {
    Tables: {
      content_blocks: {
        Row: {
          id: string;
          page: 'home' | 'travel' | 'trade' | 'about' | 'contact';
          section_key: string;
          content: string | null;
          image_url: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['content_blocks']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['content_blocks']['Insert']>;
      };
      submissions: {
        Row: {
          id: string;
          form_type: 'travel' | 'trade' | 'contact';
          name: string;
          email: string | null;
          phone: string | null;
          division: string | null;
          destination: string | null;
          dates: string | null;
          service: string | null;
          message: string | null;
          status: 'new' | 'read' | 'responded';
          created_at: string;
          ip_hash: string | null;
        };
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'id' | 'created_at' | 'status'>;
        Update: {
          status?: 'new' | 'read' | 'responded';
        };
      };
      admin_users: {
        Row: {
          user_id: string;
          role: 'editor' | 'owner';
          added_at: string;
          added_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'added_at'>;
        Update: {
          role?: 'editor' | 'owner';
        };
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_table: string;
          target_id: string | null;
          old_value: Record<string, unknown> | null;
          new_value: Record<string, unknown> | null;
          ip_hash: string | null;
          user_agent: string | null;
          created_at: string;
        };
      };
      rate_limit_log: {
        Row: {
          id: string;
          ip_hash: string;
          form_type: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rate_limit_log']['Row'], 'id' | 'created_at'>;
      };
    };
  };
};
