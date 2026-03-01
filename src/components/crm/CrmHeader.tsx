import { LogOut } from "lucide-react";
import { cookies } from "next/headers";
import ThemeToggle from "@/components/crm/ThemeToggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { CrmUser } from "@/lib/crm/types";
import { CRM_TEST_ADMIN_COOKIE, isCrmTestLoginEnabled } from "@/lib/crm/test-login";

interface CrmHeaderProps {
  user: CrmUser;
}

async function logout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  if (isCrmTestLoginEnabled) {
    const cookieStore = await cookies();
    cookieStore.delete(CRM_TEST_ADMIN_COOKIE);
  }
}

export default function CrmHeader({ user }: CrmHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {user.full_name || user.email}
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{user.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

