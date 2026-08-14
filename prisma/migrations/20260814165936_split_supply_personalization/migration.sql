-- Split the single "personalization" toggle/text into two independent options:
-- player number and first name.

-- AlterTable: SupplyProduct
ALTER TABLE "SupplyProduct" ADD COLUMN     "personalizationNumberEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SupplyProduct" ADD COLUMN     "personalizationNameEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: articles that already had personalization enabled were the "player number" kind
-- (the UI badge read "Personnalisable (n° joueur)").
UPDATE "SupplyProduct" SET "personalizationNumberEnabled" = true WHERE "personalizationEnabled" = true;

ALTER TABLE "SupplyProduct" DROP COLUMN "personalizationEnabled";

-- AlterTable: SupplyOrderItem
ALTER TABLE "SupplyOrderItem" ADD COLUMN     "personalizationNumber" TEXT;
ALTER TABLE "SupplyOrderItem" ADD COLUMN     "personalizationName" TEXT;

-- Backfill: existing free-text personalization was always a player number.
UPDATE "SupplyOrderItem" SET "personalizationNumber" = "personalizationText" WHERE "personalizationText" IS NOT NULL;

ALTER TABLE "SupplyOrderItem" DROP COLUMN "personalizationText";
