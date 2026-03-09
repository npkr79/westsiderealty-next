"use client";
import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/firebaseClient";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function usePushNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    const register = async () => {
      try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!token) return;
        await fetch("/api/crm/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token }),
        });
      } catch (err) {
        console.error("Push registration failed:", err);
      }
    };
    register();
  }, [userId]);
}
