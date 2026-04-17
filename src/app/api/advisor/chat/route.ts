import { NextRequest, NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildContextString,
  buildGuardPrompt,
  ADVISOR_TOOLS,
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
import { webSearch, buildWebDataContext } from "@/lib/advisor/web-search";
import { runProactiveIntelligence } from "@/lib/advisor/proactive";
import { submitLead } from "@/app/actions/submit-lead";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// ─── Config ───────────────────────────────────────────────────────────────────

export const maxDuration = 30;

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-20250514";

// ─── Anthropic API types ──────────────────────────────────────────────────────

interface TextBlock {
  type: "text";
  text: string;
}

interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

type ContentBlock = TextBlock | ToolUseBlock;

interface AnthropicResponse {
  stop_reason: "end_turn" | "tool_use" | "max_tokens";
  content: ContentBlock[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  return key;
}

function extractText(content: ContentBlock[]): string {
  return content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
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

// ─── Build conversation messages (proper multi-turn format) ───────────────────

function buildMessages(
  history: Array<{ role: string; content: string }>,
  currentMessage: string
): Array<{ role: "user" | "assistant"; content: string }> {
  // Cap history to last 20 messages (10 turns) to stay within token limits
  const recent = history.slice(-20);
  const normalized: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const msg of recent) {
    const role: "user" | "assistant" = msg.role === "user" ? "user" : "assistant";
    // Merge consecutive same-role messages (API requires strict alternation)
    if (normalized.length > 0 && normalized[normalized.length - 1].role === role) {
      normalized[normalized.length - 1].content += "\n" + msg.content;
    } else {
      normalized.push({ role, content: msg.content });
    }
  }

  // Append current message
  if (normalized.length > 0 && normalized[normalized.length - 1].role === "user") {
    normalized[normalized.length - 1].content += "\n" + currentMessage;
  } else {
    normalized.push({ role: "user", content: currentMessage });
  }

  // Anthropic requires first message to be from user
  while (normalized.length > 0 && normalized[0].role !== "user") {
    normalized.shift();
  }

  return normalized;
}

// ─── Anthropic API calls ──────────────────────────────────────────────────────

async function callHaikuGuard(userMessage: string): Promise<string> {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: HAIKU,
      max_tokens: 60,
      system: "You are a message validator. Return only valid JSON.",
      messages: [{ role: "user", content: buildGuardPrompt(userMessage) }],
    }),
  });
  if (!res.ok) throw new Error(`Haiku guard error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? '{"valid":true}';
}

async function callSonnetWithTools(
  messages: Array<{ role: string; content: unknown }>,
  systemPrompt: string
): Promise<AnthropicResponse> {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model: SONNET,
      max_tokens: 1500,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      tools: ADVISOR_TOOLS,
      tool_choice: { type: "auto" },
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sonnet API error ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Search dispatcher ────────────────────────────────────────────────────────

interface SearchProjectsInput {
  query?: string;
  developer_name?: string;
  bhk?: string;
  budget_min_cr?: number;
  budget_max_cr?: number;
  city?: string;
  market?: string;
  property_type?: string;
  ready_to_move?: boolean;
}

async function executeSearchProjects(
  input: SearchProjectsInput
): Promise<AdvisorQueryResult> {
  const {
    query,
    developer_name,
    bhk,
    budget_min_cr,
    budget_max_cr,
    city,
    market,
    property_type,
    ready_to_move,
  } = input;

  if (developer_name) return fetchByDeveloper(developer_name);

  if (ready_to_move !== undefined) {
    return fetchForPossessionTimeline(ready_to_move, market);
  }

  if (budget_min_cr !== undefined || budget_max_cr !== undefined) {
    const result = await fetchByBudget(
      budget_min_cr ?? 0,
      budget_max_cr ?? null,
      market,
      city,
      property_type
    );
    if (bhk && result.configs.length > 0) {
      const norm = bhk.replace(/\s+/g, " ").toUpperCase();
      return {
        ...result,
        configs: result.configs.filter((c) =>
          c.config_type.toUpperCase().includes(norm)
        ),
      };
    }
    return result;
  }

  if (bhk) return fetchByBHK(bhk, market, city, property_type);

  if (query) {
    const projectResult = await fetchByProjectName(query);
    if (projectResult.projects.length > 0) return projectResult;
    // If no project found, try as a market slug
    const slug = query.toLowerCase().replace(/\s+/g, "-");
    const marketResult = await fetchByMarket(slug);
    if (marketResult.projects.length > 0 || marketResult.markets.length > 0) {
      return marketResult;
    }
    return projectResult;
  }

  if (market) return fetchByMarket(market);

  return fetchAllForGeneral();
}

// ─── Tool executor ────────────────────────────────────────────────────────────

interface ToolContext {
  supabase: ReturnType<typeof createServiceClient>;
  conversationId: string | null;
  sourcePage: string | null;
}

async function executeAdvisorTools(
  toolUseBlocks: ToolUseBlock[],
  ctx: ToolContext
): Promise<{ results: ToolResultBlock[]; contactLogged: boolean; webSearchFired: boolean }> {
  let contactLogged = false;
  let webSearchFired = false;

  const results = await Promise.all(
    toolUseBlocks.map(async (block): Promise<ToolResultBlock> => {
      let content: string;

      try {
        switch (block.name) {
          case "search_projects": {
            const data = await executeSearchProjects(block.input as SearchProjectsInput);
            content = buildContextString(data.projects, data.configs, data.markets);
            if (data.projects.length === 0 && data.markets.length === 0) {
              content =
                "No matching results found in our database for these criteria. Consider using web_search for real-time data.";
            }
            console.log(
              `[advisor/tool] search_projects → ${data.projects.length}p ${data.markets.length}m`
            );
            break;
          }

          case "search_market": {
            const raw = (block.input.location as string) ?? "";
            const slug = raw.toLowerCase().replace(/\s+/g, "-");
            const data = await fetchByMarket(slug);
            content = buildContextString(data.projects, data.configs, data.markets);
            if (data.projects.length === 0 && data.markets.length === 0) {
              content = `No data found for "${raw}" in our database. Consider using web_search.`;
            }
            console.log(
              `[advisor/tool] search_market(${slug}) → ${data.projects.length}p ${data.markets.length}m`
            );
            break;
          }

          case "web_search": {
            const query = (block.input.query as string) ?? "";
            const reason = (block.input.reason as string) ?? "";
            console.log(`[advisor/tool] web_search: "${query}" | reason: ${reason}`);
            const webResult = await webSearch(ctx.supabase, [query], "live_search", query);
            content = webResult
              ? buildWebDataContext(webResult)
              : "No useful web results found for this query.";
            webSearchFired = true;
            break;
          }

          case "log_contact": {
            const phone = (block.input.phone as string) ?? "";
            const name = (block.input.name as string) ?? "";
            const company = (block.input.company as string) ?? "";
            const contactContext = (block.input.context as string) ?? "";

            console.log(`[advisor/tool] log_contact: ${name} / ${phone} / ${company}`);

            // Use the same submitLead pipeline as the website contact form.
            // This inserts into crm_leads and triggers onNewLeadAutomation (WhatsApp alert).
            const result = await submitLead({
              name: name || "Unknown",
              phone,
              type: "GENERAL_CONTACT",
              source_page: ctx.sourcePage ?? "advisor_chat",
              details: {
                company: company || null,
                notes: [
                  company ? `Via ${company}` : "Via advisor chat",
                  contactContext || null,
                ]
                  .filter(Boolean)
                  .join(". "),
                channel: "advisor_chat",
                conversation_id: ctx.conversationId,
              },
              attribution_metadata: {
                source_type: "advisor_chat",
                company: company || null,
                conversation_id: ctx.conversationId,
              },
            });

            if (!result.success) {
              console.error("[advisor/tool] log_contact submitLead failed:", result.error);
              content = `Failed to log contact: ${result.error}`;
              break;
            }

            // Mark conversation status
            if (ctx.conversationId) {
              ctx.supabase
                .from("advisor_conversations")
                .update({ status: "contact_shared" })
                .eq("id", ctx.conversationId)
                .then(() => {})
                .catch(() => {});
            }

            contactLogged = true;
            content = `Lead logged to CRM: ${name || "Unknown"} (${phone}${company ? ", " + company : ""}). WhatsApp automation triggered.`;
            break;
          }

          default:
            content = `Unknown tool: ${block.name}`;
        }
      } catch (e) {
        content = `Tool error: ${e instanceof Error ? e.message : "unknown error"}`;
        console.error(`[advisor/tool] ${block.name} error:`, e);
      }

      return { type: "tool_result", tool_use_id: block.id, content };
    })
  );

  return { results, contactLogged, webSearchFired };
}

// ─── Supabase conversation logging ────────────────────────────────────────────

async function upsertConversationSession(
  conversationUuid: string | null,
  {
    visitorId,
    sourcePage,
    projectSlug,
    marketSlug,
  }: {
    visitorId: string;
    sourcePage: string | null;
    projectSlug: string | null;
    marketSlug: string | null;
  }
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
      console.error(
        "[advisor/chat] failed to create conversation session:",
        error?.message,
        error?.details
      );
      return null;
    }
    return data.id as string;
  } catch (e) {
    console.error("[advisor/chat] upsertConversationSession error:", e);
    return null;
  }
}

async function logMessageTurn(
  conversationUuid: string,
  userMessage: string,
  assistantResponse: string,
  {
    toolsUsed,
    latencyMs,
    suggestLeadCapture,
  }: { toolsUsed: string[]; latencyMs: number; suggestLeadCapture: boolean }
): Promise<void> {
  try {
    const supabase = createServiceClient();

    await Promise.all([
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
          tools_used: toolsUsed.length ? toolsUsed : null,
          show_lead_capture: suggestLeadCapture,
          latency_ms: latencyMs,
        },
      ]),
      supabase.rpc("increment_advisor_message_count", {
        conv_id: conversationUuid,
      }),
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
    const sourcePage: string | null =
      body.source_page ?? request.headers.get("referer") ?? null;
    const projectSlug: string | null = body.projectSlug ?? null;
    const marketSlug: string | null = body.marketSlug ?? null;
    const history: Array<{ role: string; content: string }> = Array.isArray(body.history)
      ? body.history
      : [];
    const visitorId: string =
      body.visitor_id ||
      `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const captureState: string = body.capture_state ?? "idle";

    if (!userMessage) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    if (userMessage.length > 2000) {
      return NextResponse.json(
        { error: "message too long (max 2000 chars)" },
        { status: 400 }
      );
    }

    // Step 1: Haiku guard — fast validation, blocks prompt injection / pure abuse only
    try {
      const guardRaw = await callHaikuGuard(userMessage);
      const guard = safeParseJson<{ valid: boolean }>(guardRaw);
      if (guard?.valid === false) {
        console.log(`[advisor/chat] guard blocked: ${guardRaw}`);
        return NextResponse.json({
          conversation_id:
            incomingConversationId ??
            `adv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          message:
            "I'm the Westside Realty advisor, here to help with property questions in Hyderabad and Goa. What would you like to know?",
          latency_ms: Date.now() - start,
        });
      }
    } catch (e) {
      // Guard failure must never break the chat — let it through
      console.warn("[advisor/chat] guard error (allowing through):", e);
    }

    // Step 2: Upsert conversation session early (log_contact tool needs the ID)
    const supabase = createServiceClient();
    const conversationUuid = await upsertConversationSession(incomingConversationId, {
      visitorId,
      sourcePage,
      projectSlug,
      marketSlug,
    });

    // Step 3: Build full conversation as proper multi-turn messages
    const messages = buildMessages(history, userMessage);
    const systemPrompt = buildSystemPrompt();

    // Step 4: First Sonnet call with tools
    const firstResponse = await callSonnetWithTools(messages, systemPrompt);

    let responseText: string;
    let toolsUsed: string[] = [];
    let contactLogged = false;
    let webSearchFired = false;

    if (firstResponse.stop_reason === "tool_use") {
      // Sonnet decided to call tools
      const toolUseBlocks = firstResponse.content.filter(
        (b): b is ToolUseBlock => b.type === "tool_use"
      );
      toolsUsed = toolUseBlocks.map((b) => b.name);

      // Execute all tool calls in parallel
      const { results, contactLogged: cl, webSearchFired: wsf } =
        await executeAdvisorTools(toolUseBlocks, {
          supabase,
          conversationId: conversationUuid,
          sourcePage,
        });
      contactLogged = cl;
      webSearchFired = wsf;

      // Second Sonnet call with tool results appended
      const messagesWithResults: Array<{ role: string; content: unknown }> = [
        ...messages,
        { role: "assistant", content: firstResponse.content },
        { role: "user", content: results },
      ];

      const secondResponse = await callSonnetWithTools(messagesWithResults, systemPrompt);
      responseText = extractText(secondResponse.content);
    } else {
      // end_turn: direct answer or clarification question — use as-is
      responseText = extractText(firstResponse.content);
    }

    if (!responseText) {
      responseText =
        "I didn't quite catch that — could you rephrase what you're looking for?";
    }

    const latencyMs = Date.now() - start;

    // Lead capture trigger: show form after 2+ turns or contact intent — not if already logged
    const userTurns = history.filter((m) => m.role === "user").length + 1;
    const isContactIntent =
      /broker|agent|advisor|call me|contact|visit|site.?visit/i.test(userMessage);
    const suggestLeadCapture =
      !contactLogged &&
      captureState !== "done" &&
      (userTurns >= 2 || isContactIntent);

    // Step 5: Log conversation (fire-and-forget)
    if (conversationUuid) {
      logMessageTurn(conversationUuid, userMessage, responseText, {
        toolsUsed,
        latencyMs,
        suggestLeadCapture,
      }).catch(() => {});

      // Step 6: Proactive signal scoring (only if contact wasn't already captured)
      if (!contactLogged) {
        runProactiveIntelligence(
          supabase,
          conversationUuid,
          userMessage,
          history,
          { intent: toolsUsed[0] ?? "general" },
          sourcePage
        ).catch((e) => console.error("[advisor/chat] proactive error:", e));
      }
    }

    console.log(
      `[advisor/chat] ${latencyMs}ms | tools=[${toolsUsed.join(",")}] | contact=${contactLogged} | web=${webSearchFired}`
    );

    return NextResponse.json({
      conversation_id:
        conversationUuid ??
        `adv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message: responseText,
      intent: toolsUsed[0] ?? "general",
      tools_used: toolsUsed,
      data_stats: {
        tools_called: toolsUsed.length,
        web_search_fired: webSearchFired,
        contact_logged: contactLogged,
      },
      show_lead_capture: suggestLeadCapture,
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
