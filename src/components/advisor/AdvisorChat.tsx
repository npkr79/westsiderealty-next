"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { submitAdvisorLead } from "@/app/actions/submit-advisor-lead";

// ─── Price Breakdown Table ─────────────────────────────────────────────────────

interface PriceItem {
  label: string;
  amount_cr: number;
  note: string;
  section: "pre" | "possession" | "govt";
}

interface PriceBreakdownData {
  project: string;
  config: string;
  sqft: number;
  floor: number;
  floor_assumed: boolean;
  segment: "premium" | "regular";
  bsp_cr: number;
  items: PriceItem[];
  total_cr: number;
  disclaimer: string;
}

function formatCr(val: number): string {
  if (val < 0.01) return `₹${Math.round(val * 1_00_000).toLocaleString("en-IN")}`;
  return `₹${val.toFixed(2)} Cr`;
}

function PriceBreakdownTable({ raw }: { raw: string }) {
  let data: PriceBreakdownData;
  try {
    data = JSON.parse(raw) as PriceBreakdownData;
  } catch {
    return <code className="text-xs">{raw}</code>;
  }

  const sections: Array<{ key: PriceItem["section"]; label: string }> = [
    { key: "pre", label: "Developer Charges" },
    { key: "possession", label: "At Possession" },
    { key: "govt", label: "Govt. Charges" },
  ];

  const Row = ({ label, amount, note, bold }: { label: string; amount: string; note?: string; bold?: boolean }) => (
    <div className={`flex items-start justify-between gap-2 py-1 ${bold ? "font-semibold" : ""}`}>
      <div className="flex-1 min-w-0">
        <span className={`text-xs ${bold ? "text-zinc-900" : "text-zinc-700"}`}>{label}</span>
        {note ? <span className="ml-1.5 text-[10px] text-zinc-400">{note}</span> : null}
      </div>
      <span className={`text-xs tabular-nums shrink-0 ${bold ? "text-zinc-900" : "text-zinc-600"}`}>{amount}</span>
    </div>
  );

  return (
    <div className="mt-1 rounded-xl border border-zinc-200 bg-white overflow-hidden text-sm w-full">
      {/* Header */}
      <div className="bg-zinc-900 px-3 py-2">
        <p className="text-white font-semibold text-xs leading-tight">{data.project}</p>
        <p className="text-zinc-400 text-[10px] mt-0.5">
          {data.config} · {data.sqft?.toLocaleString("en-IN")} sqft · {data.floor_assumed ? `~${data.floor}th` : `${data.floor}th`} floor
          {data.floor_assumed ? <span className="ml-1 italic">(floor assumed)</span> : null}
        </p>
      </div>

      <div className="px-3 py-2 border-b border-zinc-100">
        <Row label="Base Price (BSP)" amount={formatCr(data.bsp_cr)} note="From project data" bold />
      </div>

      {sections.map(({ key, label }) => {
        const items = data.items.filter((it) => it.section === key);
        if (!items.length) return null;
        return (
          <div key={key} className="border-b border-zinc-100 last:border-0">
            <p className="px-3 pt-2 pb-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
            <div className="px-3 pb-2">
              {items.map((item, i) => (
                <Row key={i} label={item.label} amount={`+${formatCr(item.amount_cr)}`} note={item.note || undefined} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="bg-zinc-50 px-3 py-2 border-t-2 border-zinc-200">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-zinc-900">All-In Estimate</span>
          <span className="text-sm font-bold text-zinc-900">~{formatCr(data.total_cr)}</span>
        </div>
        {data.bsp_cr > 0 && (
          <p className="text-[10px] text-zinc-400 mt-0.5">
            +{Math.round(((data.total_cr - data.bsp_cr) / data.bsp_cr) * 100)}% over BSP
          </p>
        )}
      </div>

      {/* Disclaimer */}
      {data.disclaimer && (
        <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-100">
          <p className="text-[10px] text-amber-700 leading-snug">⚠ {data.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  webSearchFired?: boolean;
}

interface ApiResponse {
  message: string;
  conversation_id?: string;
  intent?: string;
  suggest_lead_capture?: boolean;
  intent_signals?: string[];
  projects_discussed?: string[];
  data_stats?: { web_search_fired?: boolean };
  error?: string;
}

type CaptureState = "idle" | "offered" | "declined" | "form" | "submitting" | "done";

const GENERIC_GREETING: Message = {
  role: "assistant",
  content:
    "Hi! I'm the Westside Realty AI Advisor. Ask me about Hyderabad (Kokapet, Neopolis, Financial District) or Goa (Calangute, Candolim, Anjuna, Assagao, Morjim) — prices, rental yields, investment outlook, or anything else.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the project slug if the current URL is a project detail page. */
function getPageProjectSlug(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/\/[^/]+\/projects\/([^/]+)/);
  return match?.[1] ?? null;
}

const VISITOR_ID_KEY = "wsr_visitor_id";

/** Returns a persistent visitor ID from localStorage, creating one if absent. */
function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return `srv_${Date.now()}`;
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ADVISOR_SEEN_KEY = "wsr_advisor_seen";

export default function AdvisorChat() {
  const [open, setOpen] = useState(false);

  // New-visitor nudge
  const [isNewVisitor, setIsNewVisitor] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  // Conversation — start empty; populated on first open
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Page context
  const [pageProjectSlug, setPageProjectSlug] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Lead capture
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [conversationId, setConversationId] = useState("");
  const [allProjectsDiscussed, setAllProjectsDiscussed] = useState<string[]>([]);
  const [captureSignals, setCaptureSignals] = useState<string[]>([]);

  // Inline form fields
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formError, setFormError] = useState("");

  // Retry support
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  // Market page context (set by westside:openAdvisor custom event)
  const pageMarketSlugRef = useRef<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // true when the user has scrolled up far enough that we shouldn't auto-scroll
  const userScrolledUpRef = useRef(false);
  // true when the user just sent a message — always force-scroll in that case
  const forceScrollRef = useRef(false);

  // ── New-visitor nudge ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(ADVISOR_SEEN_KEY);
    if (!seen) {
      setIsNewVisitor(true);
      // Small delay so it appears after page paint
      const showTimer = setTimeout(() => setShowLabel(true), 1200);
      // Label fades away after 5s
      const hideTimer = setTimeout(() => setShowLabel(false), 6200);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }
  }, []);

  function markAdvisorSeen() {
    if (typeof window !== "undefined") {
      localStorage.setItem(ADVISOR_SEEN_KEY, "1");
    }
    setIsNewVisitor(false);
    setShowLabel(false);
  }

  function handleScrollContainer() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distFromBottom > 100;
  }

  useEffect(() => {
    if (!open) return;
    if (forceScrollRef.current || !userScrolledUpRef.current) {
      forceScrollRef.current = false;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [open, messages, captureState]);

  // ── Init: runs once when widget first opens ───────────────────────────────

  const initChat = useCallback(async () => {
    const slug = getPageProjectSlug();
    setPageProjectSlug(slug);
    const marketSlug = pageMarketSlugRef.current;

    // Market page context — dispatched via westside:openAdvisor event
    if (marketSlug && !slug) {
      setLoading(true);
      try {
        const res = await fetch("/api/advisor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          message: "__market_context__",
          marketSlug,
          visitor_id: getOrCreateVisitorId(),
          source_page: typeof window !== "undefined" ? window.location.pathname : "/",
        }),
        });
        const data: ApiResponse = await res.json();
        setMessages([{ role: "assistant", content: data.message || GENERIC_GREETING.content }]);
        if (data.conversation_id) setConversationId(data.conversation_id);
        if (data.projects_discussed?.length) setAllProjectsDiscussed(data.projects_discussed);
      } catch {
        setMessages([GENERIC_GREETING]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      return;
    }

    if (!slug) {
      setMessages([GENERIC_GREETING]);
      return;
    }

    // On a project page — fetch a personalised greeting
    setLoading(true);
    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "__context__",
          projectSlug: slug,
          visitor_id: getOrCreateVisitorId(),
          source_page: typeof window !== "undefined" ? window.location.pathname : "/",
        }),
      });
      const data: ApiResponse = await res.json();
      setMessages([{ role: "assistant", content: data.message || GENERIC_GREETING.content }]);
      if (data.conversation_id) setConversationId(data.conversation_id);
      if (data.projects_discussed?.length) setAllProjectsDiscussed(data.projects_discussed);
    } catch {
      setMessages([GENERIC_GREETING]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  useEffect(() => {
    if (open && !initialized) {
      setInitialized(true);
      initChat();
    }
    if (open && initialized) {
      inputRef.current?.focus();
    }
  }, [open, initialized, initChat]);

  // Listen for westside:openAdvisor custom event dispatched from market pages
  useEffect(() => {
    function handleAdvisorOpen(e: Event) {
      const detail = (e as CustomEvent<{ marketSlug?: string; message?: string }>).detail;
      if (detail?.marketSlug) {
        pageMarketSlugRef.current = detail.marketSlug;
        // Reset so initChat re-runs with the new market context
        setInitialized(false);
      }
      setOpen(true);
      if (detail?.message) {
        // Pre-fill the input with the preset question so the user can review + send
        setTimeout(() => setInput(detail.message!), 100);
      }
    }
    window.addEventListener("westside:openAdvisor", handleAdvisorOpen);
    return () => window.removeEventListener("westside:openAdvisor", handleAdvisorOpen);
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    // Snapshot history before adding current message (skip index 0 = greeting)
    const history = messages.slice(1).slice(-10);

    setInput("");
    setLastFailedText(null);
    forceScrollRef.current = true;
    userScrolledUpRef.current = false;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          visitor_id: getOrCreateVisitorId(),
          capture_state: captureState,
          ...(conversationId ? { conversation_id: conversationId } : {}),
          ...(pageProjectSlug ? { projectSlug: pageProjectSlug } : {}),
          ...(pageMarketSlugRef.current ? { marketSlug: pageMarketSlugRef.current } : {}),
          source_page: typeof window !== "undefined" ? window.location.pathname : "/",
        }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok || data.error) {
        setLastFailedText(text);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error ?? "Something went wrong. Please try again." },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          webSearchFired: data.data_stats?.web_search_fired === true,
        },
      ]);

      // Persist conversation_id from first regular response
      if (data.conversation_id && !conversationId) setConversationId(data.conversation_id);

      // Accumulate project slugs
      if (data.projects_discussed?.length) {
        setAllProjectsDiscussed((prev) => [...new Set([...prev, ...data.projects_discussed!])]);
      }

      // Trigger capture offer (once, after turn 2+, not on project page init)
      const completedTurns = history.filter((m) => m.role === "user").length + 1;
      if (data.suggest_lead_capture && captureState === "idle" && completedTurns >= 2) {
        setCaptureSignals(data.intent_signals ?? []);
        setCaptureState("offered");
      }
    } catch {
      setLastFailedText(text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function retryLastMessage() {
    if (!lastFailedText || loading) return;
    // Remove the failed user message + error assistant message from the chat
    setMessages((prev) => prev.slice(0, -2));
    setInput(lastFailedText);
    setLastFailedText(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Lead form submit ──────────────────────────────────────────────────────

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) { setFormError("Please enter your name."); return; }
    const digits = formPhone.replace(/\D/g, "");
    if (digits.length < 10) { setFormError("Please enter a valid 10-digit phone number."); return; }

    setCaptureState("submitting");

    const result = await submitAdvisorLead({
      name: formName.trim(),
      phone: digits,
      email: formEmail.trim() || undefined,
      source_page: typeof window !== "undefined" ? window.location.pathname : "/",
      conversation_id: conversationId,
      projects_discussed: allProjectsDiscussed,
      intent_signals: captureSignals,
    });

    if (result.success) {
      setCaptureState("done");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Done! Our advisor **Srinivas** will call you within 30 minutes. Feel free to keep asking questions in the meantime.",
        },
      ]);
    } else {
      setCaptureState("form");
      setFormError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderCaptureOffer() {
    return (
      <div className="flex justify-start">
        <div className="ml-1 mt-1 flex gap-2">
          <button
            onClick={() => {
              setCaptureState("form");
              setTimeout(() => phoneRef.current?.focus(), 50);
            }}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
          >
            Yes, connect me →
          </button>
          <button
            onClick={() => setCaptureState("declined")}
            className="rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-400"
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  function renderLeadForm() {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3 text-sm">
          <p className="mb-3 font-medium text-zinc-800">Quick details to connect you:</p>
          <form onSubmit={handleLeadSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Your name *"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            <input
              ref={phoneRef}
              type="tel"
              placeholder="Phone number *"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              maxLength={15}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <button
              type="submit"
              disabled={captureState === "submitting"}
              className="mt-1 rounded-lg bg-zinc-900 py-2 text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {captureState === "submitting" ? "Connecting…" : "Connect me with a specialist →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes wsr-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .wsr-pulse-ring {
          animation: wsr-pulse-ring 2s ease-out infinite;
        }
        @keyframes wsr-label-in {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes wsr-label-out {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(10px); }
        }
        .wsr-label-enter { animation: wsr-label-in 0.35s ease forwards; }
        .wsr-label-exit  { animation: wsr-label-out 0.35s ease forwards; }
      `}</style>

      {/* Floating button + nudge wrapper */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">

        {/* "Ask me anything" label — new visitors only */}
        {!open && isNewVisitor && (
          <div
            className={showLabel ? "wsr-label-enter" : "wsr-label-exit"}
            style={{ pointerEvents: showLabel ? "auto" : "none" }}
          >
            <button
              onClick={() => { markAdvisorSeen(); setOpen(true); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#18181B",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "10px 16px 10px 12px",
                fontSize: 13,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 16 }}>💬</span>
              Ask me anything
              <span style={{ opacity: 0.5, fontSize: 11, marginLeft: 2 }}>→</span>
            </button>
          </div>
        )}

        {/* Pulse ring — only for new visitors when chat is closed */}
        {!open && isNewVisitor && (
          <span
            className="wsr-pulse-ring"
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(24,24,27,0.35)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Main button */}
        <button
          onClick={() => {
            if (!open) markAdvisorSeen();
            setOpen((v) => !v);
          }}
          aria-label={open ? "Close advisor chat" : "Open advisor chat"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          style={{ position: "relative", flexShrink: 0 }}
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.84L3 20l1.09-3.27A7.93 7.93 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:rounded-2xl sm:border sm:border-zinc-200 sm:shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-900 px-4 py-3">
            {/* Mobile back button — hidden on sm+ where the floating X button handles close */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex sm:hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
              AI
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Westside Advisor</p>
              <p className="text-xs text-zinc-400">Hyderabad &amp; Goa Real Estate Expert</p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScrollContainer}
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:max-h-[420px]"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-zinc-900 text-white whitespace-pre-wrap"
                      : "rounded-bl-sm bg-zinc-100 text-zinc-800"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          code: ({ className, children }) => {
                            if (className === "language-price-breakdown") {
                              return <PriceBreakdownTable raw={String(children).trim()} />;
                            }
                            return <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs font-mono">{children}</code>;
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {msg.webSearchFired && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                          </svg>
                          Live web search used — verify key facts independently
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Lead capture UI — flows inline with messages */}
            {captureState === "offered" && renderCaptureOffer()}
            {(captureState === "form" || captureState === "submitting") && renderLeadForm()}

            {/* Retry button — shown when the last API call failed */}
            {lastFailedText && !loading && (
              <div className="flex justify-start">
                <button
                  onClick={retryLastMessage}
                  className="ml-1 flex items-center gap-1.5 rounded-full border border-zinc-300 px-3.5 py-1.5 text-xs text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-900"
                >
                  ↩ Retry
                </button>
              </div>
            )}

            {/* Typing indicator — also shows during project page init */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-100 bg-white px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about prices, projects, investment…"
                rows={1}
                className="max-h-28 flex-1 resize-none overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0"
                style={{ minHeight: "42px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-opacity hover:bg-zinc-700 focus:outline-none disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-zinc-400">
              Prices shown are base rates (BSP). All-in cost is typically 15–25% higher.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
