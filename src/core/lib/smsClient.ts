import { appConfig } from "@/core/config";
import { logger } from "@/core/utils/logger";
import { env } from "@/core/config/env";

type SmsPayload = {
  to: string | string[];
  message: string;
  from?: string;
};

type SmsDispatchResult = {
  ok: boolean;
  skipped?: boolean;
  successCount?: number;
  failureCount?: number;
  messageIds?: string[];
  error?: string;
};

/**
 * Normalize phone number to E.164 format if needed
 */
const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // If it doesn't start with +, assume it needs country code
  if (!cleaned.startsWith("+")) {
    // You can customize this based on your default country
    return `+${cleaned}`;
  }
  
  return cleaned;
};

/**
 * Twilio SMS Client
 */
const sendViaTwilio = async (payload: SmsPayload): Promise<SmsDispatchResult> => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    logger.error("Twilio credentials are missing");
    return {
      ok: false,
      error: "Twilio credentials are not configured",
    };
  }

  try {
    // Dynamically import Twilio to avoid requiring it if not used
    const twilio = await import("twilio" as any);
    const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const from = payload.from || TWILIO_PHONE_NUMBER;

    const results = await Promise.allSettled(
      recipients.map((to) =>
        client.messages.create({
          body: payload.message,
          from,
          to: normalizePhoneNumber(to),
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    const messageIds = successful.map((r) =>
      r.status === "fulfilled" ? r.value.sid : ""
    );

    logger.info("SMS sent via Twilio", {
      successCount: successful.length,
      failureCount: failed.length,
      messageIds,
    });

    return {
      ok: failed.length === 0,
      successCount: successful.length,
      failureCount: failed.length,
      messageIds,
    };
  } catch (error) {
    // Check if it's a module not found error
    if (error instanceof Error && error.message.includes("Cannot find module")) {
      logger.error("Twilio SDK is not installed. Run: npm install twilio");
      return {
        ok: false,
        error: "Twilio SDK is not installed. Please run: npm install twilio",
      };
    }
    logger.error("Twilio SMS dispatch failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Vonage (Nexmo) SMS Client
 */
const sendViaVonage = async (payload: SmsPayload): Promise<SmsDispatchResult> => {
  const { VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM } = env;

  if (!VONAGE_API_KEY || !VONAGE_API_SECRET || !VONAGE_FROM) {
    logger.error("Vonage credentials are missing");
    return {
      ok: false,
      error: "Vonage credentials are not configured",
    };
  }

  try {
    // Dynamically import Vonage to avoid requiring it if not used
    const { Vonage } = await import("@vonage/server-sdk" as any);
    const vonage = new Vonage({
      apiKey: VONAGE_API_KEY,
      apiSecret: VONAGE_API_SECRET,
    });

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const from = payload.from || VONAGE_FROM;

    const results = await Promise.allSettled(
      recipients.map((to) =>
        vonage.sms.send({
          to: normalizePhoneNumber(to),
          from,
          text: payload.message,
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    const messageIds = successful.map((r) => {
      if (r.status === "fulfilled") {
        const messages = (r.value as any).messages || [];
        return messages[0]?.["message-id"] || "";
      }
      return "";
    });

    logger.info("SMS sent via Vonage", {
      successCount: successful.length,
      failureCount: failed.length,
      messageIds,
    });

    return {
      ok: failed.length === 0,
      successCount: successful.length,
      failureCount: failed.length,
      messageIds,
    };
  } catch (error) {
    // Check if it's a module not found error
    if (error instanceof Error && error.message.includes("Cannot find module")) {
      logger.error("Vonage SDK is not installed. Run: npm install @vonage/server-sdk");
      return {
        ok: false,
        error: "Vonage SDK is not installed. Please run: npm install @vonage/server-sdk",
      };
    }
    logger.error("Vonage SMS dispatch failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Stub SMS Client (for testing/development)
 */
const sendViaStub = async (payload: SmsPayload): Promise<SmsDispatchResult> => {
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  logger.debug("SMS stub dispatch", {
    to: recipients,
    message: payload.message,
    from: payload.from,
  });

  // In test environment, just log and return success
  if (appConfig.nodeEnv === "test") {
    return {
      ok: true,
      skipped: true,
      successCount: recipients.length,
      failureCount: 0,
      messageIds: recipients.map(() => `stub-${Date.now()}-${Math.random()}`),
    };
  }

  // In development, log to console
  console.log("\n📱 SMS STUB MODE");
  console.log("════════════════════════════════════════");
  console.log(`To: ${recipients.join(", ")}`);
  console.log(`From: ${payload.from || "default"}`);
  console.log(`Message: ${payload.message}`);
  console.log("════════════════════════════════════════\n");

  return {
    ok: true,
    skipped: true,
    successCount: recipients.length,
    failureCount: 0,
    messageIds: recipients.map(() => `stub-${Date.now()}-${Math.random()}`),
  };
};

export const smsClient = {
  get isEnabled() {
    return env.SMS_PROVIDER !== "stub";
  },

  get provider() {
    return env.SMS_PROVIDER;
  },

  async send(payload: SmsPayload): Promise<SmsDispatchResult> {
    // Validate payload
    if (!payload.to || !payload.message) {
      logger.error("Invalid SMS payload", { payload });
      return {
        ok: false,
        error: "SMS payload must include 'to' and 'message' fields",
      };
    }

    // Dispatch based on provider
    switch (env.SMS_PROVIDER) {
      case "twilio":
        return sendViaTwilio(payload);
      case "vonage":
        return sendViaVonage(payload);
      case "stub":
      default:
        return sendViaStub(payload);
    }
  },
};

export type { SmsPayload, SmsDispatchResult };

