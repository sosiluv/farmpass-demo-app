-- DropForeignKey
ALTER TABLE "system_logs" DROP CONSTRAINT "system_logs_user_id_fkey";

-- CreateTable
CREATE TABLE "user_consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "consent_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "agreed" BOOLEAN NOT NULL DEFAULT false,
    "agreed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_consents_user_id" ON "user_consents"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_consents_consent_type" ON "user_consents"("consent_type");

-- CreateIndex
CREATE INDEX "idx_user_consents_type_version" ON "user_consents"("consent_type", "version");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_user_id_consent_type_version_key" ON "user_consents"("user_id", "consent_type", "version");

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
