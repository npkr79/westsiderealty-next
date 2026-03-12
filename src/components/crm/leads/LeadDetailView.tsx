"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, MapPin, Pencil, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useActivities } from "@/hooks/useActivities";
import type { CrmTask, CrmUser } from "@/lib/crm/types";
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


interface LeadDetailViewProps {
  leadId: string;
  currentUser: CrmUser;
}

interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
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
  value?: number | string | null;
  deal_value?: number | null;
  property_description?: string | null;
  commission_pct?: number | null;
  commission_value?: number | null;
  expected_close_date?: string | null;
  stage?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

interface CallActivity {
  id: string;
  activity_type: string;
  description?: string | null;
  notes?: string | null;
  metadata?: {
    duration_minutes?: number | null;
    outcome?: string;
    notes?: string | null;
  } | null;
  created_at?: string;
}

interface SiteVisitActivity {
  id: string;
  activity_type: string;
  description?: string | null;
  notes?: string | null;
  metadata?: {
    visit_date?: string;
    location?: string;
    outcome?: string;
    notes?: string;
  } | null;
  created_at?: string;
}

interface AgentRecord {
  id: string;
  full_name: string | null;
}

// ── Inline editable field (pencil-to-input pattern) ──────────────────────────
interface InlineEditFieldProps {
  fieldKey: string;
  label: string;
  displayValue: string;
  inputType?: string;
  editValue: string;
  setEditValue: (v: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (val: string) => void;
  isSaved: boolean;
}

function InlineEditField({
  label,
  displayValue,
  inputType = "text",
  editValue,
  setEditValue,
  isEditing,
  onStartEdit,
  onSave,
  isSaved,
}: InlineEditFieldProps) {
  return (
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">{label}</p>
      {isEditing ? (
        <Input
          type={inputType}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onSave(editValue)}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(editValue); }}
          autoFocus
          className="h-7 text-sm"
        />
      ) : (
        <div className="flex items-center gap-1.5 group">
          {displayValue
            ? <span className="font-medium text-sm">{displayValue}</span>
            : <span className="text-slate-400 italic text-sm">Not set</span>}
          <button
            type="button"
            onClick={onStartEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <Pencil className="h-3 w-3" />
          </button>
          {isSaved && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Saved ✓</span>}
        </div>
      )}
    </div>
  );
}

export default function LeadDetailView({ leadId, currentUser }: LeadDetailViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const { activities, loading: loadingActivities, error: activityError } = useActivities(leadId);

  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [leadError, setLeadError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [dealsError, setDealsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Existing editable fields (status/priority/notes)
  const [editStatus, setEditStatus] = useState("new");
  const [editPriority, setEditPriority] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Contact detail inline edits
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savedField, setSavedField] = useState<string | null>(null);
  const savedFieldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Budget edits
  const [editBudgetMin, setEditBudgetMin] = useState("");
  const [editBudgetMax, setEditBudgetMax] = useState("");

  // Location / Buyer type
  const [editLocation, setEditLocation] = useState("");
  const [editBuyerType, setEditBuyerType] = useState("");

  // Assigned agent
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [editAssignedTo, setEditAssignedTo] = useState("");

  // Deal creation
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealProperty, setDealProperty] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [dealCommission, setDealCommission] = useState("2");
  const [dealCloseDate, setDealCloseDate] = useState("");
  const [dealStage, setDealStage] = useState("Negotiation");
  const [dealNotes, setDealNotes] = useState("");
  const [savingDeal, setSavingDeal] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

  // Site visits
  const [siteVisits, setSiteVisits] = useState<SiteVisitActivity[]>([]);
  const [showSiteVisitForm, setShowSiteVisitForm] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitLocation, setVisitLocation] = useState("");
  const [visitOutcome, setVisitOutcome] = useState("Scheduled");
  const [visitNotes, setVisitNotes] = useState("");
  const [savingSiteVisit, setSavingSiteVisit] = useState(false);

  // Call logging
  const [callLogs, setCallLogs] = useState<CallActivity[]>([]);
  const [showCallForm, setShowCallForm] = useState(false);
  const [callDuration, setCallDuration] = useState("");
  const [callOutcome, setCallOutcome] = useState("Connected");
  const [callNotes, setCallNotes] = useState("");
  const [savingCall, setSavingCall] = useState(false);

  // Profile save (budget, location, buyer_type, assigned_to)
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const agentName = currentUser.full_name || "your advisor";

  const loadLead = useCallback(async () => {
    setLoadingLead(true);
    setLeadError(null);
    const selectVariants = [
      "id,name,phone,email,source_channel,source_type,budget_min,budget_max,location,buyer_type,status,priority,notes,attribution_metadata,assigned_to,created_at,updated_at,last_activity_at",
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
      if (!/column .* does not exist|could not find.*column|schema cache/i.test(lastError)) break;
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
      .select("id,name,status,value,deal_value,property_description,commission_pct,commission_value,expected_close_date,stage,notes,created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      // Fallback: try minimal select in case newer columns don't exist yet
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("crm_deals")
        .select("id,name,status,value,created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (fallbackError) {
        setDeals([]);
        setDealsError("Deals table not available yet.");
        return;
      }
      setDeals((fallbackData as DealRecord[]) || []);
      return;
    }
    setDeals((data as DealRecord[]) || []);
  }, [leadId, supabase]);

  const loadSiteVisits = useCallback(async () => {
    const { data } = await supabase
      .from("crm_lead_activities")
      .select("id,activity_type,description,notes,metadata,created_at")
      .eq("lead_id", leadId)
      .eq("activity_type", "site_visit")
      .order("created_at", { ascending: false });
    setSiteVisits((data as SiteVisitActivity[]) || []);
  }, [leadId, supabase]);

  const loadAgents = useCallback(async () => {
    const { data } = await supabase
      .from("crm_users")
      .select("id,full_name")
      .eq("is_active", true)
      .eq("role", "agent")
      .order("full_name", { ascending: true });
    setAgents((data as AgentRecord[]) || []);
  }, [supabase]);

  const loadCallLogs = useCallback(async () => {
    const { data } = await supabase
      .from("crm_lead_activities")
      .select("id,activity_type,description,notes,metadata,created_at")
      .eq("lead_id", leadId)
      .eq("activity_type", "call")
      .order("created_at", { ascending: false });
    setCallLogs((data as CallActivity[]) || []);
  }, [leadId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLead();
      void loadLeadTasks();
      void loadDeals();
      void loadSiteVisits();
      void loadAgents();
      void loadCallLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDeals, loadLead, loadLeadTasks, loadSiteVisits, loadAgents, loadCallLogs]);

  // Sync edit states when lead data loads
  useEffect(() => {
    if (lead) {
      setEditStatus(lead.status || "new");
      setEditPriority(lead.priority || "");
      setEditNotes(lead.notes || "");
      setEditName(lead.name || "");
      setEditPhone(lead.phone || "");
      setEditEmail(lead.email || "");
      setEditBudgetMin(lead.budget_min != null ? String(lead.budget_min) : "");
      setEditBudgetMax(lead.budget_max != null ? String(lead.budget_max) : "");
      setEditLocation(lead.location || "");
      setEditBuyerType(lead.buyer_type || "");
      setEditAssignedTo(lead.assigned_to || "");
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
        () => { void loadSiteVisits(); void loadCallLogs(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, loadLead, loadLeadTasks, loadSiteVisits, loadCallLogs, supabase]);

  // ── helpers ──────────────────────────────────────────────────────────────────

  const showSaved = useCallback((field: string) => {
    setSavedField(field);
    if (savedFieldTimer.current) clearTimeout(savedFieldTimer.current);
    savedFieldTimer.current = setTimeout(() => setSavedField(null), 2000);
  }, []);

  const patchField = useCallback(
    async (field: string, value: unknown) => {
      setEditingField(null);
      await fetch(`/api/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      showSaved(field);
      void loadLead();
    },
    [leadId, loadLead, showSaved]
  );


  // ── task / site-visit mutations ──────────────────────────────────────────────

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

  const addSiteVisit = useCallback(async () => {
    if (!visitDate || !visitLocation.trim()) return;
    setSavingSiteVisit(true);
    const description = `Site visit at ${visitLocation.trim()} — ${visitOutcome}`;
    const taskStatus = visitOutcome === "Completed" ? "completed" : "pending";

    const [{ error: actError }, { error: taskError }] = await Promise.all([
      supabase.from("crm_lead_activities").insert({
        lead_id: leadId,
        activity_type: "site_visit",
        description,
        notes: visitNotes.trim() || null,
        metadata: {
          visit_date: visitDate,
          location: visitLocation.trim(),
          outcome: visitOutcome,
          notes: visitNotes.trim() || null,
        },
        created_by: currentUser.id,
      }),
      supabase.from("crm_tasks").insert({
        lead_id: leadId,
        title: `Site visit: ${visitLocation.trim()}`,
        due_date: visitDate,
        status: taskStatus,
        assigned_to: lead?.assigned_to || null,
      }),
    ]);

    setSavingSiteVisit(false);
    if (!actError && !taskError) {
      setVisitDate("");
      setVisitLocation("");
      setVisitOutcome("Scheduled");
      setVisitNotes("");
      setShowSiteVisitForm(false);
      void loadSiteVisits();
      void loadLeadTasks();
    }
  }, [
    visitDate, visitLocation, visitOutcome, visitNotes,
    currentUser.id, leadId, lead?.assigned_to,
    supabase, loadSiteVisits, loadLeadTasks,
  ]);

  const createDeal = useCallback(async () => {
    if (!dealProperty.trim() || !dealValue) return;
    setSavingDeal(true);
    setDealError(null);
    const numValue = Number(dealValue);
    const commPct = Number(dealCommission) || 0;
    const commValue = Math.round(numValue * commPct / 100);
    const fullPayload = {
      lead_id: leadId,
      name: dealProperty.trim(),
      property_description: dealProperty.trim(),
      value: numValue,          // used by dashboard pipeline calc
      deal_value: numValue,     // requested schema field
      commission_pct: commPct,
      commission_value: commValue,
      expected_close_date: dealCloseDate || null,
      stage: dealStage,
      notes: dealNotes.trim() || null,
      status: "active",
      created_by: currentUser.id,
    };
    const { error } = await supabase.from("crm_deals").insert(fullPayload);
    if (error) {
      // Fallback: minimal insert if newer columns don't exist
      const { error: fallbackError } = await supabase.from("crm_deals").insert({
        lead_id: leadId,
        name: dealProperty.trim(),
        value: numValue,
        status: "active",
        created_by: currentUser.id,
      });
      if (fallbackError) {
        setDealError("Failed to save deal. Please try again.");
        setSavingDeal(false);
        return;
      }
    }
    setSavingDeal(false);
    setShowDealForm(false);
    setDealProperty("");
    setDealValue("");
    setDealCommission("2");
    setDealCloseDate("");
    setDealStage("Negotiation");
    setDealNotes("");
    void loadDeals();
  }, [
    dealProperty, dealValue, dealCommission, dealCloseDate, dealStage, dealNotes,
    leadId, currentUser.id, supabase, loadDeals,
  ]);

  const logCall = useCallback(async () => {
    setSavingCall(true);
    const duration = callDuration ? parseInt(callDuration, 10) : null;
    const description = duration
      ? `Call — ${callOutcome} (${duration} mins)`
      : `Call — ${callOutcome}`;

    await supabase.from("crm_lead_activities").insert({
      lead_id: leadId,
      activity_type: "call",
      description,
      notes: callNotes.trim() || null,
      metadata: {
        duration_minutes: duration,
        outcome: callOutcome,
        notes: callNotes.trim() || null,
      },
      created_by: currentUser.id,
    });

    // Update last_activity_at; promote status New → Contacted on Connected
    const updates: Record<string, unknown> = { last_activity_at: new Date().toISOString() };
    if (callOutcome === "Connected" && /^new$/i.test(lead?.status ?? "")) {
      updates.status = "contacted";
    }
    await fetch(`/api/crm/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    setSavingCall(false);
    setShowCallForm(false);
    setCallDuration("");
    setCallOutcome("Connected");
    setCallNotes("");
    void loadCallLogs();
    void loadLead();
  }, [callDuration, callOutcome, callNotes, leadId, lead?.status, currentUser.id, supabase, loadCallLogs, loadLead]);

  const saveProfileChanges = useCallback(async () => {
    setSavingProfile(true);
    setProfileSaved(false);
    setProfileError(null);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget_min: editBudgetMin !== "" ? Number(editBudgetMin) : null,
          budget_max: editBudgetMax !== "" ? Number(editBudgetMax) : null,
          location_preference: editLocation || null,
          buyer_type: editBuyerType || null,
          assigned_to: editAssignedTo || null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      // If assigned_to changed, also write to crm_lead_assignments
      if (editAssignedTo && editAssignedTo !== lead?.assigned_to) {
        await supabase.from("crm_lead_assignments" as never).insert({
          lead_id: leadId,
          assigned_to: editAssignedTo,
          assigned_by: currentUser.id,
          assigned_at: new Date().toISOString(),
        });
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      void loadLead();
    } catch {
      setProfileError("Failed to save. Please try again.");
    }
    setSavingProfile(false);
  }, [
    editBudgetMin, editBudgetMax, editLocation, editBuyerType, editAssignedTo,
    lead?.assigned_to, leadId, currentUser.id, supabase, loadLead,
  ]);

  // ── render ───────────────────────────────────────────────────────────────────

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
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> {lead.phone}
          </span>
          <Badge className={getPriorityBadgeClassName(lead.priority)}>{getPriorityLabel(lead.priority)}</Badge>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setShowCallForm((v) => !v)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
        >
          <Phone className="h-4 w-4" /> Log Call
        </button>
        <a
          href={getWhatsAppLink(lead.phone, lead.name, agentName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold"
        >
          💬 WhatsApp
        </a>
      </div>

      {/* ── Inline Log Call form ── */}
      {showCallForm && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-4 space-y-3 mb-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Log a Call</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Call Duration (mins)</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Call Outcome</label>
              <select
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                className="w-full h-9 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="Connected">Connected</option>
                <option value="No Answer">No Answer</option>
                <option value="Busy">Busy</option>
                <option value="Wrong Number">Wrong Number</option>
                <option value="Callback Requested">Callback Requested</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Notes</label>
            <Textarea
              placeholder="What was discussed..."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={logCall} disabled={savingCall}>
              {savingCall ? "Saving..." : "Save Call Log"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowCallForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
          <TabsTrigger value="activities" className="flex-shrink-0">Activities</TabsTrigger>
          <TabsTrigger value="project-activity" className="flex-shrink-0">Website Activity</TabsTrigger>
          <TabsTrigger value="smart-shortlist" className="flex-shrink-0">Smart Shortlist</TabsTrigger>
          <TabsTrigger value="tasks" className="flex-shrink-0">Tasks</TabsTrigger>
          <TabsTrigger value="site-visits" className="flex-shrink-0">Site Visits</TabsTrigger>
          <TabsTrigger value="calls" className="flex-shrink-0">Calls</TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-shrink-0">WhatsApp</TabsTrigger>
          <TabsTrigger value="whatsapp-logs" className="flex-shrink-0">WhatsApp Logs</TabsTrigger>
          <TabsTrigger value="deals" className="flex-shrink-0">Deals</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview">
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lead profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">

                {/* Contact Details */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Contact Details</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <InlineEditField
                      fieldKey="name" label="Full Name"
                      displayValue={lead.name} editValue={editName} setEditValue={setEditName}
                      isEditing={editingField === "name"} isSaved={savedField === "name"}
                      onStartEdit={() => { setEditName(lead.name); setEditingField("name"); }}
                      onSave={(v) => void patchField("name", v)}
                    />
                    <InlineEditField
                      fieldKey="phone" label="Mobile" inputType="tel"
                      displayValue={lead.phone} editValue={editPhone} setEditValue={setEditPhone}
                      isEditing={editingField === "phone"} isSaved={savedField === "phone"}
                      onStartEdit={() => { setEditPhone(lead.phone); setEditingField("phone"); }}
                      onSave={(v) => void patchField("phone", v)}
                    />
                    <InlineEditField
                      fieldKey="email" label="Email" inputType="email"
                      displayValue={lead.email || ""} editValue={editEmail} setEditValue={setEditEmail}
                      isEditing={editingField === "email"} isSaved={savedField === "email"}
                      onStartEdit={() => { setEditEmail(lead.email || ""); setEditingField("email"); }}
                      onSave={(v) => void patchField("email", v)}
                    />
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Budget */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Budget</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Min Budget (₹)</p>
                      <Input
                        type="number"
                        value={editBudgetMin}
                        onChange={(e) => setEditBudgetMin(e.target.value)}
                        placeholder="e.g. 5000000"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Max Budget (₹)</p>
                      <Input
                        type="number"
                        value={editBudgetMax}
                        onChange={(e) => setEditBudgetMax(e.target.value)}
                        placeholder="e.g. 20000000"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  {(editBudgetMin || editBudgetMax) && (
                    <p className="mt-1 text-xs text-slate-400">
                      {formatBudgetRange(
                        editBudgetMin !== "" ? Number(editBudgetMin) : null,
                        editBudgetMax !== "" ? Number(editBudgetMax) : null
                      )}
                    </p>
                  )}
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Location + Buyer Type */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Location Preference</p>
                    <Input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g. North Goa"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Buyer Type</p>
                    <select
                      value={editBuyerType}
                      onChange={(e) => setEditBuyerType(e.target.value)}
                      className="w-full h-8 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">— Select —</option>
                      <option value="End User">End User</option>
                      <option value="Investor">Investor</option>
                      <option value="NRI">NRI</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Status + Priority + Source */}
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Source</p>
                    <p className="font-medium">{lead.source || "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Status</p>
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
                      className="w-full h-8 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Priority</p>
                    <select
                      value={editPriority}
                      onChange={async (e) => {
                        const newPriority = e.target.value;
                        setEditPriority(newPriority);
                        await fetch(`/api/crm/leads/${lead.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ priority: newPriority }),
                        });
                        console.log("Priority updated to:", newPriority);
                      }}
                      className="w-full h-8 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="cold">Cold</option>
                      <option value="warm">Warm</option>
                      <option value="hot">Hot</option>
                    </select>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Assigned Agent */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Assigned Agent</p>
                    <select
                      value={editAssignedTo}
                      onChange={(e) => setEditAssignedTo(e.target.value)}
                      className="w-full h-8 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">— Unassigned —</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.full_name ?? a.id}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Last activity</p>
                    <p className="font-medium">{toIST(lead.last_activity_at)}</p>
                  </div>
                </div>

                {/* Save Changes */}
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    onClick={saveProfileChanges}
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                  {profileSaved && (
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Saved ✓</span>
                  )}
                  {profileError && (
                    <span className="text-sm text-rose-600 dark:text-rose-400">{profileError}</span>
                  )}
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Notes */}
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Notes</p>
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

              {/* Lead Form Answers */}
              {(() => {
                const items = normalizeFormQuestions(
                  lead.attribution_metadata?.form_questions ?? lead.attribution_metadata?.field_data
                );
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

        {/* ── Activities ── */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingActivities ? <p className="text-sm">Loading activities...</p> : null}
              {activityError ? <p className="text-sm text-rose-600 dark:text-rose-300">{activityError}</p> : null}
              {(() => {
                const HIDDEN_TYPES = new Set(["stage_automation", "system", "automation"]);
                const visible = activities.filter((a) => {
                  if (HIDDEN_TYPES.has(a.activity_type)) return false;
                  const text = a.description || a.notes || "";
                  if (text.trimStart().startsWith("{")) return false;
                  return true;
                });
                if (!loadingActivities && visible.length === 0) {
                  return <p className="text-sm text-slate-500 dark:text-slate-400">No activity recorded yet.</p>;
                }
                return visible.map((activity) => {
                  const type = activity.activity_type;
                  const text = activity.description || activity.notes || "";

                  let icon: React.ReactNode = null;
                  let label: string;
                  let badgeClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

                  if (type === "call") {
                    icon = <Phone className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />;
                    label = text ? `Call logged — ${text}` : "Call logged";
                    badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
                  } else if (type === "note") {
                    icon = <FileText className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />;
                    label = text || "Note";
                  } else if (type === "site_visit") {
                    icon = <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />;
                    label = text || "Site visit";
                    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
                  } else if (type === "stage_change") {
                    icon = <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />;
                    label = text || "Stage changed";
                    badgeClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
                  } else {
                    label = text || type;
                  }

                  return (
                    <div key={activity.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          {icon && <span className="mt-0.5">{icon}</span>}
                          <div className="min-w-0">
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded mb-1 ${badgeClass}`}>
                              {type.replace(/_/g, " ")}
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-200 break-words">{label}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                          {toIST(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project-activity">
          <LeadProjectActivityTab leadId={leadId} currentUserId={currentUser.id} assignedAgentId={lead.assigned_to} />
        </TabsContent>

        <TabsContent value="smart-shortlist">
          <LeadSmartShortlistTab leadId={leadId} leadPhone={lead.phone} currentUserId={currentUser.id} />
        </TabsContent>

        {/* ── Tasks ── */}
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

        {/* ── Site Visits ── */}
        <TabsContent value="site-visits">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Site Visits</CardTitle>
              {!showSiteVisitForm && (
                <Button type="button" size="sm" onClick={() => setShowSiteVisitForm(true)}>
                  + Schedule Site Visit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {showSiteVisitForm && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Visit Date &amp; Time</label>
                      <Input
                        type="datetime-local"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Location / Property</label>
                      <Input
                        type="text"
                        placeholder="e.g. Sapphire, Siolim — Unit 302"
                        value={visitLocation}
                        onChange={(e) => setVisitLocation(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Outcome</label>
                    <select
                      value={visitOutcome}
                      onChange={(e) => setVisitOutcome(e.target.value)}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="No Show">No Show</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Notes (optional)</label>
                    <Textarea
                      placeholder="Any details about the visit..."
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={addSiteVisit}
                      disabled={savingSiteVisit || !visitDate || !visitLocation.trim()}
                    >
                      {savingSiteVisit ? "Saving..." : "Save Site Visit"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowSiteVisitForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {siteVisits.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No site visits logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {siteVisits.map((sv) => {
                    const outcome = sv.metadata?.outcome ?? "Scheduled";
                    const outcomeBadgeClass =
                      outcome === "Completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : outcome === "Scheduled"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
                    const visitDateStr = sv.metadata?.visit_date
                      ? toIST(sv.metadata.visit_date)
                      : toIST(sv.created_at);
                    return (
                      <div key={sv.id} className="rounded-md border p-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{sv.metadata?.location ?? "—"}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${outcomeBadgeClass}`}>
                            {outcome}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{visitDateStr}</p>
                        {sv.metadata?.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-300">{sv.metadata.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Calls ── */}
        <TabsContent value="calls">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" /> Call History
              </CardTitle>
              <Button type="button" size="sm" onClick={() => setShowCallForm(true)}>
                + Log Call
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {callLogs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No calls logged yet.</p>
              ) : (
                callLogs.map((call) => {
                  const outcome = call.metadata?.outcome ?? "Unknown";
                  const outcomeBadge = (() => {
                    if (outcome === "Connected") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
                    if (outcome === "No Answer" || outcome === "Busy") return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
                    if (outcome === "Wrong Number") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
                    if (outcome === "Callback Requested") return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
                    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                  })();
                  return (
                    <div key={call.id} className="rounded-md border p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${outcomeBadge}`}>
                            {outcome}
                          </span>
                          {call.metadata?.duration_minutes && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {call.metadata.duration_minutes} mins
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 whitespace-nowrap">{toIST(call.created_at)}</p>
                      </div>
                      {call.metadata?.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 pl-5">{call.metadata.notes}</p>
                      )}
                    </div>
                  );
                })
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

        {/* ── Deals ── */}
        <TabsContent value="deals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Deals</CardTitle>
              {!showDealForm && (
                <Button type="button" size="sm" onClick={() => setShowDealForm(true)}>
                  + Create Deal
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Create deal form */}
              {showDealForm && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Property / Project</label>
                      <Input
                        type="text"
                        placeholder="e.g. Sapphire, Siolim — Unit 302"
                        value={dealProperty}
                        onChange={(e) => setDealProperty(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Deal Value (₹)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 18700000"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Commission %</label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2"
                        value={dealCommission}
                        onChange={(e) => setDealCommission(e.target.value)}
                      />
                      {dealValue && dealCommission && (
                        <p className="text-xs text-slate-400">
                          ≈ ₹{(Number(dealValue) * Number(dealCommission) / 100).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Expected Close Date</label>
                      <Input
                        type="date"
                        value={dealCloseDate}
                        onChange={(e) => setDealCloseDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Stage</label>
                      <select
                        value={dealStage}
                        onChange={(e) => setDealStage(e.target.value)}
                        className="w-full h-9 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="Negotiation">Negotiation</option>
                        <option value="Agreement">Agreement</option>
                        <option value="Registration">Registration</option>
                        <option value="Closed Won">Closed Won</option>
                        <option value="Closed Lost">Closed Lost</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Notes (optional)</label>
                      <Textarea
                        placeholder="Any deal notes..."
                        value={dealNotes}
                        onChange={(e) => setDealNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  {dealError && <p className="text-xs text-rose-600 dark:text-rose-400">{dealError}</p>}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={createDeal}
                      disabled={savingDeal || !dealProperty.trim() || !dealValue}
                    >
                      {savingDeal ? "Saving..." : "Save Deal"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => { setShowDealForm(false); setDealError(null); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Deals error */}
              {dealsError && <p className="text-sm text-slate-500 dark:text-slate-400">{dealsError}</p>}

              {/* Deals table */}
              {deals.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No deals linked yet.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          <th className="pb-2 pr-4">Property</th>
                          <th className="pb-2 pr-4">Deal Value</th>
                          <th className="pb-2 pr-4">Commission</th>
                          <th className="pb-2 pr-4">Expected Close</th>
                          <th className="pb-2 pr-4">Stage</th>
                          <th className="pb-2">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {deals.map((deal) => {
                          const numVal = typeof deal.value === "number" ? deal.value : Number(deal.deal_value ?? deal.value ?? 0);
                          const commVal = deal.commission_value ?? (numVal * (deal.commission_pct ?? 0) / 100);
                          const stageBadge = (() => {
                            const s = deal.stage || deal.status || "";
                            if (/closed.won|won/i.test(s)) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
                            if (/closed.lost|lost/i.test(s)) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
                            if (/negotiat/i.test(s)) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
                            if (/agreement/i.test(s)) return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
                            if (/registrat/i.test(s)) return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
                            return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                          })();
                          return (
                            <tr key={deal.id} className="py-2">
                              <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200 max-w-[160px] truncate">
                                {deal.property_description || deal.name || `Deal ${deal.id.slice(0, 8)}`}
                              </td>
                              <td className="py-2.5 pr-4 tabular-nums">
                                {numVal ? `₹${numVal.toLocaleString("en-IN")}` : "—"}
                              </td>
                              <td className="py-2.5 pr-4 tabular-nums text-slate-500">
                                {commVal ? `₹${Math.round(commVal).toLocaleString("en-IN")}` : deal.commission_pct ? `${deal.commission_pct}%` : "—"}
                              </td>
                              <td className="py-2.5 pr-4 text-slate-500">
                                {deal.expected_close_date ? toISTDate(deal.expected_close_date) : "—"}
                              </td>
                              <td className="py-2.5 pr-4">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stageBadge}`}>
                                  {deal.stage || deal.status || "open"}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-400 text-xs whitespace-nowrap">
                                {toISTDate(deal.created_at ?? undefined)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Total pipeline */}
                  {(() => {
                    const total = deals
                      .filter((d) => !/closed.lost|lost/i.test(d.stage || d.status || ""))
                      .reduce((sum, d) => {
                        const v = typeof d.value === "number" ? d.value : Number(d.deal_value ?? d.value ?? 0);
                        return sum + v;
                      }, 0);
                    return total > 0 ? (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Total Pipeline: ₹{total.toLocaleString("en-IN")}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
