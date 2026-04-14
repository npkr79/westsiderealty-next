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
import {
  shouldTriggerWebSearch,
  buildWebQuery,
  webSearch,
  buildWebDataContext,
} from "@/lib/advisor/web-search";
import { createServiceClient } from "@/lib/supabase/serviceClient";

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
      const max = intent.budget_max_cr ?? null;
      return fetchByBudget(min, max, market, intent.city, intent.property_type);
    }

    case "bhk_filter": {
      if (!intent.bhk) return fetchAllForGeneral();
      return fetchByBHK(intent.bhk, market, intent.city, intent.property_type);
    }

    case "project_inquiry": {
      const names = intent.project_names?.length ? intent.project_names : intent.project_name ? [intent.project_name] : [];
      if (!names.length) return fetchAllForGeneral();
      const results = await Promise.all(names.map(fetchByProjectName));
      return mergeResults(...results);
    }

    case "market_overview": {
      if (market) return fetchByMarket(market);
      // Goa city-level overview: return top Goa markets
      if (intent.city === "goa") {
        const [calangute, benaulim, vagator] = await Promise.all([
          fetchByMarket("calangute"),
          fetchByMarket("benaulim"),
          fetchByMarket("vagator"),
        ]);
        return {
          projects: [...calangute.projects.slice(0, 4), ...benaulim.projects.slice(0, 4), ...vagator.projects.slice(0, 4)],
          configs: [...calangute.configs.slice(0, 10), ...benaulim.configs.slice(0, 8), ...vagator.configs.slice(0, 8)],
          markets: [...calangute.markets, ...benaulim.markets, ...vagator.markets],
        };
      }
      // Default: Hyderabad top markets
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
      if (market) return fetchByMarket(market);
      // Goa investment advice: show top 3 yield markets
      if (intent.city === "goa") {
        const [calangute, benaulim, morjim] = await Promise.all([
          fetchByMarket("calangute"),
          fetchByMarket("benaulim"),
          fetchByMarket("morjim"),
        ]);
        return {
          projects: [...calangute.projects.slice(0, 5), ...benaulim.projects.slice(0, 4), ...morjim.projects.slice(0, 3)],
          configs: [...calangute.configs.slice(0, 12), ...benaulim.configs.slice(0, 8), ...morjim.configs.slice(0, 6)],
          markets: [...calangute.markets, ...benaulim.markets, ...morjim.markets],
        };
      }
      // Default: Hyderabad investment overview
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

// ─── Supabase conversation logging (fire-and-forget) ─────────────────────────

/**
 * Returns the UUID of the advisor_conversations row.
 * Creates a new session row on first message; updates last_message_at on subsequent turns.
 */
async function upsertConversationSession(
  conversationUuid: string | null,
  {
    visitorId,
    sourcePage,
    projectSlug,
    marketSlug,
  }: { visitorId: string; sourcePage: string | null; projectSlug: string | null; marketSlug: string | null }
): Promise<string | null> {
  try {
    const supabase = createServiceClient();

    if (conversationUuid) {
      await supabase
        .from("advisor_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationUuid);
      return conversationUuid;
    }

    const sourcePageType = projectSlug ? "project" : marketSlug ? "market" : "general";

    const { data, error } = await supabase
      .from("advisor_conversations")
      .insert({
        visitor_id: visitorId,
        channel: "web_chat",
        source_page: sourcePage,
        source_page_type: sourcePageType,
        project_slug: projectSlug ?? null,
        micro_market_slug: marketSlug ?? null,
        status: "active",
        message_count: 0,
        started_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[advisor/chat] failed to create conversation session:", error?.message, error?.details);
      return null;
    }
    return data.id as string;
  } catch (e) {
    console.error("[advisor/chat] upsertConversationSession error:", e);
    return null;
  }
}

/**
 * Logs the user message and AI response as two rows in advisor_messages.
 * Also increments message_count on the parent conversation.
 */
async function logMessageTurn(
  conversationUuid: string,
  userMessage: string,
  assistantResponse: string,
  {
    intent,
    latencyMs,
    suggestLeadCapture,
  }: { intent: string; latencyMs: number; suggestLeadCapture: boolean }
): Promise<void> {
  try {
    const supabase = createServiceClient();

    await Promise.all([
      // Log both turns
      supabase.from("advisor_messages").insert([
        {
          conversation_id: conversationUuid,
          role: "user",
          content: userMessage,
        },
        {
          conversation_id: conversationUuid,
          role: "assistant",
          content: assistantResponse,
          model: SONNET,
          show_lead_capture: suggestLeadCapture,
          latency_ms: latencyMs,
        },
      ]),
      // Increment message_count atomically
      supabase.rpc("increment_advisor_message_count", { conv_id: conversationUuid }),
    ]);
  } catch (e) {
    console.error("[advisor/chat] logMessageTurn error:", e);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const body = await request.json();
    const userMessage = (body.message ?? "").trim();
    const incomingConversationId: string | null = body.conversation_id ?? null;
    const sourcePage: string | null = body.source_page ?? request.headers.get("referer") ?? null;
    const projectSlug: string | null = body.projectSlug ?? null;
    const marketSlug: string | null = body.marketSlug ?? null;
    // Conversation history for context-aware intent classification
    const history: Array<{ role: string; content: string }> = Array.isArray(body.history)
      ? body.history
      : [];
    // visitor_id is generated client-side and persisted in localStorage
    const visitorId: string = body.visitor_id || `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
      buildIntentPrompt(userMessage, history),
      300
    );

    const intent = safeParseJson<ParsedIntent>(intentRaw) ?? {
      intent: "general",
    };

    // Step 2: Fetch relevant data from Supabase (Layer 1 + 2)
    const supabase = createServiceClient();
    const data = await fetchDataForIntent(intent);

    // Step 3: Layer 3 — web search if DB is sparse or user wants real-time data
    let webContext = "";
    let webSearchFired = false;
    if (shouldTriggerWebSearch(userMessage, intent, data.projects.length, data.markets.length)) {
      try {
        const { query, queryType, entityName } = buildWebQuery(intent, userMessage);
        const webResult = await webSearch(supabase, query, queryType, entityName);
        if (webResult) {
          webContext = buildWebDataContext(webResult);
          webSearchFired = true;
          console.log(`[advisor/chat] Layer 3 fired (${queryType}): ${entityName} | from_cache=${webResult.from_cache}`);
        }
      } catch (e) {
        // Web search failure must never break the chat
        console.error("[advisor/chat] Layer 3 web search failed:", e);
      }
    }

    // Step 4: Build context string (DB data + optional web data)
    const dbContext = buildContextString(data.projects, data.configs, data.markets);
    const fullContext = [dbContext, webContext].filter(Boolean).join("\n\n");

    // Step 5: Generate response with Sonnet
    const systemPrompt = buildSystemPrompt();
    const promptWithContext =
      fullContext.length > 50
        ? `Here is the real estate data to inform your answer:\n\n${fullContext}\n\n---\n\nUser question: ${userMessage}`
        : userMessage;

    const responseText = await callClaude(SONNET, systemPrompt, promptWithContext, 1200);

    const latencyMs = Date.now() - start;

    // Trigger lead capture after 2+ user turns, or immediately on contact/broker requests
    const captureState: string = body.capture_state ?? "idle";
    const userTurns = history.filter((m) => m.role === "user").length + 1; // +1 for current
    const isContactIntent = /broker|agent|advisor|call me|contact|visit|site visit|phone|number/i.test(userMessage);
    const suggestLeadCapture = captureState !== "done" && (userTurns >= 2 || isContactIntent);

    // Step 5: Log to Supabase (fire-and-forget — never blocks the response)
    const conversationUuid = await upsertConversationSession(incomingConversationId, {
      visitorId,
      sourcePage,
      projectSlug,
      marketSlug,
    });

    if (conversationUuid) {
      // Await to ensure Vercel doesn't kill the function before DB write completes
      await logMessageTurn(conversationUuid, userMessage, responseText, {
        intent: intent.intent,
        latencyMs,
        suggestLeadCapture,
      }).catch(() => {}); // swallow errors, never break the chat
    }

    return NextResponse.json({
      conversation_id: conversationUuid ?? `adv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message: responseText,
      intent: intent.intent,
      data_stats: {
        projects_loaded: data.projects.length,
        configs_loaded: data.configs.length,
        markets_loaded: data.markets.length,
        web_search_fired: webSearchFired,
      },
      latency_ms: latencyMs,
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
