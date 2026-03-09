import { initializeApp, getApps } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDjmWYMd8r1mcGJhDbyV4NzU7JNyHNF4ow",
  authDomain: "westside-crm.firebaseapp.com",
  projectId: "westside-crm",
  storageBucket: "westside-crm.firebasestorage.app",
  messagingSenderId: "980085644101",
  appId: "1:980085644101:web:cd13a0158c5c832f743c2c",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};
