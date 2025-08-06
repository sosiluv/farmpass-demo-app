/*
  Warnings:

  - You are about to drop the column `consent_type` on the `user_consents` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `user_consents` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,term_id]` on the table `user_consents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `term_id` to the `user_consents` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "visitor_entries" DROP CONSTRAINT "visitor_entries_registered_by_fkey";

-- DropIndex
DROP INDEX "idx_user_consents_consent_type";

-- DropIndex
DROP INDEX "idx_user_consents_type_version";

-- DropIndex
DROP INDEX "user_consents_user_id_consent_type_version_key";

-- AlterTable
ALTER TABLE "user_consents" DROP COLUMN "consent_type",
DROP COLUMN "version",
ADD COLUMN     "term_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "terms_management" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_management_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_terms_management_type" ON "terms_management"("type");

-- CreateIndex
CREATE INDEX "idx_terms_management_is_active" ON "terms_management"("is_active");

-- CreateIndex
CREATE INDEX "idx_terms_management_created_by" ON "terms_management"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "terms_management_type_version_key" ON "terms_management"("type", "version");

-- CreateIndex
CREATE INDEX "idx_user_consents_term_id" ON "user_consents"("term_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_user_id_term_id_key" ON "user_consents"("user_id", "term_id");

-- AddForeignKey
ALTER TABLE "visitor_entries" ADD CONSTRAINT "visitor_entries_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "terms_management" ADD CONSTRAINT "terms_management_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms_management"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
