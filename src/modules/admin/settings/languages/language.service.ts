import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

const baseSelect = {
  code: true,
  label: true,
} satisfies Prisma.LanguageSelect;

export const languageService = {
  list: () => prisma.language.findMany({ orderBy: { code: "asc" }, select: baseSelect }),
  get: (code: string) => prisma.language.findUnique({ where: { code }, select: baseSelect }),
  create: (data: Prisma.LanguageCreateInput) =>
    prisma.language.create({ data, select: baseSelect }),
  update: (code: string, data: Prisma.LanguageUpdateInput) =>
    prisma.language.update({ where: { code }, data, select: baseSelect }),
  delete: (code: string) =>
    prisma.language.delete({ where: { code }, select: baseSelect }),
};