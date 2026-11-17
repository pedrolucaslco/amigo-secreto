import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

export type Profile = {
  id: string
  name: string
  email: string
  is_admin: boolean
  surprise: boolean
}

export type Book = {
  id: number
  user_id: string
  title: string
  author: string
  link: string | null
}
