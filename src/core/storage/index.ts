/**
 * Storage Module Entry Point
 * Exports all storage-related functionality
 */

export * from "./types";
export * from "./StorageFactory";
export * from "./providers/LocalStorageProvider";
export * from "./providers/S3StorageProvider";
export * from "./providers/AzureStorageProvider";

// Convenience function to get the default storage provider
import { StorageFactory } from "./StorageFactory";

export const getStorageProvider = () => StorageFactory.getProvider();

