"use client";

export type ListingsEventName =
  | "page_view"
  | "intent_selected"
  | "advisory_section_viewed"
  | "lead_submitted";

interface ListingsEventPayload {
  [key: string]: unknown;
}

export interface ListingsBufferedEvent extends ListingsEventPayload {
  event: ListingsEventName;
  source: string;
  ts: number;
  page: string;
  sessionId: string;
}

interface AdvisoryTrackingContext {
  sessionId: string;
  projectId?: string;
  microMarket?: string;
  intent?: string;
  startedAt?: number;
  maxScrollDepth?: number;
  sectionsViewed?: string[];
  sectionViewMs?: Record<string, number>;
}

const SESSION_KEY = "listing_session_id";
const CONTEXT_KEY = "listing_advisory_context";
const EVENT_BUFFER_KEY = "listing_event_buffer";

const now = () => Date.now();

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getListingSessionId = (): string => {
  if (typeof window === "undefined") return "server";
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess-${now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
};

export const getAdvisoryTrackingContext = (): AdvisoryTrackingContext => {
  if (typeof window === "undefined") return { sessionId: "server" };
  const fromStore = safeParse<AdvisoryTrackingContext>(window.sessionStorage.getItem(CONTEXT_KEY), {
    sessionId: getListingSessionId(),
  });
  return {
    sessionId: fromStore.sessionId || getListingSessionId(),
    ...fromStore,
  };
};

export const setAdvisoryTrackingContext = (patch: Partial<AdvisoryTrackingContext>) => {
  if (typeof window === "undefined") return;
  const current = getAdvisoryTrackingContext();
  const next: AdvisoryTrackingContext = {
    ...current,
    ...patch,
    sectionsViewed: patch.sectionsViewed || current.sectionsViewed || [],
    sectionViewMs: patch.sectionViewMs || current.sectionViewMs || {},
  };
  window.sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(next));
};

export const trackListingsEvent = (event: ListingsEventName, payload: ListingsEventPayload = {}) => {
  if (typeof window === "undefined") return;
  const context = getAdvisoryTrackingContext();
  const eventData: ListingsBufferedEvent = {
    event,
    source: "listings_personalization",
    ts: now(),
    page: window.location.pathname,
    sessionId: context.sessionId,
    ...payload,
  };

  // Lightweight sinks: dataLayer (if available) + session buffer for funnel context.
  const globalObj = window as unknown as { dataLayer?: unknown[] };
  if (Array.isArray(globalObj.dataLayer)) {
    globalObj.dataLayer.push(eventData);
  }

  const existingBuffer = safeParse<any[]>(window.sessionStorage.getItem(EVENT_BUFFER_KEY), []);
  const trimmed = [...existingBuffer, eventData].slice(-100);
  window.sessionStorage.setItem(EVENT_BUFFER_KEY, JSON.stringify(trimmed));
};

export const getListingsEventBuffer = (): ListingsBufferedEvent[] => {
  if (typeof window === "undefined") return [];
  return safeParse<ListingsBufferedEvent[]>(window.sessionStorage.getItem(EVENT_BUFFER_KEY), []);
};

