import crypto from "node:crypto";

import bcrypt from "bcryptjs";

export const APP_PASSWORD_SALT_ROUNDS = 10;

export const hashPassword = (password: string) => bcrypt.hash(password, APP_PASSWORD_SALT_ROUNDS);

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const hashToken = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const createResetTokenPair = (sizeInBytes = 32) => {
  const token = crypto.randomBytes(sizeInBytes).toString("hex");
  return { token, tokenHash: hashToken(token) } as const;
};

export const secureRandomString = (sizeInBytes = 32) =>
  crypto.randomBytes(sizeInBytes).toString("hex");
