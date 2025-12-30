"use client";

import Link from "next/link";
import { Home, Search, Heart, Phone, User } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/home-test" },
    { icon: Search, label: "Search", href: "/hyderabad/buy" },
    { icon: Heart, label: "Saved", href: "/hyderabad/buy" },
    { icon: Phone, label: "Call", href: "tel:+919866085831" },
    { icon: User, label: "Profile", href: "/login" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
