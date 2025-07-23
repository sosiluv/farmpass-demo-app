-- DropForeignKey
ALTER TABLE "visitor_entries" DROP CONSTRAINT "visitor_entries_registered_by_fkey";

-- AddForeignKey
ALTER TABLE "visitor_entries" ADD CONSTRAINT "visitor_entries_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
