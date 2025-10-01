"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const APP_USER_PASSWORD_SALT_ROUNDS = 10;
const loadJson = async (fileName) => {
    const filePath = node_path_1.default.join(__dirname, "..", "mocks", fileName);
    const content = await promises_1.default.readFile(filePath, "utf8");
    return JSON.parse(content);
};
const parseDate = (value) => value ? new Date(value) : new Date();
const toJson = (value) => (value !== undefined ? JSON.stringify(value) : null);
async function seedCoreData() {
    const [admins, customers, orders, products, appSettings, appMenuLinks, contactRequests, faqs, languages, appUsers,] = await Promise.all([
        loadJson("admins.json"),
        loadJson("customers.json"),
        loadJson("orders.json"),
        loadJson("products.json"),
        loadJson("appSettings.json"),
        loadJson("appMenuLinks.json"),
        loadJson("contactUs.json"),
        loadJson("faqs.json"),
        loadJson("langs.json"),
        loadJson("appUsers.json"),
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
    await prisma.admin.createMany({ data: admins });
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
            date: parseDate(order.date),
            status: order.status,
            customerId: customerMap.get(order.customer) ?? null,
        })),
    });
    await prisma.product.createMany({
        data: products.map((product) => ({
            ...product,
            createdAt: parseDate(product.createdAt),
            updatedAt: parseDate(product.updatedAt),
            images: toJson(product.images ?? []),
            tags: toJson(product.tags ?? []),
            variants: toJson(product.variants ?? []),
            dimensions: toJson(product.dimensions ?? {}),
            shipping: toJson(product.shipping ?? {}),
            seo: toJson(product.seo ?? {}),
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
        const hashedAppUsers = await Promise.all(appUsers.map(async (user) => ({
            email: user.email,
            name: user.name ?? null,
            phone: user.phone ?? null,
            status: user.status ?? "active",
            passwordHash: await bcryptjs_1.default.hash(user.password, APP_USER_PASSWORD_SALT_ROUNDS),
            lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
            apiTokenVersion: user.apiTokenVersion ?? 1,
            createdAt: parseDate(user.createdAt),
            updatedAt: parseDate(user.updatedAt),
        })));
        await prisma.appUser.createMany({ data: hashedAppUsers });
    }
    await prisma.language.createMany({ data: languages });
}
async function seedRbac() {
    const snapshot = await loadJson("rbac.json");
    await prisma.rbacModule.createMany({
        data: snapshot.modules.map((module) => ({
            id: module.id,
            name: module.name,
            description: module.description,
            resource: module.resource,
            tags: toJson(module.tags ?? []),
        })),
    });
    await prisma.rbacPermission.createMany({
        data: snapshot.permissions.map((permission) => ({
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            moduleId: permission.resource,
        })),
    });
    await prisma.rbacRole.createMany({
        data: snapshot.roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem ?? false,
        })),
    });
    const permissionIds = new Set(snapshot.permissions.map((permission) => permission.id));
    const rolePermissionLinks = snapshot.roles.flatMap((role) => (role.permissions || [])
        .filter((permissionId) => permissionId !== "*" && permissionIds.has(permissionId))
        .map((permissionId) => ({
        roleId: role.id,
        permissionId,
    })));
    if (rolePermissionLinks.length > 0) {
        for (const link of rolePermissionLinks) {
            await prisma.rolePermission.create({ data: link });
        }
    }
    if (snapshot.assignments.length > 0) {
        await prisma.rbacAssignment.createMany({ data: snapshot.assignments });
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
