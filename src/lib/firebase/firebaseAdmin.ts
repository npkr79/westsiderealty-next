import admin from "firebase-admin";

function getAdminApp() {
  if (admin.apps.length) return admin.apps[0]!;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKey) return null;
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "westside-crm",
      clientEmail: "firebase-adminsdk-fbsvc@westside-crm.iam.gserviceaccount.com",
      privateKey,
    }),
  });
}

export function getAdminMessaging() {
  const app = getAdminApp();
  if (!app) return null;
  return admin.messaging(app);
}

export default admin;
