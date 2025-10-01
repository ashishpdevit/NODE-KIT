import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

type RoleWithPermissions = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

const mapRole = (
  role: Prisma.RbacRoleGetPayload<{ include: { permissions: { include: { permission: true } } } }>
): RoleWithPermissions => ({
  id: role.id,
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  permissions: role.permissions.map((link) => link.permissionId),
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

const parseTags = (tags: string | null) => {
  if (!tags) return [] as string[];
  try {
    return JSON.parse(tags) as string[];
  } catch {
    return [] as string[];
  }
};

const serialiseTags = (tags?: string[]) => (tags ? JSON.stringify(tags) : null);

export const rbacService = {
  snapshot: async () => {
    const [modules, permissions, roles, assignments] = await Promise.all([
      prisma.rbacModule.findMany({ orderBy: { name: "asc" } }),
      prisma.rbacPermission.findMany({ orderBy: { name: "asc" } }),
      prisma.rbacRole.findMany({
        orderBy: { name: "asc" },
        include: { permissions: { include: { permission: true } } },
      }),
      prisma.rbacAssignment.findMany({ orderBy: { subjectId: "asc" } }),
    ]);

    return {
      modules: modules.map((module) => ({ ...module, tags: parseTags(module.tags) })),
      permissions,
      roles: roles.map(mapRole),
      assignments,
    };
  },

  // Modules
  listModules: async () => {
    const modules = await prisma.rbacModule.findMany({ orderBy: { name: "asc" } });
    return modules.map((module) => ({ ...module, tags: parseTags(module.tags) }));
  },
  getModule: async (id: string) => {
    const module = await prisma.rbacModule.findUnique({ where: { id } });
    return module ? { ...module, tags: parseTags(module.tags) } : null;
  },
  createModule: async (data: { id: string; name: string; resource: string; description?: string; tags?: string[] }) => {
    const created = await prisma.rbacModule.create({
      data: {
        id: data.id,
        name: data.name,
        resource: data.resource,
        description: data.description,
        tags: serialiseTags(data.tags),
      },
    });
    return { ...created, tags: parseTags(created.tags) };
  },
  updateModule: async (
    id: string,
    data: { name?: string; resource?: string; description?: string | null; tags?: string[] | null }
  ) => {
    const updated = await prisma.rbacModule.update({
      where: { id },
      data: {
        ...data,
        tags: data.tags !== undefined ? serialiseTags(data.tags ?? undefined) : undefined,
      },
    });
    return { ...updated, tags: parseTags(updated.tags) };
  },
  deleteModule: async (id: string) => {
    const removed = await prisma.rbacModule.delete({ where: { id } });
    return { ...removed, tags: parseTags(removed.tags) };
  },

  // Permissions
  listPermissions: async () => {
    const permissions = await prisma.rbacPermission.findMany({ orderBy: { name: "asc" } });
    return permissions.map((permission) => ({ ...permission, moduleId: permission.moduleId ?? undefined }));
  },
  getPermission: async (id: string) => {
    const permission = await prisma.rbacPermission.findUnique({ where: { id } });
    return permission ? { ...permission, moduleId: permission.moduleId ?? undefined } : null;
  },
  createPermission: (data: Prisma.RbacPermissionCreateInput) =>
    prisma.rbacPermission.create({ data }),
  updatePermission: (id: string, data: Prisma.RbacPermissionUpdateInput) =>
    prisma.rbacPermission.update({ where: { id }, data }),
  deletePermission: (id: string) => prisma.rbacPermission.delete({ where: { id } }),

  // Roles
  listRoles: async (systemOnly?: boolean) => {
    const roles = await prisma.rbacRole.findMany({
      where: systemOnly ? { isSystem: true } : undefined,
      orderBy: { name: "asc" },
      include: { permissions: { include: { permission: true } } },
    });
    return roles.map(mapRole);
  },
  getRole: async (id: string) => {
    const role = await prisma.rbacRole.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    return role ? mapRole(role) : null;
  },
  createRole: async (
    data: Prisma.RbacRoleCreateInput & { permissionIds?: string[] }
  ) => {
    const { permissionIds = [], ...roleData } = data;
    return prisma.$transaction(async (tx) => {
      const role = await tx.rbacRole.create({ data: roleData });
      if (permissionIds.length > 0) {
        for (const permissionId of permissionIds) {
          await tx.rolePermission.create({ data: { roleId: role.id, permissionId } });
        }
      }
      const fullRole = await tx.rbacRole.findUnique({
        where: { id: role.id },
        include: { permissions: { include: { permission: true } } },
      });
      if (!fullRole) {
        throw new Error("Role not found after creation");
      }
      return mapRole(fullRole);
    });
  },
  updateRole: async (
    id: string,
    data: Prisma.RbacRoleUpdateInput & { permissionIds?: string[] }
  ) => {
    const { permissionIds, ...roleData } = data;
    return prisma.$transaction(async (tx) => {
      await tx.rbacRole.update({ where: { id }, data: roleData });
      if (permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        for (const permissionId of permissionIds) {
          await tx.rolePermission.create({ data: { roleId: id, permissionId } });
        }
      }
      const fullRole = await tx.rbacRole.findUnique({
        where: { id },
        include: { permissions: { include: { permission: true } } },
      });
      if (!fullRole) {
        throw new Error("Role not found after update");
      }
      return mapRole(fullRole);
    });
  },
  deleteRole: (id: string) => prisma.rbacRole.delete({ where: { id } }),

  // Assignments
  listAssignments: (subjectId?: string) =>
    prisma.rbacAssignment.findMany({
      where: subjectId ? { subjectId } : undefined,
      orderBy: { subjectId: "asc" },
    }),
  getAssignment: (id: string) => prisma.rbacAssignment.findUnique({ where: { id } }),
  createAssignment: (data: Prisma.RbacAssignmentUncheckedCreateInput) =>
    prisma.rbacAssignment.create({ data }),
  updateAssignment: (id: string, data: Prisma.RbacAssignmentUncheckedUpdateInput) =>
    prisma.rbacAssignment.update({ where: { id }, data }),
  deleteAssignment: (id: string) => prisma.rbacAssignment.delete({ where: { id } }),
};
