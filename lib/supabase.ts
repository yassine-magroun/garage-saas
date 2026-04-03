import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logs
if (typeof window !== 'undefined') {
  console.log('[Supabase] URL:', SUPABASE_URL?.substring(0, 20) + '...');
  console.log('[Supabase] Key loaded:', !!SUPABASE_ANON_KEY);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const msg = `Missing Supabase config. URL: ${!!SUPABASE_URL}, KEY: ${!!SUPABASE_ANON_KEY}`;
  console.error('[Supabase]', msg);
  throw new Error(msg);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'x-application-name': 'garage-saas-app',
    },
    fetch: async (resource, config) => {
      const resourceStr = typeof resource === 'string' ? resource : 'resource';
      console.log('[Supabase] Fetch request to:', resourceStr);
      if (resourceStr.includes('/rest/v1/')) {
        const table = resourceStr.split('/rest/v1/')[1]?.split('?')[0] || '';
        if (table.length === 1) {
          console.error('[Supabase] ERROR: Short table name used:', table, 'URL:', resourceStr);
          console.error('[Supabase] Stack trace:', new Error().stack);
        }
      }
      try {
        const response = await fetch(resource, config);
        if (!response.ok) {
          const cloned = response.clone();
          cloned.text().then((body) => {
            console.error('[Supabase] Error', response.status, 'on', resourceStr, '→', body);
          }).catch(() => {});
        }
        return response;
      } catch (err) {
        console.error('[Supabase] Fetch error:', err);
        throw err;
      }
    },
  },
});

if (typeof window !== 'undefined') {
  const connectivityCheck = async () => {
    const checkUrl = `${SUPABASE_URL}/auth/v1/settings`;
    console.log('[Supabase] Connectivity check URL:', checkUrl);
    try {
      const response = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const text = await response.text();
      console.log('[Supabase] Connectivity check status:', response.status);
      console.log('[Supabase] Connectivity check response:', text);
    } catch (err) {
      console.error('[Supabase] Connectivity check failed:', err);
    }
  };

  void connectivityCheck();
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}


export type SupabaseError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

export type SupabaseResult<T> = {
  data: T | null;
  error: SupabaseError | null;
};
