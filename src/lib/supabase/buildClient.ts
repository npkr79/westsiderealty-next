/**
 * Build-time Supabase client for use in generateStaticParams
 * This client does NOT use cookies and can be used outside request context
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createBuildClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}
