/**
 * Shared WhatsApp alert utility for CRM lead notifications.
 * Sends a plain-text message to an agent or admin phone number
 * via the WhatsApp Cloud API.
 */

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION ?? "v21.0";

export async function sendLeadAlertWhatsApp(
  recipientPhone: string,
  leadName: string,
  leadPhone: string,
  formName: string | null
): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return;

  const phone = recipientPhone.replace(/[^\d]/g, "");
  const source = formName || "Meta Ad";
  const message = `🔔 New Lead Alert!\n\nName: ${leadName}\nPhone: ${leadPhone}\nSource: ${source}\n\nLogin to CRM: https://www.westsiderealty.in/crm`;

  await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    }),
  }).catch((err) => {
    console.warn("[whatsappAlert] Failed to send alert:", err?.message ?? err);
  });
}
