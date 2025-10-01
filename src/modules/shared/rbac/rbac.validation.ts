import { z } from "zod";

export const rbacModuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  resource: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export const rbacModuleUpdateSchema = rbacModuleSchema.partial();

export const rbacPermissionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  resource: z.string().min(1),
  action: z.string().min(1),
  moduleId: z.string().optional(),
});

export const rbacPermissionUpdateSchema = rbacPermissionSchema.partial();

export const rbacRoleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  isSystem: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

export const rbacRoleUpdateSchema = rbacRoleSchema.partial();

export const rbacAssignmentSchema = z.object({
  id: z.string().optional(),
  subjectId: z.string().min(1),
  subjectType: z.string().min(1),
  roleId: z.string().min(1),
});

export const rbacAssignmentUpdateSchema = rbacAssignmentSchema.partial();