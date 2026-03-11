"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import FooterSection from "../home/FooterSection";
import AuditModeController from "@/components/audit/AuditModeController";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}

const Layout = ({ children, className, header }: LayoutProps) => {
  const pathname = usePathname();
  const isCrmRoute =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/leads") ||
    pathname?.startsWith("/pipeline") ||
    pathname?.startsWith("/tasks") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/crm/");

  if (isCrmRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AuditModeController />
      {header ?? <Header />}
      <main className={`flex-grow ${className}`}>
        {children}
      </main>
      <FooterSection />
    </div>
  );
};

export default Layout;
