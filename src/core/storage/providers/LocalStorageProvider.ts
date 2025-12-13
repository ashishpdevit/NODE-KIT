/**
 * Local File System Storage Provider
 * Stores files on the local server filesystem
 */

import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import {
  StorageProvider,
  UploadedFile,
  StorageFile,
  DeleteResult,
  UploadOptions,
} from "../types";
import { env } from "@/core/config/env";

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private publicUrl?: string;

  constructor() {
    this.basePath = path.resolve(env.STORAGE_LOCAL_PATH);
    this.publicUrl = env.STORAGE_PUBLIC_URL;
    this.ensureBasePathExists();
  }

  private async ensureBasePathExists(): Promise<void> {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }
  }

  private async ensureFolderExists(folderPath: string): Promise<void> {
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
    }
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

  async uploadFile(
    file: UploadedFile,
    options: UploadOptions = {}
  ): Promise<StorageFile> {
    const collection = options.collectionName || "default";
    const folderPath = path.join(this.basePath, collection);

    await this.ensureFolderExists(folderPath);

    const fileName = this.generateFilename(file.originalname, options.fileName);
    const filePath = path.join(folderPath, fileName);
    const relativePath = path.join(collection, fileName);

    // Write file to disk
    if (file.buffer) {
      await fs.writeFile(filePath, file.buffer);
    } else if (file.path) {
      await fs.copyFile(file.path, filePath);
    } else {
      throw new Error("File buffer or path is required");
    }

    // Generate UUID
    const uuid = this.generateUUID();

    return {
      uuid,
      name: path.parse(file.originalname).name,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
      url: this.getFileUrl(relativePath),
      path: relativePath,
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
      const fullPath = path.join(this.basePath, filePath);

      if (!existsSync(fullPath)) {
        return {
          success: false,
          message: "File not found",
        };
      }

      await fs.unlink(fullPath);

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
    if (this.publicUrl) {
      return `${this.publicUrl}/${filePath.replace(/\\/g, "/")}`;
    }
    // Return relative path if no public URL is configured
    return `/uploads/${filePath.replace(/\\/g, "/")}`;
  }

  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, filePath);
    return existsSync(fullPath);
  }

  getProviderName(): string {
    return "local";
  }
}

