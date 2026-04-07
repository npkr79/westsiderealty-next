"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import CallBriefPanel from "@/components/crm/leads/CallBriefPanel";
import LeadWhatsAppPanel from "@/components/crm/leads/LeadWhatsAppPanel";
import LeadBehaviorIntelligencePanel from "@/components/crm/leads/LeadBehaviorIntelligencePanel";
import LeadAdvisorChatPanel from "@/components/crm/leads/LeadAdvisorChatPanel";
import LeadProjectActivityTab from "@/components/crm/leads/LeadProjectActivityTab";
import LeadSmartShortlistTab from "@/components/crm/leads/LeadSmartShortlistTab";
import LeadWhatsAppLogsTab from "@/components/crm/leads/LeadWhatsAppLogsTab";
import { getPriorityBadgeClassName, getPriorityLabel } from "@/lib/crm/leadPriority";
import { formatBudgetRange } from "@/lib/crm/budget";

function toIST(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    // Append Z to treat as UTC if no timezone indicator present
    const normalized = dateStr.includes('Z') || dateStr.includes('+')
      ? dateStr
      : dateStr + 'Z';
    const utc = new Date(normalized).getTime();
    const ist = new Date(utc + 5.5 * 60 * 60 * 1000);
    const d = ist.getUTCDate().toString().padStart(2,"0");
    const m = ["Jan","Feb","Mar","Apr","May","Jun",
               "Jul","Aug","Sep","Oct","Nov","Dec"][ist.getUTCMonth()];
    const y = ist.getUTCFullYear();
    let h = ist.getUTCHours();
    const min = ist.getUTCMinutes().toString().padStart(2,"0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${d} ${m} ${y}, ${h}:${min} ${ampm}`;
  } catch {
    return "—";
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

function formatSourceName(source: string | null | undefined): string {
  if (!source) return "-";
  const map: Record<string, string> = {
    facebook_lead_ads: "Facebook Lead Ads",
    meta_ads: "Meta Ads",
    meta: "Meta",
    website_form: "Website Form",
    website: "Website",
    organic_landing: "Organic",
    google_ads: "Google Ads",
    referral: "Referral",
    channel: "Channel Partner",
    manual: "Manual Entry",
    landing_page: "Landing Page",
    whatsapp: "WhatsApp",
  };
  return map[source] ?? source.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatBudget(val: number | null): string | null {
  if (!val) return null;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
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
  lead_score?: number | null;
  lead_status?: string | null;
  notes?: string | null;
  attribution_metadata?: Record<string, unknown> | null;
  assigned_to: string | null;
  stage_id?: string | null;
  first_contact_at?: string | null;
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
    location?: string;      // legacy field
    project_name?: string;  // new field
    outcome?: string;       // legacy field
    status?: string;        // new field
    notes?: string;         // legacy field
    feedback?: string;      // new field
    postponed_date?: string;
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
            className="transition-opacity text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" style={{ opacity: 0.4 }}
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
  const [newTaskTime, setNewTaskTime] = useState("09:00");
  const [savingTask, setSavingTask] = useState(false);

  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [dealsError, setDealsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Existing editable fields (status/notes)
  const [editStatus, setEditStatus] = useState("new");
  const [editLeadStatus, setEditLeadStatus] = useState("cold");
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

  // Location / Buyer type / Timeline
  const [editLocation, setEditLocation] = useState("");
  const [editBuyerType, setEditBuyerType] = useState("");
  const [editTimeline, setEditTimeline] = useState("");

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
  // Site visit update panel
  const [updatingSiteVisitId, setUpdatingSiteVisitId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState("Completed");
  const [updateFeedback, setUpdateFeedback] = useState("");
  const [updatePostponedDate, setUpdatePostponedDate] = useState("");
  const [savingUpdate, setSavingUpdate] = useState(false);

  // Call logging
  const [callLogs, setCallLogs] = useState<CallActivity[]>([]);
  const [showCallForm, setShowCallForm] = useState(false);
  const [callDuration, setCallDuration] = useState("");
  const [callOutcome, setCallOutcome] = useState("Connected");
  const [callNotes, setCallNotes] = useState("");
  const [savingCall, setSavingCall] = useState(false);
  // Quick-call bottom sheet
  const [showCallSheet, setShowCallSheet] = useState(false);
  const [showBriefPanel, setShowBriefPanel] = useState(false);
  const [showPostCallNote, setShowPostCallNote] = useState(false);
  const [lastCallOutcome, setLastCallOutcome] = useState("");

  // Profile save (budget, location, buyer_type, assigned_to)
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Mobile enhancements
  const [stages, setStages] = useState<{ id: string; name: string; position: number }[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const agentName = currentUser.full_name || "your advisor";
  const router = useRouter();

  const loadLead = useCallback(async () => {
    setLoadingLead(true);
    setLeadError(null);
    const selectVariants = [
      "id,name,phone,email,source_channel,source_type,budget_min,budget_max,location,buyer_type,status,lead_status,priority,lead_score,notes,attribution_metadata,assigned_to,stage_id,first_contact_at,created_at,updated_at,last_activity_at",
      "id,name,phone,source_channel,source_type,budget_min,budget_max,location,buyer_type,status,lead_status,priority,lead_score,notes,attribution_metadata,assigned_to,stage_id,first_contact_at,created_at,updated_at,last_activity_at",
      "id,name,phone,source_channel,source_type,budget_min,budget_max,location,buyer_type,status,assigned_to,stage_id,first_contact_at,created_at,updated_at,last_activity_at",
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
    // crm_leads_view may not expose the priority column — fetch it via the API (service-client, bypasses RLS)
    let resolvedPriority: string | null = (row as any)?.priority || (row as any)?.lead_priority || null;
    if (!resolvedPriority && row?.id) {
      try {
        const res = await fetch(`/api/crm/leads/${leadId}`);
        if (res.ok) {
          const directData = await res.json();
          if (directData?.priority) resolvedPriority = directData.priority;
        }
      } catch { /* ignore */ }
    }
    setLead(
      row
        ? {
            ...row,
            source: row.source_channel || row.source_type || null,
            priority: resolvedPriority,
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

  const loadStages = useCallback(async () => {
    const { data } = await supabase
      .from("crm_lead_stages")
      .select("id,name,position")
      .eq("is_active", true)
      .order("position");
    if (data) setStages(data as { id: string; name: string; position: number }[]);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLead();
      void loadLeadTasks();
      void loadDeals();
      void loadSiteVisits();
      void loadAgents();
      void loadCallLogs();
      void loadStages();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDeals, loadLead, loadLeadTasks, loadSiteVisits, loadAgents, loadCallLogs, loadStages]);

  // Sync edit states when lead data loads
  useEffect(() => {
    if (lead) {
      setEditStatus(lead.status || "new");
      setEditLeadStatus(lead.lead_status || "cold");
      setEditNotes(lead.notes || "");
      setEditName(lead.name || "");
      setEditPhone(lead.phone || "");
      setEditEmail(lead.email || "");
      setEditBudgetMin(lead.budget_min != null ? String(lead.budget_min) : "");
      setEditBudgetMax(lead.budget_max != null ? String(lead.budget_max) : "");
      setEditLocation(lead.location || "");
      setEditBuyerType(lead.buyer_type || "");
      setEditTimeline((lead as any).timeline || "");
      setEditAssignedTo(lead.assigned_to || "");
    }
  }, [lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── mobile detection ─────────────────────────────────────────────────────────

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
    const due = newTaskDueDate && newTaskTime
      ? new Date(`${newTaskDueDate}T${newTaskTime}`).toISOString()
      : newTaskDueDate
        ? new Date(newTaskDueDate).toISOString()
        : null;
    const { error } = await supabase.from("crm_tasks").insert({
      title: newTaskTitle.trim(),
      due_date: due,
      status: "pending",
      lead_id: leadId,
      assigned_to: lead?.assigned_to || null,
    });
    setSavingTask(false);
    if (!error) {
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskTime("09:00");
      loadLeadTasks();
    }
  }, [lead?.assigned_to, leadId, loadLeadTasks, newTaskDueDate, newTaskTime, newTaskTitle, supabase]);

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

  const updateSiteVisit = useCallback(async (sv: SiteVisitActivity) => {
    if (!updateStatus) return;
    setSavingUpdate(true);
    const projectName = sv.metadata?.project_name || sv.metadata?.location || "site";
    const newDescription = `Site visit at ${projectName} — ${updateStatus}`;
    const updatedMetadata = {
      ...sv.metadata,
      status: updateStatus,
      outcome: updateStatus,
      feedback: updateFeedback.trim() || null,
      ...(updateStatus === "Postponed" ? { postponed_date: updatePostponedDate } : {}),
    };

    const ops: Promise<unknown>[] = [
      supabase.from("crm_lead_activities").update({
        description: newDescription,
        notes: updateFeedback.trim() || null,
        metadata: updatedMetadata,
      }).eq("id", sv.id),
      supabase.from("crm_lead_activities").insert({
        lead_id: leadId,
        activity_type: "site_visit_update",
        description: `Site visit at ${projectName} updated to ${updateStatus}`,
        notes: updateFeedback.trim() || null,
        created_by: currentUser.id,
        metadata: { previous_status: sv.metadata?.status || sv.metadata?.outcome || "Scheduled" },
      }),
    ];

    if (updateStatus === "Postponed" && updatePostponedDate) {
      ops.push(
        supabase.from("crm_lead_activities").insert({
          lead_id: leadId,
          activity_type: "site_visit",
          description: `Site visit at ${projectName} — Scheduled`,
          notes: null,
          created_by: currentUser.id,
          metadata: { status: "Scheduled", project_name: projectName, visit_date: updatePostponedDate },
        })
      );
    }

    await Promise.all(ops);
    setSavingUpdate(false);
    setUpdatingSiteVisitId(null);
    setUpdateStatus("Completed");
    setUpdateFeedback("");
    setUpdatePostponedDate("");
    void loadSiteVisits();
  }, [
    updateStatus, updateFeedback, updatePostponedDate,
    leadId, currentUser.id, supabase, loadSiteVisits,
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

  const handleQuickCall = async (outcome: string) => {
    setShowCallSheet(false);
    setSavingCall(true);

    await supabase.from("crm_lead_activities").insert({
      lead_id: leadId,
      activity_type: "call",
      description: `Call — ${outcome}`,
      notes: null,
      metadata: { outcome, duration_minutes: null },
      created_by: currentUser.id,
    });

    const STAGE_CONTACTED = "f0825f0e-0fba-44f7-8973-1c34c9ced33c";
    const STAGE_NEW = "c11c69eb-c76f-460a-9114-e616411d57a6";

    const updates: Record<string, unknown> = { last_activity_at: new Date().toISOString() };

    if (outcome === "Connected") {
      // Update status + first_contact_at if not yet contacted
      if (/^new$/i.test(lead?.status ?? "")) {
        updates.status = "contacted";
        updates.first_contact_at = new Date().toISOString();
      }

      // Advance stage to Contacted if currently on New or null
      const currentStageId = lead?.stage_id ?? null;
      if (!currentStageId || currentStageId === STAGE_NEW) {
        await fetch("/api/crm/pipeline/update-stage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, toStageId: STAGE_CONTACTED }),
        });
      }
    }

    // Always patch last_activity_at (and status/first_contact if set)
    await fetch(`/api/crm/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    setSavingCall(false);
    setLastCallOutcome(outcome);
    setShowPostCallNote(true);
    void loadCallLogs();
    void loadLead();
  };

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
          timeline: editTimeline || null,
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
    editBudgetMin, editBudgetMax, editLocation, editBuyerType, editTimeline, editAssignedTo,
    lead?.assigned_to, leadId, currentUser.id, supabase, loadLead,
  ]);

  const handleStageChange = useCallback(async (stageId: string) => {
    setLead((prev) => prev ? { ...prev, stage_id: stageId } : prev);
    const res = await fetch("/api/crm/pipeline/update-stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, toStageId: stageId, userId: currentUser.id }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[StageChange] Failed:", res.status, err);
      // Revert optimistic update
      setLead((prev) => prev ? { ...prev, stage_id: prev.stage_id } : prev);
    }
  }, [leadId, currentUser.id]);

  const handleMarkContacted = useCallback(async () => {
    if (!lead) return;
    const now = new Date().toISOString();
    setLead((prev) => prev ? { ...prev, first_contact_at: now, status: "contacted" } : prev);
    await fetch(`/api/crm/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_contact_at: now, status: "contacted" }),
    });
    await supabase.from("crm_lead_activities").insert({
      lead_id: leadId,
      activity_type: "note",
      description: "Marked as Contacted",
      created_by: currentUser.id,
    });
  }, [lead, leadId, currentUser.id, supabase]);

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
      {/* ── Sticky mobile header ── */}
      {isMobile && (
        <div className="sticky top-0 z-50 -mx-4 px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 rounded-md text-slate-400 hover:text-white active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{lead.name}</p>
            <p className="text-xs text-slate-400">{lead.phone}</p>
          </div>
          {stages.length > 0 && (
            <select
              value={lead.stage_id || ""}
              onChange={(e) => void handleStageChange(e.target.value)}
              className="text-xs border border-slate-700 rounded-lg px-2 py-1.5 bg-slate-800 text-slate-200 max-w-[120px]"
            >
              <option value="">— Stage —</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="hidden md:block space-y-1">
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

      {/* ── Quick actions bar ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => {
            if (lead?.phone) window.location.href = `tel:${lead.phone}`;
            setTimeout(() => setShowCallSheet(true), 1500);
          }}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-medium"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </button>
        <a
          href={getWhatsAppLink(lead.phone, lead.name, agentName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 text-white text-sm font-medium"
        >
          💬 WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setShowBriefPanel(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-sm font-medium"
        >
          📋 Brief
        </button>
        <button
          type="button"
          onClick={() => void handleMarkContacted()}
          disabled={!!lead.first_contact_at}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✓ Contacted
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("site-visits")}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-sm font-medium"
        >
          📍 Site Visit
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("activities"); setTimeout(() => document.getElementById("quick-note-input")?.focus(), 50); }}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-sm font-medium"
        >
          📝 Add Note
        </button>
      </div>

      {/* ── Post-call note prompt ── */}
      {showPostCallNote && (
        <div style={{
          background: "var(--color-background-secondary)",
          borderRadius: "var(--border-radius-lg)",
          padding: "12px 14px",
          marginBottom: "12px",
          border: "0.5px solid var(--color-border-secondary)",
        }}>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
            {lastCallOutcome} logged ✓ — Add a note? (optional)
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="post-call-note-input"
              autoFocus
              placeholder="What was discussed..."
              style={{
                flex: 1, border: "none",
                background: "var(--color-background-primary)",
                borderRadius: "var(--border-radius-md)",
                padding: "8px 10px",
                fontSize: "13px",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  await supabase.from("crm_lead_activities").insert({
                    lead_id: leadId,
                    activity_type: "note",
                    description: e.currentTarget.value.trim(),
                    created_by: currentUser.id,
                  });
                  setShowPostCallNote(false);
                  void loadCallLogs();
                }
                if (e.key === "Escape") setShowPostCallNote(false);
              }}
            />
            <button
              onClick={async () => {
                const input = document.getElementById("post-call-note-input") as HTMLInputElement;
                if (input?.value.trim()) {
                  await supabase.from("crm_lead_activities").insert({
                    lead_id: leadId,
                    activity_type: "note",
                    description: input.value.trim(),
                    created_by: currentUser.id,
                  });
                  setShowPostCallNote(false);
                  void loadCallLogs();
                }
              }}
              style={{
                padding: "6px 14px",
                background: "var(--color-background-info)",
                color: "var(--color-text-info)",
                border: "none",
                borderRadius: "var(--border-radius-md)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >Save</button>
            <button
              onClick={() => setShowPostCallNote(false)}
              style={{ background: "none", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", fontSize: "18px", padding: "0 4px" }}
            >×</button>
          </div>
        </div>
      )}

      {/* ── Detailed call form (desktop fallback / via "Detailed log" link) ── */}
      {showCallForm && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-4 space-y-3 mb-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Log a Call</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Call Duration (mins)</label>
              <Input type="number" min="0" placeholder="e.g. 5" value={callDuration} onChange={(e) => setCallDuration(e.target.value)} />
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
            <Textarea placeholder="What was discussed..." value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={3} />
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
        {(() => {
          const mobileTabs = ["overview", "activities", "tasks", "whatsapp", "calls"];
          const allTabs = [
            { value: "overview", label: "Overview" },
            { value: "activities", label: "Activities" },
            { value: "project-activity", label: "Website Activity" },
            { value: "smart-shortlist", label: "Smart Shortlist" },
            { value: "tasks", label: "Tasks" },
            { value: "site-visits", label: "Site Visits" },
            { value: "calls", label: "Calls" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "whatsapp-logs", label: "WhatsApp Logs" },
            { value: "deals", label: "Deals" },
          ];
          return (
            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
              {allTabs
                .filter((tab) => !isMobile || mobileTabs.includes(tab.value))
                .map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="flex-shrink-0">
                    {tab.label}
                  </TabsTrigger>
                ))}
            </TabsList>
          );
        })()}

        {/* ── Overview ── */}
        <TabsContent value="overview">
          <div className="space-y-3">

            {/* Contact */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Contact</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
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
              </CardContent>
            </Card>

            {/* Requirement */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Requirement</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Min Budget (₹)</p>
                    {editBudgetMin && (
                      <div style={{ fontSize: "12px", color: "var(--color-text-info, #38bdf8)", marginBottom: "4px" }}>
                        {formatBudget(Number(editBudgetMin))}
                      </div>
                    )}
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
                    {editBudgetMax && (
                      <div style={{ fontSize: "12px", color: "var(--color-text-info, #38bdf8)", marginBottom: "4px" }}>
                        {formatBudget(Number(editBudgetMax))}
                      </div>
                    )}
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
                  <p className="text-xs text-slate-400">
                    {formatBudgetRange(
                      editBudgetMin !== "" ? Number(editBudgetMin) : null,
                      editBudgetMax !== "" ? Number(editBudgetMax) : null
                    )}
                  </p>
                )}
                <div className="grid gap-3 md:grid-cols-3">
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
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Purchase Timeline</p>
                    <select
                      value={editTimeline}
                      onChange={(e) => setEditTimeline(e.target.value)}
                      className="w-full h-8 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">— Select —</option>
                      <option value="immediate">Immediate (within 1 month)</option>
                      <option value="1-3 months">1–3 months</option>
                      <option value="3-6 months">3–6 months</option>
                      <option value="6-12 months">6–12 months</option>
                      <option value="over 1 year">Over 1 year</option>
                      <option value="just exploring">Just exploring</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button type="button" onClick={saveProfileChanges} disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                  {profileSaved && <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Saved ✓</span>}
                  {profileError && <span className="text-sm text-rose-600 dark:text-rose-400">{profileError}</span>}
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Status</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Source</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{formatSourceName(lead.source_type || lead.source_channel || lead.source)}</p>
                      {lead.attribution_metadata?.lead_source === "ai_advisor_chat" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border border-violet-200 dark:border-violet-700/40">
                          🤖 AI Advisor Chat
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Pipeline Status</p>
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
                      <option value="not_connected">Not Connected</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="site_visit">Site Visit</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Lead Status — segmented buttons */}
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">Lead Status</p>
                    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {([
                        { value: "cold", label: "❄ Cold",  activeClass: "bg-slate-600 text-slate-100 dark:bg-slate-700" },
                        { value: "warm", label: "🔥 Warm", activeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/70 dark:text-orange-300" },
                        { value: "hot",  label: "⚡ Hot",  activeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-300" },
                      ] as const).map(({ value, label, activeClass }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={async () => {
                            setEditLeadStatus(value);
                            const res = await fetch(`/api/crm/leads/${lead.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ lead_status: value }),
                            });
                            if (res.ok) setLead((prev) => prev ? { ...prev, lead_status: value } : prev);
                          }}
                          className={`px-3 py-1.5 text-sm font-medium transition-colors ${editLeadStatus === value ? activeClass : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Buyer Profile — auto-calculated, read-only */}
                  {(() => {
                    const priorityConfig: Record<string, { label: string; bg: string; color: string }> = {
                      serious_buyer: { label: "Serious Buyer", bg: "var(--color-background-danger, #450a0a)",    color: "var(--color-text-danger, #f87171)" },
                      evaluating:    { label: "Evaluating",    bg: "var(--color-background-warning, #431407)",  color: "var(--color-text-warning, #fb923c)" },
                      early_stage:   { label: "Early Stage",   bg: "var(--color-background-secondary, #1e293b)", color: "var(--color-text-secondary, #94a3b8)" },
                    };
                    const key = (lead.priority ?? "early_stage").toLowerCase().replace(/[\s-]+/g, "_");
                    const mapped = key === "hot" || key === "high" ? "serious_buyer"
                      : key === "warm" || key === "medium" ? "evaluating"
                      : key;
                    const cfg = priorityConfig[mapped] ?? priorityConfig.early_stage;
                    return (
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">Buyer Profile</p>
                        <div className="flex items-center gap-2.5">
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-slate-500">{lead.lead_score ?? 0}/100</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Auto-calculated</p>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Assignment */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Assignment</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
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
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Last Activity</p>
                    <p className="font-medium text-sm">{toIST(lead.last_activity_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Notes</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
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
              </CardContent>
            </Card>

            {/* Lead Form Answers */}
            {(() => {
              const items = normalizeFormQuestions(
                lead.attribution_metadata?.form_questions ?? lead.attribution_metadata?.field_data
              );
              if (items.length === 0) return null;
              return (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Lead Form Answers</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <table className="w-full text-xs">
                      <tbody>
                        {items.map(({ q, a }, i) => (
                          <tr key={q} className={i % 2 === 0 ? "bg-slate-50 dark:bg-slate-800/40" : ""}>
                            <td className="py-1.5 px-2 text-slate-500 uppercase tracking-wide w-1/2">{q.replace(/_/g, " ")}</td>
                            <td className="py-1.5 px-2 font-medium text-slate-800 dark:text-slate-200">{a.replace(/_/g, " ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              );
            })()}

            {/* AI Advisor Chat — shows projects, intent signals, and full transcript */}
            <LeadAdvisorChatPanel attributionMetadata={lead.attribution_metadata} />

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
              {/* Inline quick note input */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", padding: "10px", background: "var(--color-background-secondary, rgba(148,163,184,0.08))", borderRadius: "var(--border-radius-md, 8px)" }}>
                <input
                  id="quick-note-input"
                  placeholder="Log a note..."
                  style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "var(--color-text-primary, inherit)", outline: "none" }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const note = e.currentTarget.value.trim();
                      e.currentTarget.value = "";
                      await supabase.from("crm_lead_activities").insert({
                        lead_id: lead?.id,
                        activity_type: "note",
                        notes: note,
                        created_by: currentUser.id,
                      });
                    }
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--color-text-tertiary, #94a3b8)", alignSelf: "center" }}>↵ to save</span>
              </div>
              {loadingActivities ? <p className="text-sm">Loading activities...</p> : null}
              {activityError ? <p className="text-sm text-rose-600 dark:text-rose-300">{activityError}</p> : null}
              {(() => {
                const HIDDEN_TYPES = new Set(["stage_automation", "system", "automation"]);
                const visible = activities.filter((a) => !HIDDEN_TYPES.has(a.activity_type));
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
                  } else if (type === "contacted") {
                    icon = <Phone className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />;
                    label = text || "Marked as Contacted";
                    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
                  } else if (type === "task_completed") {
                    icon = <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" />;
                    label = text || "Task completed";
                    badgeClass = "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300";
                  } else if (type === "assignment") {
                    icon = <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-sky-500" />;
                    label = text || "Lead assigned";
                    badgeClass = "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300";
                  } else {
                    label = text || type.replace(/_/g, " ");
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
                <div className="flex gap-1">
                  <Input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="flex-1" />
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    style={{
                      border: "1px solid var(--color-border-secondary, #e2e8f0)",
                      borderRadius: "var(--border-radius-md, 6px)",
                      padding: "6px 10px",
                      fontSize: "14px",
                      color: "var(--color-text-primary, inherit)",
                      background: "var(--color-background-primary, transparent)",
                    }}
                  />
                </div>
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
                    const status = sv.metadata?.status || sv.metadata?.outcome || "Scheduled";
                    const projectName = sv.metadata?.project_name || sv.metadata?.location || "—";
                    const feedback = sv.metadata?.feedback || sv.metadata?.notes || sv.notes;
                    const postponedDate = sv.metadata?.postponed_date;
                    const visitDateStr = sv.metadata?.visit_date
                      ? toIST(sv.metadata.visit_date)
                      : toIST(sv.created_at);
                    const isUpdatable = status === "Scheduled" || status === "Postponed";
                    const isOpen = updatingSiteVisitId === sv.id;

                    const badgeClass =
                      status === "Completed"  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                      status === "Scheduled"  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                      status === "Postponed"  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                      status === "No Show"    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

                    return (
                      <div key={sv.id} className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{projectName}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                                {status}
                              </span>
                              {isUpdatable && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isOpen) {
                                      setUpdatingSiteVisitId(null);
                                    } else {
                                      setUpdatingSiteVisitId(sv.id);
                                      setUpdateStatus("Completed");
                                      setUpdateFeedback("");
                                      setUpdatePostponedDate("");
                                    }
                                  }}
                                  className="text-xs px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                  {isOpen ? "Cancel" : "Update"}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{visitDateStr}</p>
                          {postponedDate && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Postponed → {toIST(postponedDate)}
                            </p>
                          )}
                          {feedback && !isOpen && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{feedback}</p>
                          )}
                        </div>

                        {/* Inline update panel */}
                        {isOpen && (
                          <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-3">
                            {/* Status buttons */}
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">New Status</p>
                              <div className="flex flex-wrap gap-2">
                                {(["Completed", "No Show", "Postponed", "Cancelled"] as const).map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setUpdateStatus(s)}
                                    className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${
                                      updateStatus === s
                                        ? s === "Completed"  ? "bg-emerald-600 border-emerald-600 text-white"
                                        : s === "No Show"   ? "bg-red-600 border-red-600 text-white"
                                        : s === "Postponed" ? "bg-amber-500 border-amber-500 text-white"
                                        : "bg-slate-500 border-slate-500 text-white"
                                        : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Postponed date picker */}
                            {updateStatus === "Postponed" && (
                              <div className="space-y-1.5">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">New Visit Date</p>
                                <Input
                                  type="datetime-local"
                                  value={updatePostponedDate}
                                  onChange={(e) => setUpdatePostponedDate(e.target.value)}
                                  className="text-sm dark:bg-slate-900"
                                />
                              </div>
                            )}

                            {/* Feedback */}
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Feedback</p>
                              <Textarea
                                rows={3}
                                value={updateFeedback}
                                onChange={(e) => setUpdateFeedback(e.target.value)}
                                placeholder="Add feedback or notes about the site visit..."
                                className="text-sm resize-none dark:bg-slate-900"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={savingUpdate || (updateStatus === "Postponed" && !updatePostponedDate)}
                                onClick={() => void updateSiteVisit(sv)}
                              >
                                {savingUpdate ? "Saving..." : "Save Update"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setUpdatingSiteVisitId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
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
              <Button type="button" size="sm" onClick={() => setShowCallSheet(true)}>
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

      {/* ── Call Brief panel — rendered via portal ── */}
      {showBriefPanel && typeof document !== "undefined" && createPortal(
        <CallBriefPanel leadId={leadId} onClose={() => setShowBriefPanel(false)} />,
        document.body
      )}

      {/* ── Quick-call bottom sheet — rendered via portal to escape CRM shell transforms/overflow ── */}
      {showCallSheet && typeof document !== "undefined" && createPortal(
        <>
          <div
            onClick={() => setShowCallSheet(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.6)" }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            zIndex: 9999,
            background: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#1a1a1a" : "#ffffff",
            isolation: "isolate",
            borderTop: "0.5px solid var(--color-border-secondary)",
            borderRadius: "16px 16px 0 0",
            padding: "20px 16px 40px",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "16px", textAlign: "center" }}>
              How did the call go?
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                { outcome: "Connected",          emoji: "✅", color: "var(--color-background-success)", textColor: "var(--color-text-success)" },
                { outcome: "No Answer",          emoji: "📵", color: "var(--color-background-secondary)", textColor: "var(--color-text-secondary)" },
                { outcome: "Busy",               emoji: "🔴", color: "var(--color-background-secondary)", textColor: "var(--color-text-secondary)" },
                { outcome: "Callback Requested", emoji: "🔁", color: "var(--color-background-warning)", textColor: "var(--color-text-warning)" },
                { outcome: "Wrong Number",       emoji: "❌", color: "var(--color-background-danger)", textColor: "var(--color-text-danger)" },
              ].map(({ outcome, emoji, color, textColor }) => (
                <button
                  key={outcome}
                  onClick={() => handleQuickCall(outcome)}
                  disabled={savingCall}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: "12px",
                    border: "none", background: color, color: textColor,
                    fontSize: "15px", fontWeight: 500, cursor: "pointer",
                    textAlign: "left", display: "flex", alignItems: "center",
                    gap: "10px", minHeight: "52px",
                    opacity: savingCall ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{emoji}</span>
                  {outcome}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCallSheet(false)}
              style={{ width: "100%", marginTop: "12px", padding: "10px", background: "none", border: "none", fontSize: "13px", color: "var(--color-text-tertiary)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              Skip logging
            </button>
            <button
              onClick={() => { setShowCallSheet(false); setShowCallForm(true); }}
              style={{ width: "100%", padding: "10px", background: "none", border: "none", fontSize: "13px", color: "var(--color-text-tertiary)", cursor: "pointer" }}
            >
              + Detailed log (with duration &amp; notes)
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
