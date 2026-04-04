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
  fetchByBHKAndBudget,
  fetchByMarket,
  fetchByProjectName,
  fetchByDeveloper,
  fetchForPossessionTimeline,
  fetchBySuperlative,
  fetchAllForGeneral,
  fetchRAGChunks,
  type AdvisorQueryResult,
  type RAGChunk,
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

type ChatMessage = { role: "user" | "assistant"; content: string };

async function callClaude(
  model: string,
  system: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  return callClaudeWithHistory(model, system, [], userMessage, maxTokens);
}

async function callClaudeWithHistory(
  model: string,
  system: string,
  history: ChatMessage[],
  currentMessage: string,
  maxTokens: number
): Promise<string> {
  const messages: ChatMessage[] = [...history, { role: "user", content: currentMessage }];

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
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

// ─── Lead signal detection ────────────────────────────────────────────────────

interface LeadSignalResult {
  shouldSuggest: boolean;
  signals: string[];
}

function detectLeadSignals(
  userMessage: string,
  history: ChatMessage[]
): LeadSignalResult {
  const allUserText = [
    ...history.filter((m) => m.role === "user").map((m) => m.content),
    userMessage,
  ].join(" ");

  const signals: string[] = [];

  if (/\d+(\.\d+)?\s*(cr|crore|lakh|lac|\bl\b)|my budget|can afford|budget of/i.test(allUserText))
    signals.push("budget_mentioned");
  if (/site.?visit|go.?see|schedule.*visit|book.*visit|can i visit|show me/i.test(allUserText))
    signals.push("site_visit_intent");
  if (/move.?in|by \d{4}|need.*\d{4}|\d{4}.*possession|urgent|asap|soon as/i.test(allUserText))
    signals.push("timeline_mentioned");
  if (/payment.?plan|emi|home.?loan|mortgage|down.?payment|financing/i.test(allUserText))
    signals.push("payment_inquiry");
  if (/available|availability|units left|inventory|still.?selling|how many/i.test(allUserText))
    signals.push("availability_check");
  if (/how to book|booking process|register|purchase process/i.test(allUserText))
    signals.push("booking_inquiry");

  const completedUserTurns = history.filter((m) => m.role === "user").length;
  if (completedUserTurns >= 3) signals.push("extended_conversation");

  return { shouldSuggest: signals.length >= 2, signals };
}

// ─── Merge multiple AdvisorQueryResults, deduplicating by slug ───────────────

function mergeResults(...results: AdvisorQueryResult[]): AdvisorQueryResult {
  const seenProjects = new Set<string>();
  const seenMarkets = new Set<string>();
  const projects: AdvisorQueryResult["projects"] = [];
  const configs: AdvisorQueryResult["configs"] = [];
  const markets: AdvisorQueryResult["markets"] = [];
  for (const r of results) {
    for (const p of r.projects) {
      if (!seenProjects.has(p.project_slug)) {
        seenProjects.add(p.project_slug);
        projects.push(p);
      }
    }
    configs.push(...r.configs.filter((c) => !seenProjects.has("cfg:" + c.project_slug + c.config_type) && seenProjects.add("cfg:" + c.project_slug + c.config_type)));
    for (const m of r.markets) {
      if (!seenMarkets.has(m.market_slug)) {
        seenMarkets.add(m.market_slug);
        markets.push(m);
      }
    }
  }
  return { projects, configs, markets };
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
      // If budget also specified, use combined fetcher for accurate config filtering
      if (intent.budget_max_cr != null) {
        return fetchByBHKAndBudget(
          intent.bhk,
          intent.budget_min_cr ?? 0,
          intent.budget_max_cr,
          market
        );
      }
      return fetchByBHK(intent.bhk, market);
    }

    case "project_inquiry": {
      const names = intent.project_names?.length ? intent.project_names : intent.project_name ? [intent.project_name] : [];
      if (!names.length) return fetchAllForGeneral();
      const results = await Promise.all(names.map(fetchByProjectName));
      return mergeResults(...results);
    }

    case "market_overview": {
      if (market) return fetchByMarket(market);
      // Return all three markets
      const [kokapet, neopolis, fd] = await Promise.all([
        fetchByMarket("kokapet"),
        fetchByMarket("neopolis"),
        fetchByMarket("financial-district"),
      ]);
      return {
        projects: [...kokapet.projects.slice(0, 6), ...neopolis.projects.slice(0, 4), ...fd.projects.slice(0, 5)],
        configs: [...kokapet.configs.slice(0, 15), ...neopolis.configs.slice(0, 10), ...fd.configs.slice(0, 12)],
        markets: [...kokapet.markets, ...neopolis.markets, ...fd.markets],
      };
    }

    case "comparison": {
      // If specific projects named, fetch each; else fall back to market/general
      const names = intent.project_names?.length ? intent.project_names : intent.project_name ? [intent.project_name] : [];
      if (names.length) {
        const results = await Promise.all(names.map(fetchByProjectName));
        return mergeResults(...results);
      }
      if (market) return fetchByMarket(market);
      return fetchAllForGeneral();
    }

    case "investment_advice": {
      const names = intent.project_names?.length ? intent.project_names : intent.project_name ? [intent.project_name] : [];
      if (names.length) {
        const results = await Promise.all(names.map(fetchByProjectName));
        return mergeResults(...results);
      }
      if (market) return fetchByMarket(market);
      // Return all three markets with investment-focused data
      const [k, n, f] = await Promise.all([
        fetchByMarket("kokapet"),
        fetchByMarket("neopolis"),
        fetchByMarket("financial-district"),
      ]);
      return {
        projects: [...k.projects.slice(0, 5), ...n.projects.slice(0, 4), ...f.projects.slice(0, 5)],
        configs: [...k.configs.slice(0, 12), ...n.configs.slice(0, 10), ...f.configs.slice(0, 12)],
        markets: [...k.markets, ...n.markets, ...f.markets],
      };
    }

    case "possession_timeline": {
      // If a specific project is named, fetch it directly
      const names = intent.project_names?.length ? intent.project_names : intent.project_name ? [intent.project_name] : [];
      if (names.length) {
        console.log(`[advisor:intent] possession_timeline with project names: ${JSON.stringify(names)}`);
        const results = await Promise.all(names.map(fetchByProjectName));
        return mergeResults(...results);
      }
      const readyToMove = intent.ready_to_move ?? false;
      return fetchForPossessionTimeline(readyToMove, market);
    }

    case "developer_inquiry": {
      if (!intent.developer_name) return fetchAllForGeneral();
      return fetchByDeveloper(intent.developer_name);
    }

    case "superlative_query": {
      if (!intent.superlative_sort) return fetchAllForGeneral();
      return fetchBySuperlative(
        intent.superlative_sort.column,
        intent.superlative_sort.direction,
        market
      );
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
    const projectSlug: string | null =
      typeof body.projectSlug === "string" && body.projectSlug ? body.projectSlug : null;
    const marketSlug: string | null =
      typeof body.marketSlug === "string" && body.marketSlug ? body.marketSlug : null;

    if (!userMessage) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    if (userMessage.length > 2000) {
      return NextResponse.json({ error: "message too long (max 2000 chars)" }, { status: 400 });
    }

    // ── Context init: silent call made when widget opens on a project page ──
    if (userMessage === "__context__" && projectSlug) {
      const pageData = await fetchByProjectName(projectSlug);
      const fallbackGreeting =
        "Hi! I'm the Westside Realty AI Advisor. Ask me anything about projects in Kokapet, Neopolis, or Financial District.";

      if (!pageData.projects.length) {
        return NextResponse.json({
          conversation_id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          message: fallbackGreeting,
          intent: "context_init",
          data_stats: { projects_loaded: 0, configs_loaded: 0, markets_loaded: 0 },
          suggest_lead_capture: false,
          intent_signals: [],
          projects_discussed: [],
          latency_ms: Date.now() - start,
        });
      }

      const pageContext = buildContextString(pageData.projects, pageData.configs, pageData.markets);
      const greeting = await callClaude(
        SONNET,
        buildSystemPrompt(),
        `The user is viewing this project's page. Write a warm, punchy welcome message (2-3 sentences MAX, no bullet points) that: (1) says you see they're looking at the project by name, (2) highlights 1-2 specific data points from the project below (price range, completion status, or appreciation), (3) invites their first question. Be conversational and confident.\n\n${pageContext}`,
        250
      );

      return NextResponse.json({
        conversation_id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        message: greeting || fallbackGreeting,
        intent: "context_init",
        data_stats: {
          projects_loaded: pageData.projects.length,
          configs_loaded: pageData.configs.length,
          markets_loaded: pageData.markets.length,
        },
        suggest_lead_capture: false,
        intent_signals: [],
        projects_discussed: pageData.projects.map((p) => p.project_slug),
        latency_ms: Date.now() - start,
      });
    }

    // ── Market context init: silent call made when widget opens from a market page ──
    if (userMessage === "__market_context__" && marketSlug) {
      const marketData = await fetchByMarket(marketSlug);
      const marketName =
        marketData.markets[0]
          ? (marketData.markets[0] as unknown as Record<string, unknown>).market_name as string ?? marketSlug
          : marketSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const projectCount = marketData.projects.length;
      const fallbackGreeting = `Hi! I see you're exploring ${marketName}. I have data on ${projectCount} projects in this corridor — ask me about prices, investment outlook, or which project fits your budget.`;

      if (!projectCount) {
        return NextResponse.json({
          conversation_id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          message: fallbackGreeting,
          intent: "market_context_init",
          data_stats: { projects_loaded: 0, configs_loaded: 0, markets_loaded: 0 },
          suggest_lead_capture: false,
          intent_signals: [],
          projects_discussed: [],
          latency_ms: Date.now() - start,
        });
      }

      const marketContext = buildContextString(marketData.projects, marketData.configs, marketData.markets);
      const greeting = await callClaude(
        SONNET,
        buildSystemPrompt(),
        `The user is viewing the ${marketName} micro-market page. Write a warm, punchy welcome (2-3 sentences MAX, no bullet points): (1) acknowledge they're exploring ${marketName}, (2) mention ${projectCount} projects available and highlight 1 specific data point (entry price or appreciation), (3) invite their first question. Be confident and advisory — never generic.\n\n${marketContext}`,
        250
      );

      return NextResponse.json({
        conversation_id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        message: greeting || fallbackGreeting,
        intent: "market_context_init",
        data_stats: {
          projects_loaded: marketData.projects.length,
          configs_loaded: marketData.configs.length,
          markets_loaded: marketData.markets.length,
        },
        suggest_lead_capture: false,
        intent_signals: [],
        projects_discussed: marketData.projects.map((p) => p.project_slug),
        latency_ms: Date.now() - start,
      });
    }

    // Sanitise history from client: only user/assistant roles, must start with
    // "user", must alternate, capped at 10 messages (5 turns).
    const rawHistory: unknown[] = Array.isArray(body.history) ? body.history : [];
    const history: ChatMessage[] = [];
    for (const msg of rawHistory) {
      if (
        typeof msg === "object" &&
        msg !== null &&
        "role" in msg &&
        "content" in msg &&
        (msg as ChatMessage).role === "user" || (msg as ChatMessage).role === "assistant"
      ) {
        const m = msg as ChatMessage;
        // Enforce alternation and require first message to be "user"
        const lastRole = history[history.length - 1]?.role;
        if (lastRole === m.role) continue; // skip consecutive same-role
        if (history.length === 0 && m.role !== "user") continue; // must start with user
        history.push({ role: m.role, content: String(m.content).slice(0, 4000) });
      }
    }
    const cappedHistory = history.slice(-10); // max 5 turns (10 messages)

    // Step 1: Classify intent with Haiku using only the current message (fast + cheap)
    const intentRaw = await callClaude(
      HAIKU,
      "You are a JSON extraction assistant. Return only valid JSON.",
      buildIntentPrompt(userMessage),
      300
    );

    const intent = safeParseJson<ParsedIntent>(intentRaw) ?? {
      intent: "general",
    };

    // Step 2: Fetch structured data and RAG chunks in parallel.
    // ParsedIntent has no city field — all covered markets are Hyderabad.
    const [structuredData, ragChunks] = await Promise.all([
      fetchDataForIntent(intent),
      fetchRAGChunks(userMessage, {
        city: "hyderabad",
        asset_class: "residential",
        limit: 5,
      }),
    ]);
    let data = structuredData;

    // Step 3: If on a project page, ensure that project is always in context.
    // If on a market page (marketSlug), ensure that market's projects are in context.
    if (projectSlug && !data.projects.some((p) => p.project_slug === projectSlug)) {
      const pageData = await fetchByProjectName(projectSlug);
      if (pageData.projects.length) data = mergeResults(pageData, data);
    } else if (marketSlug && !data.markets.some((m) => (m as unknown as Record<string,unknown>).market_slug === marketSlug)) {
      const marketData = await fetchByMarket(marketSlug);
      if (marketData.projects.length) data = mergeResults(marketData, data);
    }

    // Step 4: Build context string (RAG chunks appended as Market Research section)
    const context = buildContextString(data.projects, data.configs, data.markets, ragChunks);

    // Step 5: Detect high-intent signals for lead capture
    const leadSignals = detectLeadSignals(userMessage, cappedHistory);

    // Step 6: Generate response with Sonnet — inject data context into the
    // current message only; history messages are already contextualised.
    // When lead signals fire, append a natural capture suggestion to the prompt.
    const systemPrompt = buildSystemPrompt();
    const captureInstruction = leadSignals.shouldSuggest
      ? `\n\nIMPORTANT: This user has shown strong purchase intent. At the natural end of your response, add exactly one line suggesting connection with a specialist — e.g. "Ready to take the next step? I can connect you with our Kokapet specialist for a site visit and exclusive pricing — just say yes." Keep it conversational, not salesy.`
      : "";

    const promptWithContext =
      context.length > 50
        ? `Here is the current real estate data to inform your answer:\n\n${context}\n\n---\n\nUser question: ${userMessage}${captureInstruction}`
        : `${userMessage}${captureInstruction}`;

    const responseText = await callClaudeWithHistory(
      SONNET,
      systemPrompt,
      cappedHistory,
      promptWithContext,
      1200
    );

    return NextResponse.json({
      conversation_id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message: responseText,
      intent: intent.intent,
      data_stats: {
        projects_loaded: data.projects.length,
        configs_loaded: data.configs.length,
        markets_loaded: data.markets.length,
      },
      suggest_lead_capture: leadSignals.shouldSuggest,
      intent_signals: leadSignals.signals,
      projects_discussed: data.projects.map((p) => p.project_slug),
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
