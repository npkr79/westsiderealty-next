"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Building,
  Building2,
  FileText,
  LogOut,
  MapPin,
  MessageSquare,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LeadsCRM from "@/components/admin/LeadsCRM";
import UserRolesManager from "@/components/admin/UserRolesManager";
import AgentManagement from "./AgentManagement";
import Properties from "./Properties";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { DevelopersManager } from "@/components/admin/DevelopersManager";
import { MicroMarketPagesManager } from "@/components/admin/MicroMarketPagesManager";
import BlogManagement from "./BlogManagement";
import AddAgentModal from "@/components/admin/AddAgentModal";
import CreateUserModal from "@/components/admin/CreateUserModal";

interface AdminDashboardProps {
  onLogout?: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { isOwner, isDevAdmin, isOfficeAdmin, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("leads");
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const tabs = useMemo(() => {
    if (isOwner) {
      return [
        {
          id: "leads",
          label: "Leads CRM",
          icon: MessageSquare,
          content: <LeadsCRM />,
        },
        {
          id: "user-roles",
          label: "User Roles",
          icon: UserCheck,
          content: <UserRolesManager />,
        },
        { id: "agents", label: "Agents", icon: Users, content: <AgentManagement /> },
        { id: "properties", label: "Properties", icon: Building2, content: <Properties /> },
        { id: "projects", label: "Projects", icon: Building2, content: <ProjectsManager /> },
        { id: "micro-markets", label: "Micro Markets", icon: MapPin, content: <MicroMarketPagesManager /> },
        { id: "developers", label: "Developers", icon: Building, content: <DevelopersManager /> },
        { id: "blog", label: "Blog", icon: FileText, content: <BlogManagement /> },
      ];
    }

    if (isDevAdmin) {
      return [
        {
          id: "leads",
          label: "Leads CRM",
          icon: MessageSquare,
          content: <LeadsCRM />,
        },
        { id: "agents", label: "Agents", icon: Users, content: <AgentManagement /> },
        { id: "properties", label: "Properties", icon: Building2, content: <Properties /> },
        { id: "projects", label: "Projects", icon: Building2, content: <ProjectsManager /> },
        { id: "micro-markets", label: "Micro Markets", icon: MapPin, content: <MicroMarketPagesManager /> },
        { id: "developers", label: "Developers", icon: Building, content: <DevelopersManager /> },
        { id: "blog", label: "Blog", icon: FileText, content: <BlogManagement /> },
      ];
    }

    if (isOfficeAdmin) {
      return [
        { id: "agents", label: "Agents", icon: Users, content: <AgentManagement /> },
        { id: "properties", label: "Properties", icon: Building2, content: <Properties /> },
        { id: "projects", label: "Projects", icon: Building2, content: <ProjectsManager /> },
        { id: "micro-markets", label: "Micro Markets", icon: MapPin, content: <MicroMarketPagesManager /> },
        { id: "developers", label: "Developers", icon: Building, content: <DevelopersManager /> },
        { id: "leads", label: "Leads CRM", icon: MessageSquare, content: <LeadsCRM /> },
      ];
    }

    return [];
  }, [isOwner, isDevAdmin, isOfficeAdmin]);

  useEffect(() => {
    if (tabs.length && !tabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!tabs.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Access restricted</h2>
          <p className="text-sm text-muted-foreground">You do not have access to the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          </div>

          <nav className="mt-6">
            <div className="px-4 space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </div>

            <div className="px-4 mt-8">
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </nav>
        </div>

        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xl font-semibold text-gray-900">Admin Workspace</div>
            <div className="flex gap-2">
              {(isOwner || isDevAdmin || isOfficeAdmin) && (
                <Button variant="outline" onClick={() => setShowAgentModal(true)}>
                  Create Agent
                </Button>
              )}
              {isOwner && (
                <Button onClick={() => setShowUserModal(true)}>
                  Create User
                </Button>
              )}
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      <AddAgentModal
        open={showAgentModal}
        onOpenChange={setShowAgentModal}
        onClose={() => setShowAgentModal(false)}
      />
      <CreateUserModal
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;
