import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ipxdozgrihqogtdbhkyf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlweGRvemdyaWhxb2d0ZGJoa3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzQwNDYsImV4cCI6MjA3NTAxMDA0Nn0.LZl2VFTnyhljR4w_f3lKLIzclqMAy7NNx30eYJjn5QI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
