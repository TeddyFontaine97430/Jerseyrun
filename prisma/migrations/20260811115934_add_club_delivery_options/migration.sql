-- AlterEnum
ALTER TYPE "DeliveryMethod" ADD VALUE 'DELIVERY_METROPOLE';
ALTER TYPE "DeliveryMethod" ADD VALUE 'DELIVERY_REUNION';

-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "deliveryMetropoleEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryMetropoleExtraItemCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryMetropoleFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryReunionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryReunionExtraItemCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryReunionFeeCents" INTEGER NOT NULL DEFAULT 0;
