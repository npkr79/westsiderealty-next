import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Loader2, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PropertyLead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  message: string | null;
  created_at: string;
  property_location?: string;
}

interface LandingPageLead {
  id: string;
  full_name: string;
  name?: string;
  email: string;
  phone: string;
  requirements_message: string | null;
  message?: string | null;
  created_at: string;
  source_page_url: string;
  lead_type: string;
}

interface CommercialLead {
  id: number;
  full_name: string;
  business_email: string;
  business_phone: string | null;
  requirements: string;
  created_at: string;
  business_industry: string;
  preferred_location: string;
}

type Lead = PropertyLead | LandingPageLead | (CommercialLead & { id: string; name: string; email: string | null; phone: string; message: string | null });

const LeadsManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [propertyLeads, setPropertyLeads] = useState<PropertyLead[]>([]);
  const [landingPageLeads, setLandingPageLeads] = useState<LandingPageLead[]>([]);
  const [commercialLeads, setCommercialLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      console.log('🔍 LOADING LEADS - Starting...');
      
      const [propertyRes, landingRes, commercialRes] = await Promise.all([
        supabase.from("property_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("all_leads").select("*").eq("lead_type", "landing_page").order("created_at", { ascending: false }),
        supabase.from("commercial_leads").select("*").order("created_at", { ascending: false }),
      ]);

      console.log('🔍 Property Leads Response:', { data: propertyRes.data, error: propertyRes.error });
      console.log('🔍 Landing Page Leads Response:', { data: landingRes.data, error: landingRes.error });
      console.log('🔍 Commercial Leads Response:', { data: commercialRes.data, error: commercialRes.error });

      if (propertyRes.error) {
        console.error('❌ Property leads error:', propertyRes.error);
        throw propertyRes.error;
      }
      if (landingRes.error) {
        console.error('❌ Landing page leads error:', landingRes.error);
        throw landingRes.error;
      }
      if (commercialRes.error) {
        console.error('❌ Commercial leads error:', commercialRes.error);
        throw commercialRes.error;
      }

      console.log('✅ All queries successful');
      console.log('📊 Property Leads Count:', propertyRes.data?.length || 0);
      console.log('📊 Landing Page Leads Count:', landingRes.data?.length || 0);
      console.log('📊 Commercial Leads Count:', commercialRes.data?.length || 0);

      setPropertyLeads(propertyRes.data || []);
      
      // Transform all_leads to match LandingPageLead interface
      const transformedLanding = (landingRes.data || []).map(lead => ({
        ...lead,
        name: lead.full_name,
        message: lead.requirements_message,
      }));
      setLandingPageLeads(transformedLanding as any);
      
      // Transform commercial leads to match Lead interface
      const transformedCommercial = (commercialRes.data || []).map(lead => ({
        ...lead,
        id: String(lead.id),
        name: lead.full_name,
        email: lead.business_email,
        phone: lead.business_phone || '',
        message: lead.requirements,
      }));
      setCommercialLeads(transformedCommercial);

      console.log('✅ LOADING LEADS - Completed successfully');
    } catch (error) {
      console.error("❌ Error loading leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, tableName: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      // Map table names and handle ID conversion
      let table: 'property_leads' | 'all_leads' | 'commercial_leads';
      let deleteId: string | number = id;
      
      if (tableName === 'landing-page-leads' || tableName === 'all-leads') {
        table = 'all_leads';
      } else if (tableName === 'commercial-leads') {
        table = 'commercial_leads';
        deleteId = parseInt(id);
      } else {
        table = tableName as 'property_leads' | 'all_leads' | 'commercial_leads';
        if (tableName === 'commercial_leads') {
          deleteId = parseInt(id);
        }
      }
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", deleteId);
        
      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      loadLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = (leads: Lead[], filename: string) => {
    const headers = ["Name", "Email", "Phone", "Message", "Date"];
    const rows = leads.map(lead => {
      const name = 'name' in lead ? lead.name : 'full_name' in lead ? lead.full_name : '';
      const message = 'message' in lead ? lead.message : 'requirements_message' in lead ? lead.requirements_message : '';
      
      return [
        name || "",
        lead.email || "",
        lead.phone,
        message || "",
        format(new Date(lead.created_at), "dd/MM/yyyy HH:mm"),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const renderLeadsTable = (leads: Lead[], tableName: string) => {
    console.log(`🎨 RENDERING TABLE: ${tableName}`, {
      totalLeads: leads.length,
      searchQuery,
      leads: leads.slice(0, 3)
    });
    
    const filteredLeads = leads.filter(lead => {
      const name = 'name' in lead ? lead.name : 'full_name' in lead ? lead.full_name : '';
      const searchLower = searchQuery.toLowerCase();
      
      return (
        name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.phone.includes(searchQuery)
      );
    });

    console.log(`🎨 FILTERED LEADS for ${tableName}:`, filteredLeads.length);

    return (
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => exportToCSV(filteredLeads, tableName)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => {
                  const name = 'name' in lead ? lead.name : 'full_name' in lead ? lead.full_name : '';
                  const message = 'message' in lead ? lead.message : 'requirements_message' in lead ? lead.requirements_message : '';
                  
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{lead.email || "-"}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {message || "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(lead.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(lead.id, tableName)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const allLeads = [...propertyLeads, ...landingPageLeads, ...commercialLeads];
  
  console.log('📊 FINAL STATE:', {
    propertyLeads: propertyLeads.length,
    landingPageLeads: landingPageLeads.length,
    commercialLeads: commercialLeads.length,
    allLeads: allLeads.length,
    activeTab
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leads Management</h1>
        <div className="flex gap-2">
          <Badge variant="outline">{allLeads.length} Total Leads</Badge>
          <Badge variant="secondary">{propertyLeads.length} Property</Badge>
          <Badge variant="secondary">{landingPageLeads.length} Landing Page</Badge>
          <Badge variant="secondary">{commercialLeads.length} Commercial</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Leads ({allLeads.length})</TabsTrigger>
              <TabsTrigger value="property">Property ({propertyLeads.length})</TabsTrigger>
              <TabsTrigger value="landing">Landing Page ({landingPageLeads.length})</TabsTrigger>
              <TabsTrigger value="commercial">Commercial ({commercialLeads.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {renderLeadsTable(allLeads, "all-leads")}
            </TabsContent>

            <TabsContent value="property" className="mt-6">
              {renderLeadsTable(propertyLeads, "property-leads")}
            </TabsContent>

            <TabsContent value="landing" className="mt-6">
              {renderLeadsTable(landingPageLeads, "landing-page-leads")}
            </TabsContent>

            <TabsContent value="commercial" className="mt-6">
              {renderLeadsTable(commercialLeads, "commercial-leads")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsManagement;
