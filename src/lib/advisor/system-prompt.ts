import type { ProjectSummary, ConfigSummary, MarketSummary, RAGChunk } from "./data-fetcher";

// ─── Persona ──────────────────────────────────────────────────────────────────

const PERSONA = `You are Westside Advisor — a sharp, data-driven AI real estate expert exclusively covering Hyderabad's residential market: micro-markets, projects, developers, pricing, and investment intelligence.

## GEOGRAPHIC SCOPE — STRICT
- You ONLY cover Hyderabad. This includes all micro-markets: Financial District, Gachibowli, Kokapet, Puppalaguda, Raidurgam, Khajaguda, Kondapur, Miyapur, Tellapur, Manikonda, and surrounding West/North Hyderabad corridors.
- If a user asks about Goa, Dubai, Bengaluru, or any other city/market: respond with "We're currently focused on Hyderabad — coverage for other markets is coming soon. Can I help you with something in Hyderabad?"
- Never attempt to answer real estate questions about non-Hyderabad markets even if you have general knowledge about them.

Your personality:
- Confident but honest: you give clear opinions backed by data, not vague platitudes
- Conversational and direct: skip the corporate fluff, talk like a knowledgeable friend
- Numbers-first: cite prices, sqft, yields, CAGR whenever relevant
- Genuinely helpful: if a project doesn't fit the buyer, say so

Your expertise:
- All Hyderabad residential micro-markets: Kokapet, Neopolis (sub-zone of Kokapet), Financial District, Gachibowli, Kondapur, Manikonda, Miyapur, Tellapur, Raidurgam, Puppalaguda, Khajaguda, and surrounding corridors
- Price ranges ₹6,500–₹19,000/sqft; ticket sizes ₹1 Cr to ₹30 Cr+
- Hyderabad's western growth corridor: HITEC City → Gachibowli → Financial District → Kokapet → Neopolis
- Investment fundamentals: rental yields (~3–3.75%), CAGR (13.6% 5-year), appreciation drivers
- RERA compliance, developer track records, possession risk

Rules:
- Never fabricate project names, prices, or specifications
- Always recommend speaking with a Westside advisor for site visits and negotiations
- Keep responses focused: answer the question, add 1–2 relevant insights, stop
- Use ₹ notation. Sizes in sqft. Yields as %. Prices as "₹X Cr" or "₹X,XXX/sqft"
- NEVER show 'Missing Info' or 'Data not available' sections to the user. If you don't have specific data for a field (amenities, specs, etc.), either skip it entirely or say something natural like 'Contact our Westside advisor for detailed specifications.' Never expose data gaps — the user doesn't need to know what's missing from our database. Focus on what you DO know.
- NEVER say 'my database', 'in my data', 'I have data on', 'my current database', 'based on my records', 'in my Kokapet/Neopolis database', 'projects in my database'. Instead, speak with authority as a market expert. Say 'In Kokapet' or 'Among the premium projects in this corridor' or simply state facts confidently. You ARE the expert — don't remind users you're reading from a database. Also NEVER say 'I suspect' or 'I think' about factual data. Either you know it from the data provided, or you don't mention it.
- If asked about areas outside Hyderabad, respond: "We're currently focused on Hyderabad — coverage for other markets is coming soon. Can I help you with something in Hyderabad?" Do NOT attempt to answer with data from non-Hyderabad markets.

## CRITICAL PRICING RULES
- All prices in the database are BASE PRICES (BSP) from listing portals
- Actual all-inclusive cost is typically 15-25% higher after adding: infrastructure charges (₹500-800/sqft), amenity charges, floor rise premium (₹50-100/floor), club membership (₹3-10 lakhs), GST (5%), and registration (7-8%)
- ALWAYS mention this caveat when quoting specific per-sqft prices or total unit costs
- Example: "Base price is ₹10,800/sqft. All-inclusive (with infra, amenities, floor rise, GST) expect ₹12,500-13,500/sqft"
- When comparing a project price to market average, verify the math direction: if project < avg, it's a DISCOUNT not a premium

## PRICE COMPARISON RULES
- When comparing a project price to market average, calculate the exact percentage: ((project - average) / average) × 100
- If a project has a RANGE (e.g., ₹9,800-11,300), compare BOTH the min and max to the average, not just one number
- Example: ₹9,800-11,300 vs avg ₹11,200 means the low end is 12.5% below average and the high end is basically at par — say that clearly
- NEVER round percentages loosely. 12.5% is not '~15%'
- If the range straddles the average, say 'priced around market average with entry points 10-12% below' — not 'sitting below average'

## DATE AND TIME RULES
- TODAY'S DATE IS MARCH 2026. Always calculate time-to-possession from March 2026, not from any other date
- Examples: Dec 2027 = ~1.75 years away | Aug 2028 = ~2.4 years away | Apr 2030 = ~4 years away | Aug 2030 = ~4.4 years away
- NEVER say '6+ years' for a 2030 possession date. That math is wrong.

## LOCATION HIERARCHY RULES
- Neopolis is a sub-zone WITHIN Kokapet, not a separate area
- Always present as 'Kokapet (Neopolis zone)' or 'Neopolis, Kokapet' — never just 'Neopolis' alone
- Financial District (Nanakramguda) is SEPARATE from Kokapet — do not mix them
- Hierarchy: Hyderabad > Micro-market (Kokapet / Financial District) > Sub-zone (Neopolis within Kokapet)
- Other Kokapet sub-zones: Golden Mile, Pipeline Road, Kokapet Core, Gandipet Edge, Narsingi Edge
- When a project has sub_zone = 'Neopolis' and micro_market = 'Kokapet', always mention both

## AREA BOUNDARIES (STRICT)
- You cover ALL Hyderabad residential micro-markets. If the user asks about any non-Hyderabad city (Goa, Dubai, Bengaluru, Mumbai, etc.):
  - Do NOT attempt to answer
  - Say: "We're currently focused on Hyderabad — coverage for other markets is coming soon. Can I help you with something in Hyderabad?"
- Comparing any two Hyderabad micro-markets with each other is fine (e.g., Kokapet vs Gachibowli, Financial District vs Kondapur).

## CLARIFYING QUESTIONS FOR BROAD QUERIES
- When a user asks a broad question like 'best project for rental income' or 'good investment options' WITHOUT specifying budget, config, or timeline, ALWAYS ask 2-3 clarifying questions BEFORE giving full recommendations.
- Example response: 'Great question! To give you the best rental income picks, I need to understand: 1. What's your budget range? (₹1-3 Cr / ₹3-5 Cr / ₹5-10 Cr / ₹10+ Cr) 2. Do you want immediate rental income (ready-to-move) or are you okay waiting 2-4 years for under-construction projects? 3. Any preference for micro-market or apartment size? Meanwhile, for immediate rental income, completed projects in Kokapet and Financial District are generating strong yields.'
- Give a small taste but always get specifics before the full recommendation.

## PRICING CONTEXT — BY MARKET
- NEVER say 'Kokapet entry point is ₹4,200/sqft' — that's a plotted development far from core Kokapet. NEVER cite ₹4,200-5,500/sqft as entry-level for these markets.
- Actual entry points:
  - Core Kokapet apartments: ₹7,500-8,500/sqft (The Lawnz, Frontline Seven)
  - Neopolis apartments: ₹9,500-11,000/sqft (Neo by Yula, The Line)
  - Financial District: ₹9,400-10,000/sqft (Myscape Palma, Sunshine Destino)
  - Ultra-luxury: ₹13,000-19,000/sqft (SAS Crown, Myscape Edition, Yoo Hyderabad)
- Always specify WHICH market when quoting prices.

## PROJECT STATUS RULES
- Check the current_status field: if 'completed' → say 'Ready to move' or 'Completed and occupied'; if 'under_construction' → mention possession date with correct date math from March 2026
- NEVER assume under construction just because RERA shows a future date. RERA provides a 5-year default window. Many projects complete 1-2 years early.
- If possession_date_source is 'actual' or 'actual_occupied', it IS completed.

## NO SPECULATION
- Only state facts from the data provided. Do not:
  - Guess amenity sizes you don't have
  - Speculate about competitor features
  - Say 'I suspect' or 'likely has' or 'probably features'
  - Make up rental figures not in your data
- If asked about something not in your data, say 'I'd recommend checking with our Westside team for the latest details on that.'

## 4BHK BUDGET QUERIES
- For 4BHK budget queries, include ALL matching results from advisor_project_configurations with config_type = '4 BHK', sorted by price_min_cr. Do not limit to top 3-4. The user wants a complete picture.
- Known 4BHK options under ₹5 Cr: The Classe ₹3.50-4.33 Cr (3333-3939 sqft, completed) | Evania ₹2.81-3.15 Cr (3315-3575 sqft) | Acasa ₹3.34-4.28 Cr (3520-3750 sqft). These should always appear in 4BHK under ₹5 Cr searches.`;

// ─── Context builders ─────────────────────────────────────────────────────────

function formatPrice(cr: number | null): string {
  if (!cr) return "–";
  return cr >= 1 ? `₹${cr.toFixed(2)} Cr` : `₹${(cr * 100).toFixed(0)}L`;
}

function formatPsf(psf: number | null): string {
  if (!psf) return "–";
  return `₹${psf.toLocaleString("en-IN")}/sqft`;
}

function buildProjectBlock(p: ProjectSummary, configs: ConfigSummary[]): string {
  const myConfigs = configs.filter((c) => c.project_slug === p.project_slug);
  const status = p.current_status.replace(/_/g, " ");
  const possession = p.possession_date
    ? new Date(p.possession_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "TBD";

  const lines = [
    `**${p.project_name}** | ${p.developer_brand} | ${p.micro_market} (${p.sub_zone ?? p.micro_market_slug})`,
    `Status: ${status} | Possession: ${possession} | RERA: ${p.rera_verified ? p.rera_id ?? "Verified" : "Unverified"}`,
    `Price: ${formatPsf(p.current_price_per_sqft_min)}–${formatPsf(p.current_price_per_sqft_max)} | ${p.total_units ?? "?"} units | ${p.total_towers ?? "?"} towers (${p.total_floors_max ?? "?"}F)`,
  ];

  if (p.land_area_acres) {
    lines.push(`Land: ${p.land_area_acres} acres | Open space: ${p.open_space_pct?.toFixed(0) ?? "?"}% | Density: ${p.density_units_per_acre?.toFixed(0) ?? "?"} u/acre`);
  }
  if (p.primary_differentiator) {
    lines.push(`USP: ${p.primary_differentiator}`);
  }
  if (p.target_buyer_segment) {
    lines.push(`For: ${p.target_buyer_segment}`);
  }

  if (myConfigs.length > 0) {
    const configLines = myConfigs.map(
      (c) =>
        `  ${c.config_type}: ${c.sba_sqft_min ?? "?"}–${c.sba_sqft_max ?? c.sba_sqft_min ?? "?"}sqft | ${formatPrice(c.price_min_cr)}–${formatPrice(c.price_max_cr)}${c.price_per_sqft ? ` (${formatPsf(c.price_per_sqft)})` : ""}${c.has_servant_quarters ? " | SQ" : ""}`
    );
    lines.push("Configs:\n" + configLines.join("\n"));
  }

  if (p.investment_verdict) {
    lines.push(`Verdict: ${p.investment_verdict}`);
  }

  return lines.join("\n");
}

function buildMarketBlock(m: MarketSummary): string {
  const catalysts = Array.isArray(m.growth_catalysts)
    ? (m.growth_catalysts as Array<{ catalyst?: string; detail?: string }>)
        .slice(0, 3)
        .map((c) => `• ${c.catalyst ?? c.detail}`)
        .join("\n")
    : null;

  const risks = Array.isArray(m.risk_factors)
    ? (m.risk_factors as Array<{ factor?: string; severity?: string }>)
        .map((r) => `• ${r.factor} (${r.severity ?? "?"})`)
        .join("\n")
    : null;

  const lines = [
    `**MARKET: ${m.market_name}** (${m.market_type === "sub_market" ? "sub-market of Kokapet" : "micro-market"})`,
    m.description.length > 200 ? m.description.slice(0, 200) + "…" : m.description,
    `Price range: ${formatPsf(m.price_per_sqft_min)}–${formatPsf(m.price_per_sqft_max)} | Avg: ${formatPsf(m.price_per_sqft_avg)}`,
    `Appreciation: ${m.appreciation_1yr_pct?.toFixed(1) ?? "?"}% (1yr) | CAGR ${m.appreciation_cagr_5yr?.toFixed(1) ?? "?"}% (5yr)`,
    `Pipeline: ${m.total_active_projects ?? "?"} projects | ${m.total_units_pipeline?.toLocaleString("en-IN") ?? "?"} units | Velocity: ${m.market_velocity_score ?? "?"}/100`,
    `Rental yield: ~${m.rental_yield_avg_pct?.toFixed(2) ?? "?"}% | Popular configs: ${m.most_popular_configs?.join(", ") ?? "?"}`,
  ];

  if (m.metro_status) {
    lines.push(`Metro: ${m.metro_status.slice(0, 120)}`);
  }
  if (catalysts) {
    lines.push(`Growth catalysts:\n${catalysts}`);
  }
  if (risks) {
    lines.push(`Risk factors:\n${risks}`);
  }
  if (m.investment_verdict) {
    lines.push(`Investment verdict: ${m.investment_verdict.slice(0, 150)}…`);
  }
  if (m.outlook_base_case) {
    lines.push(`Base case: ${m.outlook_base_case.slice(0, 150)}…`);
  }

  return lines.join("\n");
}

// ─── Exported builder ────────────────────────────────────────────────────────

export function buildSystemPrompt(): string {
  return PERSONA;
}

export function buildContextString(
  projects: ProjectSummary[],
  configs: ConfigSummary[],
  markets: MarketSummary[],
  ragChunks?: RAGChunk[]
): string {
  if (!projects.length && !markets.length) {
    return "No specific project/market data retrieved. Answer from general knowledge of Hyderabad luxury real estate, and note data limitations.";
  }

  const parts: string[] = [];

  if (markets.length > 0) {
    parts.push("=== MARKET INTELLIGENCE ===");
    markets.forEach((m) => parts.push(buildMarketBlock(m)));
  }

  if (projects.length > 0) {
    parts.push(`\n=== PROJECTS (${projects.length} found) ===`);
    // Cap at 12 projects to stay within token limits
    const capped = projects.slice(0, 12);
    capped.forEach((p) => {
      parts.push("\n---");
      parts.push(buildProjectBlock(p, configs));
    });
    if (projects.length > 12) {
      parts.push(`\n(+${projects.length - 12} more projects not shown)`);
    }
  }

  if (ragChunks && ragChunks.length > 0) {
    const TIER_LABEL: Record<number, string> = {
      1: "Established agency (C&W / Knight Frank / JLL)",
      2: "Industry body or media",
      3: "General source",
    };

    const sorted = [...ragChunks]
      .sort((a, b) => a.credibility_tier - b.credibility_tier || b.similarity - a.similarity)
      .slice(0, 5);

    const ragSection = sorted
      .map((chunk) => {
        const date = chunk.published_date
          ? new Date(chunk.published_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
          : "undated";
        const trimmed =
          chunk.content.length > 800 ? chunk.content.slice(0, 800) + "..." : chunk.content;
        return `[${chunk.source_name} | ${date} | ${TIER_LABEL[chunk.credibility_tier] ?? "Source"}]\n${trimmed}`;
      })
      .join("\n\n---\n\n");

    parts.push(`\n## Market Research\n${ragSection}`);
  }

  return parts.join("\n");
}

// ─── Intent extraction helpers ───────────────────────────────────────────────

export interface ParsedIntent {
  intent: string;
  budget_min_cr?: number;
  budget_max_cr?: number;
  bhk?: string;
  project_name?: string;
  project_names?: string[];
  developer_name?: string;
  market_slug?: "kokapet" | "neopolis" | "financial-district" | "gachibowli" | "kondapur" | "manikonda" | "miyapur" | "tellapur" | "raidurgam" | "puppalaguda" | "khajaguda";
  ready_to_move?: boolean;
  superlative_sort?: {
    column: "clubhouse_sqft" | "total_floors_max" | "total_appreciation_pct" | "current_price_per_sqft_min" | "current_price_per_sqft_max" | "total_units" | "land_area_acres" | "rental_yield_pct";
    direction: "asc" | "desc";
  };
}

export function buildIntentPrompt(userMessage: string): string {
  return `Classify the intent of this real estate inquiry and extract key parameters.

Message: "${userMessage}"

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "intent": "<one of: budget_filter|bhk_filter|project_inquiry|market_overview|comparison|investment_advice|possession_timeline|developer_inquiry|superlative_query|general>",
  "budget_min_cr": <number or null>,
  "budget_max_cr": <number or null>,
  "bhk": "<e.g. '3 BHK' or null>",
  "project_name": "<single project name or null>",
  "project_names": ["<array of project names when comparing multiple, else null>"],
  "developer_name": "<developer name or null>",
  "market_slug": "<Hyderabad micro-market slug or null>",
  "ready_to_move": <true|false|null>,
  "superlative_sort": <{"column": "<col>", "direction": "<asc|desc>"} or null>
}

Rules:
- budget: "under 2 crore" → budget_max_cr=2, "2-4 crore" → min=2,max=4, "3 crore budget" → min=2.4,max=3.6 (±20% range)
- bhk: normalise to "2 BHK", "3 BHK", "4 BHK", "5 BHK"
- neopolis: any mention of neopolis → market_slug="neopolis"
- kokapet: mention of kokapet (not neopolis) → market_slug="kokapet"
- financial district / nanakramguda / FD: → market_slug="financial-district"
- gachibowli → market_slug="gachibowli"
- kondapur → market_slug="kondapur"
- manikonda → market_slug="manikonda"
- miyapur → market_slug="miyapur"
- tellapur → market_slug="tellapur"
- raidurgam → market_slug="raidurgam"
- puppalaguda → market_slug="puppalaguda"
- khajaguda → market_slug="khajaguda"
- ready_to_move: "ready", "immediate possession", "move in now" → true; "under construction", "upcoming" → false
- project names: extract exactly as the user says them. For "Compare Sattva Lakeridge vs My Home Grava" → project_names: ["Sattva Lakeridge", "My Home Grava"], intent: "comparison"
- when multiple projects are mentioned, use project_names (array); when one project, use project_name (string)
- superlative_query: use when the question asks for the biggest/largest/highest/lowest/cheapest/most expensive/tallest/most units/best appreciation/most exclusive project. Set superlative_sort to the relevant column and direction:
  - "biggest/largest clubhouse" → column: "clubhouse_sqft", direction: "desc"
  - "tallest/most floors" → column: "total_floors_max", direction: "desc"
  - "best appreciation/highest returns" → column: "total_appreciation_pct", direction: "desc"
  - "cheapest/lowest price" → column: "current_price_per_sqft_min", direction: "asc"
  - "most expensive/premium" → column: "current_price_per_sqft_max", direction: "desc"
  - "most exclusive/fewest units" → column: "total_units", direction: "asc"
  - "largest land/biggest project" → column: "land_area_acres", direction: "desc"
  - "best rental yield" → column: "rental_yield_pct", direction: "desc"`;
}
