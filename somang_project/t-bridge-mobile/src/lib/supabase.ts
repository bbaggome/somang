import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://bbxycbghbatcovzuiotu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHljYmdoYmF0Y292enVpb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzg2NzUsImV4cCI6MjA1Mjk1NDY3NX0.1WGGN-yZGNhbwlX6dEn2cKHPRnFE1eJWwYpfGr3TCqg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});