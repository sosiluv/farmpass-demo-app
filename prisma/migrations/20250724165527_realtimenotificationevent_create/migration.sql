-- CreateTable
CREATE TABLE "RealtimeNotificationEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RealtimeNotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_realtime_notification_events_user_id" ON "RealtimeNotificationEvent"("user_id");

-- CreateIndex
CREATE INDEX "idx_realtime_notification_events_created_at" ON "RealtimeNotificationEvent"("created_at");

-- AddForeignKey
ALTER TABLE "RealtimeNotificationEvent" ADD CONSTRAINT "RealtimeNotificationEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
