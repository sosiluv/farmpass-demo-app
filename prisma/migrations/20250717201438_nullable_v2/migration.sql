/*
  Warnings:

  - Made the column `created_at` on table `farm_members` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `farm_members` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `farms` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `farms` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `push_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `push_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `system_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `system_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `system_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `user_notification_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `user_notification_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `visitor_entries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `visitor_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "farm_members" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "farms" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "push_subscriptions" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "system_logs" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "system_settings" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_notification_settings" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "visitor_entries" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;
