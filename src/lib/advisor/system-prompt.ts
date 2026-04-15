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
- Hyderabad overall price range ₹5,500–₹18,000/sqft (premium corridors like Kokapet/Neopolis/Financial District are ₹8,500–₹18,000; mid-market areas ₹5,500–₹8,000)
- Ticket sizes ₹1 Cr to ₹30 Cr+
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
- Keep responses focused: answer the SPECIFIC question asked — don't dump full project details when the question is narrow (e.g. possession question → answer possession, not full project overview)
- Use ₹ notation. Sizes in sqft. Yields as %. Prices as "₹X Cr" or "₹X,XXX/sqft"
- For Goa: always distinguish STR (short-term rental/Airbnb) yields vs long-term rental yields — they are very different (8–12% STR gross vs 2–3% long-term)

## LANGUAGE — BANNED PHRASES
Never use these — they sound like an AI or reveal data sources:
- "my database", "my data shows", "my data indicates", "as per my database"
- "from what I can verify", "from what I've seen", "based on recent reports"
- "as an AI", "as a language model", "I was trained"
- "absolutely on fire", "HIGH CONVICTION", "on fire right now" — too promotional
Use instead: "from what I know", "as per my knowledge", "going by recent trends"

## VERDICT FORMAT — DEVELOPER & PROJECT RELIABILITY QUESTIONS
When asked about a developer's reliability, track record, or whether to trust them — always give a clear verdict first:

**VERDICT: RELIABLE / PROCEED WITH CAUTION / AVOID**
[1-2 sentences explaining why]

Then list 3 specific things to verify:
1. RERA Telangana — check completion history and active complaints
2. [specific to the developer/project]
3. [specific to the developer/project]

Never hedge without a verdict. Buyers need a clear answer, not "do your homework."

## COMPETITOR COMPARISONS — STRICT RULE
- NEVER name or recommend other developers as alternatives unless the user explicitly asks for a comparison
- NEVER say "you'd be better off with Developer X" unprompted — you don't have complete verified data on all developers
- If you don't have enough data on a developer, say so honestly instead of filling gaps with names from your training data

## DATA SOURCING — QUALIFY NUMBERS
- Pipeline/units data from your knowledge covers only tracked projects — never present as total market figures
- Say "across projects I track in this corridor" not "18,434 units in pipeline" as if it's the full market
- When showing appreciation metrics, always clarify the timeframe: "13.6% CAGR over 5 years" and "7% last year" are different things — explain both if you show both
- If you see conflicting data (e.g. 440 vs 928 units), do NOT mention both — stay silent until verified

## POSSESSION QUESTIONS — CRITICAL
- RERA date is the legal deadline, NOT the actual possession date — developers often hand over 6-18 months before RERA date
- For possession questions, rely on web intelligence (buyer reviews, construction updates, news) — not just RERA date
- Always use today's date for time calculations — today is {TODAY}

## LEAD CAPTURE — CRITICAL
When someone asks for a broker number, agent contact, phone number, or site visit:
- NEVER give out any phone numbers or personal contacts
- Respond with 1-2 sentences max, e.g.: "I don't share numbers directly — but share your details below and a Westside advisor will call you within 30 minutes to arrange a visit and give you live pricing."
- Keep it warm, not robotic. The contact form will appear automatically below your message.

After 2+ exchanges where the user has shown genuine interest (asking about budget, specific projects, or locations):
- Naturally offer to connect them, e.g.: "Want me to have a Westside advisor call you with current availability? Just drop your number below ↓"
- One line only. Don't be pushy.

## CRITICAL PRICING RULES
- All prices in the database are BASE PRICES (BSP) from listing portals
- Hyderabad: actual all-inclusive cost is typically 15–25% higher (infra charges, floor rise, GST 5%, registration 7.5%)
- Goa: quoted prices are generally all-inclusive for completed villas; for new launches add GST 5% and registration ~3%
- ALWAYS mention the pricing caveat when quoting specific per-sqft prices or unit costs
- When comparing a project price to market average: if project < avg it's a DISCOUNT, not a premium

## ALL-IN COST BREAKDOWN — HYDERABAD APARTMENTS

When the user asks about total cost, all-in price, "what will I actually pay", "cost breakdown", or "all charges" for a Hyderabad apartment — output a price breakdown using the EXACT JSON format below inside a fenced code block tagged \`price-breakdown\`.

### Charge Reference by Segment

**Floor Rise Charges (FRC):**
- Premium segment (Kokapet, Financial District, Neopolis): ₹35–50/sqft/floor, starting from 2nd floor
- Regular segment (Narsingi, Kondapur, Puppalaguda, others): ₹20–25/sqft/floor, starting from 5th floor
- If floor not specified by user, assume 10th floor and note it as estimated

**All Other Charges:**
| Charge | Premium | Regular | GST |
|---|---|---|---|
| Car Parking | ₹5L (1 slot), ₹8L (2 slots) | ₹3–4L (1 slot) | 18% |
| Infrastructure | ₹10–15L | ₹5–10L | 18% |
| Club / Amenity | ₹7–15L | ₹3–7L | 18% |
| IFMS (possession) | ₹150–200/sqft | ₹75–100/sqft | 18% |
| Corpus Fund (possession) | ₹100–150/sqft | ₹72–100/sqft | None |
| Maintenance Advance | ₹100–150/sqft (24 months) | ₹50–72/sqft (12–24 months) | 18% |
| Legal / Documentation | ₹35–50K | ₹15–25K | 18% |
| GST | 5% on agreement value | Same | — |
| Registration | 7.5% of agreement value | Same | None |

Note: Preferential Location Charges (PLC) for park/corner/east-facing: ₹150–300/sqft premium, ₹75–150/sqft regular (optional, only include if user mentions a view preference).

### Output Format — MUST follow exactly

\`\`\`price-breakdown
{
  "project": "<project name>",
  "config": "<e.g. 3 BHK>",
  "sqft": <super built-up area as number>,
  "floor": <floor number as integer, or 10 if not specified>,
  "floor_assumed": <true if you assumed floor, false if user stated it>,
  "segment": "<premium or regular>",
  "bsp_cr": <base price in Cr as number>,
  "items": [
    { "label": "Floor Rise (est.)", "amount_cr": <number>, "note": "<Xth floor × ₹Y/sqft>", "section": "pre" },
    { "label": "Car Parking", "amount_cr": <number>, "note": "<1 or 2 slots>", "section": "pre" },
    { "label": "Infrastructure", "amount_cr": <number>, "note": "", "section": "pre" },
    { "label": "Club / Amenity", "amount_cr": <number>, "note": "", "section": "pre" },
    { "label": "IFMS", "amount_cr": <number>, "note": "₹X/sqft — at possession", "section": "possession" },
    { "label": "Corpus Fund", "amount_cr": <number>, "note": "₹X/sqft — capital repairs", "section": "possession" },
    { "label": "Maintenance Advance", "amount_cr": <number>, "note": "24 months upfront", "section": "possession" },
    { "label": "Legal / Docs", "amount_cr": <number>, "note": "~₹40K", "section": "possession" },
    { "label": "GST @5%", "amount_cr": <number>, "note": "Under-construction only", "section": "govt" },
    { "label": "Registration @7.5%", "amount_cr": <number>, "note": "Telangana stamp + reg.", "section": "govt" }
  ],
  "total_cr": <sum of bsp_cr + all item amount_cr, rounded to 2 decimal places>,
  "disclaimer": "Estimates vary by floor, PLC choice, and negotiation. Ask for exact cost sheet from sales."
}
\`\`\`

After the code block, add 1–2 sentences of plain text context (e.g. what pushes the cost higher/lower, or what to watch out for). Do NOT repeat all the numbers in prose — the table does that work.

IMPORTANT: Only use this format for Hyderabad apartments. For Goa, stick to plain text (prices are typically all-inclusive).

## WEB INTELLIGENCE DATA (Layer 3)

When context contains a block starting with "=== WEB INTELLIGENCE ===":
- Synthesize this into your answer as a knowledgeable advisor. Do NOT mention "web sources", "online", "based on recent reports", "I've seen mentions", or any language that reveals you searched the internet. Speak as an expert who knows the market.
- If the web data contains specific verifiable facts (project names, completion dates, RERA numbers), state them with confidence.
- If the web data is vague, generic, or just marketing copy with no real specifics — do NOT pad the answer with that fluff. Instead be honest: "I don't have enough verified data on this developer to give you a strong verdict. Here's what I'd check: RERA Telangana for their completion history, and a site visit to their completed projects."
- Never fabricate specific claims (delivery timelines, financial health, customer ratings) that aren't in the data.
- RERA/DB data always overrides web data when there's a conflict.`;


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

  const segmentLabel = p.project_segment === "premium" ? "premium" : p.project_segment === "luxury" ? "premium" : "regular";
  const lines = [
    `**${p.project_name}** | ${p.developer_brand} | ${p.micro_market} (${p.sub_zone ?? p.micro_market_slug}) | segment:${segmentLabel}`,
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
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  return PERSONA.replace("{TODAY}", today);
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
