/*
  Warnings:

  - Added the required column `member_name` to the `farm_members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "farm_members" ADD COLUMN     "member_name" TEXT NOT NULL;
