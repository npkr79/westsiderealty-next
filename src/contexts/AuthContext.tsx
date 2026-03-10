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
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), timeoutMs)
        ),
      ]);
    };

    const checkUser = async () => {
      try {
        type SessionResponse = Awaited<ReturnType<typeof supabase.auth.getSession>>;
        const sessionResult = await withTimeout<SessionResponse>(
          supabase.auth.getSession(),
          8000
        );
        const session = sessionResult.data.session;
        setUser(session?.user ?? null);

        if (session?.user) {
          // Don't block initial render on role lookups
          checkUserRoles(session.user).catch((error) => {
            console.error("Role lookup failed:", error);
          });
        }
      } catch (error) {
        console.error("Auth session check failed:", error);
        setUser(null);
        setIsAgent(false);
        setIsAdmin(false);
        setIsOwner(false);
        setIsDevAdmin(false);
        setIsOfficeAdmin(false);
        setRole(null);
        setRequirePasswordChange(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      try {
        setUser(session?.user ?? null);

        if (session?.user) {
          await withTimeout(checkUserRoles(session.user), 8000);
        } else {
          setIsAgent(false);
          setIsAdmin(false);
          setIsOwner(false);
          setIsDevAdmin(false);
          setIsOfficeAdmin(false);
          setRole(null);
          setRequirePasswordChange(false);
        }
      } catch (error) {
        console.error("Auth state change failed:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const checkUserRoles = async (authUser: User) => {
    // Check if user is an agent
    const { data: registry, error: registryError } = await supabase
      .from("crm_users")
      .select("id, is_active")
      .eq("id", authUser.id)
      .maybeSingle();

    if (registryError && registryError.code !== "PGRST116") {
      console.error("Agent registry lookup error:", registryError);
    }

    if (registry && registry.is_active) {
      setIsAgent(true);
      setRequirePasswordChange(false);
    } else {
      setIsAgent(false);
    }

    // Check if user is an admin
    const { data: roleData } = await supabase
      .from("crm_users")
      .select("id, crm_roles(name)")
      .eq("id", authUser.id)
      .maybeSingle();

    const crmRoles = (roleData as any)?.crm_roles;
    const resolvedRoleName: string | null = Array.isArray(crmRoles)
      ? (crmRoles[0]?.name ?? null)
      : (crmRoles?.name ?? null);

    const resolvedRole =
      resolvedRoleName ||
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
    const last10 = normalizedPhone.slice(-10);

    // 1) Check crm_users by phone — email is in auth.users only, not crm_users
    // Phone-based login via crm_users is not supported (no email column).
    // Fall through to phone_auth lookup below.
    console.warn("signInWithPhone: crm_users has no email column; skipping role-based phone lookup");

    // 2) Check crm_users by phone for active agents
    let { data: agentByPhone } = await supabase
      .from("crm_users")
      .select("id, phone, is_active")
      .eq("phone", normalizedPhone)
      .single();

    if (!agentByPhone && last10) {
      const { data: fuzzyAgent } = await supabase
        .from("crm_users")
        .select("id, phone, is_active")
        .ilike("phone", `%${last10}`)
        .single();
      agentByPhone = fuzzyAgent || null;
    }

    if (agentByPhone?.is_active) {
      // email is not on crm_users — must use phone_auth flow
      console.warn("signInWithPhone: crm_users found but email not available; falling through to phone_auth");
    }

    // 3) Legacy phone_auth lookup
    const { data: phoneAuth } = await supabase
      .from("phone_auth")
      .select("agent_id")
      .eq("phone", normalizedPhone)
      .eq("active", true)
      .single();

    if (!phoneAuth?.agent_id) {
      return { error: { message: "Invalid phone number" } };
    }

    const { data: agentByAuthId } = await supabase
      .from("crm_users")
      .select("id, is_active")
      .eq("id", phoneAuth.agent_id)
      .single();

    if (!agentByAuthId?.is_active) {
      return { error: { message: "Invalid phone number" } };
    }

    // email is in auth.users only — phone login must go through phone_auth RPC or OTP
    console.warn("signInWithPhone: Phone login not available without email. Use email login or OTP.");
    return { error: { message: "Phone login not available" } };
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

