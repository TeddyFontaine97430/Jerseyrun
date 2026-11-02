-- AlterTable
ALTER TABLE "ProductOptionValue" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill: numérote les valeurs existantes de chaque option dans leur ordre d'enregistrement.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "optionId" ORDER BY "createdAt" ASC, "id" ASC) - 1 AS rn
  FROM "ProductOptionValue"
)
UPDATE "ProductOptionValue" v
SET "position" = ranked.rn
FROM ranked
WHERE v."id" = ranked."id";
