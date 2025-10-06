import jwt, { type SignOptions, type Secret } from "jsonwebtoken";

import { adminAuthConfig, authConfig } from "@/core/config";

export interface AppJwtPayload {
  sub: string;
  email: string;
  version: number;
}

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
  version: number;
}

export const signAppJwt = (payload: AppJwtPayload, options?: SignOptions) => {
  const signOptions: SignOptions = {
    expiresIn: authConfig.jwtExpiresIn as SignOptions["expiresIn"],
    ...options,
  };

  return jwt.sign(payload, authConfig.jwtSecret as Secret, signOptions);
};

export const verifyAppJwt = (token: string): AppJwtPayload => {
  const decoded = jwt.verify(token, authConfig.jwtSecret);

  if (typeof decoded === "string" || !decoded) {
    throw new Error("Invalid token payload");
  }

  return decoded as AppJwtPayload;
};

export const signAdminJwt = (payload: AdminJwtPayload, options?: SignOptions) => {
  const signOptions: SignOptions = {
    // expiresIn: adminAuthConfig.jwtExpiresIn as SignOptions["expiresIn"],
    ...options,
  };

  return jwt.sign(payload, adminAuthConfig.jwtSecret as Secret, signOptions);
};

export const verifyAdminJwt = (token: string): AdminJwtPayload => {
  const decoded = jwt.verify(token, adminAuthConfig.jwtSecret);

  if (typeof decoded === "string" || !decoded) {
    throw new Error("Invalid token payload");
  }

  return decoded as AdminJwtPayload;
};
