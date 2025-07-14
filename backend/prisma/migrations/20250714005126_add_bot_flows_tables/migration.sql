/*
  Warnings:

  - The primary key for the `_ContactTags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_TicketTags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_ContactTags` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_TicketTags` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_ContactTags" DROP CONSTRAINT "_ContactTags_AB_pkey";

-- AlterTable
ALTER TABLE "_TicketTags" DROP CONSTRAINT "_TicketTags_AB_pkey";

-- CreateTable
CREATE TABLE "bot_flows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "alwaysRespond" BOOLEAN NOT NULL DEFAULT false,
    "stopOnMatch" BOOLEAN NOT NULL DEFAULT true,
    "connectionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_conditions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "operator" TEXT NOT NULL DEFAULT 'equals',
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "regexFlags" TEXT,
    "flowId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_responses" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "responseType" TEXT NOT NULL DEFAULT 'text',
    "mediaUrl" TEXT,
    "mediaCaption" TEXT,
    "delay" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "conditionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_interactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "flowId" TEXT,
    "conditionId" TEXT,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "responsesSent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "_ContactTags_AB_unique" ON "_ContactTags"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_TicketTags_AB_unique" ON "_TicketTags"("A", "B");

-- AddForeignKey
ALTER TABLE "bot_flows" ADD CONSTRAINT "bot_flows_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_flows" ADD CONSTRAINT "bot_flows_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_conditions" ADD CONSTRAINT "bot_conditions_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "bot_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_responses" ADD CONSTRAINT "bot_responses_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "bot_conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_interactions" ADD CONSTRAINT "bot_interactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_interactions" ADD CONSTRAINT "bot_interactions_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_interactions" ADD CONSTRAINT "bot_interactions_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "bot_flows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_interactions" ADD CONSTRAINT "bot_interactions_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "bot_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
