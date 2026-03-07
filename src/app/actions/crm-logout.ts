"use server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CRM_TEST_ADMIN_COOKIE, isCrmTestLoginEnabled } from "@/lib/crm/test-login";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  if (isCrmTestLoginEnabled) {
    const cookieStore = await cookies();
    cookieStore.delete(CRM_TEST_ADMIN_COOKIE);
  }
}
