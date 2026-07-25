-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "personalizationText" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "personalizationText" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "personalizationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "personalizationFeeCents" INTEGER NOT NULL DEFAULT 0;

