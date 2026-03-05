import { createHash } from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const VISITOR_COOKIE = "wsr_vid";
const SESSION_COOKIE = "wsr_sid";

const normalizePhone = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 10 ? digits : null;
};

const hashPhone = (phone: string): string => createHash("sha256").update(phone).digest("hex");

export async function mapBehaviorToLead(leadId: string, phone: string) {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get(VISITOR_COOKIE)?.value || null;
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value || null;
  const normalized = normalizePhone(phone);

  if (!visitorId && !sessionId && !normalized) return;

  const supabase = createServiceClient();
  const phoneHash = normalized ? hashPhone(normalized) : null;

  let query = supabase
    .from("crm_behavior_events")
    .update({
      lead_id: leadId,
      identified_phone_hash: phoneHash,
      updated_at: new Date().toISOString(),
    })
    .is("lead_id", null);

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  } else if (visitorId) {
    query = query.eq("visitor_id", visitorId);
  }

  await query;
}
