"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdvisorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Props {
  attributionMetadata: Record<string, unknown> | null | undefined;
}

// UUID format validator — conversation IDs from the new logging system are UUIDs.
// Old leads used text like "adv_1234_abc" which cannot be looked up in advisor_messages.
function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadAdvisorChatPanel({ attributionMetadata }: Props) {
  const isAdvisorLead = attributionMetadata?.lead_source === "ai_advisor_chat";
  const conversationId = attributionMetadata?.advisor_conversation_id as string | undefined;
  const projectsDiscussed = (attributionMetadata?.projects_discussed as string[] | undefined) ?? [];
  const intentSignals = (attributionMetadata?.intent_signals as string[] | undefined) ?? [];
  const budgetMentioned = attributionMetadata?.budget_mentioned as string | null | undefined;

  const hasTranscript = !!conversationId && isUuid(conversationId);

  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!hasTranscript || !expanded) return;

    setLoading(true);
    setFetchError(null);

    supabase
      .from("advisor_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setFetchError("Could not load transcript.");
        } else {
          setMessages((data ?? []) as AdvisorMessage[]);
        }
        setLoading(false);
      });
  }, [hasTranscript, conversationId, expanded, supabase]);

  if (!isAdvisorLead) return null;

  return (
    <Card className="border-violet-200 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-950/10">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              AI Advisor Chat
            </CardTitle>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border border-violet-200 dark:border-violet-700/40">
              🤖 Westside Advisor
            </span>
          </div>
          {hasTranscript && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
            >
              {expanded ? "▲ Hide transcript" : "▼ View transcript"}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3 text-sm">

        {/* ── Projects Discussed ── */}
        {projectsDiscussed.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Projects Discussed
            </p>
            <div className="flex flex-wrap gap-1.5">
              {projectsDiscussed.map((slug) => (
                <span
                  key={slug}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Intent Signals ── */}
        {intentSignals.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Intent Signals
            </p>
            <div className="flex flex-wrap gap-1.5">
              {intentSignals.map((signal) => (
                <span
                  key={signal}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Budget Mentioned ── */}
        {budgetMentioned && (
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Budget Mentioned in Chat
            </p>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{budgetMentioned}</p>
          </div>
        )}

        {/* ── No UUID — old lead, no transcript available ── */}
        {!hasTranscript && (
          <p className="text-xs text-slate-400 italic">
            Conversation transcript not available — this lead was captured before chat logging was enabled.
          </p>
        )}

        {/* ── Transcript ── */}
        {hasTranscript && expanded && (
          <div className="mt-1">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Conversation Transcript
            </p>

            {loading && (
              <p className="text-xs text-slate-400">Loading transcript…</p>
            )}
            {fetchError && (
              <p className="text-xs text-rose-500">{fetchError}</p>
            )}
            {!loading && !fetchError && messages.length === 0 && (
              <p className="text-xs text-slate-400 italic">No messages found for this conversation.</p>
            )}
            {!loading && messages.length > 0 && (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 rounded-lg border border-violet-100 dark:border-violet-900/30 bg-white dark:bg-slate-900 p-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-zinc-900 text-white rounded-br-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 opacity-60 text-right`}>
                        {msg.role === "user" ? "User" : "Advisor"} · {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
