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

  // Remove FCM tokens that are no longer valid (device unregistered, token rotated, etc.)
  const staleTokens: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code: string = (result.reason as any)?.errorInfo?.code ?? (result.reason as any)?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument"
      ) {
        staleTokens.push(tokens[i].token);
        console.log("[Push] Stale token detected, will remove:", code);
      }
    }
  });
  if (staleTokens.length > 0) {
    console.log("[Push] Removing stale tokens:", staleTokens.length);
    await supabase.from("crm_push_tokens").delete().in("token", staleTokens);
  }
}
