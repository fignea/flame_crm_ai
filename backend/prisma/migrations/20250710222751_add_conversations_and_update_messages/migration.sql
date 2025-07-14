/*
  Warnings:

  - You are about to drop the column `body` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `messages` table. All the data in the column will be lost.

*/

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "contactId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "userId" TEXT,
    "lastMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_contactId_connectionId_key" ON "conversations"("contactId", "connectionId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrar datos existentes de mensajes
-- Primero, crear conversaciones para los mensajes existentes
INSERT INTO "conversations" ("id", "contactId", "connectionId", "createdAt", "updatedAt")
SELECT DISTINCT 
    'conv_' || "contactId" || '_' || "connectionId",
    "contactId",
    "connectionId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "messages"
WHERE "ticketId" IS NOT NULL;

-- Actualizar mensajes existentes
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_ticketId_fkey";

-- AlterTable
ALTER TABLE "messages" 
ADD COLUMN     "content" TEXT,
ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'sent',
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "ticketId" DROP NOT NULL;

-- Copiar datos de body a content
UPDATE "messages" SET "content" = "body" WHERE "body" IS NOT NULL;

-- Asignar conversationId a mensajes existentes
UPDATE "messages" 
SET "conversationId" = 'conv_' || "contactId" || '_' || "connectionId"
WHERE "conversationId" IS NULL;

-- Hacer content NOT NULL después de copiar los datos
ALTER TABLE "messages" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "messages" ALTER COLUMN "conversationId" SET NOT NULL;

-- Eliminar columnas antiguas
ALTER TABLE "messages" DROP COLUMN "body";
ALTER TABLE "messages" DROP COLUMN "read";

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
