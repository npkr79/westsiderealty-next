import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { sendWhatsAppText } from "@/services/whatsappCloudService";

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const leadId = String(body?.leadId || "");
    const phone = String(body?.phone || "");
    const message = String(body?.message || "").trim();

    if (!leadId || !phone || !message) {
      return NextResponse.json({ error: "leadId, phone and message are required." }, { status: 400 });
    }

    const result = await sendWhatsAppText({
      leadId,
      phone,
      message,
      sentBy: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send message." }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId, providerMessageId: result.providerMessageId });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected WhatsApp send error." },
      { status: 500 }
    );
  }
}
