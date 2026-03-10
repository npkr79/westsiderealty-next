"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  assigned_to: string | null;
  priority: string | null;
}

interface ConversationRow {
  id: string;
  lead_id: string;
  agent_id: string | null;
  last_message_at: string | null;
  status: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  lead_id: string;
  direction: "inbound" | "outbound";
  message_type: string;
  content: string | null;
  template_name: string | null;
  status: string | null;
  created_at: string | null;
}

interface UserSession {
  id: string;
}

const TEMPLATE_OPTIONS = [
  "investor_outreach_v1",
  "institutional_intro_v1",
  "capital_allocation_followup_v1",
  "site_visit_invite_v1",
];

const statusBadgeVariant = (status: string | null): "default" | "secondary" | "outline" => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "read") return "default";
  if (normalized === "delivered" || normalized === "sent") return "secondary";
  return "outline";
};

const normalizeDirection = (value: unknown): "inbound" | "outbound" =>
  String(value || "").toLowerCase() === "inbound" ? "inbound" : "outbound";

const getPriorityLabel = (value: string | null | undefined): "hot" | "warm" | "cold" => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "hot" || normalized === "high" || normalized === "p1") return "hot";
  if (normalized === "warm" || normalized === "medium" || normalized === "p2") return "warm";
  return "cold";
};

const formatTimestamp = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const makeInitials = (value: string): string =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "NA";

export default function InstitutionalWhatsAppModule() {
  const supabase = useMemo(() => createClient(), []);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [templateName, setTemplateName] = useState(TEMPLATE_OPTIONS[0]);
  const [sendingText, setSendingText] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          setSessionUser({ id: data.user.id });
        }
      } catch (err) {
        console.error("WhatsApp module error", err);
      }
    })();
  }, [supabase]);

  const {
    data: conversations = [],
    isLoading: loadingConversations,
    mutate: mutateConversations,
  } = useSWR<ConversationRow[]>(
    sessionUser?.id ? ["crm_whatsapp_conversations", sessionUser.id] : null,
    async ([, userId]) => {
      try {
        const { data, error: queryError } = await supabase
          .from("crm_whatsapp_conversations")
          .select(`
            id,
            lead_id,
            agent_id,
            last_message_at,
            status
          `)
          .eq("agent_id", userId)
          .order("last_message_at", { ascending: false });
        if (queryError) {
          console.error("WhatsApp module error", queryError);
          return [];
        }

        if (!data || data.length === 0) {
          console.warn("No conversations for agent. Debug fallback triggered.");
          const fallback = await supabase.from("crm_whatsapp_conversations").select("*").limit(20);
          console.log("Fallback conversations:", fallback.data);
        }

        return ((data as Array<Record<string, unknown>>) || []).map((row) => ({
          id: String(row.id || ""),
          lead_id: String(row.lead_id || ""),
          agent_id: typeof row.agent_id === "string" ? row.agent_id : null,
          last_message_at: typeof row.last_message_at === "string" ? row.last_message_at : null,
          status: typeof row.status === "string" ? row.status : null,
        }));
      } catch (err) {
        console.error("WhatsApp module error", err);
        return [];
      }
    }
  );

  const leadIds = useMemo(() => Array.from(new Set(conversations.map((item) => item.lead_id).filter(Boolean))), [conversations]);

  const {
    data: leadsById = {},
    isLoading: loadingLeads,
    mutate: mutateLeads,
  } = useSWR<Record<string, LeadRow>>(
    sessionUser?.id ? ["crm_whatsapp_leads", sessionUser.id, leadIds.join(",")] : null,
    async () => {
      try {
        if (leadIds.length === 0) return {};
        const { data, error: queryError } = await supabase
          .from("crm_leads_view")
          .select("id,name,phone,assigned_to,priority")
          .in("id", leadIds);
        if (queryError) {
          console.error("WhatsApp module error", queryError);
          return {};
        }
        const mapped: Record<string, LeadRow> = {};
        for (const row of (data as Array<Record<string, unknown>>) || []) {
          const id = String(row.id || "");
          if (!id) continue;
          mapped[id] = {
            id,
            name: typeof row.name === "string" ? row.name : "Unnamed lead",
            phone: typeof row.phone === "string" ? row.phone : null,
            assigned_to: typeof row.assigned_to === "string" ? row.assigned_to : null,
            priority: typeof row.priority === "string" ? row.priority : null,
          };
        }
        return mapped;
      } catch (err) {
        console.error("WhatsApp module error", err);
        return {};
      }
    }
  );

  const {
    data: latestMessageMeta = {},
    mutate: mutateLatestMeta,
  } = useSWR<Record<string, { preview: string; unread: number }>>(
    sessionUser?.id ? ["crm_whatsapp_latest_meta", sessionUser.id, leadIds.join(",")] : null,
    async () => {
      try {
        if (leadIds.length === 0) return {};
        const { data, error: queryError } = await supabase
          .from("crm_whatsapp_messages")
          .select("lead_id,direction,content,template_name,status,created_at")
          .in("lead_id", leadIds)
          .order("created_at", { ascending: false })
          .limit(5000);
        if (queryError) {
          console.error("WhatsApp module error", queryError);
          return {};
        }
        const mapped: Record<string, { preview: string; unread: number }> = {};
        for (const row of (data as Array<Record<string, unknown>>) || []) {
          const leadId = typeof row.lead_id === "string" ? row.lead_id : "";
          if (!leadId) continue;
          const status = String(row.status || "").toLowerCase();
          const direction = normalizeDirection(row.direction);
          if (!mapped[leadId]) {
            mapped[leadId] = {
              preview:
                typeof row.content === "string" && row.content.trim().length > 0
                  ? row.content
                  : typeof row.template_name === "string"
                    ? `Template: ${row.template_name}`
                    : "(empty)",
              unread: 0,
            };
          }
          if (direction === "inbound" && status !== "read") {
            mapped[leadId].unread += 1;
          }
        }
        return mapped;
      } catch (err) {
        console.error("WhatsApp module error", err);
        return {};
      }
    }
  );

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0] || null,
    [activeConversationId, conversations]
  );

  const {
    data: messages = [],
    isLoading: loadingMessages,
    mutate: mutateMessages,
  } = useSWR<MessageRow[]>(
    activeConversation ? ["crm_whatsapp_messages", activeConversation.lead_id] : null,
    async ([, leadId]) => {
      try {
        const { data, error: queryError } = await supabase
          .from("crm_whatsapp_messages")
          .select("*")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: true });
        if (queryError) {
          console.error("WhatsApp module error", queryError);
          return [];
        }
        return ((data as Array<Record<string, unknown>>) || []).map((row) => ({
          id: String(row.id || ""),
          conversation_id: typeof row.conversation_id === "string" ? row.conversation_id : activeConversation?.id || "",
          lead_id: typeof row.lead_id === "string" ? row.lead_id : leadId,
          direction: normalizeDirection(row.direction),
          message_type: typeof row.message_type === "string" ? row.message_type : "text",
          content: typeof row.content === "string" ? row.content : typeof row.body === "string" ? row.body : null,
          template_name: typeof row.template_name === "string" ? row.template_name : null,
          status: typeof row.status === "string" ? row.status : null,
          created_at: typeof row.created_at === "string" ? row.created_at : null,
        }));
      } catch (err) {
        console.error("WhatsApp module error", err);
        return [];
      }
    }
  );

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const lead = leadsById[conversation.lead_id];
      if (!lead) return false;
      if (priorityFilter !== "all" && getPriorityLabel(lead.priority) !== priorityFilter) return false;
      if (!term) return true;
      const haystack = `${lead.name} ${lead.phone || ""} ${latestMessageMeta[conversation.lead_id]?.preview || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [conversations, leadsById, latestMessageMeta, priorityFilter, search]);

  useEffect(() => {
    if (!activeConversationId && filteredConversations[0]?.id) {
      setActiveConversationId(filteredConversations[0].id);
      return;
    }
    if (activeConversationId && !filteredConversations.some((conversation) => conversation.id === activeConversationId)) {
      setActiveConversationId(filteredConversations[0]?.id ?? null);
    }
  }, [activeConversationId, filteredConversations]);

  useEffect(() => {
    const channel = supabase
      .channel("whatsapp-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crm_whatsapp_messages" }, () => {
        void mutateConversations();
        void mutateLatestMeta();
        void mutateMessages();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_whatsapp_conversations" }, () => {
        void mutateConversations();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutateConversations, mutateLatestMeta, mutateMessages, supabase]);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendText = async () => {
    const conversation = activeConversation;
    if (!conversation) return;
    const message = draft.trim();
    if (!message) return;
    setSendingText(true);
    setError(null);
    const lead = leadsById[conversation.lead_id];

    const optimistic: MessageRow = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversation.id,
      lead_id: conversation.lead_id,
      direction: "outbound",
      message_type: "text",
      content: message,
      template_name: null,
      status: "queued",
      created_at: new Date().toISOString(),
    };
    await mutateMessages((prev) => [...(prev || []), optimistic], false);

    try {
      const response = await fetch("/api/crm/whatsapp/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: conversation.lead_id,
          conversationId: conversation.id,
          phone: lead?.phone || "",
          mode: "text",
          message,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error || "Unable to send message right now.");
      } else {
        setDraft("");
      }
      await mutateConversations();
      await mutateLatestMeta();
      await mutateMessages();
    } catch (err) {
      console.error("WhatsApp module error", err);
      setError("Unable to send message right now.");
      await mutateMessages();
    } finally {
      setSendingText(false);
    }
  };

  const sendTemplate = async () => {
    const conversation = activeConversation;
    if (!conversation || !templateName) return;
    setSendingTemplate(true);
    setError(null);
    const lead = leadsById[conversation.lead_id];
    try {
      const response = await fetch("/api/crm/whatsapp/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: conversation.lead_id,
          conversationId: conversation.id,
          phone: lead?.phone || "",
          mode: "template",
          templateName,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error || "Unable to send template right now.");
      }
      await mutateConversations();
      await mutateLatestMeta();
      await mutateMessages();
    } catch (err) {
      console.error("WhatsApp module error", err);
      setError("Unable to send template right now.");
    } finally {
      setSendingTemplate(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversation Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Search conversation" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={priorityFilter} onValueChange={(value: "all" | "hot" | "warm" | "cold") => setPriorityFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Priority filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="hot">HOT</SelectItem>
                <SelectItem value="warm">WARM</SelectItem>
                <SelectItem value="cold">COLD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingConversations || loadingLeads ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-16 animate-pulse rounded-md border bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : null}

          {!loadingConversations && !loadingLeads && filteredConversations.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No WhatsApp conversations yet. Conversations will appear when automation or manual outreach begins.
            </p>
          ) : null}

          {filteredConversations.map((conversation) => {
            const lead = leadsById[conversation.lead_id];
            const isActive = activeConversation?.id === conversation.id;
            const preview = latestMessageMeta[conversation.lead_id]?.preview || "No messages yet.";
            const unread = latestMessageMeta[conversation.lead_id]?.unread || 0;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveConversationId(conversation.id)}
                className={`w-full rounded-md border p-2 text-left transition ${
                  isActive ? "border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-900" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {makeInitials(lead?.name || "Unknown")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{lead?.name || "Unknown lead"}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{preview}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatTimestamp(conversation.last_message_at)}</p>
                    {unread > 0 ? <Badge className="mt-1">{unread}</Badge> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Message View</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
          {!activeConversation ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a conversation to start.</p>
          ) : (
            <>
              <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md border p-3">
                {loadingMessages ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="h-12 animate-pulse rounded-md border bg-slate-100 dark:bg-slate-800" />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[92%] rounded-md border px-3 py-2 text-sm ${
                        msg.direction === "outbound" ? "ml-auto bg-slate-100 dark:bg-slate-800" : "mr-auto bg-white dark:bg-slate-950"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{msg.message_type}</span>
                        <Badge variant={statusBadgeVariant(msg.status)}>{msg.status || "queued"}</Badge>
                      </div>
                      <p>{msg.content || (msg.template_name ? `Template: ${msg.template_name}` : "(empty)")}</p>
                      {msg.created_at ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(msg.created_at).toLocaleString()}</p>
                      ) : null}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Select value={templateName} onValueChange={setTemplateName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Investor outreach template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={sendTemplate} disabled={sendingTemplate}>
                  {sendingTemplate ? "Sending template..." : "Send investor template"}
                </Button>
              </div>

              <div className="space-y-2">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type WhatsApp message..." className="min-h-[110px]" />
                <Button type="button" onClick={sendText} disabled={sendingText}>
                  {sendingText ? "Sending..." : "Send message"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

