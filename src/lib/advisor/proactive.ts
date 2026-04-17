import type { SupabaseClient } from "@supabase/supabase-js";

// Minimal intent shape needed for buying signal scoring
export interface AdvisorToolIntent {
  intent: string;
  budget_min_cr?: number | null;
  budget_max_cr?: number | null;
  bhk?: string | null;
  market_slug?: string | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuyingSignalResult {
  score: number;
  signals: string[];
  isHot: boolean;
}

// ─── Signal patterns ──────────────────────────────────────────────────────────

const SIGNAL_PATTERNS: Array<{
  label: string;
  score: number;
  patterns: RegExp[];
}> = [
  {
    label: "Budget specified",
    score: 2,
    patterns: [
      /budget.{0,20}(\d+(\.\d+)?)\s*(cr|crore|lakh|l\b)/i,
      /(\d+(\.\d+)?)\s*(cr|crore|lakh).{0,20}budget/i,
      /under\s+(\d+(\.\d+)?)\s*(cr|crore)/i,
      /between\s+[\d.]+\s*(cr|crore).{0,20}and/i,
      /[\d.]+\s*(cr|crore)\s*(to|-)\s*[\d.]+\s*(cr|crore)/i,
    ],
  },
  {
    label: "Site visit intent",
    score: 3,
    patterns: [
      /site\s*visit/i,
      /can (i|we) (visit|see|check)/i,
      /want to (visit|see|view|come)/i,
      /schedule.{0,20}visit/i,
      /when (can|could) (i|we)/i,
      /show (me|us) the (flat|apartment|project|unit)/i,
    ],
  },
  {
    label: "Possession urgency",
    score: 2,
    patterns: [
      /ready.?to.?move/i,
      /immediate\s+possession/i,
      /need (it |a flat |apartment |unit )?(by|before|in)\s+\w/i,
      /possession.{0,30}(by|before|in)\s+\w/i,
      /(moving|shifting|relocating).{0,30}(soon|by|in)\s+\w/i,
      /within\s+(3|6|12|18|24)\s*months/i,
    ],
  },
  {
    label: "Specific project inquiry",
    score: 2,
    patterns: [
      /is\s+\w+\s+(good|better|worth|available)/i,
      /tell me more about/i,
      /more (info|details|information) (on|about)/i,
      /what.{0,10}(floor|tower|unit|view) (is|are|do)/i,
      /which (floor|tower|unit|facing)/i,
    ],
  },
  {
    label: "Investment ROI focus",
    score: 2,
    patterns: [
      /rental yield/i,
      /\broi\b/i,
      /return on investment/i,
      /how much (rent|rental)/i,
      /(annual|monthly)\s+return/i,
      /appreciation.{0,20}(expect|likely|forecast)/i,
      /airbnb|short.?term\s+rent/i,
      /cap\s+rate|capitali[sz]ation/i,
    ],
  },
  {
    label: "Financing & loan intent",
    score: 2,
    patterns: [
      /home\s*loan/i,
      /loan.{0,20}(eligible|apply|sanction|approv)/i,
      /(bank|hdfc|sbi|icici).{0,20}(loan|finance|mortgage)/i,
      /down\s*payment/i,
      /emi\b/i,
      /pre.?approved/i,
    ],
  },
  {
    label: "Comparison shortlisting",
    score: 1,
    patterns: [
      /compare.{0,30}(vs|versus|or|and)/i,
      /which is better/i,
      /(between|vs\.?)\s+\w+\s+and\s+\w+/i,
      /pros and cons/i,
      /shortlist/i,
    ],
  },
];

// HOT threshold: score ≥ 4 (at least 2 strong signals, or 1 strong + multiple weaker)
const HOT_SCORE_THRESHOLD = 4;

// Minimum alert cooldown per conversation (only alert once)
// Global cooldown: don't alert advisor more than once per 10 minutes across all conversations
const GLOBAL_COOLDOWN_MINUTES = 10;

// ─── Score buying signals ─────────────────────────────────────────────────────

export function scoreBuyingSignals(
  currentMessage: string,
  history: Array<{ role: string; content: string }>,
  intent: AdvisorToolIntent
): BuyingSignalResult {
  const signals: string[] = [];
  let score = 0;

  // Build full conversation text for pattern matching
  const userMessages = [
    ...history.filter((m) => m.role === "user").map((m) => m.content),
    currentMessage,
  ].join(" ");

  // Run pattern matching
  for (const { label, score: pts, patterns } of SIGNAL_PATTERNS) {
    if (patterns.some((re) => re.test(userMessages))) {
      signals.push(label);
      score += pts;
    }
  }

  // Bonus: intent-based signals
  if (intent.intent === "possession_timeline") {
    if (!signals.includes("Possession urgency")) {
      signals.push("Possession timeline focus");
      score += 1;
    }
  }
  if (intent.budget_min_cr || intent.budget_max_cr) {
    if (!signals.includes("Budget specified")) {
      signals.push("Budget specified (intent)");
      score += 2;
    }
  }
  if (intent.bhk && intent.market_slug) {
    signals.push("BHK + location specified");
    score += 1;
  }

  // Multi-turn engagement bonus: 3+ user turns = serious interest
  const userTurnCount = history.filter((m) => m.role === "user").length + 1;
  if (userTurnCount >= 4) {
    signals.push(`Deep engagement (${userTurnCount} turns)`);
    score += 1;
  }

  return {
    score,
    signals,
    isHot: score >= HOT_SCORE_THRESHOLD,
  };
}

// ─── Direct WhatsApp notification (internal, no lead ID needed) ───────────────

export async function sendDirectWhatsApp(phone: string, message: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp env vars not configured");
  }

  const cleanPhone = phone.replace(/[^\d]/g, "");
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: message },
      }),
      signal: AbortSignal.timeout(8_000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${err.slice(0, 200)}`);
  }
}

// ─── Build advisor alert message ──────────────────────────────────────────────

function buildAlertMessage(
  result: BuyingSignalResult,
  conversationId: string,
  sourcePage: string | null,
  userTurns: number
): string {
  const signalList = result.signals
    .map((s) => `• ${s}`)
    .join("\n");

  const page = sourcePage
    ? sourcePage.replace(/^https?:\/\/[^/]+/, "")
    : "website";

  return [
    `🔥 *Hot Lead Alert — Westside Advisor Bot*`,
    ``,
    `A visitor is showing strong buying intent right now.`,
    ``,
    `📍 *Page:* ${page}`,
    `💬 *Turns:* ${userTurns} exchanges`,
    `📊 *Score:* ${result.score}/10`,
    ``,
    `*Buying signals detected:*`,
    signalList,
    ``,
    `They haven't shared their contact yet — the chat will prompt them shortly.`,
    ``,
    `_Conversation ID: ${conversationId.slice(0, 8)}…_`,
  ].join("\n");
}

// ─── Check global cooldown ────────────────────────────────────────────────────

async function isWithinGlobalCooldown(supabase: SupabaseClient): Promise<boolean> {
  try {
    const cooldownCutoff = new Date(
      Date.now() - GLOBAL_COOLDOWN_MINUTES * 60 * 1000
    ).toISOString();

    const { data } = await supabase
      .from("advisor_conversations")
      .select("id")
      .not("hot_lead_notified_at", "is", null)
      .gte("hot_lead_notified_at", cooldownCutoff)
      .limit(1)
      .maybeSingle();

    return !!data; // true = in cooldown, skip notification
  } catch {
    return false; // on error, allow the notification
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Evaluates buying signals and fires a WhatsApp alert to the duty advisor if:
 * 1. The score crosses HOT_SCORE_THRESHOLD
 * 2. This conversation hasn't been notified yet
 * 3. No other conversation triggered an alert in the last GLOBAL_COOLDOWN_MINUTES
 *
 * Always updates lead_score + buying_signals on the conversation row.
 * Never throws — silently logs errors to avoid breaking the chat.
 */
export async function runProactiveIntelligence(
  supabase: SupabaseClient,
  conversationId: string,
  currentMessage: string,
  history: Array<{ role: string; content: string }>,
  intent: AdvisorToolIntent,
  sourcePage: string | null
): Promise<{ score: number; signals: string[]; notified: boolean }> {
  try {
    const result = scoreBuyingSignals(currentMessage, history, intent);

    // Always persist score + signals (non-blocking)
    supabase
      .from("advisor_conversations")
      .update({
        lead_score: result.score,
        buying_signals: result.signals,
        // Promote status to "hot" when threshold crossed
        ...(result.isHot ? { status: "hot" } : {}),
      })
      .eq("id", conversationId)
      .then(() => {})
      .catch(() => {});

    if (!result.isHot) {
      return { ...result, notified: false };
    }

    // Check if this conversation was already notified
    const { data: conv } = await supabase
      .from("advisor_conversations")
      .select("hot_lead_notified_at")
      .eq("id", conversationId)
      .maybeSingle();

    if (conv?.hot_lead_notified_at) {
      // Already notified — don't spam
      return { ...result, notified: false };
    }

    // Check global cooldown
    const inCooldown = await isWithinGlobalCooldown(supabase);
    if (inCooldown) {
      console.log(`[Proactive] Skipping alert for ${conversationId} — global cooldown active`);
      return { ...result, notified: false };
    }

    // Get duty advisor phone from env
    const dutyPhone = process.env.ADVISOR_DUTY_PHONE;
    if (!dutyPhone) {
      console.warn("[Proactive] ADVISOR_DUTY_PHONE not configured — skipping WhatsApp alert");
      return { ...result, notified: false };
    }

    const userTurns = history.filter((m) => m.role === "user").length + 1;
    const alertMessage = buildAlertMessage(result, conversationId, sourcePage, userTurns);

    await sendDirectWhatsApp(dutyPhone, alertMessage);

    // Mark as notified
    await supabase
      .from("advisor_conversations")
      .update({ hot_lead_notified_at: new Date().toISOString() })
      .eq("id", conversationId);

    console.log(
      `[Proactive] 🔥 Hot lead alert sent for conversation ${conversationId} | score=${result.score} | signals=${result.signals.join(", ")}`
    );

    return { ...result, notified: true };
  } catch (e) {
    console.error("[Proactive] runProactiveIntelligence error:", e);
    return { score: 0, signals: [], notified: false };
  }
}
