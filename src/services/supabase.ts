import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// URL do seu projeto Supabase (lida das variáveis de ambiente com fallback local)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rgcgxiuhvzvjhxnolnic.supabase.co';

// Substitua pelo valor da sua "Anon Public Key" lida das variáveis de ambiente com fallback local
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY2d4aXVodnp2amh4bm9sbmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjQ5ODksImV4cCI6MjA5NDgwMDk4OX0.afYc85o_YKVbLSrFXvCpcZdynks1_s_ig5pHSPtYgzw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
