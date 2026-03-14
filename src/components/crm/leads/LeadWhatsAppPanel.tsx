"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CrmMessage } from "@/lib/crm/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface LeadWhatsAppPanelProps {
  leadId: string;
  leadPhone: string;
}

const templateOptions = ["instant_greeting", "agent_intro"];

export default function LeadWhatsAppPanel({ leadId, leadPhone }: LeadWhatsAppPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<CrmMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingText, setSendingText] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const [templateName, setTemplateName] = useState(templateOptions[0]);

  const loadConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: conv, error: convError } = await supabase
      .from("crm_conversations")
      .select("id")
      .eq("lead_id", leadId)
      .eq("channel", "whatsapp")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (convError) {
      setLoading(false);
      setError(convError.message || "Unable to load WhatsApp conversation.");
      return;
    }

    const convId = conv?.id ? String(conv.id) : null;
    setConversationId(convId);
    if (!convId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data: msgData, error: msgError } = await supabase
      .from("crm_messages")
      .select("id,lead_id,direction,content,template_name,status,provider_message_id,error_message,created_at,updated_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(500);
    setLoading(false);
    if (msgError) {
      setError(msgError.message || "Unable to load WhatsApp messages.");
      return;
    }
    setMessages((msgData as CrmMessage[]) || []);
  }, [leadId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConversation();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadConversation]);

  useEffect(() => {
    const channel = supabase
      .channel(`crm-whatsapp-${leadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_conversations", filter: `lead_id=eq.${leadId}` }, loadConversation)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_messages", filter: `lead_id=eq.${leadId}` }, loadConversation)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, loadConversation, supabase]);

  const sendText = async () => {
    const message = textDraft.trim();
    if (!message) return;
    setSendingText(true);
    setError(null);
    const response = await fetch("/api/crm/whatsapp/send-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, phone: leadPhone, message }),
    });
    setSendingText(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload?.error || "Unable to send WhatsApp text.");
      return;
    }
    setTextDraft("");
    loadConversation();
  };

  const sendTemplate = async () => {
    if (!templateName) return;
    setSendingTemplate(true);
    setError(null);
    const response = await fetch("/api/crm/whatsapp/send-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, phone: leadPhone, templateName }),
    });
    setSendingTemplate(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload?.error || "Unable to send template.");
      return;
    }
    loadConversation();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">WhatsApp chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">Lead phone: {leadPhone || "-"}</p>
        {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

        <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-md border p-3">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No WhatsApp messages yet. Send a template or free text to create the conversation.
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[92%] rounded-md border px-3 py-2 text-sm ${
                  msg.direction === "outbound"
                    ? "ml-auto bg-slate-100 dark:bg-slate-800"
                    : "mr-auto bg-white dark:bg-slate-950"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{msg.template_name != null ? "template" : "text"}</span>
                  <Badge variant={msg.status === "failed" ? "destructive" : "outline"}>{msg.status || "queued"}</Badge>
                </div>
                <p>{msg.content || (msg.template_name ? `Template: ${msg.template_name}` : "(empty)")}</p>
                {msg.error_message ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{msg.error_message}</p> : null}
              </div>
            ))
          )}
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            list="crm-whatsapp-template-options"
            placeholder="Template name"
          />
          <Button type="button" variant="outline" onClick={sendTemplate} disabled={sendingTemplate || !leadPhone}>
            {sendingTemplate ? "Sending template..." : "Send template"}
          </Button>
        </div>
        <datalist id="crm-whatsapp-template-options">
          {templateOptions.map((name) => (
            <option value={name} key={name} />
          ))}
        </datalist>

        <div className="space-y-2">
          <Textarea
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            placeholder="Type WhatsApp message..."
            className="min-h-[110px]"
          />
          <Button type="button" onClick={sendText} disabled={sendingText || !leadPhone} className="w-full md:w-auto">
            {sendingText ? "Sending..." : "Send text"}
          </Button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Conversation id: {conversationId || "Will be created on first send"}
        </p>
      </CardContent>
    </Card>
  );
}
