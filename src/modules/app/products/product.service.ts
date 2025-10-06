import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";
import type { 
  PaginationOptions, 
  SortOptions, 
  SearchOptions, 
  PaginatedResult 
} from "@/core/utils/pagination";
import { createPaginatedResponse } from "@/core/utils/pagination";

type ProductFilters = { status?: string; category?: string; tag?: string };

type ProductRecord = Prisma.ProductGetPayload<{ select: typeof baseSelect }>;

const baseSelect = {
  id: true,
  name: true,
  price: true,
  inventory: true,
  status: true,
  category: true,
  sku: true,
  description: true,
  brand: true,
  barcode: true,
  featured: true,
  images: true,
  tags: true,
  variants: true,
  dimensions: true,
  shipping: true,
  seo: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapProduct = (product: ProductRecord) => ({
  ...product,
  images: parseJson<string[]>(product.images as string | null, []),
  tags: parseJson<string[]>(product.tags as string | null, []),
  variants: parseJson<any[]>(product.variants as string | null, []),
  dimensions: parseJson<Record<string, unknown> | null>(product.dimensions as string | null, null),
  shipping: parseJson<Record<string, unknown> | null>(product.shipping as string | null, null),
  seo: parseJson<Record<string, unknown> | null>(product.seo as string | null, null),
});

const serialiseProduct = (data: Record<string, unknown>) => {
  const payload: Record<string, unknown> = { ...data };

  const maybeSerialise = (key: string) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      payload[key] = value != null ? JSON.stringify(value) : null;
    }
  };

  ["images", "tags", "variants", "dimensions", "shipping", "seo"].forEach(maybeSerialise);

  return payload as Prisma.ProductCreateInput;
};

export const productService = {
  list: async (filters: ProductFilters) => {
    const where: Prisma.ProductWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.category) {
      where.category = filters.category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { id: "asc" },
      select: baseSelect,
    });

    const mapped = products.map(mapProduct);

    if (!filters.tag) return mapped;

    const tag = filters.tag.toLowerCase();
    return mapped.filter(
      (product) =>
        Array.isArray(product.tags) && product.tags.some((item) => item.toLowerCase() === tag)
    );
  },

  listPaginated: async (options: {
    pagination: PaginationOptions;
    sort?: SortOptions | null;
    search?: SearchOptions | null;
    filters: ProductFilters;
  }): Promise<PaginatedResult<any>> => {
    const { pagination, sort, search, filters } = options;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.category) {
      where.category = filters.category;
    }

    // Apply search
    if (search && search.query) {
      where.OR = [
        {
          name: {
            contains: search.query,
          },
        },
        {
          sku: {
            contains: search.query,
          },
        },
        {
          category: {
            contains: search.query,
          },
        },
        {
          brand: {
            contains: search.query,
          },
        },
      ];
    }

    // Build orderBy clause
    const orderBy = sort ? { [sort.field]: sort.direction } : { id: "asc" as const };

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        select: baseSelect,
      }),
      prisma.product.count({ where }),
    ]);

    // Map products
    let mappedProducts = products.map(mapProduct);

    // Apply tag filter after mapping (since tags are JSON)
    if (filters.tag) {
      const tag = filters.tag.toLowerCase();
      mappedProducts = mappedProducts.filter(
        (product) =>
          Array.isArray(product.tags) && product.tags.some((item) => item.toLowerCase() === tag)
      );
    }

    return createPaginatedResponse(
      mappedProducts,
      total,
      pagination,
      '/api/admin/products',
      { 
        ...(sort?.field && { sortBy: sort.field }), 
        ...(sort?.direction && { sortOrder: sort.direction }), 
        ...(search?.query && { search: search.query }),
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.tag && { tag: filters.tag })
      }
    );
  },
  get: async (id: number) => {
    const product = await prisma.product.findUnique({ where: { id }, select: baseSelect });
    return product ? mapProduct(product) : null;
  },
  create: async (data: Prisma.ProductCreateInput) => {
    const created = await prisma.product.create({
      data: serialiseProduct(data),
      select: baseSelect,
    });
    return mapProduct(created);
  },
  update: async (id: number, data: Prisma.ProductUpdateInput) => {
    const updated = await prisma.product.update({
      where: { id },
      data: serialiseProduct(data),
      select: baseSelect,
    });
    return mapProduct(updated);
  },
  delete: async (id: number) => {
    const removed = await prisma.product.delete({ where: { id }, select: baseSelect });
    return mapProduct(removed);
  },
};

