import { createClient } from '@supabase/supabase-js'

// 모바일 환경을 위한 Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: {
      // Capacitor의 localStorage 사용
      async getItem(key: string) {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : null
      },
      async setItem(key: string, value: string) {
        localStorage.setItem(key, JSON.stringify(value))
      },
      async removeItem(key: string) {
        localStorage.removeItem(key)
      }
    }
  }
})