/**
 * AWS S3 Storage Provider
 * Stores files on Amazon S3
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import path from "path";
import {
  StorageProvider,
  UploadedFile,
  StorageFile,
  DeleteResult,
  UploadOptions,
} from "../types";
import { env } from "@/core/config/env";

export class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    if (!env.AWS_S3_REGION || !env.AWS_S3_BUCKET) {
      throw new Error("AWS S3 configuration is incomplete");
    }

    this.bucket = env.AWS_S3_BUCKET;
    this.region = env.AWS_S3_REGION;

    const clientConfig: any = {
      region: this.region,
    };

    // Add credentials if provided
    if (env.AWS_S3_ACCESS_KEY_ID && env.AWS_S3_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
      };
    }

    // Add custom endpoint if provided (for S3-compatible services)
    if (env.AWS_S3_ENDPOINT) {
      clientConfig.endpoint = env.AWS_S3_ENDPOINT;
      clientConfig.forcePathStyle = true;
    }

    this.s3Client = new S3Client(clientConfig);
  }

  private generateFilename(originalName: string, customFilename?: string): string {
    if (customFilename) {
      return customFilename;
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const sanitizedName = nameWithoutExt
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    return `${sanitizedName}_${timestamp}_${random}${ext}`;
  }

  private getS3Key(folder: string, filename: string): string {
    return folder ? `${folder}/${filename}` : filename;
  }

  async uploadFile(
    file: UploadedFile,
    options: UploadOptions = {}
  ): Promise<StorageFile> {
    const collection = options.collectionName || "default";
    const fileName = this.generateFilename(file.originalname, options.fileName);
    const key = this.getS3Key(collection, fileName);

    const buffer = file.buffer;
    if (!buffer) {
      throw new Error("File buffer is required for S3 upload");
    }

    const metadata: Record<string, string> = {};
    if (options.customProperties) {
      Object.entries(options.customProperties).forEach(([key, value]) => {
        metadata[key] = String(value);
      });
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
      ACL: options.isPublic !== false ? "public-read" : "private",
      Metadata: metadata,
    });

    await this.s3Client.send(command);

    // Generate UUID
    const uuid = this.generateUUID();

    return {
      uuid,
      name: path.parse(file.originalname).name,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
      url: this.getFileUrl(key),
      path: key,
      disk: this.getProviderName(),
      customProperties: options.customProperties,
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async uploadFiles(
    files: UploadedFile[],
    options: UploadOptions = {}
  ): Promise<StorageFile[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  async deleteFile(filePath: string): Promise<DeleteResult> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });

      await this.s3Client.send(command);

      return {
        success: true,
        message: "File deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete file",
      };
    }
  }

  async deleteFiles(filePaths: string[]): Promise<DeleteResult[]> {
    try {
      if (filePaths.length === 0) {
        return [];
      }

      // S3 supports batch delete
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: filePaths.map((key) => ({ Key: key })),
        },
      });

      const result = await this.s3Client.send(command);

      return filePaths.map((filePath) => {
        const deleted = result.Deleted?.some((d) => d.Key === filePath);
        return {
          success: deleted || false,
          message: deleted ? "File deleted successfully" : "Failed to delete file",
        };
      });
    } catch (error) {
      return filePaths.map(() => ({
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete files",
      }));
    }
  }

  getFileUrl(filePath: string): string {
    if (env.AWS_S3_ENDPOINT) {
      // Custom endpoint (like MinIO, DigitalOcean Spaces, etc.)
      return `${env.AWS_S3_ENDPOINT}/${this.bucket}/${filePath}`;
    }
    // Standard AWS S3 URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filePath}`;
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  getProviderName(): string {
    return "s3";
  }
}

