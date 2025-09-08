/*
  Warnings:

  - A unique constraint covering the columns `[user_id,device_id]` on the table `push_subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "push_subscriptions_user_id_endpoint_key";

-- CreateIndex
CREATE INDEX "idx_push_subscriptions_device_id" ON "push_subscriptions"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_user_id_device_id_key" ON "push_subscriptions"("user_id", "device_id");
