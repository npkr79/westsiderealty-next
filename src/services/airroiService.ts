const AIRROI_BASE = "https://api.airroi.com";

const AIRROI_HEADERS = {
  "x-api-key": process.env.AIRROI_API_KEY ?? "",
  "Content-Type": "application/json",
};

function buildMarketQuery(district: string, locality: string, numMonths = 12) {
  return {
    market: { country: "India", region: "Goa", locality, district },
    filter: { room_type: { eq: "entire_home" } },
    num_months: numMonths,
    currency: "native",
  };
}

function buildLocalityQuery(locality: string, numMonths = 12) {
  return {
    market: { country: "India", region: "Goa", locality },
    filter: { room_type: { eq: "entire_home" } },
    num_months: numMonths,
    currency: "native",
  };
}

async function postWithTimeout(
  url: string,
  body: object,
  timeoutMs = 15_000
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: AIRROI_HEADERS,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    console.error("[airroi] fetch error:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchMarketSummary(
  district: string,
  locality: string
): Promise<{ data: unknown; fallbackLevel: string } | null> {
  try {
    let res = await postWithTimeout(
      `${AIRROI_BASE}/markets/summary`,
      buildMarketQuery(district, locality)
    );

    if (res && res.status === 404) {
      res = await postWithTimeout(
        `${AIRROI_BASE}/markets/summary`,
        buildLocalityQuery(locality)
      );
      if (!res || !res.ok) return null;
      return { data: await res.json(), fallbackLevel: "locality" };
    }

    if (!res || !res.ok) {
      console.error("[airroi] summary error:", res?.status, district);
      return null;
    }
    return { data: await res.json(), fallbackLevel: "district" };
  } catch (err) {
    console.error("[airroi] fetchMarketSummary failed:", err);
    return null;
  }
}

export async function fetchMarketADR(
  district: string,
  locality: string
): Promise<unknown[] | null> {
  try {
    let res = await postWithTimeout(
      `${AIRROI_BASE}/markets/metrics/average-daily-rate`,
      buildMarketQuery(district, locality)
    );

    if (res && res.status === 404) {
      res = await postWithTimeout(
        `${AIRROI_BASE}/markets/metrics/average-daily-rate`,
        buildLocalityQuery(locality)
      );
      if (!res || !res.ok) return null;
      const d = await res.json() as { results?: unknown[] };
      return d.results ?? null;
    }

    if (!res || !res.ok) {
      console.error("[airroi] ADR error:", res?.status, district);
      return null;
    }
    const d = await res.json() as { results?: unknown[] };
    return d.results ?? null;
  } catch (err) {
    console.error("[airroi] fetchMarketADR failed:", err);
    return null;
  }
}

export async function fetchMarketOccupancy(
  district: string,
  locality: string
): Promise<unknown[] | null> {
  try {
    let res = await postWithTimeout(
      `${AIRROI_BASE}/markets/metrics/occupancy`,
      buildMarketQuery(district, locality)
    );

    if (res && res.status === 404) {
      res = await postWithTimeout(
        `${AIRROI_BASE}/markets/metrics/occupancy`,
        buildLocalityQuery(locality)
      );
      if (!res || !res.ok) return null;
      const d = await res.json() as { results?: unknown[] };
      return d.results ?? null;
    }

    if (!res || !res.ok) {
      console.error("[airroi] occupancy error:", res?.status, district);
      return null;
    }
    const d = await res.json() as { results?: unknown[] };
    return d.results ?? null;
  } catch (err) {
    console.error("[airroi] fetchMarketOccupancy failed:", err);
    return null;
  }
}
