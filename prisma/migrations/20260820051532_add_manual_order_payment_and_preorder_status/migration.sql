-- CreateEnum
CREATE TYPE "ManualPaymentMethod" AS ENUM ('ESPECES', 'CARTE', 'CHEQUE');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PREORDER';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "manualPaymentMethod" "ManualPaymentMethod";
