"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, KanbanSquare, CheckSquare2, CalendarDays, Settings, Route, BellRing, MessageCircle, Workflow, Activity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/agent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/crm/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/crm/automation-monitor", label: "Automation", icon: Activity },
  { href: "/crm/revenue-dashboard", label: "Revenue", icon: TrendingUp },
  { href: "/dashboard/alerts", label: "Alerts", icon: BellRing },
  { href: "/journeys", label: "Journeys", icon: Workflow },
  { href: "/routing", label: "Routing", icon: Route },
  { href: "/tasks", label: "Tasks", icon: CheckSquare2 },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function CrmSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-200 bg-white px-3 py-3 md:h-screen md:w-64 md:border-b-0 md:border-r md:px-4 md:py-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between md:mb-6 md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">CRM</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Westside Advisory</p>
      </div>
      <nav className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition md:justify-start md:text-sm",
                isActive
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

