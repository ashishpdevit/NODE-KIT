import fs from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const APP_USER_PASSWORD_SALT_ROUNDS = 10;
const ADMIN_PASSWORD_FALLBACK = "AdminPass123!";

type SeedAdmin = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
  apiTokenVersion?: number;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

const loadJson = async <T>(fileName: string): Promise<T> => {
  const filePath = path.join(__dirname, "..", "mocks", fileName);
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
};

const parseDate = (value: string | undefined | null) =>
  value ? new Date(value) : new Date();

const toJson = (value: unknown) => (value !== undefined ? JSON.stringify(value) : null);

async function seedCoreData() {
  const [
    admins,
    customers,
    orders,
    products,
    appSettings,
    appMenuLinks,
    contactRequests,
    faqs,
    languages,
    appUsers,
  ] = await Promise.all([
    loadJson<SeedAdmin[]>("admins.json"),
    loadJson<
      Array<{
        id: number;
        name: string;
        email: string;
        phone?: string;
        company?: string;
        status?: string;
        country?: string;
        timezone?: string;
        createdAt?: string;
        updatedAt?: string;
      }>
    >("customers.json"),
    loadJson<
      Array<{
        id: string;
        customer: string;
        total: number;
        date: string;
        status: string;
      }>
    >("orders.json"),
    loadJson<any[]>("products.json"),
    loadJson<
      Array<{
        id: number;
        label: string;
        version: string;
        forceUpdates: number;
        maintenance: number;
        updatedAt: string;
      }>
    >("appSettings.json"),
    loadJson<
      Array<{
        id: number;
        name: string;
        type: string;
        for: string;
        updatedAt: string;
        link: string;
      }>
    >("appMenuLinks.json"),
    loadJson<
      Array<{
        id: number;
        message: string;
        contact: string;
        createdAt: string;
      }>
    >("contactUs.json"),
    loadJson<
      Array<{
        id: number;
        question: Record<string, string>;
        answer: Record<string, string>;
        type: string;
        status: string;
      }>
    >("faqs.json"),
    loadJson<Array<{ code: string; label: string }>>("langs.json"),
    loadJson<
      Array<{
        email: string;
        password: string;
        name?: string;
        phone?: string;
        status?: string;
        lastLoginAt?: string;
        createdAt?: string;
        updatedAt?: string;
        apiTokenVersion?: number;
      }>
    >("appUsers.json"),
  ]);

  await prisma.rbacAssignment.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.rbacRole.deleteMany();
  await prisma.rbacPermission.deleteMany();
  await prisma.rbacModule.deleteMany();

  await prisma.passwordResetToken.deleteMany();
  await prisma.appUser.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.appMenuLink.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.language.deleteMany();

  const hashedAdmins = await Promise.all(
    admins.map(async (admin) => {
      const record: Prisma.AdminCreateManyInput = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        passwordHash: await bcrypt.hash(admin.password ?? ADMIN_PASSWORD_FALLBACK, APP_USER_PASSWORD_SALT_ROUNDS),
        apiTokenVersion: admin.apiTokenVersion ?? 1,
      };

      if (admin.lastLoginAt) {
        record.lastLoginAt = new Date(admin.lastLoginAt);
      }
      if (admin.createdAt) {
        record.createdAt = new Date(admin.createdAt);
      }
      if (admin.updatedAt) {
        record.updatedAt = new Date(admin.updatedAt);
      }

      return record;
    })
  );

  await prisma.admin.createMany({ data: hashedAdmins });

  await prisma.customer.createMany({
    data: customers.map((customer) => ({
      ...customer,
      createdAt: parseDate(customer.createdAt),
      updatedAt: parseDate(customer.updatedAt),
    })),
  });

  const customerMap = new Map(customers.map((customer) => [customer.name, customer.id]));

  await prisma.order.createMany({
    data: orders.map((order) => ({
      id: order.id,
      customerName: order.customer,
      total: order.total,
      status: order.status,
      date: parseDate(order.date),
      customerId: customerMap.get(order.customer),
    })),
  });

  await prisma.product.createMany({
    data: products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      inventory: product.inventory,
      status: product.status,
      category: product.category,
      sku: product.sku,
      description: product.description,
      brand: product.brand,
      barcode: product.barcode,
      featured: product.featured ?? false,
      images: toJson(product.images ?? []),
      tags: toJson(product.tags ?? []),
      variants: toJson(product.variants ?? []),
      dimensions: toJson(product.dimensions ?? null),
      shipping: toJson(product.shipping ?? null),
      seo: toJson(product.seo ?? null),
      createdAt: parseDate(product.createdAt),
      updatedAt: parseDate(product.updatedAt),
    })),
  });

  await prisma.appSetting.createMany({
    data: appSettings.map((setting) => ({
      ...setting,
      updatedAt: parseDate(setting.updatedAt),
    })),
  });

  await prisma.appMenuLink.createMany({
    data: appMenuLinks.map((link) => ({
      id: link.id,
      name: link.name,
      type: link.type,
      audience: link.for,
      link: link.link,
      updatedAt: parseDate(link.updatedAt),
    })),
  });

  await prisma.contactRequest.createMany({
    data: contactRequests.map((request) => ({
      ...request,
      createdAt: parseDate(request.createdAt),
    })),
  });

  await prisma.faq.createMany({
    data: faqs.map((faq) => ({
      id: faq.id,
      question: JSON.stringify(faq.question ?? {}),
      answer: JSON.stringify(faq.answer ?? {}),
      type: faq.type,
      status: faq.status,
    })),
  });

  if (appUsers.length > 0) {
    const hashedAppUsers = await Promise.all(
      appUsers.map(async (user) => ({
        email: user.email,
        name: user.name ?? null,
        phone: user.phone ?? null,
        status: user.status ?? "active",
        passwordHash: await bcrypt.hash(user.password, APP_USER_PASSWORD_SALT_ROUNDS),
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
        apiTokenVersion: user.apiTokenVersion ?? 1,
        createdAt: parseDate(user.createdAt),
        updatedAt: parseDate(user.updatedAt),
      }))
    );

    await prisma.appUser.createMany({ data: hashedAppUsers });
  }

  await prisma.language.createMany({ data: languages });


}

async function seedRbac() {
  const snapshot = await loadJson<{
    modules: Array<{
      id: string;
      name: string;
      description?: string;
      resource: string;
      tags?: string[];
    }>;
    permissions: Array<{
      id: string;
      name: string;
      description?: string;
      resource: string;
      action: string;
    }>;
    roles: Array<{
      id: string;
      name: string;
      description?: string;
      permissions: string[];
      isSystem?: boolean;
    }>;
    assignments: Array<{
      id: string;
      subjectId: string;
      subjectType: string;
      roleId: string;
    }>;
  }>("rbac.json");

  // Create modules and get their new IDs
  const createdModules = await Promise.all(
    snapshot.modules.map(async (module) => {
      const created = await prisma.rbacModule.create({
        data: {
          key: module.id, // Keep the original string ID as 'key'
          name: module.name,
          description: module.description,
          resource: module.resource,
          tags: toJson(module.tags ?? []),
        },
      });
      return { oldId: module.id, newId: created.id, resource: module.resource };
    })
  );

  const moduleIdMap = new Map(createdModules.map((m) => [m.oldId, m.newId]));
  const resourceToModuleIdMap = new Map(createdModules.map((m) => [m.resource, m.newId]));

  // Create permissions and get their new IDs
  const createdPermissions = await Promise.all(
    snapshot.permissions.map(async (permission) => {
      const created = await prisma.rbacPermission.create({
        data: {
          key: permission.id, // Keep the original string ID as 'key'
          name: permission.name,
          description: permission.description,
          resource: permission.resource,
          action: permission.action,
          moduleId: resourceToModuleIdMap.get(permission.resource) || null,
        },
      });
      return { oldId: permission.id, newId: created.id };
    })
  );

  const permissionIdMap = new Map(createdPermissions.map((p) => [p.oldId, p.newId]));

  // Create roles and get their new IDs
  const createdRoles = await Promise.all(
    snapshot.roles.map(async (role) => {
      const created = await prisma.rbacRole.create({
        data: {
          key: role.id, // Keep the original string ID as 'key'
          name: role.name,
          description: role.description,
          isSystem: role.isSystem ?? false,
        },
      });
      return { oldId: role.id, newId: created.id, permissions: role.permissions || [] };
    })
  );

  const roleIdMap = new Map(createdRoles.map((r) => [r.oldId, r.newId]));

  // Create role-permission links
  for (const role of createdRoles) {
    const validPermissionIds = role.permissions
      .filter((permissionId) => permissionId !== "*" && permissionIdMap.has(permissionId))
      .map((permissionId) => permissionIdMap.get(permissionId)!);

    for (const permissionId of validPermissionIds) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.newId,
          permissionId,
        },
      });
    }
  }

  // Create assignments
  if (snapshot.assignments.length > 0) {
    await prisma.rbacAssignment.createMany({
      data: snapshot.assignments.map((assignment) => ({
        key: assignment.id, // Keep the original string ID as 'key'
        subjectId: assignment.subjectId,
        subjectType: assignment.subjectType,
        roleId: roleIdMap.get(assignment.roleId) || 0,
      })),
    });
  }
}

async function main() {
  await seedCoreData();
  await seedRbac();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed error", error);
    await prisma.$disconnect();
    process.exit(1);
  });
