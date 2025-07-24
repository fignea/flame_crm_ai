-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "fileMimeType" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "locationAddress" TEXT,
ADD COLUMN     "locationLatitude" DOUBLE PRECISION,
ADD COLUMN     "locationLongitude" DOUBLE PRECISION,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3);
