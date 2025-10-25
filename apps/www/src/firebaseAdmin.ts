import { getAuth } from "firebase-admin/auth";
import { cert, getApps, initializeApp } from "firebase-admin/app";

const apps = getApps();

if (apps.length === 0) {
  initializeApp({
    credential: cert(JSON.parse(process.env.NEXT_FIREBASE_SERVICE_KEY!)),
  });
}

export const auth = getAuth();
