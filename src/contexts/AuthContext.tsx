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
  requirePasswordChange: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: any; agentId?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAgent, setIsAgent] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkUserRoles(session.user.id);
      }

      setIsLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkUserRoles(session.user.id);
      } else {
        setIsAgent(false);
        setIsAdmin(false);
        setRequirePasswordChange(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const checkUserRoles = async (userId: string) => {
    // Check if user is an agent
    const { data: agent } = await supabase
      .from("agents")
      .select("id, active, profile_completed")
      .eq("id", userId)
      .single();

    if (agent && agent.active) {
      setIsAgent(true);
      setRequirePasswordChange(!agent.profile_completed);
    } else {
      setIsAgent(false);
    }

    // Check if user is an admin
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    setIsAdmin(role?.role === "admin");
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signInWithPhone = async (phone: string, password: string) => {
    // Get agent by phone
    const { data: phoneAuth } = await supabase
      .from("phone_auth")
      .select("agent_id, agents(*)")
      .eq("phone", phone)
      .eq("active", true)
      .single();

    if (!phoneAuth) {
      return { error: { message: "Invalid phone number" } };
    }

    // Verify password (you'll need to implement password verification)
    // For now, we'll use a simple approach - in production, use proper hashing
    const { data: agent } = await supabase
      .from("agents")
      .select("email")
      .eq("id", phoneAuth.agent_id)
      .single();

    if (!agent?.email) {
      return { error: { message: "Agent not found" } };
    }

    // Sign in with email (since Supabase Auth uses email)
    const { error } = await supabase.auth.signInWithPassword({
      email: agent.email,
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAgent(false);
    setIsAdmin(false);
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
        requirePasswordChange,
        signIn,
        signInWithPhone,
        signUp,
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

