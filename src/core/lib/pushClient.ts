import type { MulticastMessage } from "firebase-admin/messaging";

import { getFirebaseMessaging, isFirebaseConfigured } from "@/core/lib/firebase";
import { logger } from "@/core/utils/logger";

type PushTokens = string | string[];

type PushPayload = {
  tokens?: PushTokens;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
};

type PushDispatchResult = {
  ok: boolean;
  skipped?: boolean;
  successCount?: number;
  failureCount?: number;
  responses?: Array<{
    messageId?: string | null;
    error?: string;
  }>;
  error?: unknown;
};

const ensureArray = (value?: PushTokens) => {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
};

const normalizeData = (data: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)])
  );

export const pushClient = {
  get isConfigured() {
    return isFirebaseConfigured();
  },

  async send(payload: PushPayload): Promise<PushDispatchResult> {
    const tokens = ensureArray(payload.tokens);

    if (tokens.length === 0) {
      logger.debug("No push tokens supplied; skipping push dispatch");
      return { ok: false, skipped: true };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      logger.warn("Firebase messaging is not configured; skipping push notification");
      return { ok: false, skipped: true };
    }

    const message: MulticastMessage = {
      tokens,
    };

    if (payload.title || payload.body || payload.imageUrl) {
      message.notification = {
        ...(payload.title ? { title: payload.title } : {}),
        ...(payload.body ? { body: payload.body } : {}),
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
      };
    }

    if (payload.data) {
      message.data = normalizeData(payload.data);
    }

    try {
      const response = await messaging.sendEachForMulticast(message);
      const ok = response.failureCount === 0;

      return {
        ok,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses.map((item) => ({
          messageId: item.messageId ?? null,
          error: item.error ? item.error.message : undefined,
        })),
      };
    } catch (error) {
      logger.error("Push notification dispatch failed", error);
      return { ok: false, error };
    }
  },
};

export type { PushPayload, PushDispatchResult };
