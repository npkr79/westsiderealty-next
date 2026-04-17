/**
 * Google Search Console API Client — westsiderealty.in
 *
 * Uses JWT service-account auth (no external dependencies — only Node.js built-in crypto).
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  — e.g. seo-agent@your-project.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY            — RSA private key from service account JSON
 *                                    (paste the full -----BEGIN PRIVATE KEY----- block;
 *                                     GitHub Actions: store with literal \n, they auto-expand)
 *   GOOGLE_SITE_URL               — e.g. https://www.westsiderealty.in
 *
 * NOTE: A plain Google API key does NOT work for Search Analytics or Sitemaps API.
 * You need a service account. Steps:
 *   1. GCP Console → IAM → Service Accounts → Create
 *   2. Download JSON key, copy `client_email` and `private_key`
 *   3. Search Console → Settings → Users & Permissions → Add the service account email as Owner
 *   4. GCP Console → APIs → Enable "Google Search Console API" and "Web Search Indexing API"
 */

import { createSign } from "crypto";

const SITE_URL = process.env.GOOGLE_SITE_URL || "https://www.westsiderealty.in";
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
const RAW_KEY = process.env.GOOGLE_PRIVATE_KEY || "";

// Normalize escaped newlines from CI secrets
const PRIVATE_KEY = RAW_KEY.replace(/\\n/g, "\n");

// Token cache — valid for 55 min (Google tokens last 60 min)
const tokenCache = { accessToken: null, expiresAt: 0 };

// ─── JWT / Token ──────────────────────────────────────────────────────────────

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(scopes) {
  const now = Math.floor(Date.now() / 1000);

  if (tokenCache.accessToken && tokenCache.expiresAt > now + 60) {
    return tokenCache.accessToken;
  }

  if (!SA_EMAIL || !PRIVATE_KEY) {
    throw new Error(
      "[gsc-client] Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY. " +
      "See setup instructions at the top of gsc-client.mjs"
    );
  }

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: SA_EMAIL,
      scope: scopes.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${claims}`);
  const signature = base64url(sign.sign(PRIVATE_KEY));
  const jwt = `${header}.${claims}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `[gsc-client] Token exchange failed (${res.status}): ${JSON.stringify(data)}`
    );
  }

  tokenCache.accessToken = data.access_token;
  tokenCache.expiresAt = now + 3600;
  return data.access_token;
}

// ─── Search Analytics ─────────────────────────────────────────────────────────

const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
];

const SEARCH_ANALYTICS_BASE =
  "https://searchconsole.googleapis.com/webmasters/v3/sites";

/**
 * Query Search Analytics API.
 *
 * @param {Object} body - Request body per GSC API spec
 *   https://developers.google.com/webmaster-tools/v1/api_reference_index#Search_Analytics
 * @returns {Promise<{ rows: Array, responseAggregationType: string }>}
 */
export async function querySearchAnalytics(body) {
  const token = await getAccessToken(GSC_SCOPES);
  const encodedSite = encodeURIComponent(SITE_URL);
  const url = `${SEARCH_ANALYTICS_BASE}/${encodedSite}/searchAnalytics/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[gsc-client] Search Analytics query failed (${res.status}): ${err}`);
  }

  return res.json();
}

/**
 * Fetch page-level performance (impressions, clicks, CTR, position) for a date range.
 * Default rowLimit raised to 5000 to cover all meaningful pages on the site.
 *
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 * @param {number} rowLimit  - max rows (default 5000)
 */
export async function getPagePerformance(startDate, endDate, rowLimit = 5000) {
  return querySearchAnalytics({
    startDate,
    endDate,
    dimensions: ["page"],
    rowLimit,
    dataState: "final",
  });
}

/**
 * Fetch query+page combined performance — for keyword gap and position tracking.
 * Returns one row per (query, page) pair.
 *
 * @param {string} startDate
 * @param {string} endDate
 * @param {number} rowLimit  - max rows (default 5000)
 */
export async function getQueryPagePerformance(startDate, endDate, rowLimit = 5000) {
  return querySearchAnalytics({
    startDate,
    endDate,
    dimensions: ["query", "page"],
    rowLimit,
    dataState: "final",
  });
}

/**
 * Fetch query performance for a specific page URL (to find which queries drive traffic).
 *
 * @param {string} pageUrl   - Full URL e.g. https://www.westsiderealty.in/hyderabad/kokapet
 * @param {string} startDate
 * @param {string} endDate
 * @param {number} rowLimit
 */
export async function getQueriesForPage(pageUrl, startDate, endDate, rowLimit = 20) {
  return querySearchAnalytics({
    startDate,
    endDate,
    dimensions: ["query"],
    dimensionFilterGroups: [
      {
        filters: [
          {
            dimension: "page",
            operator: "equals",
            expression: pageUrl,
          },
        ],
      },
    ],
    rowLimit,
    dataState: "final",
  });
}

/**
 * Fetch overall site-level query summary (top queries by impression).
 */
export async function getTopQueries(startDate, endDate, rowLimit = 100) {
  return querySearchAnalytics({
    startDate,
    endDate,
    dimensions: ["query"],
    rowLimit,
    dataState: "final",
  });
}

// ─── Sitemaps ──────────────────────────────────────────────────────────────────

const SITEMAPS_BASE =
  "https://searchconsole.googleapis.com/webmasters/v3/sites";

/**
 * List sitemaps submitted to GSC for this property.
 */
export async function listSitemaps() {
  const token = await getAccessToken(GSC_SCOPES);
  const encodedSite = encodeURIComponent(SITE_URL);
  const res = await fetch(`${SITEMAPS_BASE}/${encodedSite}/sitemaps`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[gsc-client] listSitemaps failed (${res.status}): ${err}`);
  }
  return res.json(); // { sitemap: [...] }
}

/**
 * Submit (or re-submit) a sitemap to GSC.
 *
 * @param {string} sitemapUrl - e.g. https://www.westsiderealty.in/sitemap.xml
 */
export async function submitSitemap(sitemapUrl) {
  const token = await getAccessToken(GSC_SCOPES);
  const encodedSite = encodeURIComponent(SITE_URL);
  const encodedSitemap = encodeURIComponent(sitemapUrl);
  const url = `${SITEMAPS_BASE}/${encodedSite}/sitemaps/${encodedSitemap}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204 || res.ok) {
    return { success: true, message: `Sitemap submitted: ${sitemapUrl}` };
  }

  const err = await res.text();
  throw new Error(`[gsc-client] submitSitemap failed (${res.status}): ${err}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a YYYY-MM-DD date string N days ago.
 */
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
