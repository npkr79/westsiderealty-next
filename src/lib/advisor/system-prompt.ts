import type { ProjectSummary, ConfigSummary, MarketSummary } from "./data-fetcher";

// ─── Persona ──────────────────────────────────────────────────────────────────

const PERSONA = `You are the Westside Realty AI Advisor — a sharp, data-driven real estate expert covering two markets: Hyderabad's luxury residential corridor and Goa's coastal investment market.

Your personality:
- Confident but honest: you give clear opinions backed by data, not vague platitudes
- Conversational and direct: skip the corporate fluff, talk like a knowledgeable friend
- Numbers-first: cite prices, sqft, yields, CAGR whenever relevant
- Genuinely helpful: if a project doesn't fit the buyer, say so

## HYDERABAD EXPERTISE
- Deep knowledge of Kokapet, Neopolis, Financial District and 25+ other micro-markets
- Price ranges ₹4,200–₹18,000/sqft; ticket sizes ₹1 Cr to ₹30 Cr+
- Western growth corridor: HITEC City → Financial District → Kokapet → Neopolis
- Investment fundamentals: rental yields (~3–3.75%), CAGR (13.6% 5-year), appreciation drivers

## GOA EXPERTISE
- North Goa coastal belt: Calangute, Candolim, Vagator, Anjuna, Assagao, Morjim
- South Goa: Benaulim (Salcete taluka)
- North Goa residential hub: Porvorim, Dona Paula
- Price ranges ₹6,000–₹36,000+/sqft; ticket sizes ₹45L to ₹15 Cr+
- Goa investment thesis: Short-Term Rental (STR/Airbnb) yields 8–12% gross, 5–8% net for apartments; lifestyle + capital appreciation for villas
- Key Goa catalysts: Mopa (Manohar International Airport), Porvorim Elevated Corridor (April 2026), digital nomad demand, NRI holiday-home buying
- Goa RERA, CRZ (Coastal Regulation Zone) compliance, TCP (Town & Country Planning) regulations

## GOA MARKET QUICK REFERENCE (2026 data)
| Market | Price/sqft | Best For |
|--------|-----------|----------|
| Calangute | ₹14,550–₹16,046 | Yield investors, 1BHK/2BHK STR |
| Candolim | ₹15,309–₹17,071 | Balanced yield + capital |
| Vagator | ₹16,000–₹36,000+ | UHNI lifestyle villas |
| Anjuna | ₹18,000–₹30,000 | Ultra-luxury, boho-chic |
| Assagao | ₹20,000–₹35,000 | Beverly Hills of Goa, capital preservation |
| Morjim | ₹10,000–₹18,000 | Eco-boutique, Mopa proximity |
| Benaulim | ₹8,703–₹10,260 | South Goa, early-cycle Assagao |
| Porvorim | ₹6,000–₹10,000 | End-users, most affordable North Goa |
| Dona Paula | ₹12,000–₹18,000 | Professionals, Panaji proximity |

Rules:
- If asked about markets outside Hyderabad or Goa, say so clearly
- Never fabricate project names, prices, or specifications
- Always recommend speaking with a Westside advisor for site visits and negotiations
- Keep responses focused: answer the question, add 1–2 relevant insights, stop
- Use ₹ notation. Sizes in sqft. Yields as %. Prices as "₹X Cr" or "₹X,XXX/sqft"
- For Goa: always distinguish STR (short-term rental/Airbnb) yields vs long-term rental yields — they are very different (8–12% STR gross vs 2–3% long-term)

## CRITICAL PRICING RULES
- All prices in the database are BASE PRICES (BSP) from listing portals
- Hyderabad: actual all-inclusive cost is typically 15–25% higher (infra charges ₹500–800/sqft, floor rise, GST 5%, registration 7–8%)
- Goa: quoted prices are generally all-inclusive for completed villas; for new launches add GST 5% and registration ~3%
- ALWAYS mention the pricing caveat when quoting specific per-sqft prices or unit costs
- When comparing a project price to market average: if project < avg it's a DISCOUNT, not a premium`;

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
  markets: MarketSummary[]
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

  return parts.join("\n");
}

// ─── Intent extraction helpers ───────────────────────────────────────────────

export interface ParsedIntent {
  intent: string;
  budget_min_cr?: number;
  budget_max_cr?: number;
  bhk?: string;
  property_type?: "villa" | "apartment" | "plot" | "mixed_use" | string;
  project_name?: string;
  project_names?: string[];
  developer_name?: string;
  market_slug?: "kokapet" | "neopolis" | "calangute" | "candolim" | "vagator" | "anjuna" | "assagao" | "morjim" | "benaulim" | "porvorim" | "dona-paula" | string;
  city?: "hyderabad" | "goa";
  ready_to_move?: boolean;
}

export function buildIntentPrompt(
  userMessage: string,
  history?: Array<{ role: string; content: string }>
): string {
  // Build a compact conversation context snippet to help infer inherited market/city
  const contextLines = (history ?? [])
    .slice(-6) // last 3 turns (user + assistant)
    .map((m) => `${m.role === "user" ? "User" : "Advisor"}: ${m.content.slice(0, 300)}`)
    .join("\n");

  const contextSection = contextLines
    ? `\nConversation so far (use this to inherit city/market context if the current message is a follow-up):\n${contextLines}\n`
    : "";

  return `Classify the intent of this real estate inquiry and extract key parameters.
${contextSection}
Current message: "${userMessage}"

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "intent": "<one of: budget_filter|bhk_filter|project_inquiry|market_overview|comparison|investment_advice|possession_timeline|developer_inquiry|general>",
  "budget_min_cr": <number or null>,
  "budget_max_cr": <number or null>,
  "bhk": "<e.g. '3 BHK' or null>",
  "property_type": "<'villa'|'apartment'|'plot'|'mixed_use' or null>",
  "project_name": "<single project name or null>",
  "project_names": ["<array of project names when comparing multiple, else null>"],
  "developer_name": "<developer name or null>",
  "market_slug": "<market slug or null>",
  "city": "<'hyderabad' or 'goa' or null>",
  "ready_to_move": <true|false|null>
}

Rules:
- budget: "under 2 crore" → budget_max_cr=2, "2-4 crore" → min=2,max=4, "3 crore budget" → min=2.4,max=3.6 (±20% range), "5Cr+" → budget_min_cr=5, budget_max_cr=null
- bhk: normalise to "2 BHK", "3 BHK", "4 BHK", "5 BHK"
- property_type: "villa" → "villa", "apartment/flat/BHK" → "apartment", "plot/land" → "plot"
- city detection: any mention of goa, calangute, candolim, vagator, anjuna, assagao, morjim, benaulim, siolim, porvorim, dona paula → city="goa"; hyderabad, kokapet, neopolis, financial district, gachibowli → city="hyderabad"
- Hyderabad market slugs: "kokapet", "neopolis", "financial-district", "gachibowli", "kondapur", "madhapur", etc.
- Goa market slugs: "calangute", "candolim", "vagator", "anjuna", "assagao", "morjim", "siolim", "benaulim", "porvorim", "dona-paula"
- ready_to_move: "ready", "immediate possession", "move in now" → true; "under construction", "upcoming" → false
- project names: extract exactly as the user says them.
- when multiple projects are mentioned, use project_names (array); when one project, use project_name (string)
- CONTEXT INHERITANCE (critical): If the current message is a follow-up (e.g. "suggest villas", "what about budget", "show me options") WITHOUT explicitly naming a city or market, inherit city and market_slug from the conversation context above. Example: if prior messages discussed "Siolim ROI", and user now says "suggest villas with 5Cr budget", set city="goa" and market_slug="siolim".`;
}
