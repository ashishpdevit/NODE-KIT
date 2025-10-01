import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";
import { hashPassword } from "@/core/utils/security";

import { adminService } from "./admin.service";
import { adminCreateSchema, adminUpdateSchema } from "./admin.validation";

export const listAdmins = async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const admins = await adminService.list(status);
  res.json(toSuccess("Admins fetched", admins));
};

export const getAdmin = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "admin id");
    const admin = await adminService.get(id);

    if (!admin) {
      return res.status(404).json(toError("Admin not found"));
    }

    res.json(toSuccess("Admin fetched", admin));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  const parsed = adminCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const { password, ...rest } = parsed.data;

  try {
    const created = await adminService.create({
      ...rest,
      passwordHash: await hashPassword(password),
    });
    res.status(201).json(toSuccess("Admin created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  const parsedBody = adminUpdateSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json(toError("Invalid payload", parsedBody.error.flatten()));
  }

  const updateData = parsedBody.data;
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  const prismaUpdate: Prisma.AdminUpdateInput = {};

  if (updateData.name !== undefined) {
    prismaUpdate.name = updateData.name;
  }
  if (updateData.email !== undefined) {
    prismaUpdate.email = updateData.email;
  }
  if (updateData.role !== undefined) {
    prismaUpdate.role = updateData.role;
  }
  if (updateData.status !== undefined) {
    prismaUpdate.status = updateData.status;
  }
  if (updateData.password) {
    prismaUpdate.passwordHash = await hashPassword(updateData.password);
    prismaUpdate.apiTokenVersion = { increment: 1 };
  }

  try {
    const id = parseNumericParam(req.params.id, "admin id");
    const updated = await adminService.update(id, prismaUpdate);
    res.json(toSuccess("Admin updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "admin id");
    const removed = await adminService.delete(id);
    res.json(toSuccess("Admin deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
