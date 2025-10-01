-- AlterTable
ALTER TABLE `admins`
  ADD COLUMN `api_token_version` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `last_login_at` DATETIME(3) NULL,
  ADD COLUMN `password_hash` VARCHAR(191) NULL;

UPDATE `admins`
SET `password_hash` = '$2a$10$Mu1iQkHKF/zqFFFS3DhfH.Ubmyjt8IsAHkiYgXNtiAcR9aTQpZRam'
WHERE `password_hash` IS NULL;

ALTER TABLE `admins`
  MODIFY `password_hash` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `contact_requests`
  ADD COLUMN `admin_reply` VARCHAR(191) NULL,
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

UPDATE `contact_requests`
SET `updatedAt` = NOW(3)
WHERE `updatedAt` IS NULL;

ALTER TABLE `contact_requests`
  MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
