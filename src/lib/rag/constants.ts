/**
 * Controlled vocabulary for the RAG system that powers the AI property advisor.
 * All values here must stay in sync with the `rag_sources` and `rag_chunks`
 * Supabase tables and the `match_rag_chunks` RPC function.
 */

// ─── Source Types ─────────────────────────────────────────────────────────────

export const RAG_SOURCE_TYPES = [
  "agency_report",
  "news_article",
  "research_paper",
  "govt_data",
  "industry_body",
  "other",
] as const;

export type RagSourceType = (typeof RAG_SOURCE_TYPES)[number];

// ─── Asset Classes ────────────────────────────────────────────────────────────

/**
 * Asset class taxonomy for RAG chunk filtering.
 *
 * `'mixed'` — cross-asset chunks (general market commentary) surface for any
 * asset_class query. Use this when a report covers multiple property types
 * or makes broad market statements not tied to a single asset class.
 */
export const RAG_ASSET_CLASSES = [
  "residential",
  "office",
  "retail",
  "industrial",
  "capital_markets",
  "hospitality",
  "land",
  "mixed",
] as const;

export type RagAssetClass = (typeof RAG_ASSET_CLASSES)[number];

// ─── Content Types ────────────────────────────────────────────────────────────

export const RAG_CONTENT_TYPES = [
  "narrative",
  "price_data",
  "volume_data",
  "macro_data",
  "policy_data",
  "project_data",
  "transaction_data",
] as const;

export type RagContentType = (typeof RAG_CONTENT_TYPES)[number];

// ─── Cities ───────────────────────────────────────────────────────────────────

/**
 * City scope for RAG chunk filtering.
 *
 * `'india'` — national-context chunks always surface regardless of which city
 * is being filtered. Use this for macro data, India-wide trends, and RBI /
 * regulatory content that applies to all markets.
 */
export const RAG_CITIES = [
  "india",
  "hyderabad",
  "goa",
  "mumbai",
  "bengaluru",
  "pune",
  "chennai",
  "ncr",
  "kolkata",
  "ahmedabad",
  "delhi",
  "noida",
  "gurugram",
  "navi-mumbai",
] as const;

export type RagCity = (typeof RAG_CITIES)[number];

// ─── Credibility Tiers ────────────────────────────────────────────────────────

/**
 * Numeric credibility tier assigned to each RAG source.
 *
 * - `1` — Established research agencies with dedicated data teams and
 *   methodologically rigorous reports: Cushman & Wakefield, Knight Frank,
 *   JLL, ANAROCK, CBRE, Savills.
 *
 * - `2` — Media outlets with dedicated real estate desks and recognised
 *   industry bodies: ET Realty, Mint, CREDAI, NAREDCO, PropEquity,
 *   MagicBricks Research, Housing.com Research.
 *
 * - `3` — Blogs, general news articles, any uploaded PDF that does not meet
 *   the criteria for tiers 1 or 2. Use with caution; surface only when
 *   higher-tier chunks are unavailable.
 */
export const RAG_CREDIBILITY_TIERS = [1, 2, 3] as const;

export type RagCredibilityTier = (typeof RAG_CREDIBILITY_TIERS)[number];
