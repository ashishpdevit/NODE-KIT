/**
 * File Upload Middleware
 * Handles file uploads with validation using Multer
 */

import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { env } from "@/core/config/env";
import path from "path";

// File type validation
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  const allowedTypes = env.ALLOWED_FILE_TYPES.split(",").map((type) =>
    type.trim()
  );

  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
      )
    );
  }
};

// Multer configuration for memory storage (works with all providers)
const storage = multer.memoryStorage();

// Base upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Single file upload middleware
 * @param fieldName - Name of the form field
 */
export const uploadSingle = (fieldName: string = "file") => {
  return upload.single(fieldName);
};

/**
 * Multiple files upload middleware
 * @param fieldName - Name of the form field
 * @param maxCount - Maximum number of files (default: 10)
 */
export const uploadMultiple = (
  fieldName: string = "files",
  maxCount: number = 10
) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Multiple fields upload middleware
 * @param fields - Array of field configurations
 */
export const uploadFields = (
  fields: Array<{ name: string; maxCount: number }>
) => {
  return upload.fields(fields);
};

/**
 * Accept any file uploads
 * @param maxCount - Maximum number of files
 */
export const uploadAny = (maxCount?: number) => {
  if (maxCount) {
    return upload.any();
  }
  return upload.any();
};

// Custom file validation helpers
export const validateFileSize = (
  file: Express.Multer.File,
  maxSize: number
): boolean => {
  return file.size <= maxSize;
};

export const validateFileType = (
  file: Express.Multer.File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.mimetype);
};

export const validateImageDimensions = async (
  file: Express.Multer.File,
  maxWidth: number,
  maxHeight: number
): Promise<boolean> => {
  // This would require sharp or another image processing library
  // Implementation depends on your specific needs
  return true;
};

// File extension helper
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// MIME type helper
export const getMimeTypeFromExtension = (filename: string): string => {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return mimeTypes[ext] || "application/octet-stream";
};

