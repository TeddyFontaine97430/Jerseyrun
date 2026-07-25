-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'DELIVERY';

