import { getAdminMessaging } from "@/lib/firebase/firebaseAdmin";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  const messaging = getAdminMessaging();
  if (!messaging) return; // FIREBASE_PRIVATE_KEY not set

  const supabase = createServiceClient();
  const { data: tokens } = await supabase
    .from("crm_push_tokens")
    .select("token")
    .eq("user_id", userId);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await Promise.allSettled(messages.map((msg) => messaging.send(msg as any)));
}
