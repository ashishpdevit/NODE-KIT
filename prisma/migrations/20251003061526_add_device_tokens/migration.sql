-- AlterTable
ALTER TABLE `admins` ADD COLUMN `device_token` VARCHAR(191) NULL,
    ADD COLUMN `notifications_enabled` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `device_token` VARCHAR(191) NULL,
    ADD COLUMN `notifications_enabled` BOOLEAN NOT NULL DEFAULT true;
