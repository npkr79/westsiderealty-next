"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  created_at: string;
  interest_details: string | null;
  status: string | null;
  stage: string | null;
  priority: string | null;
  notes: string | null;
  next_follow_up: string | null;
}

const statusOptions = ["new", "active", "closed"];
const stageOptions = ["new", "not_connected", "contacted", "qualified", "site_visit", "negotiation", "won", "lost"];
const priorityOptions = ["low", "medium", "high"];

export default function AgentLeadsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadLeads(user.id);
    }
  }, [user]);

  const loadLeads = async (agentId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email, phone, created_at, interest_details, status, stage, priority, notes, next_follow_up")
        .eq("assigned_to", agentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads((data || []) as Lead[]);
    } catch (error) {
      console.error("Error loading agent leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const { error } = await supabase.from("leads").update(updates).eq("id", leadId);
      if (error) throw error;
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead)));
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead.",
        variant: "destructive",
      });
    }
  };

  const filteredLeads = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(searchLower) ||
        lead.phone.includes(searchQuery) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.interest_details?.toLowerCase().includes(searchLower)
    );
  }, [leads, searchQuery]);

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">My Leads</h1>
            <p className="text-sm text-muted-foreground">Leads assigned to you.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone, interest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Next Follow-up</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No leads assigned yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLeads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell>
                              <div className="font-medium">{lead.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {lead.phone} · {format(new Date(lead.created_at), "dd MMM")}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {lead.interest_details || "-"}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={lead.status || "new"}
                                onValueChange={(value) => updateLead(lead.id, { status: value })}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={lead.stage || "new"}
                                onValueChange={(value) => updateLead(lead.id, { stage: value })}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {stageOptions.map((stage) => (
                                    <SelectItem key={stage} value={stage}>
                                      {stage}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={lead.priority || "medium"}
                                onValueChange={(value) => updateLead(lead.id, { priority: value })}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {priorityOptions.map((priority) => (
                                    <SelectItem key={priority} value={priority}>
                                      {priority}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={lead.next_follow_up ? lead.next_follow_up.slice(0, 10) : ""}
                                onChange={(e) =>
                                  updateLead(lead.id, { next_follow_up: e.target.value || null })
                                }
                              />
                            </TableCell>
                            <TableCell className="min-w-[240px]">
                              <Textarea
                                value={lead.notes || ""}
                                onChange={(e) => updateLead(lead.id, { notes: e.target.value })}
                                placeholder="Add notes..."
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );
}
