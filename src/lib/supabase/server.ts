// NOTE: This file should only be used in Server Components
// The "server-only" package would prevent client imports but causes build issues
// with services that are imported by both server and client components
// TODO: Refactor services to have separate client/server versions
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not set");
  }

  return createSupabaseClient(url, anonKey);
}
