/**
 * Storage Provider Types and Interfaces
 * Defines the contract for all storage providers
 */

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

export interface StorageFile {
  uuid?: string;
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
  disk: string;
  customProperties?: Record<string, any>;
}

export interface DeleteResult {
  success: boolean;
  message?: string;
}

export interface UploadOptions {
  collectionName?: string;
  fileName?: string;
  isPublic?: boolean;
  customProperties?: Record<string, any>;
  orderColumn?: number;
  generateConversions?: boolean;
}

export interface StorageProvider {
  /**
   * Upload a single file
   */
  uploadFile(
    file: UploadedFile,
    options?: UploadOptions
  ): Promise<StorageFile>;

  /**
   * Upload multiple files
   */
  uploadFiles(
    files: UploadedFile[],
    options?: UploadOptions
  ): Promise<StorageFile[]>;

  /**
   * Delete a file
   */
  deleteFile(filePath: string): Promise<DeleteResult>;

  /**
   * Delete multiple files
   */
  deleteFiles(filePaths: string[]): Promise<DeleteResult[]>;

  /**
   * Get file URL
   */
  getFileUrl(filePath: string): string;

  /**
   * Check if file exists
   */
  fileExists(filePath: string): Promise<boolean>;

  /**
   * Get provider name
   */
  getProviderName(): string;
}

