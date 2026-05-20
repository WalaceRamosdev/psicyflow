import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://rgcgxiuhvzvjhxnolnic.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY2d4aXVodnp2amh4bm9sbmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjQ5ODksImV4cCI6MjA5NDgwMDk4OX0.afYc85o_YKVbLSrFXvCpcZdynks1_s_ig5pHSPtYgzw';

// Prevents Node.js SSR from crashing due to WebSocket checks on versions < Node 22.
// Renders safely as a dummy Proxy on the server, and as the real Supabase Client in the browser.
export const supabase = typeof window !== 'undefined'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({}, {
      get: (target, prop) => {
        return () => {
          return {
            from: () => ({
              select: () => ({ limit: () => ({}) }),
              insert: () => ({ select: () => ({ single: () => ({}) }) }),
              eq: () => ({ eq: () => ({}) })
            })
          };
        };
      }
    }) as any;
