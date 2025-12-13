/**
 * Storage Factory
 * Creates and returns the appropriate storage provider based on configuration
 */

import { StorageProvider } from "./types";
import { LocalStorageProvider } from "./providers/LocalStorageProvider";
import { S3StorageProvider } from "./providers/S3StorageProvider";
import { AzureStorageProvider } from "./providers/AzureStorageProvider";
import { env } from "@/core/config/env";

export class StorageFactory {
  private static instance: StorageProvider | null = null;

  /**
   * Get storage provider instance (Singleton pattern)
   */
  static getProvider(): StorageProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  /**
   * Create a new storage provider instance
   */
  private static createProvider(): StorageProvider {
    const provider = env.STORAGE_PROVIDER;

    switch (provider) {
      case "local":
        return new LocalStorageProvider();

      case "s3":
        return new S3StorageProvider();

      case "azure":
        return new AzureStorageProvider();

      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }

  /**
   * Reset the provider instance (useful for testing)
   */
  static resetProvider(): void {
    this.instance = null;
  }

  /**
   * Create a specific provider (useful for multi-provider scenarios)
   */
  static createSpecificProvider(providerType: "local" | "s3" | "azure"): StorageProvider {
    switch (providerType) {
      case "local":
        return new LocalStorageProvider();

      case "s3":
        return new S3StorageProvider();

      case "azure":
        return new AzureStorageProvider();

      default:
        throw new Error(`Unsupported storage provider: ${providerType}`);
    }
  }
}

