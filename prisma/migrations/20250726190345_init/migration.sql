-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('error', 'warn', 'info', 'debug');

-- CreateTable
CREATE TABLE "system_settings" (
    "siteName" TEXT NOT NULL DEFAULT '농장 출입 관리 시스템(FarmPass)',
    "siteDescription" TEXT NOT NULL DEFAULT '방역은 출입자 관리부터 시작됩니다. QR기록으로 축산 질병 예방의 첫걸음을 함께하세요.',
    "language" TEXT NOT NULL DEFAULT 'ko',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "dateFormat" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "favicon" TEXT,
    "logo" TEXT,
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "passwordRequireSpecialChar" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireNumber" BOOLEAN NOT NULL DEFAULT true,
    "reVisitAllowInterval" INTEGER NOT NULL DEFAULT 6,
    "maxVisitorsPerDay" INTEGER NOT NULL DEFAULT 100,
    "visitorDataRetentionDays" INTEGER NOT NULL DEFAULT 1095,
    "requireVisitorPhoto" BOOLEAN NOT NULL DEFAULT false,
    "requireVisitorContact" BOOLEAN NOT NULL DEFAULT true,
    "requireVisitPurpose" BOOLEAN NOT NULL DEFAULT true,
    "visitTemplate" TEXT NOT NULL DEFAULT '{방문자명}님이 {방문날짜} {방문시간}에 {농장명}을 방문하였습니다.',
    "logLevel" "LogLevel" NOT NULL DEFAULT 'info',
    "logRetentionDays" INTEGER NOT NULL DEFAULT 90,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "debugMode" BOOLEAN NOT NULL DEFAULT false,
    "passwordRequireUpperCase" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireLowerCase" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceContactInfo" TEXT NOT NULL DEFAULT '문의사항이 있으시면 관리자에게 연락해 주세요.',
    "maintenanceEstimatedTime" INTEGER NOT NULL DEFAULT 30,
    "maintenanceMessage" TEXT NOT NULL DEFAULT '현재 시스템 업데이트 및 유지보수 작업이 진행 중입니다.',
    "maintenanceStartTime" TIMESTAMP(3),
    "accountLockoutDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    "notificationBadge" TEXT,
    "notificationIcon" TEXT,
    "pushRequireInteraction" BOOLEAN NOT NULL DEFAULT false,
    "pushSoundEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushVibrateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vapidPrivateKey" TEXT,
    "vapidPublicKey" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionCleanupDays" INTEGER NOT NULL DEFAULT 30,
    "subscriptionCleanupInactive" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionFailCountThreshold" INTEGER NOT NULL DEFAULT 5,
    "subscriptionForceDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "farm_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "position" TEXT,
    "responsibilities" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "farm_name" TEXT NOT NULL,
    "description" TEXT,
    "farm_address" TEXT NOT NULL,
    "farm_detailed_address" TEXT,
    "farm_type" TEXT,
    "owner_id" UUID NOT NULL,
    "manager_phone" TEXT,
    "manager_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "account_type" TEXT NOT NULL DEFAULT 'user',
    "company_name" TEXT,
    "company_address" TEXT,
    "business_type" TEXT,
    "company_description" TEXT,
    "establishment_date" DATE,
    "employee_count" INTEGER,
    "company_website" TEXT,
    "position" TEXT,
    "department" TEXT,
    "bio" TEXT,
    "profile_image_url" TEXT,
    "last_login_at" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6),
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_login_attempt" TIMESTAMPTZ(6),
    "last_failed_login" TIMESTAMPTZ(6),
    "avatar_seed" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level" "LogLevel" NOT NULL DEFAULT 'info',
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "user_id" UUID,
    "user_email" TEXT,
    "user_ip" TEXT,
    "user_agent" TEXT,
    "resource_type" TEXT,
    "resource_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "farm_id" UUID NOT NULL,
    "visit_datetime" TIMESTAMPTZ(6) NOT NULL,
    "visitor_name" TEXT NOT NULL,
    "visitor_phone" TEXT NOT NULL,
    "visitor_address" TEXT NOT NULL,
    "visitor_purpose" TEXT,
    "disinfection_check" BOOLEAN NOT NULL DEFAULT false,
    "vehicle_number" TEXT,
    "notes" TEXT,
    "registered_by" UUID,
    "session_token" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_photo_url" TEXT,

    CONSTRAINT "visitor_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT,
    "auth" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "device_id" TEXT,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_fail_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "user_agent" TEXT,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "notification_method" VARCHAR(20) NOT NULL,
    "visitor_alerts" BOOLEAN NOT NULL DEFAULT true,
    "emergency_alerts" BOOLEAN NOT NULL DEFAULT true,
    "maintenance_alerts" BOOLEAN NOT NULL DEFAULT true,
    "kakao_user_id" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notice_alerts" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_farm_members_farm_id" ON "farm_members"("farm_id");

-- CreateIndex
CREATE INDEX "idx_farm_members_role" ON "farm_members"("role");

-- CreateIndex
CREATE INDEX "idx_farm_members_user_id" ON "farm_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "farm_members_farm_id_user_id_key" ON "farm_members"("farm_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_farms_created_at" ON "farms"("created_at");

-- CreateIndex
CREATE INDEX "idx_farms_is_active" ON "farms"("is_active");

-- CreateIndex
CREATE INDEX "idx_farms_owner_id" ON "farms"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "idx_profiles_account_type" ON "profiles"("account_type");

-- CreateIndex
CREATE INDEX "idx_profiles_created_at" ON "profiles"("created_at");

-- CreateIndex
CREATE INDEX "idx_profiles_email" ON "profiles"("email");

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

-- CreateIndex
CREATE INDEX "idx_visitor_entries_created_at" ON "visitor_entries"("created_at");

-- CreateIndex
CREATE INDEX "idx_visitor_entries_farm_id" ON "visitor_entries"("farm_id");

-- CreateIndex
CREATE INDEX "idx_visitor_entries_visit_datetime" ON "visitor_entries"("visit_datetime");

-- CreateIndex
CREATE INDEX "idx_visitor_entries_visitor_phone" ON "visitor_entries"("visitor_phone");

-- CreateIndex
CREATE INDEX "idx_push_subscriptions_endpoint" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "idx_push_subscriptions_user_id" ON "push_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_user_id_endpoint_key" ON "push_subscriptions"("user_id", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_settings_user_id_key" ON "user_notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id");

-- AddForeignKey
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "visitor_entries" ADD CONSTRAINT "visitor_entries_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "visitor_entries" ADD CONSTRAINT "visitor_entries_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
