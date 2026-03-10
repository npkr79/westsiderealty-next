"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, Loader2, UserRound, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  type: string | null;
  source_page: string | null;
  details: Record<string, any> | null;
  created_at: string;
  assigned_to: string | null;
  interest_details: string | null;
  status: string | null;
  stage: string | null;
  priority: string | null;
  notes: string | null;
  next_follow_up: string | null;
  lead_source: string | null;
}

interface AgentOption {
  id: string;
  name: string;
  active: boolean;
}

const statusOptions = ["new", "active", "closed"];
const stageOptions = ["new", "contacted", "qualified", "site_visit", "negotiation", "won", "lost"];
const priorityOptions = ["low", "medium", "high"];

export default function LeadsCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await fetch("/api/admin/leads");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load leads.");
      }

      const leadRows = (data.leads || []) as Lead[];
      setLeads(leadRows);
      setAgents((data.agents || []) as AgentOption[]);
    } catch (error: any) {
      console.error("Error loading leads:", error);
      setErrorMessage(error?.message || "Failed to load leads.");
      toast({
        title: "Error",
        description: "Failed to load leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        lead.name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(searchQuery) ||
        lead.interest_details?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesStage && matchesPriority;
    });
  }, [leads, searchQuery, statusFilter, stageFilter, priorityFilter]);

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update lead.");
      }

      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead)));
      toast({
        title: "Updated",
        description: "Lead updated successfully.",
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead.",
        variant: "destructive",
      });
    }
  };

  const handleAssignAgent = async (leadId: string, agentId: string | null) => {
    await updateLead(leadId, {
      assigned_to: agentId,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads CRM</h1>
          <p className="text-sm text-muted-foreground">Track and manage the complete lead journey.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{leads.length} Total Leads</Badge>
          <Badge variant="secondary">{filteredLeads.length} Filtered</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, interest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stageOptions.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorityOptions.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {errorMessage ? (
            <div className="text-sm text-muted-foreground">{errorMessage}</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No leads found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {lead.interest_details || lead.details?.projectName || lead.details?.project_name || "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.assigned_to || "unassigned"}
                          onValueChange={(value) =>
                            handleAssignAgent(lead.id, value === "unassigned" ? null : value)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Assign agent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!lead.assigned_to && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Default: Owner / Office Admin
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status || "new"}
                          onValueChange={(value) => updateLead(lead.id, { status: value })}
                        >
                          <SelectTrigger className="w-[140px]">
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
                          <SelectTrigger className="w-[160px]">
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
                        {lead.next_follow_up ? format(new Date(lead.next_follow_up), "dd MMM") : "-"}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{lead.name}</DialogTitle>
                              <DialogDescription>
                                {lead.interest_details || lead.details?.message || "Lead details"}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4">
                              <div className="grid gap-2 md:grid-cols-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <UserRound className="h-4 w-4 text-muted-foreground" />
                                  {lead.email || "No email"}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                  {format(new Date(lead.created_at), "dd MMM yyyy, hh:mm a")}
                                </div>
                              </div>
                              <div className="grid gap-2 md:grid-cols-2">
                                <div>
                                  <label className="text-xs text-muted-foreground">Assigned to</label>
                                  <Select
                                    value={lead.assigned_to || "unassigned"}
                                    onValueChange={(value) =>
                                      handleAssignAgent(lead.id, value === "unassigned" ? null : value)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Assign agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unassigned">Unassigned</SelectItem>
                                      {agents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                          {agent.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Next follow-up</label>
                                  <Input
                                    type="date"
                                    value={lead.next_follow_up ? lead.next_follow_up.slice(0, 10) : ""}
                                    onChange={(e) =>
                                      updateLead(lead.id, { next_follow_up: e.target.value || null })
                                    }
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Notes</label>
                                <Textarea
                                  value={lead.notes || ""}
                                  onChange={(e) => updateLead(lead.id, { notes: e.target.value })}
                                  placeholder="Add internal notes..."
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
