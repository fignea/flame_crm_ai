-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "customerType" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "socials" JSONB,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" TEXT;
