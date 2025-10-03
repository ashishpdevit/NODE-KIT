import type { Prisma } from "@prisma/client";

import {
  notificationCenter,
  type LocalizedNotificationEntry,
  type NotificationDispatchSummary,
  type StoredNotificationPayload,
} from "@/core/services/notificationCenter";
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

type DeliveryOptions = {
  email?: Parameters<typeof notificationCenter.dispatch>[0]["email"];
  push?: Parameters<typeof notificationCenter.dispatch>[0]["push"];
};

type LocalizedContentInput = Record<string, LocalizedNotificationEntry> | undefined;

type AdminNotificationCreateInput = {
  user_id: number;
  user_type?: string;
  title: string;
  message: string;
  default_locale?: string;
  localized_content?: LocalizedContentInput;
  metadata?: Record<string, unknown>;
} & DeliveryOptions;

type AdminNotificationForAllInput = {
  title: string;
  message: string;
  user_type?: string;
  default_locale?: string;
  localized_content?: LocalizedContentInput;
  metadata?: Record<string, unknown>;
} & DeliveryOptions;

type StoredPayload = StoredNotificationPayload;

const normalizeLocale = (locale?: string | null) =>
  locale?.trim().length ? locale.trim().toLowerCase() : undefined;

const normaliseLocalizedContent = (input?: LocalizedContentInput) => {
  if (!input) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(input).map(([locale, entry]) => [locale.toLowerCase(), entry]),
  );
};

const parsePayload = (data: string): StoredPayload => {
  try {
    const parsed = JSON.parse(data) as StoredPayload;
    return {
      locale: parsed.locale ?? parsed.defaultLocale ?? "en",
      defaultLocale: parsed.defaultLocale ?? parsed.locale ?? "en",
      title: parsed.title ?? "",
      message: parsed.message ?? "",
      titleTranslations: parsed.titleTranslations,
      messageTranslations: parsed.messageTranslations,
      metadata: parsed.metadata,
      channels: parsed.channels,
    } satisfies StoredPayload;
  } catch (error) {
    logger.error("Failed to parse notification payload", error);
    return {
      locale: "en",
      defaultLocale: "en",
      title: "",
      message: "",
      metadata: { raw: data },
    } satisfies StoredPayload;
  }
};

const mapRecord = (record: Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>) => ({
  id: record.id,
  type: record.type,
  notifiableType: record.notifiableType,
  notifiableId: record.notifiableId.toString(),
  readAt: record.readAt ?? null,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  deletedAt: record.deletedAt ?? null,
  payload: parsePayload(record.data),
});

const mapSummary = (summary: NotificationDispatchSummary | undefined) => {
  if (!summary) {
    return undefined;
  }

  return {
    notification: summary.persisted
      ? {
          id: summary.persisted.id,
          type: summary.persisted.type,
          notifiableType: summary.persisted.notifiableType,
          notifiableId: summary.persisted.notifiableId.toString(),
          readAt: summary.persisted.readAt ?? null,
          createdAt: summary.persisted.createdAt,
          updatedAt: summary.persisted.updatedAt,
          deletedAt: summary.persisted.deletedAt ?? null,
          payload: summary.persisted.payload,
        }
      : undefined,
    email: summary.email,
    push: summary.push,
  };
};

const dispatchToUser = async (
  userId: number,
  input: AdminNotificationCreateInput,
  fallbackEmail: string | null,
  deviceToken: string | null,
  notificationsEnabled: boolean,
  locale: string | null,
): Promise<NotificationDispatchSummary> => {
  const targetLocale = normalizeLocale(locale) ?? normalizeLocale(input.default_locale) ?? "en";
  const metadata = {
    ...(input.metadata ?? {}),
    userType: input.user_type ?? "user",
    source: "admin",
  } satisfies Record<string, unknown>;

  const email = (() => {
    if (!input.email) {
      return undefined;
    }
    if (input.email.to) {
      return input.email;
    }
    if (fallbackEmail) {
      return { ...input.email, to: fallbackEmail };
    }
    logger.warn("Email delivery skipped because no recipient could be resolved", { userId, title: input.title });
    return undefined;
  })();

  const pushAllowed = notificationsEnabled !== false;

  return notificationCenter.notifyUser(userId, {
    title: input.title,
    message: input.message,
    notificationType: input.user_type ? `admin.${input.user_type}` : "admin.notification",
    defaultLocale: input.default_locale ?? "en",
    localizedContent: normaliseLocalizedContent(input.localized_content),
    targetLocale,
    metadata,
    email,
    push: pushAllowed ? input.push : undefined,
    defaultPushTokens: pushAllowed ? deviceToken ?? undefined : undefined,
  });
};

export const adminNotificationService = {
  list: async (filters?: { notifiable_type?: string; notifiable_id?: number | string; read?: boolean }) => {
    const where: Prisma.NotificationWhereInput = {
      deletedAt: null,
    };

    if (filters?.notifiable_type) {
      where.notifiableType = filters.notifiable_type;
    }

    if (filters?.notifiable_id !== undefined) {
      where.notifiableId = BigInt(filters.notifiable_id);
    }

    if (filters?.read === true) {
      where.readAt = { not: null };
    } else if (filters?.read === false) {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: notificationSelect,
    });

    return notifications.map(mapRecord);
  },

  get: async (id: string) => {
    const notification = await prisma.notification.findFirst({
      where: { id, deletedAt: null },
      select: notificationSelect,
    });
    return notification ? mapRecord(notification) : null;
  },

  create: async (data: AdminNotificationCreateInput) => {
    const user = await prisma.appUser.findUnique({
      where: { id: data.user_id },
      select: { id: true, email: true, deviceToken: true, notificationsEnabled: true, locale: true },
    });

    if (!user) {
      throw new Error(`User with id ${data.user_id} not found`);
    }

    return dispatchToUser(
      user.id,
      data,
      user.email,
      user.deviceToken ?? null,
      user.notificationsEnabled,
      user.locale,
    );
  },

  createForUser: async (
    userId: number,
    title: string,
    message: string,
    userType: string = "user",
    delivery?: DeliveryOptions & {
      default_locale?: string;
      localized_content?: LocalizedContentInput;
      metadata?: Record<string, unknown>;
    },
  ) => {
    const user = await prisma.appUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, deviceToken: true, notificationsEnabled: true, locale: true },
    });

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    return dispatchToUser(
      user.id,
      {
        user_id: user.id,
        user_type: userType,
        title,
        message,
        email: delivery?.email,
        push: delivery?.push,
        default_locale: delivery?.default_locale,
        localized_content: delivery?.localized_content,
        metadata: delivery?.metadata,
      },
      user.email ?? null,
      user.deviceToken ?? null,
      user.notificationsEnabled,
      user.locale,
    );
  },

  createForAllUsers: async (input: AdminNotificationForAllInput & { user_type?: string }) => {
    const users = await prisma.appUser.findMany({
      where: { status: "active" },
      select: { id: true, email: true, deviceToken: true, notificationsEnabled: true, locale: true },
    });

    if (users.length === 0) {
      return [];
    }

    return Promise.all(
      users.map((user) =>
        dispatchToUser(
          user.id,
          {
            user_id: user.id,
            user_type: input.user_type ?? "user",
            title: input.title,
            message: input.message,
            email: input.email,
            push: input.push,
            default_locale: input.default_locale,
            localized_content: input.localized_content,
            metadata: input.metadata,
          },
          user.email ?? null,
          user.deviceToken ?? null,
          user.notificationsEnabled,
          user.locale,
        ),
      ),
    );
  },

  markAsRead: async (id: string) => {
    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
      select: notificationSelect,
    });
    return mapRecord(updated);
  },

  markAsUnread: async (id: string) => {
    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: null },
      select: notificationSelect,
    });
    return mapRecord(updated);
  },

  delete: async (id: string) => {
    const updated = await prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: notificationSelect,
    });
    return mapRecord(updated);
  },

  formatSummary: mapSummary,
};
