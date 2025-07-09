import type { UserProfile } from './auth';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
    };
  };
}