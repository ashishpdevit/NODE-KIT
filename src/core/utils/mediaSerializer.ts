/**
 * Media Serialization Utility
 * Converts Prisma Media objects to JSON-serializable format
 */

import { Media } from "@prisma/client";
import { env } from "@/core/config/env";

/**
 * Serialize a single media object
 */
export const serializeMedia = (media: Media) => {
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

/**
 * Serialize an array of media objects
 */
export const serializeMediaArray = (mediaArray: Media[]) => {
  return mediaArray.map(serializeMedia);
};

/**
 * Get full media URL based on storage provider
 */
const getMediaUrl = (media: Media): string => {
  if (media.disk === "local") {
    const baseUrl = env.STORAGE_PUBLIC_URL || "http://localhost:3000";
    return `${baseUrl}/${media.collectionName}/${media.fileName}`;
  } else if (media.disk === "s3") {
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

/**
 * Get media path
 */
const getMediaPath = (media: Media): string => {
  return `${media.collectionName}/${media.fileName}`;
};

