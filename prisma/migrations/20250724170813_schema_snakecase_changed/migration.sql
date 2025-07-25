/*
  Warnings:

  - You are about to drop the `RealtimeNotificationEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RealtimeNotificationEvent" DROP CONSTRAINT "RealtimeNotificationEvent_user_id_fkey";

-- DropTable
DROP TABLE "RealtimeNotificationEvent";

-- CreateTable
CREATE TABLE "realtime_notification_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "realtime_notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_realtime_notification_events_user_id" ON "realtime_notification_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_realtime_notification_events_created_at" ON "realtime_notification_events"("created_at");

-- AddForeignKey
ALTER TABLE "realtime_notification_events" ADD CONSTRAINT "realtime_notification_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
