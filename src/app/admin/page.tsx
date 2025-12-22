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
  Search,
  Sparkles
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
import { EnhancedTextResponseDemo } from "@/components/admin/EnhancedTextResponseDemo";

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const router = useRouter();

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
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("dashboard")}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              
              <Button
                variant={activeTab === "properties" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("properties")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Properties
              </Button>
              
              <Button
                variant={activeTab === "landing-pages" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("landing-pages")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Landing Pages
              </Button>

              <Button
                variant={activeTab === "cities" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("cities")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Cities Management
              </Button>

              <Button
                variant={activeTab === "developers" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("developers")}
              >
                <Building className="mr-2 h-4 w-4" />
                Developers
              </Button>

              <Button
                variant={activeTab === "re-projects" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("re-projects")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Projects
              </Button>
              
              <Button
                variant={activeTab === "commercial-properties" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("commercial-properties")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Commercial Properties
              </Button>
              
              <Button
                variant={activeTab === "site-content" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("site-content")}
              >
                <Image className="mr-2 h-4 w-4" />
                Homepage Content
              </Button>
              
              <Button
                variant={activeTab === "agents" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("agents")}
              >
                <Users className="mr-2 h-4 w-4" />
                Agents
              </Button>
              
              <Button
                variant={activeTab === "blog" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("blog")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Blog
              </Button>
              
              <Button
                variant={activeTab === "images" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("images")}
              >
                <Image className="mr-2 h-4 w-4" />
                Site Images
              </Button>
              
              <Button
                variant={activeTab === "reports" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("reports")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Reports
              </Button>
              
              <Button
                variant={activeTab === "projects" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("projects")}
              >
                <FolderKanban className="mr-2 h-4 w-4" />
                Project Names
              </Button>
              
              <Button
                variant={activeTab === "goa-seo" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("goa-seo")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Goa SEO Update
              </Button>
              
              <Button
                variant={activeTab === "slug-migration" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("slug-migration")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Slug Migration
              </Button>
              
              <Button
                variant={activeTab === "generate-pages" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("generate-pages")}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Pages
              </Button>
              
              <Button
                variant={activeTab === "bulk-developers" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("bulk-developers")}
              >
                <Building className="mr-2 h-4 w-4" />
                Bulk Developers
              </Button>
              
              <Button
                variant={activeTab === "create-from-brochure" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("create-from-brochure")}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Create from Brochure
              </Button>
              
              <Button
                variant={activeTab === "bulk-seo" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("bulk-seo")}
              >
                <Search className="mr-2 h-4 w-4" />
                Bulk SEO Fill
              </Button>
              
              <Button
                variant={activeTab === "bulk-faqs" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("bulk-faqs")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Bulk FAQ Fill
              </Button>
              
              <Button
                variant={activeTab === "sitemap" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("sitemap")}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Sitemap
              </Button>
              
              <Button
                variant={activeTab === "bulk-descriptions" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("bulk-descriptions")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Descriptions
              </Button>

              <Button
                variant={activeTab === "bulk-images" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("bulk-images")}
              >
                <Image className="mr-2 h-4 w-4" />
                Update Images
              </Button>

              <Button
                variant={activeTab === "format-descriptions" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("format-descriptions")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Fix Formatting
              </Button>

              <Button
                variant={activeTab === "micro-market-pages" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("micro-market-pages")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Micro-Market Pages
              </Button>

              <Button
                variant={activeTab === "project-migration" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("project-migration")}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Project Migration
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push("/admin/kollur-investment")}
              >
                <Target className="mr-2 h-4 w-4" />
                Kollur Investment Page
              </Button>

              <Button
                variant={activeTab === "text-response-demo" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("text-response-demo")}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Text Response Demo
              </Button>

              <Button
                variant={activeTab === "settings" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("settings")}
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
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

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="dashboard">
              <Dashboard />
            </TabsContent>
            
            <TabsContent value="properties">
              <Properties />
            </TabsContent>
            
            <TabsContent value="landing-pages">
              <LandingPagesManager />
            </TabsContent>

            <TabsContent value="cities">
              <CitiesManager />
            </TabsContent>

            <TabsContent value="developers">
              <DevelopersManager />
            </TabsContent>

            <TabsContent value="re-projects">
              <ProjectsManager />
            </TabsContent>
            
            <TabsContent value="commercial-properties">
              <CommercialPropertiesManager />
            </TabsContent>
            
            <TabsContent value="site-content">
              <SiteContentManager />
            </TabsContent>
            
            <TabsContent value="agents">
              <AgentManagement />
            </TabsContent>
            
            <TabsContent value="blog">
              <BlogManagement />
            </TabsContent>
            
            <TabsContent value="images">
              <ImagesManager />
            </TabsContent>
            
            <TabsContent value="reports">
              <Reports />
            </TabsContent>
            
            <TabsContent value="projects">
              <div className="space-y-6">
                <HyderabadProjectsManager />
                <ProjectNameMigration />
              </div>
            </TabsContent>
            
            <TabsContent value="goa-seo">
              <GoaPropertiesSEOUpdater />
            </TabsContent>
            
            <TabsContent value="slug-migration">
              <div className="space-y-6">
                <SlugMigrationRunner />
                <SlugMigrationTool />
              </div>
            </TabsContent>
            
            <TabsContent value="sitemap">
              <RegenerateSitemap />
            </TabsContent>
            
            <TabsContent value="bulk-descriptions">
              <BulkDescriptionGenerator />
            </TabsContent>

            <TabsContent value="bulk-images">
              <BulkImageUpdater />
              <div className="mt-6">
                <ProjectBulkImageUploader />
              </div>
            </TabsContent>

            <TabsContent value="format-descriptions">
              <DescriptionFormatter />
            </TabsContent>

            <TabsContent value="micro-market-pages">
              <MicroMarketPagesManager />
            </TabsContent>

            <TabsContent value="project-migration">
              <ProjectMigrationRunner />
            </TabsContent>

            <TabsContent value="generate-pages">
              <GeneratePagesTab />
            </TabsContent>

            <TabsContent value="bulk-developers">
              <BulkDeveloperGeneration />
            </TabsContent>

            <TabsContent value="bulk-seo">
              <BulkProjectSEOTool />
            </TabsContent>

            <TabsContent value="bulk-faqs">
              <BulkFAQPopulationTool />
            </TabsContent>

            <TabsContent value="text-response-demo">
              <EnhancedTextResponseDemo />
            </TabsContent>

            <TabsContent value="settings">
              <Settings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
