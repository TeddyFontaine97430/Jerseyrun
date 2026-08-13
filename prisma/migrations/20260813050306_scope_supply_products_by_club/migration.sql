-- AlterTable
ALTER TABLE "SupplyProduct" ADD COLUMN     "clubId" TEXT;

-- AddForeignKey
ALTER TABLE "SupplyProduct" ADD CONSTRAINT "SupplyProduct_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
