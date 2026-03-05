"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mapRoleNameToCrmRole, getDashboardPathForRole } from "@/lib/crm/roles";

function CrmLoginContent() {
  const getErrorMessage = (errorValue: unknown, fallback: string): string =>
    errorValue instanceof Error ? errorValue.message : fallback;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolveErrorFromSearch = () => {
    const errorCode = searchParams.get("error");
    if (errorCode === "not_authorized") return "You are not provisioned in CRM yet. Ask an admin to add your CRM access.";
    if (errorCode === "inactive_user") return "Your CRM account is inactive. Contact an admin to re-enable access.";
    if (errorCode === "invalid_role") return "Your CRM role is not configured correctly. Please contact admin.";
    return null;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/crm/login?verify=1`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo },
      });
      if (otpError) throw otpError;
      setMessage("Magic link sent. Please check your email.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to send OTP."));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Login not complete. Open your magic link first.");

      const crmUser = await supabase
        .from("crm_users")
        .select("id, is_active, crm_roles(name)")
        .eq("id", user.id)
        .maybeSingle();

      if (crmUser.error || !crmUser.data) {
        throw new Error("User is not provisioned in CRM. Ask admin to add your CRM profile.");
      }
      if (!crmUser.data.is_active) {
        throw new Error("Your CRM access is inactive. Contact admin.");
      }

      const joinedRole = Array.isArray(crmUser.data.crm_roles) ? crmUser.data.crm_roles[0]?.name : crmUser.data.crm_roles?.name;
      const mappedRole = mapRoleNameToCrmRole(joinedRole);
      if (!mappedRole) {
        throw new Error("CRM role is not configured correctly.");
      }
      const target = getDashboardPathForRole(mappedRole);

      router.replace(searchParams.get("next") || target);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to continue."));
    } finally {
      setLoading(false);
    }
  };

  const handleTestAdminLogin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/crm/test-login", { method: "POST" });
      if (!response.ok) throw new Error("Test login is unavailable.");
      router.replace(searchParams.get("next") || "/dashboard/admin");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to start test admin session."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <div className="w-full rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Internal CRM</p>
          <h1 className="mt-2 text-2xl font-semibold">Login with Email OTP</h1>
          <p className="mt-1 text-sm text-slate-300">Secure access for advisory, sales, and operations teams.</p>

          <form onSubmit={handleSendOtp} className="mt-5 space-y-3">
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-white/20 bg-white/10 text-white placeholder:text-slate-400"
            />
            <Button type="submit" disabled={loading} className="w-full bg-white text-slate-900 hover:bg-slate-100">
              {loading ? "Sending..." : "Send OTP Link"}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={handleContinue}
            disabled={loading}
          >
            I opened the link, continue
          </Button>

          {process.env.NODE_ENV !== "production" ? (
            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full"
              onClick={handleTestAdminLogin}
              disabled={loading}
            >
              Test admin login (local only)
            </Button>
          ) : null}

          {!error && resolveErrorFromSearch() ? <p className="mt-3 text-sm text-rose-300">{resolveErrorFromSearch()}</p> : null}
          {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function CrmLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <CrmLoginContent />
    </Suspense>
  );
}

