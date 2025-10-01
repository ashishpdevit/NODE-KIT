import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

const baseSelect = {
  id: true,
  question: true,
  answer: true,
  type: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FaqSelect;

const parseJson = (value: string | null) => {
  if (!value) return {} as Record<string, string>;
  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
};

const mapFaq = (faq: Prisma.FaqGetPayload<{ select: typeof baseSelect }>) => ({
  ...faq,
  question: parseJson(faq.question as unknown as string | null),
  answer: parseJson(faq.answer as unknown as string | null),
});

export const faqService = {
  list: async (filters: { status?: string; type?: string }) => {
    const where: Prisma.FaqWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    const faqs = await prisma.faq.findMany({ where, orderBy: { id: "asc" }, select: baseSelect });
    return faqs.map(mapFaq);
  },
  get: async (id: number) => {
    const faq = await prisma.faq.findUnique({ where: { id }, select: baseSelect });
    return faq ? mapFaq(faq) : null;
  },
  create: async (data: Prisma.FaqCreateInput) => {
    const created = await prisma.faq.create({
      data: {
        ...data,
        question: JSON.stringify((data as any).question ?? {}),
        answer: JSON.stringify((data as any).answer ?? {}),
      },
      select: baseSelect,
    });
    return mapFaq(created);
  },
  update: async (id: number, data: Prisma.FaqUpdateInput) => {
    const updateData: Prisma.FaqUpdateInput = { ...data };
    if (data.question !== undefined) {
      updateData.question = JSON.stringify((data as any).question ?? {});
    }
    if (data.answer !== undefined) {
      updateData.answer = JSON.stringify((data as any).answer ?? {});
    }

    const updated = await prisma.faq.update({
      where: { id },
      data: updateData,
      select: baseSelect,
    });
    return mapFaq(updated);
  },
  delete: async (id: number) => {
    const removed = await prisma.faq.delete({ where: { id }, select: baseSelect });
    return mapFaq(removed);
  },
};

