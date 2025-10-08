import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

type RoleWithPermissions = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: number[];
  createdAt: Date;
  updatedAt: Date;
};

const mapRole = (
  role: Prisma.RbacRoleGetPayload<{ include: { permissions: { include: { permission: true } } } }>
): RoleWithPermissions => ({
  id: role.id,
  key: role.key,
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
  getModule: async (id: number) => {
    const module = await prisma.rbacModule.findUnique({ where: { id } });
    return module ? { ...module, tags: parseTags(module.tags) } : null;
  },
  createModule: async (data: { key: string; name: string; resource: string; description?: string; tags?: string[] }) => {
    const created = await prisma.rbacModule.create({
      data: {
        key: data.key,
        name: data.name,
        resource: data.resource,
        description: data.description,
        tags: serialiseTags(data.tags),
      },
    });
    return { ...created, tags: parseTags(created.tags) };
  },
  updateModule: async (
    id: number,
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
  deleteModule: async (id: number) => {
    // First, get all permissions associated with this module
    const permissions = await prisma.rbacPermission.findMany({ where: { moduleId: id } });
    
    // Delete role-permission links for these permissions
    for (const permission of permissions) {
      await prisma.rolePermission.deleteMany({ where: { permissionId: permission.id } });
    }
    
    // Delete all permissions associated with this module
    await prisma.rbacPermission.deleteMany({ where: { moduleId: id } });
    
    // Finally, delete the module itself
    const removed = await prisma.rbacModule.delete({ where: { id } });
    return { ...removed, tags: parseTags(removed.tags) };
  },

  // Permissions
  listPermissions: async () => {
    const permissions = await prisma.rbacPermission.findMany({ orderBy: { name: "asc" } });
    return permissions.map((permission) => ({ ...permission, moduleId: permission.moduleId ?? undefined }));
  },
  getPermission: async (id: number) => {
    const permission = await prisma.rbacPermission.findUnique({ where: { id } });
    return permission ? { ...permission, moduleId: permission.moduleId ?? undefined } : null;
  },
  createPermission: (data: Prisma.RbacPermissionCreateInput) =>
    prisma.rbacPermission.create({ data }),
  updatePermission: (id: number, data: Prisma.RbacPermissionUpdateInput) =>
    prisma.rbacPermission.update({ where: { id }, data }),
  deletePermission: async (id: number) => {
    // First, delete all role-permission links for this permission
    await prisma.rolePermission.deleteMany({ where: { permissionId: id } });
    
    // Then, delete the permission itself
    return prisma.rbacPermission.delete({ where: { id } });
  },

  // Roles
  listRoles: async (systemOnly?: boolean) => {
    const roles = await prisma.rbacRole.findMany({
      where: systemOnly ? { isSystem: true } : undefined,
      orderBy: { name: "asc" },
      include: { permissions: { include: { permission: true } } },
    });
    return roles.map(mapRole);
  },
  getRole: async (id: number) => {
    const role = await prisma.rbacRole.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    return role ? mapRole(role) : null;
  },
  createRole: async (
    data: Prisma.RbacRoleCreateInput & { permissionIds?: number[] }
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
    id: number,
    data: Prisma.RbacRoleUpdateInput & { permissionIds?: number[] }
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
  deleteRole: async (id: number) => {
    // First, delete all role-permission links
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    
    // Then, delete all assignments for this role
    await prisma.rbacAssignment.deleteMany({ where: { roleId: id } });
    
    // Finally, delete the role itself
    return prisma.rbacRole.delete({ where: { id } });
  },

  // Assignments
  listAssignments: (subjectId?: string) =>
    prisma.rbacAssignment.findMany({
      where: subjectId ? { subjectId } : undefined,
      orderBy: { subjectId: "asc" },
    }),
  getAssignment: (id: number) => prisma.rbacAssignment.findUnique({ where: { id } }),
  createAssignment: (data: Prisma.RbacAssignmentUncheckedCreateInput) =>
    prisma.rbacAssignment.create({ data }),
  updateAssignment: (id: number, data: Prisma.RbacAssignmentUncheckedUpdateInput) =>
    prisma.rbacAssignment.update({ where: { id }, data }),
  deleteAssignment: (id: number) => prisma.rbacAssignment.delete({ where: { id } }),
};
