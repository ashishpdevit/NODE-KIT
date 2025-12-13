import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";
import { mediaService } from "@/core/services/media.service";
import { serializeMedia, serializeMediaArray } from "@/core/utils/mediaSerializer";

const baseSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  status: true,
  country: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

const mapCustomer = async (customer: Prisma.CustomerGetPayload<{ select: typeof baseSelect }>) => {
  // Fetch media for this customer (profile picture - single image)
  const media = await mediaService.getMediaByModel("customer", customer.id, "images");
  
  return {
    ...customer,
    // Return single profile picture (first image) or null
    profilePicture: media.length > 0 ? serializeMedia(media[0]) : null,
  };
};

export const customerService = {
  list: async (filters: { status?: string; country?: string }) => {
    const where: Prisma.CustomerWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.country) {
      where.country = filters.country;
    }

    const customers = await prisma.customer.findMany({ where, orderBy: { id: "asc" }, select: baseSelect });
    return Promise.all(customers.map(mapCustomer));
  },
  get: async (id: number) => {
    const customer = await prisma.customer.findUnique({ where: { id }, select: baseSelect });
    return customer ? await mapCustomer(customer) : null;
  },
  create: async (data: Prisma.CustomerCreateInput, file?: Express.Multer.File) => {
    // Create customer first
    const created = await prisma.customer.create({ data, select: baseSelect });

    // If profile picture is provided, upload it automatically and save to media table
    if (file) {
      try {
        await mediaService.uploadSingleMedia(file, {
          modelType: "customer",
          modelId: created.id,
          collectionName: "images",
        });
      } catch (error) {
        // Log error but don't fail customer creation
        console.error("Error uploading customer profile picture:", error);
      }
    }

    return await mapCustomer(created);
  },
  update: async (id: number, data: Prisma.CustomerUpdateInput, file?: Express.Multer.File) => {
    // Update customer first
    const updated = await prisma.customer.update({ where: { id }, data, select: baseSelect });

    // If profile picture is provided, upload it automatically and save to media table
    if (file) {
      try {
        await mediaService.uploadSingleMedia(file, {
          modelType: "customer",
          modelId: id,
          collectionName: "images",
        });
      } catch (error) {
        // Log error but don't fail customer update
        console.error("Error uploading customer profile picture:", error);
      }
    }

    return await mapCustomer(updated);
  },
  delete: (id: number) =>
    prisma.customer.delete({ where: { id }, select: baseSelect }),
};
