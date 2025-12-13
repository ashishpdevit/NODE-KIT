/**
 * Media Service
 * Business logic for media operations based on Laravel Media Library structure
 */

import { PrismaClient, Media } from "@prisma/client";
import { getStorageProvider } from "@/core/storage";
import { UploadedFile, StorageFile, UploadOptions } from "@/core/storage/types";
import { prisma } from "@/core/lib/prisma";

export interface CreateMediaData {
  modelType?: string;
  modelId?: number | string;
  collectionName?: string;
  customProperties?: Record<string, any>;
  orderColumn?: number;
  conversionsDisk?: string;
  manipulations?: Record<string, any>;
  generateConversions?: boolean;
}

export interface AttachMediaData {
  modelType: string;
  modelId: number | string;
  collectionName?: string;
  orderColumn?: number;
}

export interface MediaFilter {
  modelType?: string;
  modelId?: number | string;
  collectionName?: string;
  disk?: string;
  uuid?: string;
  mimeType?: string;
}

export class MediaService {
  private storageProvider = getStorageProvider();

  /**
   * Upload a single media file (storage only, no DB)
   */
  async uploadSingleMedia(
    file: Express.Multer.File,
    data: CreateMediaData
  ): Promise<StorageFile> {
    const uploadOptions: UploadOptions = {
      collectionName: data.collectionName || "default",
      customProperties: data.customProperties,
      isPublic: true,
    };

    // Upload to storage provider only
    const storageFile = await this.storageProvider.uploadFile(
      file as UploadedFile,
      uploadOptions
    );

    return storageFile;
  }

  /**
   * Upload multiple media files (storage only, no DB)
   */
  async uploadMultipleMedia(
    files: Express.Multer.File[],
    data: CreateMediaData
  ): Promise<StorageFile[]> {
    const uploadOptions: UploadOptions = {
      collectionName: data.collectionName || "default",
      customProperties: data.customProperties,
      isPublic: true,
    };

    // Upload to storage provider only
    const storageFiles = await this.storageProvider.uploadFiles(
      files as UploadedFile[],
      uploadOptions
    );

    return storageFiles;
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: number | string): Promise<Media | null> {
    return prisma.media.findUnique({
      where: { id: BigInt(id) },
    });
  }

  /**
   * Get media by UUID
   */
  async getMediaByUuid(uuid: string): Promise<Media | null> {
    return prisma.media.findUnique({
      where: { uuid },
    });
  }

  /**
   * Get media with filters
   */
  async getMedia(
    filter: MediaFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ media: Media[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.modelType) {
      where.modelType = filter.modelType;
    }

    if (filter.modelId) {
      where.modelId = BigInt(filter.modelId);
    }

    if (filter.collectionName) {
      where.collectionName = filter.collectionName;
    }

    if (filter.disk) {
      where.disk = filter.disk;
    }

    if (filter.uuid) {
      where.uuid = filter.uuid;
    }

    if (filter.mimeType) {
      where.mimeType = {
        contains: filter.mimeType,
      };
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { orderColumn: "asc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.media.count({ where }),
    ]);

    return { media, total };
  }

  /**
   * Get media by model (polymorphic relation)
   */
  async getMediaByModel(
    modelType: string,
    modelId: number | string,
    collectionName?: string
  ): Promise<Media[]> {
    const where: any = {
      modelType,
      modelId: BigInt(modelId),
    };

    if (collectionName) {
      where.collectionName = collectionName;
    }

    return prisma.media.findMany({
      where,
      orderBy: [
        { orderColumn: "asc" },
        { createdAt: "desc" },
      ],
    });
  }

  /**
   * Delete media
   */
  async deleteMedia(id: number | string): Promise<boolean> {
    const media = await this.getMediaById(id);

    if (!media) {
      throw new Error("Media not found");
    }

    // Delete from storage provider
    const deleteResult = await this.storageProvider.deleteFile(media.fileName);

    if (!deleteResult.success) {
      throw new Error(`Failed to delete file from storage: ${deleteResult.message}`);
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: BigInt(id) },
    });

    return true;
  }

  /**
   * Delete multiple media
   */
  async deleteMultipleMedia(ids: (number | string)[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.deleteMedia(id);
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Update media order
   */
  async updateMediaOrder(id: number | string, orderColumn: number): Promise<Media> {
    return prisma.media.update({
      where: { id: BigInt(id) },
      data: { orderColumn },
    });
  }

  /**
   * Update custom properties
   */
  async updateCustomProperties(
    id: number | string,
    customProperties: Record<string, any>
  ): Promise<Media> {
    return prisma.media.update({
      where: { id: BigInt(id) },
      data: {
        customProperties,
      },
    });
  }

  /**
   * Update manipulations
   */
  async updateManipulations(
    id: number | string,
    manipulations: Record<string, any>
  ): Promise<Media> {
    return prisma.media.update({
      where: { id: BigInt(id) },
      data: {
        manipulations,
      },
    });
  }

  /**
   * Add generated conversion
   */
  async addGeneratedConversion(
    id: number | string,
    conversionName: string,
    conversionData: any
  ): Promise<Media> {
    const media = await this.getMediaById(id);
    if (!media) {
      throw new Error("Media not found");
    }

    const conversions = media.generatedConversions as Record<string, any>;
    conversions[conversionName] = conversionData;

    return prisma.media.update({
      where: { id: BigInt(id) },
      data: {
        generatedConversions: conversions,
      },
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalMedia: number;
    totalSize: bigint;
    byDisk: Record<string, { count: number; size: bigint }>;
    byMimeType: Record<string, { count: number; size: bigint }>;
    byCollection: Record<string, { count: number; size: bigint }>;
  }> {
    const allMedia = await prisma.media.findMany({
      select: {
        disk: true,
        mimeType: true,
        collectionName: true,
        size: true,
      },
    });

    const stats = {
      totalMedia: allMedia.length,
      totalSize: BigInt(0),
      byDisk: {} as Record<string, { count: number; size: bigint }>,
      byMimeType: {} as Record<string, { count: number; size: bigint }>,
      byCollection: {} as Record<string, { count: number; size: bigint }>,
    };

    allMedia.forEach((media: { disk: string; mimeType: string | null; collectionName: string; size: bigint }) => {
      stats.totalSize += media.size;

      // Group by disk
      if (!stats.byDisk[media.disk]) {
        stats.byDisk[media.disk] = { count: 0, size: BigInt(0) };
      }
      stats.byDisk[media.disk].count++;
      stats.byDisk[media.disk].size += media.size;

      // Group by mime type
      const mimeType = media.mimeType || "unknown";
      if (!stats.byMimeType[mimeType]) {
        stats.byMimeType[mimeType] = { count: 0, size: BigInt(0) };
      }
      stats.byMimeType[mimeType].count++;
      stats.byMimeType[mimeType].size += media.size;

      // Group by collection
      if (!stats.byCollection[media.collectionName]) {
        stats.byCollection[media.collectionName] = { count: 0, size: BigInt(0) };
      }
      stats.byCollection[media.collectionName].count++;
      stats.byCollection[media.collectionName].size += media.size;
    });

    return stats;
  }

  /**
   * Reorder media in a collection
   */
  async reorderMedia(
    modelType: string,
    modelId: number | string,
    collectionName: string,
    orderedIds: (number | string)[]
  ): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.media.update({
        where: { id: BigInt(orderedIds[i]) },
        data: { orderColumn: i + 1 },
      });
    }
  }

  /**
   * Attach media to a model (create DB entry)
   */
  async attachMedia(
    fileInfo: StorageFile,
    attachData: AttachMediaData
  ): Promise<Media> {
    // Calculate order column if not provided
    let orderColumn = attachData.orderColumn;
    if (orderColumn === undefined) {
      const lastMedia = await prisma.media.findFirst({
        where: {
          modelType: attachData.modelType,
          modelId: BigInt(attachData.modelId),
          collectionName: attachData.collectionName || fileInfo.customProperties?.collectionName || "default",
        },
        orderBy: {
          orderColumn: "desc",
        },
      });
      orderColumn = lastMedia ? (lastMedia.orderColumn || 0) + 1 : 1;
    }

    // Create media entry in database
    const media = await prisma.media.create({
      data: {
        modelType: attachData.modelType,
        modelId: BigInt(attachData.modelId),
        uuid: fileInfo.uuid || null,
        collectionName: attachData.collectionName || fileInfo.customProperties?.collectionName || "default",
        name: fileInfo.name,
        fileName: fileInfo.fileName,
        mimeType: fileInfo.mimeType,
        disk: fileInfo.disk,
        conversionsDisk: null,
        size: BigInt(fileInfo.size),
        orderColumn,
        manipulations: {},
        customProperties: fileInfo.customProperties || {},
        generatedConversions: {},
        responsiveImages: {},
      },
    });

    return media;
  }

  /**
   * Attach multiple media to a model (create DB entries)
   */
  async attachMultipleMedia(
    filesInfo: StorageFile[],
    attachData: AttachMediaData
  ): Promise<Media[]> {
    const results: Media[] = [];
    
    for (const fileInfo of filesInfo) {
      const media = await this.attachMedia(fileInfo, attachData);
      results.push(media);
    }

    return results;
  }

  /**
   * Detach media from model (delete from DB, file stays in storage)
   */
  async detachMedia(id: number | string): Promise<Media> {
    const media = await this.getMediaById(id);
    
    if (!media) {
      throw new Error("Media not found");
    }

    // Delete from database only (file remains in storage)
    await prisma.media.delete({
      where: { id: BigInt(id) },
    });

    return media;
  }
}

// Export singleton instance
export const mediaService = new MediaService();

