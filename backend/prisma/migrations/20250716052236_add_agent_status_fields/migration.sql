-- AlterTable
ALTER TABLE "users" ADD COLUMN     "agentStatus" TEXT NOT NULL DEFAULT 'available',
ADD COLUMN     "autoAwayEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoAwayTimeout" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "statusMessage" TEXT,
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
