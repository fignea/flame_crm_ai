-- AlterTable
ALTER TABLE "_ContactTags" ADD CONSTRAINT "_ContactTags_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ContactTags_AB_unique";

-- AlterTable
ALTER TABLE "_TicketTags" ADD CONSTRAINT "_TicketTags_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_TicketTags_AB_unique";
