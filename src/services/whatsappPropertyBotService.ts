/**
 * WhatsApp Property Listing Bot
 *
 * Handles inbound WhatsApp messages from Channel Partners to collect
 * property details and create listings in hyderabad_properties.
 *
 * Conversation steps:
 *   register → sale_type → location → property_type → bhk → area → price → photos → confirm → done
 */

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionData {
  sale_type?: "fresh" | "secondary";
  location?: string;
  property_type?: string;
  bhk?: string;
  area?: number;
  price?: string;
  photos?: string[];
  title?: string;
  description?: string;
}

interface PropertySession {
  id: string;
  phone: string;
  cp_name: string | null;
  cp_user_id: string | null;
  step: string;
  data: SessionData;
}

// ─── Direct WhatsApp send (no CRM dependency) ─────────────────────────────────

async function sendReply(phone: string, message: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    console.error("[PropertyBot] Missing WhatsApp credentials");
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
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
    }
  );

  if (!res.ok) {
    console.error("[PropertyBot] sendReply failed:", await res.text());
  }
}

// ─── WhatsApp media download → Supabase storage ───────────────────────────────

async function storeWhatsAppMedia(
  mediaId: string,
  phone: string
): Promise<string | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) return null;

  try {
    // 1. Get the temporary download URL from WhatsApp
    const urlRes = await fetch(
      `https://graph.facebook.com/v20.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!urlRes.ok) return null;
    const urlData = await urlRes.json();
    const mediaUrl: string = urlData.url;

    // 2. Download the image bytes
    const imageRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!imageRes.ok) return null;
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // 3. Upload to Supabase storage bucket "property-photos"
    const supabase = createServiceClient();
    const fileName = `${phone.replace(/\D/g, "")}/${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from("property-photos")
      .upload(fileName, imageBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("[PropertyBot] Storage upload failed:", error.message);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("property-photos").getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error("[PropertyBot] storeWhatsAppMedia error:", err);
    return null;
  }
}

// ─── AI description generation ────────────────────────────────────────────────

async function generateListing(
  data: SessionData
): Promise<{ title: string; description: string }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Generate a property listing title and description for this Indian real estate property.

Details:
- Type: ${data.bhk ? data.bhk + " " : ""}${data.property_type}
- Location: ${data.location}
- Area: ${data.area} sqft
- Price: ${data.price}
- Sale: ${data.sale_type === "secondary" ? "Resale" : "Fresh Sale / New Launch"}

Return JSON only:
{
  "title": "<concise title max 65 chars, e.g. '3BHK Apartment in Kondapur | 1450 Sqft'>",
  "description": "<2-3 sentences, highlight location, space, value proposition>"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch)
    return {
      title: `${data.bhk ? data.bhk + " " : ""}${data.property_type} in ${data.location}`,
      description: `A ${data.property_type?.toLowerCase()} available for sale in ${data.location}.`,
    };

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: parsed.title || `${data.property_type} in ${data.location}`,
    description: parsed.description || "",
  };
}

// ─── Price parser: "85 Lakhs" / "1.2 Cr" → bigint rupees ─────────────────────

function parsePrice(raw: string): { pricePaise: bigint; display: string } {
  const s = raw.trim().toLowerCase().replace(/,/g, "");
  let value = 0;

  const crMatch = s.match(/([\d.]+)\s*(?:cr|crore)/);
  const lakhMatch = s.match(/([\d.]+)\s*(?:l|lakh|lac)/);
  const numMatch = s.match(/^[\d.]+$/);

  if (crMatch) {
    value = parseFloat(crMatch[1]) * 1_00_00_000;
  } else if (lakhMatch) {
    value = parseFloat(lakhMatch[1]) * 1_00_000;
  } else if (numMatch) {
    value = parseFloat(numMatch[0]);
  }

  return {
    pricePaise: BigInt(Math.round(value)),
    display: raw.trim(),
  };
}

// ─── Slug helper ──────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

// ─── Session CRUD ─────────────────────────────────────────────────────────────

async function getSession(phone: string): Promise<PropertySession | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("whatsapp_property_sessions")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();
  return data as PropertySession | null;
}

async function saveSession(
  phone: string,
  patch: Partial<Omit<PropertySession, "id" | "phone">>
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("whatsapp_property_sessions").upsert(
    { phone, ...patch, updated_at: new Date().toISOString() },
    { onConflict: "phone" }
  );
}

async function deleteSession(phone: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("whatsapp_property_sessions")
    .delete()
    .eq("phone", phone);
}

// ─── CP lookup ────────────────────────────────────────────────────────────────

async function findCpByPhone(
  phone: string
): Promise<{ id: string; full_name: string } | null> {
  const supabase = createServiceClient();
  const normalized = phone.replace(/\D/g, "");

  // Match any internal CRM user — admin, agent, channel_partner, team_lead, etc.
  const { data } = await supabase
    .from("crm_users")
    .select("id, full_name")
    .or(`whatsapp_number.eq.${normalized},whatsapp_number.eq.+${normalized}`)
    .maybeSingle();

  return data ? { id: data.id, full_name: data.full_name } : null;
}

async function registerCp(phone: string, name: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: role } = await supabase
    .from("crm_roles")
    .select("id")
    .eq("name", "channel_partner")
    .single();

  if (!role) return null;

  const { data, error } = await supabase
    .from("crm_users")
    .insert({
      full_name: name,
      whatsapp_number: phone.replace(/\D/g, ""),
      role_id: role.id,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[PropertyBot] registerCp failed:", error.message);
    return null;
  }

  return data.id;
}

// ─── Create property listing ──────────────────────────────────────────────────

async function createPropertyListing(
  session: PropertySession
): Promise<string> {
  const supabase = createServiceClient();
  const d = session.data;
  const photos = d.photos ?? [];

  const slug = `${toSlug(d.location ?? "")}-${toSlug(d.property_type ?? "")}${d.bhk ? "-" + toSlug(d.bhk) : ""}-${Date.now()}`;

  const { pricePaise, display: priceDisplay } = parsePrice(d.price ?? "0");

  const { data, error } = await supabase
    .from("hyderabad_properties")
    .insert({
      title: d.title,
      slug,
      description: d.description,
      property_type: d.property_type,
      ownership_type: "freehold",
      bhk_config: d.bhk ?? null,
      area_sqft: d.area ?? null,
      price: pricePaise,
      price_display: priceDisplay,
      location: d.location,
      status: "draft",
      is_resale: d.sale_type === "secondary",
      agent_id: session.cp_user_id ?? null,
      main_image_url: photos[0] ?? null,
      image_gallery: photos.length > 0 ? photos : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Handles one inbound WhatsApp message from a potential Channel Partner.
 * Returns true if the bot handled the message (caller should NOT pass to CRM).
 * Returns false if this number should be handled by the existing CRM flow.
 */
export async function handlePropertyBotMessage(
  phone: string,
  text: string | null,
  mediaId: string | null
): Promise<boolean> {
  const input = text?.trim() ?? "";
  const inputLower = input.toLowerCase();

  let session = await getSession(phone);

  // ── No session: identify the sender ─────────────────────────────────────────
  if (!session) {
    const cp = await findCpByPhone(phone);
    if (!cp) {
      // Unknown number — let CRM handle it (could be a lead)
      return false;
    }
    // Known CP — start the flow
    await saveSession(phone, {
      step: "sale_type",
      cp_name: cp.full_name,
      cp_user_id: cp.id,
      data: {},
    });
    await sendReply(
      phone,
      `Welcome back ${cp.full_name}! 👋\n\nTo list a property, reply:\n*1* — Fresh Sale (Developer inventory)\n*2* — Secondary Sale (Resale)`
    );
    return true;
  }

  // ── RESTART at any time ──────────────────────────────────────────────────────
  if (inputLower === "restart" || inputLower === "/restart") {
    await saveSession(phone, { step: "sale_type", data: {} });
    await sendReply(
      phone,
      `Starting over 🔄\n\nReply:\n*1* — Fresh Sale\n*2* — Secondary Sale`
    );
    return true;
  }

  const step = session.step;
  const data: SessionData = { ...(session.data as SessionData) };

  // ── REGISTER ─────────────────────────────────────────────────────────────────
  if (step === "register") {
    if (!input) {
      await sendReply(phone, `Please share your name to register as a Channel Partner.`);
      return true;
    }
    const userId = await registerCp(phone, input);
    await saveSession(phone, {
      step: "sale_type",
      cp_name: input,
      cp_user_id: userId,
      data: {},
    });
    await sendReply(
      phone,
      `Thanks ${input}! You're registered as a Channel Partner 🎉\n\nTo list a property, reply:\n*1* — Fresh Sale (Developer inventory)\n*2* — Secondary Sale (Resale)`
    );
    return true;
  }

  // ── SALE TYPE ────────────────────────────────────────────────────────────────
  if (step === "sale_type") {
    if (input === "1" || inputLower.includes("fresh")) {
      data.sale_type = "fresh";
    } else if (
      input === "2" ||
      inputLower.includes("secondary") ||
      inputLower.includes("resale")
    ) {
      data.sale_type = "secondary";
    } else {
      await sendReply(phone, `Please reply *1* for Fresh Sale or *2* for Secondary Sale.`);
      return true;
    }
    await saveSession(phone, { step: "location", data });
    await sendReply(
      phone,
      `Got it! What is the property location/area?\n(e.g. Kondapur, Gachibowli, Jubilee Hills)`
    );
    return true;
  }

  // ── LOCATION ─────────────────────────────────────────────────────────────────
  if (step === "location") {
    if (!input) {
      await sendReply(phone, `Please share the location (e.g. Kondapur, Banjara Hills).`);
      return true;
    }
    data.location = input;
    await saveSession(phone, { step: "property_type", data });
    await sendReply(
      phone,
      `Property type?\n\n*1* — Apartment / Flat\n*2* — Villa / Independent House\n*3* — Plot / Land`
    );
    return true;
  }

  // ── PROPERTY TYPE ────────────────────────────────────────────────────────────
  if (step === "property_type") {
    let propertyType = "";
    if (input === "1" || inputLower.includes("apartment") || inputLower.includes("flat")) {
      propertyType = "Apartment";
    } else if (input === "2" || inputLower.includes("villa") || inputLower.includes("house") || inputLower.includes("independent")) {
      propertyType = "Villa";
    } else if (input === "3" || inputLower.includes("plot") || inputLower.includes("land")) {
      propertyType = "Plot";
    }

    if (!propertyType) {
      await sendReply(phone, `Please reply *1* for Apartment, *2* for Villa, or *3* for Plot.`);
      return true;
    }

    data.property_type = propertyType;

    if (propertyType === "Plot") {
      // Skip BHK for plots
      await saveSession(phone, { step: "area", data });
      await sendReply(phone, `Plot size in sqft? (e.g. 200, 500, 1200)`);
    } else {
      await saveSession(phone, { step: "bhk", data });
      await sendReply(phone, `BHK configuration? (e.g. 2BHK, 3BHK, 4BHK)`);
    }
    return true;
  }

  // ── BHK ──────────────────────────────────────────────────────────────────────
  if (step === "bhk") {
    if (!input) {
      await sendReply(phone, `Please share the BHK (e.g. 2BHK, 3BHK).`);
      return true;
    }
    data.bhk = input.toUpperCase().replace(/\s+/g, "");
    await saveSession(phone, { step: "area", data });
    await sendReply(phone, `Area in sqft? (e.g. 1450, 2200)`);
    return true;
  }

  // ── AREA ─────────────────────────────────────────────────────────────────────
  if (step === "area") {
    const area = parseFloat(input.replace(/[^0-9.]/g, ""));
    if (!area || area <= 0) {
      await sendReply(phone, `Please share the area as a number in sqft (e.g. 1450).`);
      return true;
    }
    data.area = area;
    await saveSession(phone, { step: "price", data });
    await sendReply(phone, `Asking price? (e.g. 85 Lakhs, 1.2 Cr, 55L)`);
    return true;
  }

  // ── PRICE ────────────────────────────────────────────────────────────────────
  if (step === "price") {
    if (!input) {
      await sendReply(phone, `Please share the asking price (e.g. 85 Lakhs, 1.2 Cr).`);
      return true;
    }
    data.price = input;
    data.photos = [];
    await saveSession(phone, { step: "photos", data });
    await sendReply(
      phone,
      `Please share photos of the property 📸\n\nSend as many as you like. Reply *DONE* when finished.`
    );
    return true;
  }

  // ── PHOTOS ───────────────────────────────────────────────────────────────────
  if (step === "photos") {
    // Incoming photo
    if (mediaId) {
      const url = await storeWhatsAppMedia(mediaId, phone);
      const photos = [...(data.photos ?? [])];
      if (url) photos.push(url);
      data.photos = photos;
      await saveSession(phone, { data });
      await sendReply(
        phone,
        `Photo received (${photos.length} total) ✅\n\nSend more or reply *DONE*.`
      );
      return true;
    }

    // Done collecting photos
    if (
      inputLower === "done" ||
      inputLower === "ok" ||
      inputLower === "finish" ||
      inputLower === "next"
    ) {
      await sendReply(phone, `Generating your listing... ⏳`);

      const { title, description } = await generateListing(data);
      data.title = title;
      data.description = description;
      const photos = data.photos ?? [];

      const summary =
        `📋 *Listing Summary*\n\n` +
        `🏠 *${title}*\n\n` +
        `Type: ${data.bhk ? data.bhk + " " : ""}${data.property_type}\n` +
        `Location: ${data.location}\n` +
        `Area: ${data.area} sqft\n` +
        `Price: ${data.price}\n` +
        `Sale: ${data.sale_type === "secondary" ? "Resale" : "Fresh Sale"}\n` +
        `Photos: ${photos.length}\n\n` +
        `${description}\n\n` +
        `Reply *CONFIRM* to submit or *RESTART* to begin again.`;

      await saveSession(phone, { step: "confirm", data });
      await sendReply(phone, summary);
      return true;
    }

    await sendReply(phone, `Send property photos 📸 or reply *DONE* when finished.`);
    return true;
  }

  // ── CONFIRM ──────────────────────────────────────────────────────────────────
  if (step === "confirm") {
    if (inputLower === "confirm") {
      try {
        const listingId = await createPropertyListing(session);
        await deleteSession(phone);
        await sendReply(
          phone,
          `✅ *Property submitted successfully!*\n\nOur team will review and publish it within 24 hours.\n\nRef: #${listingId.slice(0, 8).toUpperCase()}\n\nThank you ${session.cp_name ?? ""}! 🙏`
        );
      } catch (err) {
        console.error("[PropertyBot] createPropertyListing failed:", err);
        await sendReply(
          phone,
          `Something went wrong submitting the listing. Please try again or contact support.`
        );
      }
      return true;
    }

    await sendReply(phone, `Reply *CONFIRM* to submit or *RESTART* to begin again.`);
    return true;
  }

  // Unhandled step — reset
  await saveSession(phone, { step: "sale_type", data: {} });
  await sendReply(
    phone,
    `Let's start fresh! Reply *1* for Fresh Sale or *2* for Secondary Sale.`
  );
  return true;
}
