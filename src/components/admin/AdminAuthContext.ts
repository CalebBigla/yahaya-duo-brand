import { createContext } from 'react';
import type { AdminUser } from '@/lib/auth';

export interface AdminAuthState {
  status: 'checking' | 'authenticated' | 'error';
  user: AdminUser | null;
  errorMessage?: string;
}

export const AdminAuthContext = createContext<AdminAuthState | null>(null);
