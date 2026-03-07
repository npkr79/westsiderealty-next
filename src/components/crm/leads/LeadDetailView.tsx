"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useActivities } from "@/hooks/useActivities";
import type { CrmActivity, CrmTask, CrmUser } from "@/lib/crm/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import LeadWhatsAppPanel from "@/components/crm/leads/LeadWhatsAppPanel";
import LeadBehaviorIntelligencePanel from "@/components/crm/leads/LeadBehaviorIntelligencePanel";
import LeadProjectActivityTab from "@/components/crm/leads/LeadProjectActivityTab";
import LeadSmartShortlistTab from "@/components/crm/leads/LeadSmartShortlistTab";
import LeadWhatsAppLogsTab from "@/components/crm/leads/LeadWhatsAppLogsTab";
import { getPriorityBadgeClassName, getPriorityLabel } from "@/lib/crm/leadPriority";
import { formatBudgetRange } from "@/lib/crm/budget";

function toIST(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not updated";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "Invalid date";
  }
}

function toISTDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not set";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

function normalizeFormQuestions(fq: unknown): Array<{ q: string; a: string }> {
  if (!fq) return [];
  if (Array.isArray(fq)) {
    return (fq as Array<Record<string, unknown>>)
      .map((item) => ({
        q: String(item?.question ?? item?.field_name ?? item?.key ?? "").trim(),
        a: String(item?.answer ?? item?.field_value ?? item?.value ?? "").trim(),
      }))
      .filter((item) => item.q);
  }
  if (typeof fq === "object") {
    return Object.entries(fq as Record<string, unknown>).map(([q, a]) => ({
      q: q.trim(),
      a: String(a ?? "").trim(),
    }));
  }
  return [];
}

function getWhatsAppLink(phone: string, leadName: string, agentName: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const e164 = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const message = encodeURIComponent(
    `Hi ${leadName} 👋 I'm ${agentName} from Westside Advisory.\n\nYou enquired about a property in Goa — I'd love to share details about Sapphire, Siolim.\n\nHere's what makes it special:\n🏊 Private plunge pool in every unit\n🌴 In the Morjim-Vagator beach belt\n💰 2BHK from ₹1.87Cr | 3BHK from ₹2.47Cr\n📅 Possession 2027 | Managed rentals available\n\nAre you looking for investment or personal use?`
  );
  return `https://wa.me/${e164}?text=${message}`;
}

async function logCallAttempt(leadId: string): Promise<void> {
  try {
    await fetch(`/api/crm/leads/${leadId}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "call_attempt", notes: "Call initiated from CRM" }),
    });
  } catch {
    // non-critical
  }
}

interface LeadDetailViewProps {
  leadId: string;
  currentUser: CrmUser;
}

interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  source: string | null;
  source_channel?: string | null;
  source_type?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  location: string | null;
  buyer_type: string | null;
  status: string | null;
  priority?: string | null;
  notes?: string | null;
  attribution_metadata?: Record<string, unknown> | null;
  assigned_to: string | null;
  created_at?: string;
  updated_at?: string;
  last_activity_at?: string | null;
}

interface DealRecord {
  id: string;
  name?: string | null;
  status?: string | null;
  value?: string | null;
  created_at?: string | null;
}

export default function LeadDetailView({ leadId, currentUser }: LeadDetailViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const { activities, loading: loadingActivities, error: activityError } = useActivities(leadId);

  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [leadError, setLeadError] = useState<string | null>(null);

  const [notes, setNotes] = useState<CrmActivity[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [dealsError, setDealsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editStatus, setEditStatus] = useState("new");
  const [editPriority, setEditPriority] = useState("cold");
  const [editNotes, setEditNotes] = useState("");

  const agentName = currentUser.full_name || "your advisor";

  const loadLead = useCallback(async () => {
    setLoadingLead(true);
    setLeadError(null);
    const selectVariants = [
      "id,name,phone,source_channel,source_type,budget_min,budget_max,location,buyer_type,status,priority,notes,attribution_metadata,assigned_to,created_at,updated_at,last_activity_at",
      "id,name,phone,source_channel,source_type,budget_min,budget_max,location,buyer_type,status,lead_priority,notes,attribution_metadata,assigned_to,created_at,updated_at,last_activity_at",
      "id,name,phone,source_channel,source_type,budget_min,budget_max,location,buyer_type,status,assigned_to,created_at,updated_at,last_activity_at",
    ];
    let row: (LeadRecord & { lead_priority?: string | null }) | null = null;
    let found = false;
    let lastError = "Failed to load lead.";
    for (const selectClause of selectVariants) {
      const { data, error } = await supabase.from("crm_leads_view").select(selectClause).eq("id", leadId).maybeSingle();
      if (!error) {
        row = (data as (LeadRecord & { lead_priority?: string | null }) | null) || null;
        found = true;
        break;
      }
      lastError = error.message || "Failed to load lead.";
      if (!/column .* does not exist/i.test(lastError)) break;
    }
    if (!found) {
      setLeadError(lastError);
      setLoadingLead(false);
      return;
    }
    setLead(
      row
        ? {
            ...row,
            source: row.source_channel || row.source_type || null,
            priority: row.priority || row.lead_priority || null,
          }
        : null
    );
    setLoadingLead(false);
  }, [leadId, supabase]);

  const loadNotes = useCallback(async () => {
    const { data } = await supabase
      .from("crm_lead_activities")
      .select("id,lead_id,activity_type,notes,created_by,created_at")
      .eq("lead_id", leadId)
      .eq("activity_type", "note")
      .order("created_at", { ascending: false });
    setNotes((data as CrmActivity[]) || []);
  }, [leadId, supabase]);

  const loadLeadTasks = useCallback(async () => {
    const { data } = await supabase
      .from("crm_tasks")
      .select("id,title,description,status,priority,due_date,assigned_to,lead_id,created_at,updated_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setTasks((data as CrmTask[]) || []);
  }, [leadId, supabase]);

  const loadDeals = useCallback(async () => {
    setDealsError(null);
    const { data, error } = await supabase
      .from("crm_deals")
      .select("id,name,status,value,created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      setDeals([]);
      setDealsError("Deals table not available yet.");
      return;
    }
    setDeals((data as DealRecord[]) || []);
  }, [leadId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLead();
      void loadNotes();
      void loadLeadTasks();
      void loadDeals();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDeals, loadLead, loadLeadTasks, loadNotes]);

  // Sync edit states when lead data loads
  useEffect(() => {
    if (lead) {
      setEditStatus(lead.status || "new");
      setEditPriority(lead.priority || "cold");
      setEditNotes(lead.notes || "");
    }
  }, [lead]);

  useEffect(() => {
    const channel = supabase
      .channel(`crm-lead-detail-${leadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads", filter: `id=eq.${leadId}` }, loadLead)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_tasks", filter: `lead_id=eq.${leadId}` }, loadLeadTasks)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_lead_activities", filter: `lead_id=eq.${leadId}` },
        loadNotes
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, loadLead, loadLeadTasks, loadNotes, supabase]);

  const addNote = useCallback(async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const { error } = await supabase.from("crm_lead_activities").insert({
      lead_id: leadId,
      activity_type: "note",
      notes: newNote.trim(),
      created_by: currentUser.id,
    });
    setSavingNote(false);
    if (!error) {
      setNewNote("");
      loadNotes();
    }
  }, [currentUser.id, leadId, loadNotes, newNote, supabase]);

  const updateNote = useCallback(
    async (id: string, text: string) => {
      setUpdatingNoteId(id);
      await supabase.from("crm_lead_activities").update({ notes: text }).eq("id", id);
      setUpdatingNoteId(null);
      loadNotes();
    },
    [loadNotes, supabase]
  );

  const addTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    setSavingTask(true);
    const { error } = await supabase.from("crm_tasks").insert({
      title: newTaskTitle.trim(),
      due_date: newTaskDueDate || null,
      status: "pending",
      lead_id: leadId,
      assigned_to: lead?.assigned_to || null,
    });
    setSavingTask(false);
    if (!error) {
      setNewTaskTitle("");
      setNewTaskDueDate("");
      loadLeadTasks();
    }
  }, [lead?.assigned_to, leadId, loadLeadTasks, newTaskDueDate, newTaskTitle, supabase]);

  const toggleTask = useCallback(
    async (task: CrmTask, checked: boolean) => {
      await supabase.from("crm_tasks").update({ status: checked ? "completed" : "pending" }).eq("id", task.id);
      loadLeadTasks();
    },
    [loadLeadTasks, supabase]
  );

  if (loadingLead) {
    return <p className="text-sm">Loading lead details...</p>;
  }

  if (leadError || !lead) {
    return (
      <div className="space-y-3">
        <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:underline dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
        <p className="text-sm text-rose-600 dark:text-rose-300">{leadError || "Lead not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:underline dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
        <h1 className="text-2xl font-semibold">{lead.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`tel:${lead.phone}`}
            onClick={() => void logCallAttempt(lead.id)}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
          >
            📞 {lead.phone}
          </a>
          <Badge className={getPriorityBadgeClassName(lead.priority)}>{getPriorityLabel(lead.priority)}</Badge>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <a
          href={`tel:${lead.phone}`}
          onClick={() => void logCallAttempt(lead.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
        >
          📞 Call Now
        </a>
        <a
          href={getWhatsAppLink(lead.phone, lead.name, agentName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold"
        >
          💬 WhatsApp
        </a>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
          <TabsTrigger value="notes" className="flex-shrink-0">Notes</TabsTrigger>
          <TabsTrigger value="activities" className="flex-shrink-0">Activities</TabsTrigger>
          <TabsTrigger value="project-activity" className="flex-shrink-0">Project Activity</TabsTrigger>
          <TabsTrigger value="smart-shortlist" className="flex-shrink-0">Smart Shortlist</TabsTrigger>
          <TabsTrigger value="tasks" className="flex-shrink-0">Tasks</TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-shrink-0">WhatsApp</TabsTrigger>
          <TabsTrigger value="whatsapp-logs" className="flex-shrink-0">WhatsApp Logs</TabsTrigger>
          <TabsTrigger value="deals" className="flex-shrink-0">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lead profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Source</p>
                  <p className="font-medium">{lead.source || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Budget</p>
                  <p className="font-medium">{formatBudgetRange(lead.budget_min, lead.budget_max)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Preferences</p>
                  <p className="font-medium">
                    {(lead.location || "Any location") + " • " + (lead.buyer_type || "General buyer")}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Status</p>
                  <select
                    value={editStatus}
                    onChange={async (e) => {
                      setEditStatus(e.target.value);
                      await fetch(`/api/crm/leads/${lead.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: e.target.value }),
                      });
                    }}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Priority</p>
                  <select
                    value={editPriority}
                    onChange={async (e) => {
                      setEditPriority(e.target.value);
                      await fetch(`/api/crm/leads/${lead.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ priority: e.target.value }),
                      });
                    }}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="cold">Cold</option>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Last activity</p>
                  <p className="font-medium text-sm">{toIST(lead.last_activity_at)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    onBlur={async () => {
                      await fetch(`/api/crm/leads/${lead.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ notes: editNotes }),
                      });
                    }}
                    placeholder="Add notes..."
                    rows={4}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>
              </CardContent>
              {(() => {
                const items = normalizeFormQuestions(lead.attribution_metadata?.form_questions);
                return (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 px-6 pb-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Lead Form Answers</p>
                    {items.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No form data available.</p>
                    ) : (
                      <div className="space-y-2">
                        {items.map(({ q, a }) => (
                          <div key={q} className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">
                              {q.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {a.replace(/_/g, " ") || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>
            <LeadBehaviorIntelligencePanel leadId={leadId} />
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add a note for this lead..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button type="button" onClick={addNote} disabled={savingNote}>
                {savingNote ? "Saving..." : "Add note"}
              </Button>

              <div className="space-y-2">
                {notes.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No notes added yet.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-md border p-3">
                      <Textarea
                        defaultValue={note.notes || ""}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (value !== (note.notes || "").trim()) {
                            updateNote(note.id, value);
                          }
                        }}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {updatingNoteId === note.id
                          ? "Updating..."
                          : note.created_at
                            ? toIST(note.created_at)
                            : "Unknown time"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingActivities ? <p className="text-sm">Loading activities...</p> : null}
              {activityError ? <p className="text-sm text-rose-600 dark:text-rose-300">{activityError}</p> : null}
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-md border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <Badge variant="secondary">{activity.activity_type}</Badge>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {toIST(activity.created_at)}
                    </p>
                  </div>
                  <p className="text-sm">{activity.notes || "-"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project-activity">
          <LeadProjectActivityTab leadId={leadId} currentUserId={currentUser.id} assignedAgentId={lead.assigned_to} />
        </TabsContent>

        <TabsContent value="smart-shortlist">
          <LeadSmartShortlistTab leadId={leadId} leadPhone={lead.phone} currentUserId={currentUser.id} />
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="md:col-span-2"
                />
                <Input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
              </div>
              <Button type="button" onClick={addTask} disabled={savingTask}>
                {savingTask ? "Adding..." : "Create task"}
              </Button>

              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No tasks for this lead yet.</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="rounded-md border p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={task.status === "completed"} onCheckedChange={(checked) => toggleTask(task, checked)} />
                      <div>
                        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through opacity-70" : ""}`}>{task.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Due: {toISTDate(task.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <LeadWhatsAppPanel leadId={leadId} leadPhone={lead.phone} />
        </TabsContent>

        <TabsContent value="whatsapp-logs">
          <LeadWhatsAppLogsTab leadId={leadId} leadPhone={lead.phone} />
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related deals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dealsError ? <p className="text-sm text-slate-500 dark:text-slate-400">{dealsError}</p> : null}
              {deals.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No deals linked yet.</p>
              ) : (
                deals.map((deal) => (
                  <div key={deal.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{deal.name || `Deal ${deal.id}`}</p>
                      <Badge variant="outline">{deal.status || "open"}</Badge>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">Value: {deal.value || "-"}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
