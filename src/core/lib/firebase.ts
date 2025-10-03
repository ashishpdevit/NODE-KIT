import admin from "firebase-admin";

import { firebaseConfig } from "@/core/config";
import { logger } from "@/core/utils/logger";

let firebaseApp: admin.app.App | null = null;
let attempted = false;

const sanitizePrivateKey = (key: string) => key.replace(/\\n/g, "\n");

const hasRequiredConfig = () =>
  Boolean(firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey);

export const getFirebaseApp = (): admin.app.App | null => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!hasRequiredConfig()) {
    return null;
  }

  if (attempted) {
    return null;
  }

  attempted = true;

  const { projectId, clientEmail, privateKey } = firebaseConfig;
  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: sanitizePrivateKey(privateKey),
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      firebaseApp = admin.app();
    } else {
      logger.error("Failed to initialise Firebase app", error);
      firebaseApp = null;
    }
  }

  return firebaseApp;
};

export const getFirebaseMessaging = () => {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  try {
    return admin.messaging(app);
  } catch (error) {
    logger.error("Failed to retrieve Firebase messaging client", error);
    return null;
  }
};

export const isFirebaseConfigured = () => hasRequiredConfig();
