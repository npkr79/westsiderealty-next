"use client";

import Link from "next/link";
import { BarChart3, BookOpen, Info } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const InsightsDropdown = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-base font-semibold bg-transparent hover:bg-transparent hover:text-blue-700 data-[state=open]:bg-transparent text-gray-700">
        Insights
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="p-6 w-[280px]">
          <ul className="space-y-1">
            <li>
              <Link
                href="/insights"
                className="flex items-center gap-2 py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Market Insights</span>
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className="flex items-center gap-2 py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                <span>Blog</span>
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="flex items-center gap-2 py-2 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-remax-red transition-colors"
              >
                <Info className="h-4 w-4" />
                <span>About Us</span>
              </Link>
            </li>
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default InsightsDropdown;

