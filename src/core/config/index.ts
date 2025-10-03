import { env } from "./env";

export const appConfig = {
  name: env.APP_NAME,
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  nodeEnv: env.NODE_ENV,
};

export const authConfig = {
  apiKey: env.APP_API_KEY,
  jwtSecret: env.APP_JWT_SECRET,
  jwtExpiresIn: env.APP_JWT_EXPIRES_IN,
  resetTokenTtlMinutes: env.APP_PASSWORD_RESET_TOKEN_TTL_MINUTES,
};

export const adminAuthConfig = {
  jwtSecret: env.ADMIN_JWT_SECRET,
  jwtExpiresIn: env.ADMIN_JWT_EXPIRES_IN,
};

export const mailConfig = {
  transport: env.MAIL_TRANSPORT,
  from: env.MAIL_FROM,
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  },
};

export const firebaseConfig = {
  projectId: env.FIREBASE_PROJECT_ID,
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
  privateKey: env.FIREBASE_PRIVATE_KEY,
};
