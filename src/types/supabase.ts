export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      payment_requests: {
        Row: {
          id: string
          amount: number
          description: string
          recipient: string
          status: 'pending' | 'paid' | 'cancelled'
          created_at: string
          payment_method: string | null
          payment_date: string | null
          note: string | null
          user_id: string
        }
        Insert: {
          id?: string
          amount: number
          description: string
          recipient: string
          status: 'pending' | 'paid' | 'cancelled'
          created_at?: string
          payment_method?: string | null
          payment_date?: string | null
          note?: string | null
          user_id: string
        }
        Update: {
          id?: string
          amount?: number
          description?: string
          recipient?: string
          status?: 'pending' | 'paid' | 'cancelled'
          created_at?: string
          payment_method?: string | null
          payment_date?: string | null
          note?: string | null
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}