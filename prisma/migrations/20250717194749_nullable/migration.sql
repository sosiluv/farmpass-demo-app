/*
  Warnings:

  - Made the column `is_active` on table `farm_members` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `farms` required. This step will fail if there are existing NULL values in that column.
  - Made the column `login_count` on table `profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fail_count` on table `push_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `push_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `visitor_alerts` on table `user_notification_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergency_alerts` on table `user_notification_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maintenance_alerts` on table `user_notification_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `user_notification_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `notice_alerts` on table `user_notification_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `disinfection_check` on table `visitor_entries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `consent_given` on table `visitor_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "farm_members" ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "farms" ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "login_count" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "push_subscriptions" ALTER COLUMN "fail_count" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_notification_settings" ALTER COLUMN "visitor_alerts" SET NOT NULL,
ALTER COLUMN "emergency_alerts" SET NOT NULL,
ALTER COLUMN "maintenance_alerts" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "notice_alerts" SET NOT NULL;

-- AlterTable
ALTER TABLE "visitor_entries" ALTER COLUMN "disinfection_check" SET NOT NULL,
ALTER COLUMN "consent_given" SET NOT NULL;

-- CreateIndex
CREATE INDEX "system_logs_user_id_idx" ON "system_logs"("user_id");

-- CreateIndex
CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "system_logs_action_idx" ON "system_logs"("action");

-- CreateIndex
CREATE INDEX "system_logs_resource_type_idx" ON "system_logs"("resource_type");

-- CreateIndex
CREATE INDEX "system_logs_created_at_idx" ON "system_logs"("created_at");
