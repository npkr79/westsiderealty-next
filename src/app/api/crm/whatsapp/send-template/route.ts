import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { sendWhatsAppTemplate } from "@/services/whatsappCloudService";

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const leadId = String(body?.leadId || "");
    const phone = String(body?.phone || "");
    const templateName = String(body?.templateName || "").trim();
    const languageCode = typeof body?.languageCode === "string" ? body.languageCode : "en";

    if (!leadId || !phone || !templateName) {
      return NextResponse.json({ error: "leadId, phone and templateName are required." }, { status: 400 });
    }

    const result = await sendWhatsAppTemplate({
      leadId,
      phone,
      templateName,
      languageCode,
      sentBy: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send template." }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId, providerMessageId: result.providerMessageId });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected WhatsApp template send error." },
      { status: 500 }
    );
  }
}
