// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendPushToUser(..._args: any[]) {
  console.log("[Push] FCM disabled - skipping push");
  return;
}
