-- AlterTable
ALTER TABLE `products` MODIFY `description` TEXT NULL,
    MODIFY `images` TEXT NULL,
    MODIFY `tags` TEXT NULL,
    MODIFY `variants` TEXT NULL,
    MODIFY `dimensions` TEXT NULL,
    MODIFY `shipping` TEXT NULL,
    MODIFY `seo` TEXT NULL;

-- AlterTable
ALTER TABLE `rbac_modules` MODIFY `description` TEXT NULL,
    MODIFY `tags` TEXT NULL;

-- AlterTable
ALTER TABLE `rbac_permissions` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `rbac_roles` MODIFY `description` TEXT NULL;
