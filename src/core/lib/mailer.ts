import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

import { appConfig, mailConfig } from "@/core/config";
import { logger } from "@/core/utils/logger";

type MailPayload = Omit<SendMailOptions, "from"> & { from?: string };

let transporterPromise: Promise<Transporter> | null = null;

const buildTransporter = (): Transporter => {
  if (appConfig.nodeEnv === "test") {
    return nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: "unix",
    });
  }

  switch (mailConfig.transport) {
    case "smtp": {
      if (!mailConfig.smtp.host || !mailConfig.smtp.port) {
        throw new Error("SMTP transport selected but SMTP_HOST/SMTP_PORT are not configured");
      }

      const auth = mailConfig.smtp.user && mailConfig.smtp.password
        ? { user: mailConfig.smtp.user, pass: mailConfig.smtp.password }
        : undefined;

      if (!auth && appConfig.nodeEnv === "production") {
        logger.warn("SMTP credentials are missing while running in production. Mail delivery may fail.");
      }

      return nodemailer.createTransport({
        host: mailConfig.smtp.host,
        port: mailConfig.smtp.port,
        secure: mailConfig.smtp.secure,
        service: "gmail",
        auth: auth ?? undefined,
      });
    }
    case "json":
      return nodemailer.createTransport({ jsonTransport: true });
    default:
      return nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: "unix",
      });
  }
};

const getTransporter = async (): Promise<Transporter> => {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(buildTransporter());
  }
  return transporterPromise;
};

export const mailer = {
  isEnabled: mailConfig.transport !== "stub",

  async send(options: MailPayload) {
    const transporter = await getTransporter();
    const mailOptions = {
      from: options.from ?? mailConfig.from,
      ...options,
    } satisfies SendMailOptions;

    const info = await transporter.sendMail(mailOptions);

    if (mailConfig.transport !== "smtp") {
      logger.debug("Mail dispatched via", mailConfig.transport, info.message?.toString() ?? info);
    }

    return info;
  },
};

export type { MailPayload };
