import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  role: 'user' | 'owner' | 'admin';
  name: string | null;
  nick_name: string | null;
  phone_number: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}