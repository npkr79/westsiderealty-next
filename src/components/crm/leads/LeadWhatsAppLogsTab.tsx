"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type RawRow = Record<string, unknown>;

interface LeadWhatsAppLogsTabProps {
  leadId: string;
  leadPhone: string;
}

interface MessageRow {
  id: string;
  providerMessageId: string | null;
  messageType: string;
  content: string | null;
  templateName: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string | null;
}

interface DeliveryLogRow {
  id: string;
  messageId: string | null;
  providerMessageId: string | null;
  status: string;
  responseJson: unknown;
  errorMessage: string | null;
  createdAt: string | null;
}

interface TimelineRow {
  id: string;
  kind: "message" | "delivery";
  status: "sent" | "delivered" | "failed" | "other";
  title: string;
  subtitle: string;
  createdAt: string | null;
  rawJson: unknown;
  retryPayload: { mode: "text" | "template"; message?: string; templateName?: string } | null;
}

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asDate = (value: unknown): string | null => {
  const text = asText(value);
  if (!text) return null;
  const dt = new Date(text);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
};

const normalizeStatus = (value: string | null): "sent" | "delivered" | "failed" | "other" => {
  const text = String(value || "").toLowerCase();
  if (/delivered|read/.test(text)) return "delivered";
  if (/sent|queued|accepted/.test(text)) return "sent";
  if (/fail|error|rejected|undeliverable/.test(text)) return "failed";
  return "other";
};

export default function LeadWhatsAppLogsTab({ leadId, leadPhone }: LeadWhatsAppLogsTabProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [resendTemplateName, setResendTemplateName] = useState("lead_greeting_v1");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    let messageRows: RawRow[] = [];
    const { data: msgData, error: msgQueryError } = await supabase
      .from("crm_whatsapp_messages")
      .select("id,lead_id,phone,message,direction,status,provider_response,created_at,template_name,content,body")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (msgQueryError) {
      setError(msgQueryError.message || "Unable to load WhatsApp messages.");
      setLoading(false);
      return;
    }
    messageRows = (msgData as RawRow[]) || [];

    const mappedMessages: MessageRow[] = messageRows.map((row) => ({
      id: asText(row.id) || crypto.randomUUID(),
      providerMessageId: null,
      messageType: asText(row.template_name) ? "template" : "text",
      content: asText(row.content) || asText(row.body) || asText(row.message),
      templateName: asText(row.template_name),
      status: asText(row.status) || "sent",
      errorMessage: null,
      createdAt: asDate(row.created_at),
    }));
    setMessages(mappedMessages);

    const deliveryVariants = [
      "id,message_id,provider_message_id,status,response_json,error_message,created_at",
      "id,whatsapp_message_id,provider_message_id,delivery_status,provider_response,error,created_at",
      "*",
    ];
    let logRows: RawRow[] = [];
    for (const selectClause of deliveryVariants) {
      const { data, error: queryError } = await supabase
        .from("crm_whatsapp_delivery_logs")
        .select(selectClause)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!queryError) {
        logRows = (data as RawRow[]) || [];
        break;
      }
      const message = queryError.message || "";
      if (!/column .* does not exist/i.test(message)) break;
    }

    const msgIds = new Set(mappedMessages.map((item) => item.id));
    const providerIds = new Set(mappedMessages.map((item) => item.providerMessageId).filter((id): id is string => Boolean(id)));

    const mappedDeliveryLogs: DeliveryLogRow[] = logRows
      .map((row) => ({
        id: asText(row.id) || crypto.randomUUID(),
        messageId: asText(row.message_id) || asText(row.whatsapp_message_id),
        providerMessageId: asText(row.provider_message_id),
        status: asText(row.status) || asText(row.delivery_status) || "sent",
        responseJson: row.response_json ?? row.provider_response ?? null,
        errorMessage: asText(row.error_message) || asText(row.error),
        createdAt: asDate(row.created_at),
      }))
      .filter((row) => {
        if (row.messageId && msgIds.has(row.messageId)) return true;
        if (row.providerMessageId && providerIds.has(row.providerMessageId)) return true;
        return false;
      });

    setDeliveryLogs(mappedDeliveryLogs);
    setLoading(false);
  }, [leadId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadLogs]);

  useEffect(() => {
    const channel = supabase
      .channel(`crm-whatsapp-logs-${leadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_whatsapp_messages", filter: `lead_id=eq.${leadId}` }, loadLogs)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_whatsapp_delivery_logs" }, loadLogs)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, loadLogs, supabase]);

  const timeline = useMemo(() => {
    const messageRows: TimelineRow[] = messages.map((msg) => ({
      id: `msg-${msg.id}`,
      kind: "message",
      status: normalizeStatus(msg.status),
      title: msg.templateName ? `Template: ${msg.templateName}` : msg.content || "Text message",
      subtitle: `Message · ${msg.messageType}`,
      createdAt: msg.createdAt,
      rawJson: {
        id: msg.id,
        status: msg.status,
        provider_message_id: msg.providerMessageId,
        error_message: msg.errorMessage,
      },
      retryPayload:
        normalizeStatus(msg.status) === "failed"
          ? msg.templateName
            ? { mode: "template", templateName: msg.templateName }
            : { mode: "text", message: msg.content || "" }
          : null,
    }));

    const deliveryRows: TimelineRow[] = deliveryLogs.map((log) => ({
      id: `log-${log.id}`,
      kind: "delivery",
      status: normalizeStatus(log.status),
      title: log.errorMessage ? `Delivery error: ${log.errorMessage}` : "Delivery update",
      subtitle: `Delivery log · ${log.status}`,
      createdAt: log.createdAt,
      rawJson: log.responseJson,
      retryPayload: null,
    }));

    return [...messageRows, ...deliveryRows].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [deliveryLogs, messages]);

  const sendWhatsApp = async (payload: { mode: "text" | "template"; message?: string; templateName?: string }) => {
    if (!leadPhone) {
      setActionMessage("Lead phone is missing.");
      return false;
    }
    const response = await fetch("/api/crm/whatsapp/inbox/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        phone: leadPhone,
        mode: payload.mode,
        message: payload.message,
        templateName: payload.templateName,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setActionMessage(body?.error || "WhatsApp send failed.");
      return false;
    }
    return true;
  };

  const retryFailed = async (row: TimelineRow) => {
    if (!row.retryPayload) return;
    setRetryingId(row.id);
    setActionMessage(null);
    const success = await sendWhatsApp(row.retryPayload);
    setRetryingId(null);
    if (success) {
      setActionMessage("Retry sent.");
      loadLogs();
    }
  };

  const resendTemplate = async () => {
    if (!resendTemplateName.trim()) return;
    setRetryingId("resend-template");
    setActionMessage(null);
    const success = await sendWhatsApp({ mode: "template", templateName: resendTemplateName.trim() });
    setRetryingId(null);
    if (success) {
      setActionMessage("Template resent.");
      loadLogs();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">WhatsApp Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
          <Input value={resendTemplateName} onChange={(e) => setResendTemplateName(e.target.value)} placeholder="Template name" />
          <Button type="button" variant="outline" onClick={resendTemplate} disabled={retryingId === "resend-template" || !leadPhone}>
            {retryingId === "resend-template" ? "Sending..." : "Resend template"}
          </Button>
        </div>

        {actionMessage ? <p className="text-sm text-slate-600 dark:text-slate-300">{actionMessage}</p> : null}
        {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading WhatsApp logs...</p> : null}

        <div className="space-y-2">
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No WhatsApp logs found for this lead.</p>
          ) : (
            timeline.map((row) => (
              <div key={row.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{row.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        row.status === "failed"
                          ? "destructive"
                          : row.status === "delivered"
                            ? "default"
                            : "outline"
                      }
                    >
                      {row.status === "delivered" ? "Delivered" : row.status === "failed" ? "Failed" : "Sent"}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => setExpandedRowId((prev) => (prev === row.id ? null : row.id))}
                  >
                    {expandedRowId === row.id ? "Hide provider response" : "Show provider response JSON"}
                  </Button>
                  {row.status === "failed" && row.retryPayload ? (
                    <Button size="sm" type="button" variant="outline" onClick={() => void retryFailed(row)} disabled={retryingId === row.id}>
                      {retryingId === row.id ? "Retrying..." : "Retry"}
                    </Button>
                  ) : null}
                </div>

                {expandedRowId === row.id ? (
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-950">
                    {JSON.stringify(row.rawJson ?? {}, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

