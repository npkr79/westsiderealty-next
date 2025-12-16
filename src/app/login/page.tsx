 "use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const router = useRouter();
  const { signIn, signInWithPhone, user, isAdmin, isAgent, isLoading } = useAuth();
  
  // Admin login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Agent login state
  const [agentPhone, setAgentPhone] = useState("");
  const [agentPassword, setAgentPassword] = useState("");
  
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn(adminEmail, adminPassword);

    if (error) {
      setError("Invalid email or password");
      toast.error("Login failed", {
        description: "Please check your credentials and try again."
      });
    } else {
      toast.success("Login successful");
      router.replace("/admin");
    }

    setLoading(false);
  };

  const handleAgentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate phone number
    if (!/^\d{10}$/.test(agentPhone)) {
      const errorMsg = "Please enter a valid 10-digit phone number";
      setError(errorMsg);
      toast.error("Invalid phone number", {
        description: "Phone number must be exactly 10 digits"
      });
      setLoading(false);
      return;
    }

    const { error, agentId } = await signInWithPhone(agentPhone, agentPassword);

    if (error) {
      const errorMessage = error.message || "Invalid phone number or password";
      setError(errorMessage);
      toast.error("Login failed", {
        description: errorMessage,
      });
    } else {
      toast.success("Login successful", {
        description: "Welcome! Redirecting to your dashboard..."
      });
      router.replace("/agent/dashboard");
    }

    setLoading(false);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
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
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Admin Login</TabsTrigger>
              <TabsTrigger value="agent">Agent Login</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="agent">
              <form onSubmit={handleAgentLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-phone">Phone Number</Label>
                  <Input
                    id="agent-phone"
                    type="tel"
                    placeholder="10-digit phone number"
                    value={agentPhone}
                    onChange={(e) => setAgentPhone(formatPhoneNumber(e.target.value))}
                    required
                    disabled={loading}
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your 10-digit phone number
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-password">Password</Label>
                  <Input
                    id="agent-password"
                    type="password"
                    placeholder="Enter your password"
                    value={agentPassword}
                    onChange={(e) => setAgentPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    First time login? Use default password: <code className="bg-muted px-1 py-0.5 rounded">Welcome@123</code>
                  </p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
