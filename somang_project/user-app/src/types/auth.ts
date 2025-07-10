export interface Profile {
  id: string;
  role: 'user' | 'owner' | 'admin';
  name: string;
  nick_name?: string;
  phone_number?: string;
  created_at: string;
  deleted_at?: string;
}

export interface AuthContextType {
  user: any; // Supabase User 타입
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}