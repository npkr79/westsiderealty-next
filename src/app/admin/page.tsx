 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Settings as SettingsIcon, 
  Image,
  LogOut,
  MapPin,
  MessageSquare,
  UserCheck,
  FolderKanban,
  RefreshCw,
  Target,
  Wand2,
  Building,
  Search
} from "lucide-react";
import Dashboard from "./Dashboard";
import Properties from "./Properties";
import AgentManagement from "./AgentManagement";
import BlogManagement from "./BlogManagement";
import Settings from "./Settings";
import Reports from "./Reports";
import ImagesManager from "@/components/admin/ImagesManager";
import LandingPagesManager from "@/components/admin/LandingPagesManager";
import CommercialPropertiesManager from "@/components/admin/CommercialPropertiesManager";
import SiteContentManager from "@/components/admin/SiteContentManager";
import { CitiesManager } from "@/components/admin/CitiesManager";
import HyderabadProjectsManager from "@/components/admin/HyderabadProjectsManager";
import { ProjectNameMigration } from "@/components/admin/ProjectNameMigration";
import { DevelopersManager } from "@/components/admin/DevelopersManager";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import GoaPropertiesSEOUpdater from "@/components/admin/GoaPropertiesSEOUpdater";
import { SlugMigrationTool } from "@/components/admin/SlugMigrationTool";
import { SlugMigrationRunner } from "@/components/admin/SlugMigrationRunner";
import RegenerateSitemap from "./RegenerateSitemap";
import { BulkDescriptionGenerator } from "@/components/admin/BulkDescriptionGenerator";
import { BulkImageUpdater } from "@/components/admin/BulkImageUpdater";
import { ProjectBulkImageUploader } from "@/components/admin/ProjectBulkImageUploader";
import { DescriptionFormatter } from "@/components/admin/DescriptionFormatter";
import { MicroMarketPagesManager } from "@/components/admin/MicroMarketPagesManager";
import { ProjectMigrationRunner } from "@/components/admin/ProjectMigrationRunner";
import { GeneratePagesTab } from "@/components/admin/GeneratePagesTab";
import { BulkDeveloperGeneration } from "@/components/admin/BulkDeveloperGeneration";
import { BulkProjectSEOTool } from "@/components/admin/BulkProjectSEOTool";
import { BulkFAQPopulationTool } from "@/components/admin/BulkFAQPopulationTool";
import { useAuth } from "@/contexts/AuthContext";
import LeadsCRM from "@/components/admin/LeadsCRM";
import UserRolesManager from "@/components/admin/UserRolesManager";

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const router = useRouter();
  const { isOwner, isDevAdmin, isOfficeAdmin, isLoading } = useAuth();

  const canViewEverything = isOwner || isDevAdmin;
  const canManageAgents = isOwner || isDevAdmin || isOfficeAdmin;
  const canViewLeads = isOwner || isDevAdmin || isOfficeAdmin;
  const canManageRoles = isOwner;

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

  if (isOfficeAdmin && !isOwner && !isDevAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <div className="w-64 bg-white shadow-lg min-h-screen">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-800">Office Admin</h1>
            </div>
            <nav className="mt-6">
              <div className="px-4 space-y-2">
                <Button
                  variant={activeTab === "agents" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("agents")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Agents
                </Button>
                <Button
                  variant={activeTab === "leads" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("leads")}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Leads CRM
                </Button>
              </div>
              <div className="px-4 mt-8">
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                  onClick={onLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>

          <div className="flex-1 p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="agents">
                <AgentManagement />
              </TabsContent>
              <TabsContent value="leads">
                <LeadsCRM />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          </div>
          
          <nav className="mt-6">
            <div className="px-4 space-y-2">
              {canViewEverything && (
                <Button
                  variant={activeTab === "dashboard" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "properties" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("properties")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Properties
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "landing-pages" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("landing-pages")}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Landing Pages
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant={activeTab === "cities" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("cities")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Cities Management
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant={activeTab === "developers" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("developers")}
                >
                  <Building className="mr-2 h-4 w-4" />
                  Developers
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant={activeTab === "re-projects" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("re-projects")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Projects
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "commercial-properties" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("commercial-properties")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Commercial Properties
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "site-content" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("site-content")}
                >
                  <Image className="mr-2 h-4 w-4" />
                  Homepage Content
                </Button>
              )}
              
              {canManageAgents && (
                <Button
                  variant={activeTab === "agents" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("agents")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Agents
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "blog" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("blog")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Blog
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "images" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("images")}
                >
                  <Image className="mr-2 h-4 w-4" />
                  Site Images
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "reports" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("reports")}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Reports
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "projects" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("projects")}
                >
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Project Names
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "goa-seo" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("goa-seo")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Goa SEO Update
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "slug-migration" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("slug-migration")}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Slug Migration
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "generate-pages" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("generate-pages")}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Pages
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "bulk-developers" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("bulk-developers")}
                >
                  <Building className="mr-2 h-4 w-4" />
                  Bulk Developers
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "create-from-brochure" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("create-from-brochure")}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Create from Brochure
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "bulk-seo" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("bulk-seo")}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Bulk SEO Fill
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "bulk-faqs" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("bulk-faqs")}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Bulk FAQ Fill
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "sitemap" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("sitemap")}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Sitemap
                </Button>
              )}
              
              {canViewEverything && (
                <Button
                  variant={activeTab === "bulk-descriptions" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("bulk-descriptions")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Descriptions
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant={activeTab === "bulk-images" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("bulk-images")}
                >
                  <Image className="mr-2 h-4 w-4" />
                  Update Images
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant={activeTab === "format-descriptions" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("format-descriptions")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Fix Formatting
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant={activeTab === "micro-market-pages" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("micro-market-pages")}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Micro-Market Pages
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant={activeTab === "project-migration" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("project-migration")}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Project Migration
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push("/admin/kollur-investment")}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Kollur Investment Page
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push("/admin/scraping")}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Projects Scraper
                </Button>
              )}

              {canViewLeads && (
                <Button
                  variant={activeTab === "leads" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("leads")}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Leads CRM
                </Button>
              )}

              {canManageRoles && (
                <Button
                  variant={activeTab === "user-roles" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("user-roles")}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  User Roles
                </Button>
              )}

              {canViewEverything && (
                <Button
                  variant={activeTab === "settings" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("settings")}
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              )}
            </div>
            
            <div className="px-4 mt-8">
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {canViewEverything && (
              <TabsContent value="dashboard">
                <Dashboard />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="properties">
                <Properties />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="landing-pages">
                <LandingPagesManager />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="cities">
                <CitiesManager />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="developers">
                <DevelopersManager />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="re-projects">
                <ProjectsManager />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="commercial-properties">
                <CommercialPropertiesManager />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="site-content">
                <SiteContentManager />
              </TabsContent>
            )}
            
            {canManageAgents && (
              <TabsContent value="agents">
                <AgentManagement />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="blog">
                <BlogManagement />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="images">
                <ImagesManager />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="reports">
                <Reports />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="projects">
                <div className="space-y-6">
                  <HyderabadProjectsManager />
                  <ProjectNameMigration />
                </div>
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="goa-seo">
                <GoaPropertiesSEOUpdater />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="slug-migration">
                <div className="space-y-6">
                  <SlugMigrationRunner />
                  <SlugMigrationTool />
                </div>
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="sitemap">
                <RegenerateSitemap />
              </TabsContent>
            )}
            
            {canViewEverything && (
              <TabsContent value="bulk-descriptions">
                <BulkDescriptionGenerator />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="bulk-images">
                <BulkImageUpdater />
                <div className="mt-6">
                  <ProjectBulkImageUploader />
                </div>
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="format-descriptions">
                <DescriptionFormatter />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="micro-market-pages">
                <MicroMarketPagesManager />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="project-migration">
                <ProjectMigrationRunner />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="generate-pages">
                <GeneratePagesTab />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="bulk-developers">
                <BulkDeveloperGeneration />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="bulk-seo">
                <BulkProjectSEOTool />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="bulk-faqs">
                <BulkFAQPopulationTool />
              </TabsContent>
            )}

            {canViewLeads && (
              <TabsContent value="leads">
                <LeadsCRM />
              </TabsContent>
            )}

            {canManageRoles && (
              <TabsContent value="user-roles">
                <UserRolesManager />
              </TabsContent>
            )}

            {canViewEverything && (
              <TabsContent value="settings">
                <Settings />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
