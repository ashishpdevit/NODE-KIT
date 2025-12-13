/**
 * Azure Blob Storage Provider
 * Stores files on Microsoft Azure Blob Storage
 */

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  ContainerClient,
} from "@azure/storage-blob";
import path from "path";
import {
  StorageProvider,
  UploadedFile,
  StorageFile,
  DeleteResult,
  UploadOptions,
} from "../types";
import { env } from "@/core/config/env";

export class AzureStorageProvider implements StorageProvider {
  private containerClient: ContainerClient;
  private accountName: string;
  private containerName: string;

  constructor() {
    if (!env.AZURE_STORAGE_ACCOUNT_NAME || !env.AZURE_STORAGE_CONTAINER) {
      throw new Error("Azure Storage configuration is incomplete");
    }

    this.accountName = env.AZURE_STORAGE_ACCOUNT_NAME;
    this.containerName = env.AZURE_STORAGE_CONTAINER;

    let blobServiceClient: BlobServiceClient;

    // Initialize with connection string or credentials
    if (env.AZURE_STORAGE_CONNECTION_STRING) {
      blobServiceClient = BlobServiceClient.fromConnectionString(
        env.AZURE_STORAGE_CONNECTION_STRING
      );
    } else if (env.AZURE_STORAGE_ACCOUNT_KEY) {
      const sharedKeyCredential = new StorageSharedKeyCredential(
        this.accountName,
        env.AZURE_STORAGE_ACCOUNT_KEY
      );

      blobServiceClient = new BlobServiceClient(
        `https://${this.accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
    } else {
      throw new Error("Azure Storage credentials are missing");
    }

    this.containerClient = blobServiceClient.getContainerClient(
      this.containerName
    );
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

  private getBlobName(folder: string, filename: string): string {
    return folder ? `${folder}/${filename}` : filename;
  }

  async uploadFile(
    file: UploadedFile,
    options: UploadOptions = {}
  ): Promise<StorageFile> {
    const collection = options.collectionName || "default";
    const fileName = this.generateFilename(file.originalname, options.fileName);
    const blobName = this.getBlobName(collection, fileName);

    const buffer = file.buffer;
    if (!buffer) {
      throw new Error("File buffer is required for Azure upload");
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const metadata: Record<string, string> = {};
    if (options.customProperties) {
      Object.entries(options.customProperties).forEach(([key, value]) => {
        metadata[key] = String(value);
      });
    }

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
      metadata,
    });

    // Set public access if specified
    if (options.isPublic !== false) {
      await blockBlobClient.setAccessTier("Hot");
    }

    // Generate UUID
    const uuid = this.generateUUID();

    return {
      uuid,
      name: path.parse(file.originalname).name,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
      url: this.getFileUrl(blobName),
      path: blobName,
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
      const blockBlobClient = this.containerClient.getBlockBlobClient(filePath);
      await blockBlobClient.delete();

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
    const deletePromises = filePaths.map((filePath) =>
      this.deleteFile(filePath)
    );
    return Promise.all(deletePromises);
  }

  getFileUrl(filePath: string): string {
    return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${filePath}`;
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(filePath);
      return await blockBlobClient.exists();
    } catch {
      return false;
    }
  }

  getProviderName(): string {
    return "azure";
  }
}

