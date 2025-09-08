/*
  Warnings:

  - You are about to drop the column `emergency_alerts` on the `user_notification_settings` table. All the data in the column will be lost.
  - You are about to drop the column `maintenance_alerts` on the `user_notification_settings` table. All the data in the column will be lost.
  - You are about to drop the column `notice_alerts` on the `user_notification_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_notification_settings" DROP COLUMN "emergency_alerts",
DROP COLUMN "maintenance_alerts",
DROP COLUMN "notice_alerts",
ADD COLUMN     "system_alerts" BOOLEAN NOT NULL DEFAULT true;
