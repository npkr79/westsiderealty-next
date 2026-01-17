"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAgent: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isDevAdmin: boolean;
  isOfficeAdmin: boolean;
  role: string | null;
  requirePasswordChange: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: any; agentId?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAgent, setIsAgent] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isDevAdmin, setIsDevAdmin] = useState(false);
  const [isOfficeAdmin, setIsOfficeAdmin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkUserRoles(session.user);
      }

      setIsLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkUserRoles(session.user);
      } else {
        setIsAgent(false);
        setIsAdmin(false);
        setIsOwner(false);
        setIsDevAdmin(false);
        setIsOfficeAdmin(false);
        setRole(null);
        setRequirePasswordChange(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const checkUserRoles = async (authUser: User) => {
    // Check if user is an agent
    const { data: agent } = await supabase
      .from("agents")
      .select("id, active, profile_completed")
      .eq("id", authUser.id)
      .single();

    if (agent && agent.active) {
      setIsAgent(true);
      setRequirePasswordChange(!agent.profile_completed);
    } else {
      setIsAgent(false);
    }

    // Check if user is an admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .single();

    const resolvedRole =
      roleData?.role ||
      (authUser.email === "npkr79@gmail.com" ? "owner" : null);

    setRole(resolvedRole);
    setIsOwner(resolvedRole === "owner");
    setIsDevAdmin(resolvedRole === "dev_admin");
    setIsOfficeAdmin(resolvedRole === "office_admin");
    setIsAdmin(
      resolvedRole === "owner" ||
        resolvedRole === "dev_admin" ||
        resolvedRole === "office_admin" ||
        resolvedRole === "admin"
    );
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signInWithPhone = async (phone: string, password: string) => {
    const normalizedPhone = phone.replace(/\D/g, "").slice(0, 15);

    // 1) Check admin/owner roles by phone
    const { data: roleMatch } = await supabase
      .from("user_roles")
      .select("user_id, email, role")
      .eq("phone", normalizedPhone)
      .single();

    if (roleMatch?.email) {
      const { error } = await supabase.auth.signInWithPassword({
        email: roleMatch.email,
        password,
      });
      return { error, agentId: undefined };
    }

    // 2) Check agents by phone
    const { data: agentByPhone } = await supabase
      .from("agents")
      .select("id, email, active")
      .eq("phone", normalizedPhone)
      .single();

    if (agentByPhone?.email && agentByPhone.active) {
      const { error } = await supabase.auth.signInWithPassword({
        email: agentByPhone.email,
        password,
      });
      return { error, agentId: agentByPhone.id };
    }

    // 3) Legacy phone_auth lookup
    const { data: phoneAuth } = await supabase
      .from("phone_auth")
      .select("agent_id, agents(email, active)")
      .eq("phone", normalizedPhone)
      .eq("active", true)
      .single();

    if (!phoneAuth?.agents?.email || !phoneAuth?.agents?.active) {
      return { error: { message: "Invalid phone number" } };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: phoneAuth.agents.email,
      password,
    });

    return { error, agentId: phoneAuth.agent_id };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    const siteUrl =
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        siteUrl ? `${siteUrl}/reset-password` : undefined,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAgent(false);
    setIsAdmin(false);
    setIsOwner(false);
    setIsDevAdmin(false);
    setIsOfficeAdmin(false);
    setRole(null);
    setRequirePasswordChange(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAgent,
        isAdmin,
        isOwner,
        isDevAdmin,
        isOfficeAdmin,
        role,
        requirePasswordChange,
        signIn,
        signInWithPhone,
        signUp,
        resetPasswordForEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

