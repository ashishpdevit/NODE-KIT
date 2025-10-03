-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `default_locale` VARCHAR(191) NOT NULL DEFAULT 'en',
    ADD COLUMN `message_translations` JSON NULL,
    ADD COLUMN `title_translations` JSON NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `locale` VARCHAR(191) NOT NULL DEFAULT 'en';
