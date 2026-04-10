/**
 * Google Web Search Indexing API — westsiderealty.in
 *
 * Requests Google to crawl/index specific URLs immediately.
 * Best used after meta or content changes to get them picked up fast.
 *
 * Auth: same service account as gsc-client.mjs
 * Scope: https://www.googleapis.com/auth/indexing
 *
 * Quota: 200 URL notifications per day (free tier).
 * Priority: use for pages that were actually changed this run, not all pages.
 *
 * IMPORTANT: The service account must be added as a Delegated Owner in GSC.
 * Without owner-level access, indexing requests are silently ignored by Google.
 * To add: GSC → Settings → Users & permissions → Add user → paste service account email → Owner role.
 */

import { createSign } from "crypto";

const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
const RAW_KEY = process.env.GOOGLE_PRIVATE_KEY || "";
const PRIVATE_KEY = RAW_KEY.replace(/\\n/g, "\n");

const INDEXING_SCOPES = ["https://www.googleapis.com/auth/indexing"];
const INDEXING_BASE = "https://indexing.googleapis.com/v3/urlNotifications";

// Separate token cache for indexing scope
const indexTokenCache = { accessToken: null, expiresAt: 0 };

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getIndexingToken() {
  const now = Math.floor(Date.now() / 1000);

  if (indexTokenCache.accessToken && indexTokenCache.expiresAt > now + 60) {
    return indexTokenCache.accessToken;
  }

  if (!SA_EMAIL || !PRIVATE_KEY) {
    throw new Error(
      "[indexing-api] Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY"
    );
  }

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: SA_EMAIL,
      scope: INDEXING_SCOPES.join(" "),
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
      `[indexing-api] Token exchange failed (${res.status}): ${JSON.stringify(data)}`
    );
  }

  indexTokenCache.accessToken = data.access_token;
  indexTokenCache.expiresAt = now + 3600;
  return data.access_token;
}

/**
 * Notify Google to crawl/index a single URL.
 *
 * @param {string} url  - Full absolute URL
 * @param {"URL_UPDATED"|"URL_DELETED"} type
 */
async function notifyUrl(url, type = "URL_UPDATED") {
  const token = await getIndexingToken();

  const res = await fetch(`${INDEXING_BASE}:publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, type }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { url, success: false, error: `HTTP ${res.status}: ${err}` };
  }

  const data = await res.json();
  return { url, success: true, notifyTime: data.urlNotificationMetadata?.latestUpdate?.notifyTime };
}

/**
 * Request indexing for a batch of URLs.
 * Rate-limited to 200/day — only submit URLs actually changed this run.
 *
 * @param {string[]} urls - Array of absolute URLs
 * @param {number}   maxPerRun - Safety cap (default 100)
 * @returns {Promise<Array<{url, success, error?}>>}
 */
export async function requestIndexing(urls, maxPerRun = 100) {
  if (!urls || urls.length === 0) return [];

  const batch = urls.slice(0, maxPerRun);
  console.error(`[indexing-api] Submitting ${batch.length} URL(s) for indexing...`);

  const results = [];
  for (const url of batch) {
    const result = await notifyUrl(url);
    results.push(result);

    if (!result.success) {
      console.error(`[indexing-api] Failed: ${url} — ${result.error}`);
    } else {
      console.error(`[indexing-api] Queued: ${url}`);
    }

    // Respect rate limits: ~1 req/second is safe
    await new Promise((r) => setTimeout(r, 1000));
  }

  const succeeded = results.filter((r) => r.success).length;
  console.error(`[indexing-api] Done. ${succeeded}/${batch.length} submitted successfully.`);

  return results;
}

/**
 * Get the current indexing status / metadata for a URL.
 *
 * @param {string} url
 */
export async function getIndexingStatus(url) {
  const token = await getIndexingToken();

  const res = await fetch(
    `${INDEXING_BASE}/metadata?url=${encodeURIComponent(url)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    return { url, error: `HTTP ${res.status}: ${err}` };
  }

  return res.json();
}
