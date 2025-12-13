/**
 * Media Controller
 * Handles media requests
 */

import { Request, Response, NextFunction } from "express";
import { mediaService } from "@/core/services/media.service";
import { toSuccess, toError } from "@/core/utils/httpResponse";
import { StorageFile } from "@/core/storage/types";
import {
  uploadMediaSchema,
  attachMediaSchema,
  attachMultipleMediaSchema,
  mediaIdSchema,
  mediaUuidSchema,
  getMediaQuerySchema,
  deleteMediaSchema,
  updateCustomPropertiesSchema,
  updateManipulationsSchema,
  updateOrderSchema,
  reorderMediaSchema,
  getMediaByModelSchema,
} from "./media.validation";

// Helper to convert BigInt to string for JSON serialization and format response
const serializeMedia = (media: any) => {
  if (Array.isArray(media)) {
    return media.map((m) => {
      const url = getMediaUrl(m);
      return {
        id: m.id.toString(),
        uuid: m.uuid,
        fileName: m.fileName,
        name: m.name,
        url: url,
        path: getMediaPath(m),
        mimeType: m.mimeType,
        size: m.size.toString(),
        disk: m.disk,
        modelType: m.modelType,
        modelId: m.modelId.toString(),
        collectionName: m.collectionName,
        orderColumn: m.orderColumn,
        customProperties: m.customProperties,
        manipulations: m.manipulations,
        generatedConversions: m.generatedConversions,
        responsiveImages: m.responsiveImages,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      };
    });
  }
  const url = getMediaUrl(media);
  return {
    id: media.id.toString(),
    uuid: media.uuid,
    fileName: media.fileName,
    name: media.name,
    url: url,
    path: getMediaPath(media),
    mimeType: media.mimeType,
    size: media.size.toString(),
    disk: media.disk,
    modelType: media.modelType,
    modelId: media.modelId.toString(),
    collectionName: media.collectionName,
    orderColumn: media.orderColumn,
    customProperties: media.customProperties,
    manipulations: media.manipulations,
    generatedConversions: media.generatedConversions,
    responsiveImages: media.responsiveImages,
    createdAt: media.createdAt,
    updatedAt: media.updatedAt,
  };
};

// Helper to get full media URL
const getMediaUrl = (media: any): string => {
  const env = require("@/core/config").env;
  
  if (media.disk === "local") {
    const baseUrl = env.STORAGE_PUBLIC_URL || "http://localhost:3000";
    return `${baseUrl}/${media.collectionName}/${media.fileName}`;
  } else if (media.disk === "s3") {
    // S3 URL is stored in fileName path during upload
    const region = env.AWS_S3_REGION || "us-east-1";
    const bucket = env.AWS_S3_BUCKET;
    if (env.AWS_S3_ENDPOINT) {
      return `${env.AWS_S3_ENDPOINT}/${bucket}/${media.collectionName}/${media.fileName}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${media.collectionName}/${media.fileName}`;
  } else if (media.disk === "azure") {
    const accountName = env.AZURE_STORAGE_ACCOUNT_NAME;
    const container = env.AZURE_STORAGE_CONTAINER;
    return `https://${accountName}.blob.core.windows.net/${container}/${media.collectionName}/${media.fileName}`;
  }
  
  return `/${media.collectionName}/${media.fileName}`;
};

// Helper to get media path
const getMediaPath = (media: any): string => {
  return `${media.collectionName}/${media.fileName}`;
};

export class MediaController {
  /**
   * Upload single media file (storage only, no DB)
   */
  async uploadSingle(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json(toError("No file uploaded"));
      }

      const validatedData = uploadMediaSchema.parse(req.body);

      const storageFile = await mediaService.uploadSingleMedia(file, validatedData);

      return res.status(201).json(
        toSuccess("File uploaded successfully. Use /attach endpoint to link to a model.", {
          uuid: storageFile.uuid,
          fileName: storageFile.fileName,
          name: storageFile.name,
          url: storageFile.url,
          path: storageFile.path,
          mimeType: storageFile.mimeType,
          size: storageFile.size.toString(),
          disk: storageFile.disk,
          customProperties: storageFile.customProperties || {},
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple media files (storage only, no DB)
   */
  async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json(toError("No files uploaded"));
      }

      const validatedData = uploadMediaSchema.parse(req.body);

      const storageFiles = await mediaService.uploadMultipleMedia(files, validatedData);

      return res.status(201).json(
        toSuccess(
          `${storageFiles.length} files uploaded successfully. Use /attach-multiple to link to a model.`,
          storageFiles.map(sf => ({
            uuid: sf.uuid,
            fileName: sf.fileName,
            name: sf.name,
            url: sf.url,
            path: sf.path,
            mimeType: sf.mimeType,
            size: sf.size.toString(),
            disk: sf.disk,
            customProperties: sf.customProperties || {},
          }))
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get media by ID
   */
  async getMediaById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = mediaIdSchema.parse(req.params);

      const media = await mediaService.getMediaById(id);

      if (!media) {
        return res.status(404).json(toError("Media not found"));
      }

      return res.json(toSuccess("Media retrieved successfully", serializeMedia(media)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get media by UUID
   */
  async getMediaByUuid(req: Request, res: Response, next: NextFunction) {
    try {
      const { uuid } = mediaUuidSchema.parse(req.params);

      const media = await mediaService.getMediaByUuid(uuid);

      if (!media) {
        return res.status(404).json(toError("Media not found"));
      }

      return res.json(toSuccess("Media retrieved successfully", serializeMedia(media)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get media with filters
   */
  async getMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getMediaQuerySchema.parse(req.query);

      const { page, limit, ...filters } = query;

      const result = await mediaService.getMedia(filters, page, limit);

      return res.json(
        toSuccess("Media retrieved successfully", {
          media: serializeMedia(result.media),
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit),
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get media by model (polymorphic relation)
   */
  async getMediaByModel(req: Request, res: Response, next: NextFunction) {
    try {
      const { modelType, modelId } = req.params;
      const { collectionName } = req.query;

      const validatedData = getMediaByModelSchema.parse({
        modelType,
        modelId,
        collectionName,
      });

      const media = await mediaService.getMediaByModel(
        validatedData.modelType,
        validatedData.modelId,
        validatedData.collectionName
      );

      return res.json(toSuccess("Media retrieved successfully", serializeMedia(media)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete media
   */
  async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = mediaIdSchema.parse(req.params);

      await mediaService.deleteMedia(id);

      return res.json(toSuccess("Media deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete multiple media
   */
  async deleteMultipleMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = deleteMediaSchema.parse(req.body);

      const result = await mediaService.deleteMultipleMedia(ids);

      return res.json(
        toSuccess(
          `${result.success} media deleted successfully, ${result.failed} failed`,
          result
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update custom properties
   */
  async updateCustomProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = mediaIdSchema.parse(req.params);
      const { customProperties } = updateCustomPropertiesSchema.parse(req.body);

      const media = await mediaService.updateCustomProperties(id, customProperties);

      return res.json(
        toSuccess("Custom properties updated successfully", serializeMedia(media))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update manipulations
   */
  async updateManipulations(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = mediaIdSchema.parse(req.params);
      const { manipulations } = updateManipulationsSchema.parse(req.body);

      const media = await mediaService.updateManipulations(id, manipulations);

      return res.json(
        toSuccess("Manipulations updated successfully", serializeMedia(media))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order
   */
  async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = mediaIdSchema.parse(req.params);
      const { orderColumn } = updateOrderSchema.parse(req.body);

      const media = await mediaService.updateMediaOrder(id, orderColumn);

      return res.json(toSuccess("Order updated successfully", serializeMedia(media)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder media in a collection
   */
  async reorderMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { modelType, modelId, collectionName } = req.params;
      const { orderedIds } = reorderMediaSchema.parse(req.body);

      await mediaService.reorderMedia(modelType, modelId, collectionName, orderedIds);

      return res.json(toSuccess("Media reordered successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await mediaService.getStorageStats();

      // Convert BigInt to string for JSON serialization
      const serializedStats = {
        totalMedia: stats.totalMedia,
        totalSize: stats.totalSize.toString(),
        byDisk: Object.entries(stats.byDisk).reduce((acc, [key, value]) => {
          acc[key] = {
            count: value.count,
            size: value.size.toString(),
          };
          return acc;
        }, {} as Record<string, { count: number; size: string }>),
        byMimeType: Object.entries(stats.byMimeType).reduce((acc, [key, value]) => {
          acc[key] = {
            count: value.count,
            size: value.size.toString(),
          };
          return acc;
        }, {} as Record<string, { count: number; size: string }>),
        byCollection: Object.entries(stats.byCollection).reduce((acc, [key, value]) => {
          acc[key] = {
            count: value.count,
            size: value.size.toString(),
          };
          return acc;
        }, {} as Record<string, { count: number; size: string }>),
      };

      return res.json(toSuccess("Storage statistics retrieved successfully", serializedStats));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Attach media to a model (create DB entry)
   */
  async attachMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const attachData = attachMediaSchema.parse(req.body);

      // Extract file info from request body
      const fileInfo: StorageFile = {
        uuid: attachData.uuid,
        fileName: attachData.fileName,
        name: attachData.name,
        mimeType: attachData.mimeType,
        size: attachData.size,
        disk: attachData.disk,
        path: attachData.path,
        url: attachData.url,
        customProperties: attachData.customProperties,
      };

      const media = await mediaService.attachMedia(fileInfo, attachData);

      return res.json(toSuccess("Media attached to model successfully", serializeMedia(media)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Attach multiple media to a model (create DB entries)
   */
  async attachMultipleMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const attachData = attachMultipleMediaSchema.parse(req.body);

      const mediaRecords = await mediaService.attachMultipleMedia(attachData.files, attachData);

      return res.json(
        toSuccess(
          `${mediaRecords.length} media attached successfully`,
          serializeMedia(mediaRecords)
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Detach media from model (remove from DB)
   */
  async detachMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = mediaIdSchema.parse(req.params);

      const media = await mediaService.detachMedia(id);

      return res.json(toSuccess("Media detached from model (removed from database, file remains in storage)", serializeMedia(media)));
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();

