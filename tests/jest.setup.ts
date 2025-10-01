import { execSync } from "node:child_process";

import { prisma } from "@/core/lib/prisma";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  execSync("npm run db:seed", { stdio: "inherit" });
});

afterAll(async () => {
  await prisma.$disconnect();
});
