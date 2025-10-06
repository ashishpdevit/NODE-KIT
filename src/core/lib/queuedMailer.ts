import type { SendMailOptions, Transporter } from "nodemailer";

import { appConfig, mailConfig, adminAuthConfig } from "@/core/config";
import { logger } from "@/core/utils/logger";
import { emailQueueService, type EmailJobData } from "@/core/services/emailQueue";

type MailPayload = Omit<SendMailOptions, "from"> & { from?: string };

export const queuedMailer = {
  isEnabled: mailConfig.transport !== "stub",

  /**
   * Send email immediately (synchronous)
   */
  async send(options: MailPayload) {
    // This method is kept for backward compatibility
    // In production, consider using sendQueued instead
    logger.warn("Using synchronous email send. Consider using sendQueued for better performance.");
    
    const { mailer } = await import("./mailer");
    return mailer.send(options);
  },

  /**
   * Queue an email for sending (asynchronous)
   */
  async sendQueued(options: MailPayload, template?: EmailJobData["template"], metadata?: EmailJobData["metadata"]) {
    if (!this.isEnabled) {
      logger.debug("Email sending is disabled, skipping queue");
      return { id: "disabled", success: false };
    }

    try {
      // Validate options
      if (!options || !options.to) {
        const error = "Email options are missing or invalid - 'to' field is required";
        logger.error("Invalid email options", { options, error });
        return { id: "error", success: false, error };
      }

      const emailJobData: EmailJobData = {
        payload: options,
        template,
        metadata,
      };

      logger.debug("Creating email job", {
        to: options.to,
        subject: options.subject,
        template: template?.id,
        userId: metadata?.userId,
      });

      const job = await emailQueueService.addEmailJob(emailJobData);
      
      logger.debug("Email queued for sending", {
        jobId: job.id,
        to: options.to,
        subject: options.subject,
        userId: metadata?.userId,
      });

      return { id: job.id, success: true };
    } catch (error) {
      logger.error("Failed to queue email", error);
      return { id: "error", success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Queue a password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, expiresAt: Date, userId?: number) {
    const expiresAtFormatted = expiresAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return this.sendQueued({
      to: email,
      subject: `${appConfig.name} - Password Reset Request`,
      // Plain text fallback
      text: `Use the following code to reset your password: ${token}\n\nThis code expires on ${expiresAtFormatted}.\n\nIf you didn't request this password reset, please ignore this email.`,
    }, {
      id: "password-reset",
      locale: "en",
      context: {
        greeting: `Hello!`,
        intro: [
          `We received a request to reset your password for your ${appConfig.name} account.`,
          `To complete the password reset process, please use the reset code provided below.`
        ],
        resetToken: token,
        expiresAt: expiresAtFormatted,
        outro: [
          `If you didn't request this password reset, please ignore this email and your password will remain unchanged.`,
          `For security reasons, this reset code will expire after the specified time.`
        ],
        footerNote: `Need help? Contact our support team if you have any questions.`
      }
    }, {
      userId,
      notificationId: "password_reset",
      source: "auth",
    });
  },

  /**
   * Queue a welcome email
   */
  async sendWelcomeEmail(email: string, name?: string, userId?: number) {
    const greeting = name ? `Hi ${name},` : "Hello!";
    
    return this.sendQueued({
      to: email,
      subject: `Welcome to ${appConfig.name}!`,
      // Plain text fallback
      text: `Welcome to ${appConfig.name}! ${greeting} Thank you for joining us. Your account has been successfully created and you can now start using all our features.`,
    }, {
      id: "welcome",
      locale: "en",
      context: {
        greeting: greeting,
        intro: [
          `Thank you for joining ${appConfig.name}!`,
          `Your account has been successfully created and you're all set to get started.`
        ],
        ctas: [
          {
            label: "Get Started",
            url: `${appConfig.name.toLowerCase().replace(/\s+/g, '-')}.com/dashboard`
          }
        ],
        outro: [
          `We're excited to have you on board and look forward to providing you with an amazing experience.`,
          `If you have any questions, don't hesitate to reach out to our support team.`
        ],
        footerNote: `Welcome to the ${appConfig.name} family!`
      }
    }, {
      userId,
      notificationId: "welcome",
      source: "auth",
    });
  },

  /**
   * Queue an admin password reset email
   */
  async sendAdminPasswordResetEmail(email: string, adminName: string, token: string, expiresAt: Date, adminId?: number) {
    const expiresAtFormatted = expiresAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const greeting = adminName ? `Hello ${adminName},` : "Hello Admin,";
    
    // Create reset link - you can customize this URL based on your admin panel setup
    const resetLink = `${adminAuthConfig.panelUrl || 'http://localhost:3000'}/admin/reset-password?token=${token}`;

    return this.sendQueued({
      to: email,
      subject: `${appConfig.name} - Admin Password Reset Request`,
      // Plain text fallback
      text: `Admin Password Reset Request\n\n${greeting}\n\nClick the following link to reset your admin password: ${resetLink}\n\nOr use this reset code: ${token}\n\nThis link expires on ${expiresAtFormatted}.\n\nThis is an administrative password reset request. If you didn't request this reset, please contact your system administrator immediately.`,
    }, {
      id: "admin-password-reset",
      locale: "en",
      context: {
        greeting: greeting,
        intro: [
          `We received a request to reset the admin password for your ${appConfig.name} administrator account.`,
          `To complete the password reset process, please click the button below or use the reset link provided.`
        ],
        resetToken: token,
        resetLink: resetLink,
        expiresAt: expiresAtFormatted,
        ctas: [
          {
            label: "Reset Admin Password",
            url: resetLink
          }
        ],
        outro: [
          `This is an administrative password reset request. If you didn't initiate this reset, your account may be compromised.`,
          `Please contact your system administrator immediately if you did not request this password reset.`,
          `If the button doesn't work, copy and paste this link into your browser: ${resetLink}`
        ],
        footerNote: `Admin password resets require immediate attention. Contact support if you have any concerns.`
      }
    }, {
      userId: adminId,
      notificationId: "admin_password_reset",
      source: "admin_auth",
    });
  },

  /**
   * Queue a notification email
   */
  async sendNotificationEmail(email: string, title: string, message: string, userId?: number) {
    return this.sendQueued({
      to: email,
      subject: title,
      text: message,
      html: `<h2>${title}</h2><p>${message}</p>`,
    }, undefined, {
      userId,
      notificationId: "notification",
      source: "notification_center",
    });
  },
};

export type { MailPayload };
