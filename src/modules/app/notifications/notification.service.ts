import type { Prisma } from "@prisma/client";

import type { StoredNotificationPayload } from "@/core/services/notificationCenter";
import { prisma } from "@/core/lib/prisma";
import { logger } from "@/core/utils/logger";

const notificationSelect = {
  id: true,
  type: true,
  notifiableType: true,
  notifiableId: true,
  data: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

type LocalizedNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  read_at: Date | null;
  created_at: Date;
  locale: string;
  translations: {
    defaultLocale: string;
    titles: Record<string, string>;
    messages: Record<string, string>;
  };
  metadata?: Record<string, unknown>;
  channels?: StoredNotificationPayload["channels"];
  payload: StoredNotificationPayload;
};

const parsePayload = (data: string): StoredNotificationPayload => {
  try {
    const parsed = JSON.parse(data) as StoredNotificationPayload;
    return {
      locale: parsed.locale ?? parsed.defaultLocale ?? "en",
      defaultLocale: parsed.defaultLocale ?? parsed.locale ?? "en",
      title: parsed.title ?? "",
      message: parsed.message ?? "",
      titleTranslations: parsed.titleTranslations,
      messageTranslations: parsed.messageTranslations,
      metadata: parsed.metadata,
      channels: parsed.channels,
    };
  } catch (error) {
    logger.error("Failed to parse notification data", error);
    return {
      locale: "en",
      defaultLocale: "en",
      title: "",
      message: "",
      metadata: { raw: data },
    };
  }
};

const normalizeLocale = (locale?: string) => locale?.toLowerCase();

const pickLocalizedValue = (
  payload: StoredNotificationPayload,
  translations: Record<string, string> | undefined,
  targetLocale?: string,
) => {
  const defaultLocale = normalizeLocale(payload.defaultLocale) ?? "en";
  const map = { ...(translations ?? {}) } as Record<string, string>;

  if (payload.title && !map[defaultLocale]) {
    map[defaultLocale] = payload.title;
  }

  const normalizedTarget = normalizeLocale(targetLocale);
  if (normalizedTarget && map[normalizedTarget]) {
    return { value: map[normalizedTarget], locale: normalizedTarget, map };
  }

  if (normalizedTarget) {
    const fallbackKey = normalizedTarget.split("-")[0];
    if (map[fallbackKey]) {
      return { value: map[fallbackKey], locale: fallbackKey, map };
    }
  }

  if (map[defaultLocale]) {
    return { value: map[defaultLocale], locale: defaultLocale, map };
  }

  return { value: payload.title ?? "", locale: defaultLocale, map };
};

const formatNotificationForLocale = (
  record: NotificationRecord,
  locale?: string,
): LocalizedNotification => {
  const payload = parsePayload(record.data);

  const title = pickLocalizedValue(payload, payload.titleTranslations, locale);
  const message = pickLocalizedValue(
    { ...payload, title: payload.message },
    payload.messageTranslations,
    locale,
  );

  return {
    id: record.id,
    type: record.type,
    title: title.value,
    message: message.value,
    read: Boolean(record.readAt),
    read_at: record.readAt ?? null,
    created_at: record.createdAt,
    locale: title.locale,
    translations: {
      defaultLocale: payload.defaultLocale,
      titles: title.map,
      messages: message.map,
    },
    metadata: payload.metadata,
    channels: payload.channels,
    payload,
  };
};

const toNotifiableId = (userId: number) => BigInt(userId);

export const notificationService = {
  list: async (userId: number, locale?: string) => {
    const notifications = await prisma.notification.findMany({
      where: {
        notifiableType: "user",
        notifiableId: toNotifiableId(userId),
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: notificationSelect,
    });
    return notifications.map((notification) => formatNotificationForLocale(notification, locale));
  },

  get: async (id: string, userId: number, locale?: string) => {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        notifiableType: "user",
        notifiableId: toNotifiableId(userId),
        deletedAt: null,
      },
      select: notificationSelect,
    });
    if (!notification) {
      return null;
    }
    return formatNotificationForLocale(notification, locale);
  },

  updateStatus: async (id: string, userId: number, read: boolean) => {
    return prisma.notification.updateMany({
      where: {
        id,
        notifiableType: "user",
        notifiableId: toNotifiableId(userId),
        deletedAt: null,
      },
      data: { readAt: read ? new Date() : null },
    });
  },

  clearAll: async (userId: number) => {
    return prisma.notification.updateMany({
      where: {
        notifiableType: "user",
        notifiableId: toNotifiableId(userId),
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  },

  markAllAsRead: async (userId: number) => {
    return prisma.notification.updateMany({
      where: {
        notifiableType: "user",
        notifiableId: toNotifiableId(userId),
        deletedAt: null,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  },
};
