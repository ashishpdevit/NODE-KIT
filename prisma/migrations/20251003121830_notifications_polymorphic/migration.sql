/*
  Warnings:

  - The primary key for the `notifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `default_locale` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `message_translations` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `title_translations` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `user_type` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `data` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notifiable_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notifiable_type` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
TRUNCATE TABLE `notifications`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_user_id_fkey`;

-- AlterTable
ALTER TABLE `notifications` DROP PRIMARY KEY,
    DROP COLUMN `default_locale`,
    DROP COLUMN `message`,
    DROP COLUMN `message_translations`,
    DROP COLUMN `read`,
    DROP COLUMN `title`,
    DROP COLUMN `title_translations`,
    DROP COLUMN `user_id`,
    DROP COLUMN `user_type`,
    ADD COLUMN `data` LONGTEXT NOT NULL,
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `notifiable_id` BIGINT UNSIGNED NOT NULL,
    ADD COLUMN `notifiable_type` VARCHAR(191) NOT NULL,
    ADD COLUMN `read_at` DATETIME(3) NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `id` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE INDEX `notifications_notifiable_type_notifiable_id_idx` ON `notifications`(`notifiable_type`, `notifiable_id`);


-- Ensure timestamp defaults
ALTER TABLE `notifications`
  MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
