/*
  Warnings:

  - You are about to drop the `realtime_notification_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "realtime_notification_events" DROP CONSTRAINT "realtime_notification_events_user_id_fkey";

-- DropTable
DROP TABLE "realtime_notification_events";
