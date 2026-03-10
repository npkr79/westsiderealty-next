"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Kanban, MessageCircle, Zap,
  TrendingUp, Bell, GitBranch, Shuffle, CheckSquare,
  Calendar, Settings, X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/agent", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/pipeline", icon: Kanban, label: "Pipeline" },
  { href: "/crm/whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { href: "/dashboard/automation", icon: Zap, label: "Automation" },
  { href: "/crm/revenue-dashboard", icon: TrendingUp, label: "Revenue" },
  { href: "/dashboard/alerts", icon: Bell, label: "Alerts" },
  { href: "/journeys", icon: GitBranch, label: "Journeys" },
  { href: "/routing", icon: Shuffle, label: "Routing" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface CrmSidebarProps {
  onClose?: () => void;
}

export default function CrmSidebar({ onClose }: CrmSidebarProps) {
  const pathname = usePathname();
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
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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
