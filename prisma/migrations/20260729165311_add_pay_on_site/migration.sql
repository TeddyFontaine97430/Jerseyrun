-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'ON_SITE');

-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "allowPayOnSite" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE';
