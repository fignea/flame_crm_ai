-- AlterTable
ALTER TABLE "_ContactTags" ADD CONSTRAINT "_ContactTags_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ContactTags_AB_unique";

-- AlterTable
ALTER TABLE "_TicketTags" ADD CONSTRAINT "_TicketTags_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_TicketTags_AB_unique";

-- CreateTable
CREATE TABLE "auto_message_schedules" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timeRanges" JSONB NOT NULL,
    "daysOfWeek" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_message_schedules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "auto_message_schedules" ADD CONSTRAINT "auto_message_schedules_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
