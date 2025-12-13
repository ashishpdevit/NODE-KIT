/**
 * Media Validation Schemas
 */

import { z } from "zod";

// Flexible upload schema - modelType and modelId are optional
// If provided: attaches immediately (one-step)
// If not provided: saves as temporary (can link later)
export const uploadMediaSchema = z.object({
  modelType: z.string().min(1).optional(),
  modelId: z.coerce.number().int().positive().optional(),
  collectionName: z.string().optional().default("default"),
  orderColumn: z.coerce.number().int().positive().optional(),
  customProperties: z.string().optional().transform((val) => {
    if (!val) return {};
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }),
});

// Attach media to model schema
export const attachMediaSchema = z.object({
  // File info from upload response
  uuid: z.string().optional(),
  fileName: z.string().min(1, "File name is required"),
  name: z.string().min(1, "Name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.coerce.number().int().positive("Size must be positive"),
  disk: z.string().min(1, "Disk is required"),
  path: z.string().min(1, "Path is required"),
  url: z.string().min(1, "URL is required"),
  // Model info
  modelType: z.string().min(1, "Model type is required"),
  modelId: z.coerce.number().int().positive("Model ID must be a positive number"),
  collectionName: z.string().optional().default("default"),
  orderColumn: z.coerce.number().int().positive().optional(),
  customProperties: z.record(z.any()).optional(),
});

// Attach multiple media schema
export const attachMultipleMediaSchema = z.object({
  files: z.array(z.object({
    uuid: z.string().optional(),
    fileName: z.string(),
    name: z.string(),
    mimeType: z.string(),
    size: z.number(),
    disk: z.string(),
    path: z.string(),
    url: z.string(),
  })),
  modelType: z.string().min(1, "Model type is required"),
  modelId: z.coerce.number().int().positive("Model ID must be a positive number"),
  collectionName: z.string().optional().default("default"),
});

export const mediaIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const mediaUuidSchema = z.object({
  uuid: z.string().uuid(),
});

export const getMediaQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  modelType: z.string().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  collectionName: z.string().optional(),
  disk: z.string().optional(),
  mimeType: z.string().optional(),
});

export const deleteMediaSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
});

export const updateCustomPropertiesSchema = z.object({
  customProperties: z.record(z.any()),
});

export const updateManipulationsSchema = z.object({
  manipulations: z.record(z.any()),
});

export const updateOrderSchema = z.object({
  orderColumn: z.number().int().positive(),
});

export const reorderMediaSchema = z.object({
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

export const getMediaByModelSchema = z.object({
  modelType: z.string().min(1),
  modelId: z.coerce.number().int().positive(),
  collectionName: z.string().optional(),
});

// Link media to model schema
export const linkMediaToModelSchema = z.object({
  mediaIds: z.array(z.coerce.number().int().positive()).min(1, "At least one media ID is required"),
  modelType: z.string().min(1, "Model type is required"),
  modelId: z.coerce.number().int().positive("Model ID must be a positive number"),
  collectionName: z.string().optional(),
});

