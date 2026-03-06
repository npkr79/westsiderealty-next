"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function CrmLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function redirectToDashboard() {
    const res = await fetch("/api/crm/auth/me");
    const data = await res.json();
    if (!res.ok) {
      if (data.error === "not_provisioned") throw new Error("User is not provisioned in CRM. Ask admin to add your profile.");
      if (data.error === "inactive") throw new Error("Your account is inactive. Contact admin.");
      throw new Error("Login failed. Please try again.");
    }
    router.push(next || data.dashboardPath);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
      await redirectToDashboard();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/api/crm/auth/callback` },
      });
      if (otpError) throw new Error(otpError.message);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">CRM</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Westside Realty</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your agent account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {sent ? (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm text-center">
            Magic link sent to <strong>{email}</strong>. Check your inbox and click the link to sign in.
          </div>
        ) : (
          <>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
              <button
                onClick={() => setMode("password")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "password" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400"}`}
              >
                Password
              </button>
              <button
                onClick={() => setMode("magic")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "magic" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400"}`}
              >
                Magic Link
              </button>
            </div>

            <form onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@westsiderealty.in"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>

              {mode === "password" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Please wait..." : mode === "password" ? "Sign In" : "Send Magic Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function CrmLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <CrmLoginContent />
    </Suspense>
  );
}
