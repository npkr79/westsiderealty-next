import { NextRequest, NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildContextString,
  buildIntentPrompt,
  type ParsedIntent,
} from "@/lib/advisor/system-prompt";
import {
  fetchByBudget,
  fetchByBHK,
  fetchByMarket,
  fetchByProjectName,
  fetchByDeveloper,
  fetchForPossessionTimeline,
  fetchAllForGeneral,
  type AdvisorQueryResult,
} from "@/lib/advisor/data-fetcher";

// ─── Config ───────────────────────────────────────────────────────────────────

export const maxDuration = 30;

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-20250514";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  return key;
}

async function callClaude(
  model: string,
  system: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? "";
}

function safeParseJson<T>(raw: string): T | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ─── Intent → Data fetcher ────────────────────────────────────────────────────

async function fetchDataForIntent(
  intent: ParsedIntent
): Promise<AdvisorQueryResult> {
  const market = intent.market_slug;

  switch (intent.intent) {
    case "budget_filter": {
      const min = intent.budget_min_cr ?? 0;
      const max = intent.budget_max_cr ?? 99;
      return fetchByBudget(min, max, market);
    }

    case "bhk_filter": {
      if (!intent.bhk) return fetchAllForGeneral();
      return fetchByBHK(intent.bhk, market);
    }

    case "project_inquiry": {
      if (!intent.project_name) return fetchAllForGeneral();
      return fetchByProjectName(intent.project_name);
    }

    case "market_overview": {
      if (market) return fetchByMarket(market);
      // Return both markets
      const [kokapet, neopolis] = await Promise.all([
        fetchByMarket("kokapet"),
        fetchByMarket("neopolis"),
      ]);
      return {
        projects: [...kokapet.projects.slice(0, 8), ...neopolis.projects.slice(0, 6)],
        configs: [...kokapet.configs.slice(0, 20), ...neopolis.configs.slice(0, 15)],
        markets: [...kokapet.markets, ...neopolis.markets],
      };
    }

    case "comparison": {
      // If market specified, get all projects for that market; else get top projects
      if (market) return fetchByMarket(market);
      return fetchAllForGeneral();
    }

    case "investment_advice": {
      if (market) return fetchByMarket(market);
      // Return both markets with investment-focused data
      const [k, n] = await Promise.all([
        fetchByMarket("kokapet"),
        fetchByMarket("neopolis"),
      ]);
      return {
        projects: [...k.projects.slice(0, 6), ...n.projects.slice(0, 6)],
        configs: [...k.configs.slice(0, 15), ...n.configs.slice(0, 10)],
        markets: [...k.markets, ...n.markets],
      };
    }

    case "possession_timeline": {
      const readyToMove = intent.ready_to_move ?? false;
      return fetchForPossessionTimeline(readyToMove, market);
    }

    case "developer_inquiry": {
      if (!intent.developer_name) return fetchAllForGeneral();
      return fetchByDeveloper(intent.developer_name);
    }

    default:
      return fetchAllForGeneral();
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const body = await request.json();
    const userMessage = (body.message ?? "").trim();

    if (!userMessage) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    if (userMessage.length > 2000) {
      return NextResponse.json({ error: "message too long (max 2000 chars)" }, { status: 400 });
    }

    // Step 1: Classify intent with Haiku (fast + cheap)
    const intentRaw = await callClaude(
      HAIKU,
      "You are a JSON extraction assistant. Return only valid JSON.",
      buildIntentPrompt(userMessage),
      300
    );

    const intent = safeParseJson<ParsedIntent>(intentRaw) ?? {
      intent: "general",
    };

    // Step 2: Fetch relevant data from Supabase
    const data = await fetchDataForIntent(intent);

    // Step 3: Build context string
    const context = buildContextString(data.projects, data.configs, data.markets);

    // Step 4: Generate response with Sonnet
    const systemPrompt = buildSystemPrompt();
    const promptWithContext =
      context.length > 50
        ? `Here is the current real estate data to inform your answer:\n\n${context}\n\n---\n\nUser question: ${userMessage}`
        : userMessage;

    const responseText = await callClaude(SONNET, systemPrompt, promptWithContext, 1200);

    return NextResponse.json({
      conversation_id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message: responseText,
      intent: intent.intent,
      data_stats: {
        projects_loaded: data.projects.length,
        configs_loaded: data.configs.length,
        markets_loaded: data.markets.length,
      },
      latency_ms: Date.now() - start,
    });
  } catch (err) {
    console.error("[advisor/chat] error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Advisor error",
        latency_ms: Date.now() - start,
      },
      { status: 500 }
    );
  }
}
