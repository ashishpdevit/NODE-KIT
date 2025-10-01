import crypto from "node:crypto";
import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";

import { rbacService } from "./rbac.service";
import {
  rbacAssignmentSchema,
  rbacAssignmentUpdateSchema,
  rbacModuleSchema,
  rbacModuleUpdateSchema,
  rbacPermissionSchema,
  rbacPermissionUpdateSchema,
  rbacRoleSchema,
  rbacRoleUpdateSchema,
} from "./rbac.validation";

const ensurePayload = (payload: Record<string, unknown>) => {
  if (Object.keys(payload).length === 0) {
    throw new Error("No fields provided for update");
  }
};

export const getRbacSnapshot = async (_req: Request, res: Response) => {
  const snapshot = await rbacService.snapshot();
  res.json(toSuccess("RBAC snapshot fetched", snapshot));
};

// Modules
export const listRbacModules = async (_req: Request, res: Response) => {
  const data = await rbacService.listModules();
  res.json(toSuccess("RBAC modules fetched", data));
};

export const getRbacModule = async (req: Request, res: Response) => {
  const module = await rbacService.getModule(req.params.id);
  if (!module) {
    return res.status(404).json(toError("Module not found"));
  }
  res.json(toSuccess("RBAC module fetched", module));
};

export const createRbacModule = async (req: Request, res: Response) => {
  const parsed = rbacModuleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  try {
    const created = await rbacService.createModule({
      ...parsed.data,
      tags: parsed.data.tags ?? [],
    });
    res.status(201).json(toSuccess("RBAC module created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateRbacModule = async (req: Request, res: Response) => {
  const parsed = rbacModuleUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  try {
    ensurePayload(parsed.data as Record<string, unknown>);
    const updated = await rbacService.updateModule(req.params.id, {
      ...parsed.data,
      tags: parsed.data.tags ?? undefined,
    });
    res.json(toSuccess("RBAC module updated", updated));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("No fields")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const deleteRbacModule = async (req: Request, res: Response) => {
  try {
    const removed = await rbacService.deleteModule(req.params.id);
    res.json(toSuccess("RBAC module deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

// Permissions
export const listRbacPermissions = async (_req: Request, res: Response) => {
  const data = await rbacService.listPermissions();
  res.json(toSuccess("RBAC permissions fetched", data));
};

export const getRbacPermission = async (req: Request, res: Response) => {
  const permission = await rbacService.getPermission(req.params.id);
  if (!permission) {
    return res.status(404).json(toError("Permission not found"));
  }
  res.json(toSuccess("RBAC permission fetched", permission));
};

export const createRbacPermission = async (req: Request, res: Response) => {
  const parsed = rbacPermissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  try {
    const created = await rbacService.createPermission(parsed.data);
    res.status(201).json(toSuccess("RBAC permission created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateRbacPermission = async (req: Request, res: Response) => {
  const parsed = rbacPermissionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  try {
    ensurePayload(parsed.data as Record<string, unknown>);
    const updated = await rbacService.updatePermission(req.params.id, parsed.data);
    res.json(toSuccess("RBAC permission updated", updated));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("No fields")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const deleteRbacPermission = async (req: Request, res: Response) => {
  try {
    const removed = await rbacService.deletePermission(req.params.id);
    res.json(toSuccess("RBAC permission deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

// Roles
export const listRbacRoles = async (req: Request, res: Response) => {
  const systemOnly = req.query.system === "true";
  const roles = await rbacService.listRoles(systemOnly);
  res.json(toSuccess("RBAC roles fetched", roles));
};

export const getRbacRole = async (req: Request, res: Response) => {
  const role = await rbacService.getRole(req.params.id);
  if (!role) {
    return res.status(404).json(toError("Role not found"));
  }
  res.json(toSuccess("RBAC role fetched", role));
};

export const createRbacRole = async (req: Request, res: Response) => {
  const parsed = rbacRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  try {
    const created = await rbacService.createRole({
      ...parsed.data,
      permissions: undefined,
      permissionIds: parsed.data.permissions ?? [],
    });
    res.status(201).json(toSuccess("RBAC role created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateRbacRole = async (req: Request, res: Response) => {
  const parsed = rbacRoleUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  try {
    const { permissions: updatePermissions, ...roleUpdates } = updates;
    const updated = await rbacService.updateRole(req.params.id, {
      ...roleUpdates,
      permissionIds: updatePermissions,
    });
    res.json(toSuccess("RBAC role updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteRbacRole = async (req: Request, res: Response) => {
  try {
    const removed = await rbacService.deleteRole(req.params.id);
    res.json(toSuccess("RBAC role deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

// Assignments
export const listRbacAssignments = async (req: Request, res: Response) => {
  const subjectId = typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;
  const assignments = await rbacService.listAssignments(subjectId);
  res.json(toSuccess("RBAC assignments fetched", assignments));
};

export const getRbacAssignment = async (req: Request, res: Response) => {
  const assignment = await rbacService.getAssignment(req.params.id);
  if (!assignment) {
    return res.status(404).json(toError("Assignment not found"));
  }
  res.json(toSuccess("RBAC assignment fetched", assignment));
};

export const createRbacAssignment = async (req: Request, res: Response) => {
  const parsed = rbacAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const payload = {
    ...parsed.data,
    id: parsed.data.id ?? `assign-${crypto.randomUUID()}`,
  };

  try {
    const created = await rbacService.createAssignment(payload as any);
    res.status(201).json(toSuccess("RBAC assignment created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateRbacAssignment = async (req: Request, res: Response) => {
  const parsed = rbacAssignmentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  try {
    const updated = await rbacService.updateAssignment(req.params.id, updates as any);
    res.json(toSuccess("RBAC assignment updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteRbacAssignment = async (req: Request, res: Response) => {
  try {
    const removed = await rbacService.deleteAssignment(req.params.id);
    res.json(toSuccess("RBAC assignment deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
