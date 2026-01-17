"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
        const searchParams = new URLSearchParams(window.location.search);

        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMessage("Invalid or expired reset link.");
            return;
          }
        }

        const accessToken =
          hashParams.get("access_token") || searchParams.get("access_token");
        const refreshToken =
          hashParams.get("refresh_token") || searchParams.get("refresh_token");

        if (!code && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setMessage("Invalid or expired reset link.");
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setMessage("Invalid or expired reset link.");
        }
      } catch (error) {
        console.error("Reset password init failed:", error);
        setMessage("Unable to verify reset link. Please request a new one.");
      } finally {
        setIsChecking(false);
      }
    };

    initSession();
  }, [supabase]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!password || password.length < 8) {
      setMessage("Please use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      let { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMessage("Reset session not found. Please request a new link.");
            return;
          }
          sessionData = await supabase.auth.getSession().then((res) => res.data);
        }
      }
      if (!sessionData?.session) {
        setMessage("Reset session not found. Please request a new link.");
        return;
      }

      const updatePromise = supabase.auth.updateUser({ password });
      const timeoutPromise = new Promise<{ error: Error }>((resolve) => {
        setTimeout(() => resolve({ error: new Error("Password update timed out.") }), 15000);
      });

      const result = await Promise.race([updatePromise, timeoutPromise]);

      if (result.error) {
        setMessage(result.error.message || "Failed to reset password.");
        return;
      }

      setMessage("Password updated successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (error: any) {
      console.error("Password reset failed:", error);
      setMessage(error?.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            {isChecking && (
              <p className="text-sm text-muted-foreground">
                Verifying reset link...
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
