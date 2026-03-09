import { getAdminMessaging } from "@/lib/firebase/firebaseAdmin";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  const messaging = getAdminMessaging();
  console.log("[Push] messaging:", !!messaging);
  if (!messaging) return; // FIREBASE_PRIVATE_KEY not set

  const supabase = createServiceClient();
  const { data: tokens } = await supabase
    .from("crm_push_tokens")
    .select("token")
    .eq("user_id", userId);

  console.log("[Push] tokens found:", tokens?.length);
  if (!tokens?.length) return;

  const messages = tokens.map(({ token }: { token: string }) => ({
    token,
    notification: { title, body },
    data: { url: url || "/crm" },
    webpush: {
      notification: {
        title,
        body,
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
      },
      fcmOptions: { link: url || "/crm" },
    },
  }));

  console.log("[Push] sending to tokens:", messages.length);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = await Promise.allSettled(messages.map((msg) => messaging.send(msg as any)));
  console.log("[Push] results:", JSON.stringify(results));
}
