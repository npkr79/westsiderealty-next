"use client";

export type BehaviorEventName =
  | "page_view"
  | "project_view"
  | "pricing_view"
  | "brochure_download"
  | "lead_submitted";

interface BehaviorEventPayload {
  [key: string]: unknown;
}

interface BehaviorContext {
  visitorId: string;
  sessionId: string;
  visitCount: number;
  isRepeatVisit: boolean;
}

const VISITOR_COOKIE = "wsr_vid";
const SESSION_COOKIE = "wsr_sid";
const VISIT_COUNT_COOKIE = "wsr_vc";
const COOKIE_MAX_AGE_DAYS = 180;

const isBrowser = () => typeof window !== "undefined";

const createId = (prefix: string): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const readCookie = (name: string): string | null => {
  if (!isBrowser()) return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] || "");
};

const writeCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (!isBrowser()) return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};

const ensureBehaviorContext = (): BehaviorContext => {
  if (!isBrowser()) {
    return { visitorId: "server", sessionId: "server", visitCount: 1, isRepeatVisit: false };
  }

  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const visitorId = readCookie(VISITOR_COOKIE) || createId("v");
  const sessionId = createId("s");
  const existingVisitCount = Number(readCookie(VISIT_COUNT_COOKIE) || "0");
  const visitCount = Number.isFinite(existingVisitCount) ? existingVisitCount + 1 : 1;
  const isRepeatVisit = visitCount > 1;

  writeCookie(VISITOR_COOKIE, visitorId, maxAge);
  writeCookie(SESSION_COOKIE, sessionId, 24 * 60 * 60);
  writeCookie(VISIT_COUNT_COOKIE, String(visitCount), maxAge);

  return { visitorId, sessionId, visitCount, isRepeatVisit };
};

let cachedContext: BehaviorContext | null = null;

export const getBehaviorContext = (): BehaviorContext => {
  if (cachedContext) return cachedContext;
  cachedContext = ensureBehaviorContext();
  return cachedContext;
};

export const trackBehaviorEvent = async (event: BehaviorEventName, payload: BehaviorEventPayload = {}) => {
  if (!isBrowser()) return;
  const context = getBehaviorContext();
  const body = {
    event,
    page_path: window.location.pathname,
    visitor_id: context.visitorId,
    session_id: context.sessionId,
    visit_count: context.visitCount,
    is_repeat_visit: context.isRepeatVisit,
    payload,
  };

  try {
    await fetch("/api/analytics/behavior-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Do not block user flow on analytics failures.
  }
};
