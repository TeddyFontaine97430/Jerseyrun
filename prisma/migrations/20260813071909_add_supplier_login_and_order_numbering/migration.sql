-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPPLIER';

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "SupplyOrder" ADD COLUMN     "orderNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_ownerId_key" ON "Supplier"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyOrder_orderNumber_key" ON "SupplyOrder"("orderNumber");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateSequence
CREATE SEQUENCE IF NOT EXISTS "supply_order_number_seq" START 1;
