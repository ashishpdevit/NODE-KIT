import request, { type Test } from "supertest";

import { prisma } from "@/core/lib/prisma";
import { createApp } from "../src/server";

describe("Node Starter Kit API", () => {
  const app = createApp();
  const apiKey = process.env.APP_API_KEY ?? "local-dev-app-api-key";
  const withApiKey = (test: Test) => test.set("x-api-key", apiKey);

  let adminToken: string;
  const withAdminAuth = (test: Test) => test.set("Authorization", `Bearer ${adminToken}`);

  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/admin/auth/login").send({
      email: "admin@yopmail.com",
      password: "AdminPass123!",
    });

    expect(loginResponse.status).toBe(200);
    adminToken = loginResponse.body.data.token;
  });

  it("returns a welcome message on the root route", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Welcome to the Node Starter Kit",
    });
  });

  it("exposes a health endpoint", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data.uptime");
  });

  describe("Admin Auth", () => {
    it("returns the admin profile for the current token", async () => {
      const response = await withAdminAuth(request(app).get("/api/admin/auth/profile"));

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe("admin@yopmail.com");
    });
  });

  describe("Admin Users", () => {
    it("lists seeded admins", async () => {
      const response = await withAdminAuth(request(app).get("/api/admin/users"));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("creates, updates, and deletes an admin", async () => {
      const uniqueEmail = `test.admin+${Date.now()}@example.com`;
      const createResponse = await withAdminAuth(request(app).post("/api/admin/users").send({
        name: "Test Admin",
        email: uniqueEmail,
        role: "Admin",
        status: "Active",
        password: "StrongPass123!",
      }));

      expect(createResponse.status).toBe(201);
      const adminId = createResponse.body.data.id;

      const updateResponse = await withAdminAuth(
        request(app)
          .put(`/api/admin/users/${adminId}`)
          .send({ role: "Supervisor" })
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data).toMatchObject({ role: "Supervisor" });

      const deleteResponse = await withAdminAuth(request(app).delete(`/api/admin/users/${adminId}`));
      expect(deleteResponse.status).toBe(200);
    });
  });

  describe("Admin Products", () => {
    it("manages products and exposes them to the app listing", async () => {
      const uniqueSku = `SKU-${Date.now()}`;
      const createResponse = await withAdminAuth(request(app).post("/api/admin/products").send({
        name: "Sample Product",
        price: 99.99,
        inventory: 50,
        status: "Active",
        category: "Test",
        sku: uniqueSku,
        tags: ["beta"],
      }));

      expect(createResponse.status).toBe(201);
      const productId = createResponse.body.data.id;

      const updateResponse = await withAdminAuth(
        request(app)
          .put(`/api/admin/products/${productId}`)
          .send({ inventory: 75, tags: ["beta", "release"] })
      );
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.inventory).toBe(75);
      expect(updateResponse.body.data.tags).toContain("release");

      const listResponse = await request(app).get(`/api/app/products/${productId}`);
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.id).toBe(productId);

      const deleteResponse = await withAdminAuth(request(app).delete(`/api/admin/products/${productId}`));
      expect(deleteResponse.status).toBe(200);
    });
  });

  describe("Admin FAQs", () => {
    it("creates and updates FAQ entries", async () => {
      const createResponse = await withAdminAuth(request(app).post("/api/admin/faqs").send({
        question: { en: "How do I reset my password?" },
        answer: { en: "Use the Forgot Password link." },
        type: "support",
        status: "published",
      }));

      expect(createResponse.status).toBe(201);
      const faqId = createResponse.body.data.id;

      const updateResponse = await withAdminAuth(
        request(app)
          .put(`/api/admin/faqs/${faqId}`)
          .send({ status: "archived" })
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.status).toBe("archived");

      const appFaqResponse = await request(app).get(`/api/app/faqs/${faqId}`);
      expect(appFaqResponse.status).toBe(200);
      expect(appFaqResponse.body.data.id).toBe(faqId);

      await withAdminAuth(request(app).delete(`/api/admin/faqs/${faqId}`));
    });
  });

  describe("Admin Contact Requests", () => {
    it("replies to contact requests submitted from the app", async () => {
      const createResponse = await request(app).post("/api/app/contact-requests").send({
        message: "I'd like to know more.",
        contact: "visitor@example.com",
      });
      expect(createResponse.status).toBe(201);
      const requestId = createResponse.body.data.id;

      const listResponse = await withAdminAuth(request(app).get("/api/admin/contact-requests"));
      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body.data)).toBe(true);

      const updateResponse = await withAdminAuth(
        request(app)
          .put(`/api/admin/contact-requests/${requestId}`)
          .send({ status: "resolved", adminReply: "We will contact you shortly." })
      );
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.status).toBe("resolved");

      await withAdminAuth(request(app).delete(`/api/admin/contact-requests/${requestId}`));
    });
  });

  describe("Admin Settings & Languages", () => {
    it("lists application settings", async () => {
      const response = await withAdminAuth(request(app).get("/api/admin/settings/app"));
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("manages languages via CRUD", async () => {
      const createResponse = await withAdminAuth(request(app).post("/api/admin/settings/languages").send({
        code: "de",
        label: "German",
      }));
      expect(createResponse.status).toBe(201);

      const updateResponse = await withAdminAuth(
        request(app)
          .put("/api/admin/settings/languages/de")
          .send({ label: "Deutsch" })
      );
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.label).toBe("Deutsch");

      const deleteResponse = await withAdminAuth(request(app).delete("/api/admin/settings/languages/de"));
      expect(deleteResponse.status).toBe(200);
    });
  });

  describe("App Customers", () => {
    it("filters customers by status and country", async () => {
      const response = await request(app).get("/api/app/customers?status=Active&country=USA");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({ name: "John Doe" });
    });
  });

  describe("App Orders", () => {
    it("retrieves a seeded order", async () => {
      const response = await request(app).get("/api/app/orders/ORD-001");
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ id: "ORD-001" });
    });
  });

  describe("App Products", () => {
    it("lists products without allowing mutations", async () => {
      const response = await request(app).get("/api/app/products");
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("App FAQs", () => {
    it("lists FAQs for app users", async () => {
      const response = await request(app).get("/api/app/faqs");
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("App Auth", () => {
    const uniqueSuffix = Date.now();
    const basePassword = "TestPass123!";
    const updatedPassword = `${basePassword}#`;
    const testEmail = `mobile-user-${uniqueSuffix}@example.com`;

    let currentPassword = basePassword;
    let authToken: string;

    it("registers a new mobile app user", async () => {
      const response = await withApiKey(
        request(app)
          .post("/api/app/auth/register")
          .send({
            email: testEmail,
            password: currentPassword,
            name: "Mobile Tester",
          })
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testEmail);
      expect(typeof response.body.data.token).toBe("string");

      authToken = response.body.data.token;
    });

    it("logs in with registered credentials and fetches profile", async () => {
      const loginResponse = await withApiKey(
        request(app)
          .post("/api/app/auth/login")
          .send({
            email: testEmail,
            password: currentPassword,
          })
      );

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.user.email).toBe(testEmail);
      authToken = loginResponse.body.data.token;

      const profileResponse = await withApiKey(request(app).get("/api/app/auth/profile"))
        .set("Authorization", `Bearer ${authToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.email).toBe(testEmail);
    });

    it("updates the profile for the logged-in mobile user", async () => {
      const updatedName = "Mobile Tester Updated";
      const updateResponse = await withApiKey(
        request(app)
          .patch("/api/app/auth/profile")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            name: updatedName,
            phone: "+15551230000",
          })
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.user.name).toBe(updatedName);
      expect(updateResponse.body.data.user.phone).toBe("+15551230000");

      authToken = updateResponse.body.data.token;
    });

    it("resets password via token and accepts the new credentials", async () => {
      const forgotResponse = await withApiKey(
        request(app)
          .post("/api/app/auth/forgot-password")
          .send({ email: testEmail })
      );

      expect(forgotResponse.status).toBe(200);
      const resetToken = forgotResponse.body.data.resetToken;
      expect(typeof resetToken).toBe("string");
      expect(resetToken.length).toBeGreaterThan(16);

      const resetResponse = await withApiKey(
        request(app)
          .post("/api/app/auth/reset-password")
          .send({ token: resetToken, password: updatedPassword })
      );

      expect(resetResponse.status).toBe(200);
      currentPassword = updatedPassword;
      authToken = resetResponse.body.data.token;

      const reloginResponse = await withApiKey(
        request(app)
          .post("/api/app/auth/login")
          .send({ email: testEmail, password: currentPassword })
      );

      expect(reloginResponse.status).toBe(200);
      authToken = reloginResponse.body.data.token;

      const profileAfterReset = await withApiKey(request(app).get("/api/app/auth/profile"))
        .set("Authorization", `Bearer ${authToken}`);

      expect(profileAfterReset.status).toBe(200);
      expect(profileAfterReset.body.data.email).toBe(testEmail);
    });
  });

  describe("RBAC", () => {
    it("returns the RBAC snapshot", async () => {
      const response = await request(app).get("/api/rbac");
      expect(response.status).toBe(200);
      expect(response.body.data.modules.length).toBeGreaterThan(0);
    });

    it("creates an assignment", async () => {
      const response = await request(app).post("/api/rbac/assignments").send({
        subjectId: "qa@example.com",
        subjectType: "user",
        roleId: "support",
      });

      expect(response.status).toBe(201);
      expect(response.body.data.subjectId).toBe("qa@example.com");

      await prisma.rbacAssignment.delete({ where: { id: response.body.data.id } });
    });
  });
});
