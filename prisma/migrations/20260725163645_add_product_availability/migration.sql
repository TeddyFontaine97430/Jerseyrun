-- CreateEnum
CREATE TYPE "ProductAvailability" AS ENUM ('IN_STOCK', 'PREORDER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availability" "ProductAvailability" NOT NULL DEFAULT 'IN_STOCK';

