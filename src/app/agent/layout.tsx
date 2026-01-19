"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Building2, ListChecks, User, MessageSquare, Plus, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { signOut } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Check if user is agent
      const { data: agent } = await supabase
        .from("raw_agents")
        .select("id, is_active")
        .eq("id", session.user.id)
        .single();

      if (!agent || !agent.is_active) {
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white shadow-lg min-h-screen">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Agent Panel</h2>
        </div>
        <nav className="px-4 space-y-2">
          <Button
            asChild
            variant={pathname === "/agent/profile" ? "default" : "ghost"}
            className="w-full justify-start"
          >
            <Link href="/agent/profile">
              <User className="mr-2 h-4 w-4" />
              Manage Profile
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/agent/leads" ? "default" : "ghost"}
            className="w-full justify-start"
          >
            <Link href="/agent/leads">
              <MessageSquare className="mr-2 h-4 w-4" />
              Leads CRM
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/agent/listings" ? "default" : "ghost"}
            className="w-full justify-start"
          >
            <Link href="/agent/listings">
              <ListChecks className="mr-2 h-4 w-4" />
              Property Listings
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/agent/add-property" ? "default" : "ghost"}
            className="w-full justify-start"
          >
            <Link href="/agent/add-property">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start"
          >
            <Link href="/agent">
              <Building2 className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </nav>
        <div className="px-4 mt-8">
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}

