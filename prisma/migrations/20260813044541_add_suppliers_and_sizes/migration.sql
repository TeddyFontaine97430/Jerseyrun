-- AlterTable
ALTER TABLE "SupplyOrderItem" ADD COLUMN     "personalizationText" TEXT,
ADD COLUMN     "sentToSupplierAt" TIMESTAMP(3),
ADD COLUMN     "size" TEXT,
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "SupplyProduct" ADD COLUMN     "personalizationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupplyOrderItem" ADD CONSTRAINT "SupplyOrderItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
