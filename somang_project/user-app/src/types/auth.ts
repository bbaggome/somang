export interface Profile {
  id: string;
  role: 'user' | 'owner' | 'admin';
  name: string;
  nick_name?: string;
  phone_number?: string;
  created_at: string;
  deleted_at?: string;
}

import type { User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitializing?: boolean; // 초기화 로딩 상태 추가
  signOut: () => Promise<void>;
}