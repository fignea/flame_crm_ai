/*
  Warnings:

  - You are about to drop the column `name` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the `contact_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ticket_tags` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[attribute,value,companyId]` on the table `tags` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attribute` to the `tags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `tags` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "contact_tags" DROP CONSTRAINT "contact_tags_contactId_fkey";

-- DropForeignKey
ALTER TABLE "contact_tags" DROP CONSTRAINT "contact_tags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_tags" DROP CONSTRAINT "ticket_tags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_tags" DROP CONSTRAINT "ticket_tags_ticketId_fkey";

-- DropIndex
DROP INDEX "tags_name_companyId_key";

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "name",
ADD COLUMN     "attribute" TEXT NOT NULL,
ADD COLUMN     "value" TEXT NOT NULL,
ALTER COLUMN "color" SET DEFAULT '#007BFF';

-- DropTable
DROP TABLE "contact_tags";

-- DropTable
DROP TABLE "ticket_tags";

-- CreateTable
CREATE TABLE "legacy_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContactTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TicketTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "legacy_tags_name_companyId_key" ON "legacy_tags"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "_ContactTags_AB_unique" ON "_ContactTags"("A", "B");

-- CreateIndex
CREATE INDEX "_ContactTags_B_index" ON "_ContactTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TicketTags_AB_unique" ON "_TicketTags"("A", "B");

-- CreateIndex
CREATE INDEX "_TicketTags_B_index" ON "_TicketTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "tags_attribute_value_companyId_key" ON "tags"("attribute", "value", "companyId");

-- AddForeignKey
ALTER TABLE "legacy_tags" ADD CONSTRAINT "legacy_tags_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactTags" ADD CONSTRAINT "_ContactTags_A_fkey" FOREIGN KEY ("A") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactTags" ADD CONSTRAINT "_ContactTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TicketTags" ADD CONSTRAINT "_TicketTags_A_fkey" FOREIGN KEY ("A") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TicketTags" ADD CONSTRAINT "_TicketTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
