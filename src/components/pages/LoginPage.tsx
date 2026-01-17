"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithPhone, user, isAdmin, isAgent, isLoading } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) {
        router.replace("/admin");
      } else if (isAgent) {
        router.replace("/agent/dashboard");
      }
    }
  }, [user, isAdmin, isAgent, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const isEmail = identifier.includes("@");
    const loginResult = isEmail
      ? await signIn(identifier, password)
      : await signInWithPhone(identifier, password);

    if (loginResult.error) {
      setError("Invalid email/phone or password");
      toast.error("Login failed", {
        description: "Please check your credentials and try again.",
      });
    } else {
      toast.success("Login successful");
    }

    setLoading(false);
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.slice(0, 10);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-primary/10 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email / Phone</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter email or phone number"
                value={identifier}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  const formatted = nextValue.includes("@") ? nextValue : formatPhoneNumber(nextValue);
                  setIdentifier(formatted);
                }}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Agents: first time login uses default password{" "}
                <code className="bg-muted px-1 py-0.5 rounded">Welcome@123</code>
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


