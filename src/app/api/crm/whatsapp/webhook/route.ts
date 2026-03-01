import { NextResponse } from "next/server";
import { upsertInboundWhatsAppMessage, updateOutboundStatusByProviderId } from "@/services/whatsappCloudService";

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value || {};
        const statuses = Array.isArray(value?.statuses) ? value.statuses : [];
        for (const statusRecord of statuses) {
          const providerMessageId = String(statusRecord?.id || "");
          const status = String(statusRecord?.status || "");
          if (providerMessageId && status) {
            await updateOutboundStatusByProviderId(providerMessageId, status);
          }
        }

        const messages = Array.isArray(value?.messages) ? value.messages : [];
        for (const msg of messages) {
          const providerMessageId = String(msg?.id || "");
          const from = String(msg?.from || "");
          const content = msg?.text?.body ? String(msg.text.body) : null;
          if (providerMessageId && from) {
            await upsertInboundWhatsAppMessage({ providerMessageId, from, content });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected webhook processing error." },
      { status: 500 }
    );
  }
}
