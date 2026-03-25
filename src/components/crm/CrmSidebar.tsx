"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Kanban, MessageCircle, Zap,
  TrendingUp, Bell, GitBranch, Shuffle, CheckSquare,
  Calendar, Settings, X, Activity, UserCircle, Share2, Mic, BarChart2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/agent", icon: LayoutDashboard, label: "Dashboard", roles: ["admin","sales_head","team_lead","agent","marketing","analyst","channel_partner"] },
  { href: "/leads", icon: Users, label: "Leads", roles: ["admin","sales_head","team_lead","agent","marketing","analyst","channel_partner"] },
  { href: "/pipeline", icon: Kanban, label: "Pipeline", roles: ["admin","sales_head","team_lead","agent","analyst","channel_partner"] },
  { href: "/crm/whatsapp", icon: MessageCircle, label: "WhatsApp", roles: ["admin","sales_head","team_lead","agent"] },
  { href: "/dashboard/automation", icon: Zap, label: "Automation", roles: ["admin","sales_head"] },
  { href: "/crm/revenue-dashboard", icon: TrendingUp, label: "Revenue", roles: ["admin","sales_head","team_lead","analyst"] },
  { href: "/dashboard/alerts", icon: Bell, label: "Alerts", roles: ["admin","sales_head","team_lead","agent"] },
  { href: "/journeys", icon: GitBranch, label: "Journeys", roles: ["admin","sales_head","marketing"] },
  { href: "/social", icon: Share2, label: "Social Media", roles: ["admin"] },
  { href: "/routing", icon: Shuffle, label: "Routing", roles: ["admin","sales_head"] },
  { href: "/tasks", icon: CheckSquare, label: "Tasks", roles: ["admin","sales_head","team_lead","agent"] },
  { href: "/calendar", icon: Calendar, label: "Calendar", roles: ["admin","sales_head","team_lead","agent"] },
  { href: "/dashboard/admin/reports", icon: BarChart2, label: "Reports", roles: ["admin"] },
  { href: "/dashboard/admin/seo", icon: Activity, label: "Site Health", roles: ["admin"] },
  { href: "/dashboard/admin/content", icon: Mic, label: "Content Studio", roles: ["admin"] },
  { href: "/profile", icon: UserCircle, label: "My Profile", roles: ["admin","sales_head","team_lead","agent","marketing","analyst","channel_partner"] },
  { href: "/settings", icon: Settings, label: "Settings", roles: ["admin","sales_head","team_lead","agent","marketing","analyst","channel_partner"] },
];

interface CrmSidebarProps {
  onClose?: () => void;
  role?: string | null;
}

export default function CrmSidebar({ onClose, role }: CrmSidebarProps) {
  const pathname = usePathname();

  const visibleItems = role
    ? navItems.filter((item) => item.roles.includes(role))
    : navItems;

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">CRM</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Westside Advisory</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {visibleItems.map(({ href, icon: Icon, label }) => {
          const resolvedHref =
            label === "Settings" && role !== "admin" ? "/settings/personal" : href;
          const active = pathname.startsWith(resolvedHref);
          return (
            <Link
              key={href}
              href={resolvedHref}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
