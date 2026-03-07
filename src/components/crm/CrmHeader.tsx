"use client";
import { LogOut, Menu } from "lucide-react";
import ThemeToggle from "@/components/crm/ThemeToggle";
import { Button } from "@/components/ui/button";
import type { CrmUser } from "@/lib/crm/types";
import { logout } from "@/app/actions/crm-logout";

interface CrmHeaderProps {
  user: CrmUser;
  onMenuClick?: () => void;
}

export default function CrmHeader({ user, onMenuClick }: CrmHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.full_name || user.email}
            </p>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{user.role}</p>
          </div>
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
