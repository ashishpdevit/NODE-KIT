import type { Prisma } from "@prisma/client";

import { mailer, type MailPayload } from "@/core/lib/mailer";
import { pushClient, type PushDispatchResult } from "@/core/lib/pushClient";
import { prisma } from "@/core/lib/prisma";
import { renderEmailTemplate } from "@/core/templates/email";
import { logger } from "@/core/utils/logger";
import { emailQueueService, type EmailJobData } from "./emailQueue";
import { pushQueueService, type PushJobData } from "./pushQueue";

type PushRecipient = string | string[];

type EmailDeliveryOptions = MailPayload & {
  template?: {
    id?: string;
    locale?: string;
    context?: Record<string, unknown>;
  };
};

type LocalizedNotificationEntry = {
  title?: string;
  message?: string;
  email?: EmailDeliveryOptions;
  push?: {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    imageUrl?: string;
  };
};

type EmailDispatchResult = {
  ok: boolean;
  skipped?: boolean;
  meta?: {
    messageId?: string;
    accepted?: string[];
    rejected?: string[];
    response?: string;
  };
  error?: string;
};

type PushDispatchResultSummary = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  successCount?: number;
  failureCount?: number;
  error?: string;
};

type StoredNotificationPayload = {
  locale: string;
  defaultLocale: string;
  title: string;
  message: string;
  titleTranslations?: Record<string, string>;
  messageTranslations?: Record<string, string>;
  metadata?: Record<string, unknown>;
  channels?: {
    email?: EmailDispatchResult;
    push?: PushDispatchResultSummary;
  };
};

type NotificationDispatchOptions = {
  title: string;
  message: string;
  defaultLocale?: string;
  localizedContent?: Record<string, LocalizedNotificationEntry>;
  targetLocale?: string;
  metadata?: Record<string, unknown>;
  persist?: boolean;
  read?: boolean;
  markAsRead?: boolean;
  notificationType?: string;
  notifiableType?: string;
  notifiableId?: number | bigint;
  email?: EmailDeliveryOptions;
  push?: {
    tokens?: PushRecipient;
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    imageUrl?: string;
  };
  defaultPushTokens?: PushRecipient;
  useQueue?: boolean;
  queueOptions?: {
    delay?: number;
    priority?: number;
  };
};

type NotificationDispatchSummary = {
  persisted?: {
    id: string;
    type: string;
    notifiableType: string;
    notifiableId: bigint;
    readAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    payload: StoredNotificationPayload;
  };
  email?: EmailDispatchResult;
  push?: PushDispatchResultSummary;
  queued?: {
    emailJobId?: string;
    pushJobId?: string;
  };
};

type ResolvedLocalization = {
  locale: string;
  title: string;
  message: string;
  email?: EmailDeliveryOptions;
  push?: {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    imageUrl?: string;
  };
};

const normalizeLocale = (locale?: string) => locale?.toLowerCase();

const findLocalizedEntry = (
  localized: Record<string, LocalizedNotificationEntry> | undefined,
  locale?: string,
) => {
  if (!localized || !locale) {
    return undefined;
  }

  const normalized = normalizeLocale(locale);
  if (!normalized) {
    return undefined;
  }

  const direct = localized[normalized];
  if (direct) {
    return direct;
  }

  const fallbackKey = normalized.split("-")[0];
  return localized[fallbackKey];
};

const resolveLocalization = (options: NotificationDispatchOptions): ResolvedLocalization => {
  const defaultLocale = normalizeLocale(options.defaultLocale) ?? "en";
  const targetLocale = normalizeLocale(options.targetLocale) ?? defaultLocale;

  const primaryEntry = findLocalizedEntry(options.localizedContent, targetLocale);
  const fallbackEntry = findLocalizedEntry(options.localizedContent, defaultLocale) ?? undefined;

  const title = primaryEntry?.title ?? fallbackEntry?.title ?? options.title;
  const message = primaryEntry?.message ?? fallbackEntry?.message ?? options.message;

  return {
    locale: primaryEntry ? targetLocale : fallbackEntry ? defaultLocale : defaultLocale,
    title,
    message,
    email: primaryEntry?.email ?? fallbackEntry?.email ?? options.email,
    push: primaryEntry?.push ?? fallbackEntry?.push ?? undefined,
  };
};

const buildTranslationMaps = (options: NotificationDispatchOptions, localization: ResolvedLocalization) => {
  const titleTranslations: Record<string, string> = {};
  const messageTranslations: Record<string, string> = {};

  if (options.localizedContent) {
    for (const [locale, entry] of Object.entries(options.localizedContent)) {
      if (entry.title) {
        titleTranslations[locale.toLowerCase()] = entry.title;
      }
      if (entry.message) {
        messageTranslations[locale.toLowerCase()] = entry.message;
      }
    }
  }

  const defaultLocale = normalizeLocale(options.defaultLocale) ?? "en";
  titleTranslations[defaultLocale] = titleTranslations[defaultLocale] ?? localization.title;
  messageTranslations[defaultLocale] = messageTranslations[defaultLocale] ?? localization.message;

  return {
    defaultLocale,
    titleTranslations: Object.keys(titleTranslations).length ? titleTranslations : undefined,
    messageTranslations: Object.keys(messageTranslations).length ? messageTranslations : undefined,
  };
};

const shouldPersistNotification = (options: NotificationDispatchOptions) => {
  if (options.persist === false) {
    return false;
  }

  if (options.notifiableType === undefined || options.notifiableId === undefined) {
    return false;
  }

  return true;
};

const sanitizeEmailResult = (result: EmailDispatchResult | undefined) => {
  if (!result) {
    return undefined;
  }

  return {
    ok: result.ok,
    skipped: result.skipped,
    error: result.error,
    meta: result.meta,
  } satisfies EmailDispatchResult;
};

const sanitizePushResult = (result: PushDispatchResult | undefined): PushDispatchResultSummary | undefined => {
  if (!result) {
    return undefined;
  }

  return {
    ok: result.ok,
    skipped: result.skipped,
    successCount: result.successCount,
    failureCount: result.failureCount,
    error: result.error ? String(result.error) : undefined,
  } satisfies PushDispatchResultSummary;
};

const dispatchEmail = async (
  options: NotificationDispatchOptions,
  localization: ResolvedLocalization,
): Promise<EmailDispatchResult | undefined> => {
  const emailOptions = localization.email ?? options.email;
  if (!emailOptions || !mailer.isEnabled) {
    return undefined;
  }

  let payload: MailPayload = {
    ...emailOptions,
    subject: emailOptions.subject ?? localization.title,
    text: emailOptions.text ?? localization.message,
  };

  if (emailOptions.template) {
    const rendered = renderEmailTemplate({
      templateId: emailOptions.template.id,
      locale: emailOptions.template.locale ?? localization.locale,
      context: emailOptions.template.context,
      fallback: {
        title: localization.title,
        message: localization.message,
      },
      overrides: {
        subject: payload.subject,
      },
    });

    payload = {
      ...payload,
      subject: rendered.subject ?? payload.subject,
      html: rendered.html ?? payload.html,
      text: rendered.text ?? payload.text,
    } satisfies MailPayload;
  }

  try {
    const info = await mailer.send(payload);
    const accepted = Array.isArray((info as unknown as { accepted?: unknown[] }).accepted)
      ? ((info as unknown as { accepted: string[] }).accepted)
      : undefined;
    const rejected = Array.isArray((info as unknown as { rejected?: unknown[] }).rejected)
      ? ((info as unknown as { rejected: string[] }).rejected)
      : undefined;
    const response = (info as unknown as { response?: string }).response;

    return {
      ok: true,
      meta: {
        messageId: (info as unknown as { messageId?: string }).messageId,
        accepted,
        rejected,
        response,
      },
    } satisfies EmailDispatchResult;
  } catch (error) {
    logger.error("Email notification failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } satisfies EmailDispatchResult;
  }
};

const resolvePushTokens = (options: NotificationDispatchOptions): PushRecipient | undefined => {
  if (options.push?.tokens) {
    return options.push.tokens;
  }
  return options.defaultPushTokens;
};

const dispatchPush = async (
  options: NotificationDispatchOptions,
  localization: ResolvedLocalization,
): Promise<PushDispatchResult | undefined> => {
  const tokens = resolvePushTokens(options);

  if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
    return undefined;
  }

  const localizedPush = localization.push ?? {};

  const payload = {
    ...(options.push?.data ? { data: options.push.data } : {}),
    ...(localizedPush.data ? { data: { ...options.push?.data, ...localizedPush.data } } : {}),
    ...(options.push?.imageUrl ? { imageUrl: options.push.imageUrl } : {}),
    ...(localizedPush.imageUrl ? { imageUrl: localizedPush.imageUrl } : {}),
    tokens,
    title: localizedPush.title ?? options.push?.title ?? localization.title,
    body: localizedPush.body ?? options.push?.body ?? localization.message,
  } satisfies Parameters<typeof pushClient.send>[0];

  return pushClient.send(payload);
};

const persistNotification = async (
  options: NotificationDispatchOptions,
  localization: ResolvedLocalization,
  channelResults: {
    email?: EmailDispatchResult;
    push?: PushDispatchResultSummary;
  },
) => {
  if (options.notifiableType === undefined || options.notifiableId === undefined) {
    throw new Error("Persisted notifications require notifiableType and notifiableId");
  }

  const translations = buildTranslationMaps(options, localization);

  const payload: StoredNotificationPayload = {
    locale: localization.locale,
    defaultLocale: translations.defaultLocale,
    title: localization.title,
    message: localization.message,
    titleTranslations: translations.titleTranslations,
    messageTranslations: translations.messageTranslations,
    metadata: options.metadata,
    channels: {
      email: sanitizeEmailResult(channelResults.email),
      push: channelResults.push,
    },
  };

  const notifiableId =
    typeof options.notifiableId === "bigint"
      ? options.notifiableId
      : BigInt(options.notifiableId);

  const markAsRead = options.markAsRead ?? options.read ?? false;

  const record = await prisma.notification.create({
    data: {
      type: options.notificationType ?? "notification",
      notifiableType: options.notifiableType,
      notifiableId,
      data: JSON.stringify(payload),
      readAt: markAsRead ? new Date() : undefined,
    },
    select: {
      id: true,
      type: true,
      notifiableType: true,
      notifiableId: true,
      data: true,
      readAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  return {
    id: record.id,
    type: record.type,
    notifiableType: record.notifiableType,
    notifiableId: record.notifiableId,
    readAt: record.readAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
    payload,
  } satisfies NotificationDispatchSummary["persisted"];
};

export const notificationCenter = {
  async dispatch(options: NotificationDispatchOptions): Promise<NotificationDispatchSummary> {
    const summary: NotificationDispatchSummary = {};

    const localization = resolveLocalization(options);

    // Use queues if requested
    if (options.useQueue) {
      return this.dispatchQueued(options, localization);
    }

    // Original synchronous dispatch
    const emailResult = await dispatchEmail(options, localization);
    const pushResult = await dispatchPush(options, localization);

    summary.email = emailResult;
    summary.push = sanitizePushResult(pushResult);

    if (shouldPersistNotification(options)) {
      try {
        summary.persisted = await persistNotification(options, localization, {
          email: sanitizeEmailResult(emailResult),
          push: summary.push,
        });
      } catch (error) {
        summary.persisted = undefined;
        logger.error("Failed to persist notification", error);
      }
    }

    return summary;
  },

  async dispatchQueued(options: NotificationDispatchOptions, localization?: ResolvedLocalization): Promise<NotificationDispatchSummary> {
    const summary: NotificationDispatchSummary = {};
    const resolvedLocalization = localization || resolveLocalization(options);

    // Prepare queue options
    const queueOptions = options.queueOptions || {};

    // Queue email job if email options are provided
    if (options.email || resolvedLocalization.email) {
      const emailOptions = resolvedLocalization.email ?? options.email;
      if (emailOptions && mailer.isEnabled) {
        try {
          const emailJobData: EmailJobData = {
            payload: {
              ...emailOptions,
              subject: emailOptions.subject ?? resolvedLocalization.title,
              text: emailOptions.text ?? resolvedLocalization.message,
            },
            template: emailOptions.template,
            metadata: {
              userId: typeof options.notifiableId === "number" ? options.notifiableId : undefined,
              notificationId: options.notificationType,
              source: "notification_center",
            },
          };

          const emailJob = await emailQueueService.addEmailJob(emailJobData, queueOptions);
          summary.queued = { ...summary.queued, emailJobId: String(emailJob.id) };

          logger.debug("Email queued for dispatch", {
            jobId: emailJob.id,
            to: emailJobData.payload.to,
            subject: emailJobData.payload.subject,
            userId: options.notifiableId,
          });
        } catch (error) {
          logger.error("Failed to queue email", error);
        }
      }
    }

    // Queue push notification job if push options are provided
    const tokens = resolvePushTokens(options);
    if (tokens && (Array.isArray(tokens) ? tokens.length > 0 : true)) {
      try {
        const localizedPush = resolvedLocalization.push ?? {};
        
        const pushJobData: PushJobData = {
          payload: {
            ...(options.push?.data ? { data: options.push.data } : {}),
            ...(localizedPush.data ? { data: { ...options.push?.data, ...localizedPush.data } } : {}),
            ...(options.push?.imageUrl ? { imageUrl: options.push.imageUrl } : {}),
            ...(localizedPush.imageUrl ? { imageUrl: localizedPush.imageUrl } : {}),
            tokens,
            title: localizedPush.title ?? options.push?.title ?? resolvedLocalization.title,
            body: localizedPush.body ?? options.push?.body ?? resolvedLocalization.message,
          },
          metadata: {
            userId: typeof options.notifiableId === "number" ? options.notifiableId : undefined,
            notificationId: options.notificationType,
            source: "notification_center",
            userType: options.notifiableType,
          },
        };

        const pushJob = await pushQueueService.addPushJob(pushJobData, queueOptions);
        summary.queued = { ...summary.queued, pushJobId: String(pushJob.id) };

        logger.debug("Push notification queued for dispatch", {
          jobId: pushJob.id,
          tokens: Array.isArray(tokens) ? tokens.length : 1,
          title: pushJobData.payload.title,
          userId: options.notifiableId,
        });
      } catch (error) {
        logger.error("Failed to queue push notification", error);
      }
    }

    // Persist notification if required
    if (shouldPersistNotification(options)) {
      try {
        summary.persisted = await persistNotification(options, resolvedLocalization, {
          email: undefined, // Will be updated when job completes
          push: undefined, // Will be updated when job completes
        });
      } catch (error) {
        summary.persisted = undefined;
        logger.error("Failed to persist notification", error);
      }
    }

    return summary;
  },

  async notifyUser(userId: number, options: NotificationDispatchOptions) {
    return this.dispatch({
      ...options,
      notifiableType: options.notifiableType ?? "app_user",
      notifiableId: options.notifiableId ?? userId,
    });
  },

  async notifyUserQueued(userId: number, options: NotificationDispatchOptions) {
    return this.dispatchQueued({
      ...options,
      notifiableType: options.notifiableType ?? "app_user",
      notifiableId: options.notifiableId ?? userId,
    });
  },

  async notifyMany(userIds: number[], options: NotificationDispatchOptions) {
    return Promise.all(userIds.map((userId) => this.notifyUser(userId, options)));
  },

  async notifyManyQueued(userIds: number[], options: NotificationDispatchOptions) {
    return Promise.all(userIds.map((userId) => this.notifyUserQueued(userId, options)));
  },
};

export type {
  EmailDeliveryOptions,
  EmailDispatchResult,
  LocalizedNotificationEntry,
  NotificationDispatchOptions,
  NotificationDispatchSummary,
  StoredNotificationPayload,
};
