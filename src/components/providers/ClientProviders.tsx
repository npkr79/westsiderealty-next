"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import BehaviorTracker from "@/components/analytics/BehaviorTracker";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BehaviorTracker />
      {children}
    </AuthProvider>
  );
}
