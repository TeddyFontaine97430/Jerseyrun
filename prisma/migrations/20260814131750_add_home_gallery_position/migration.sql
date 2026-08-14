-- AlterTable
ALTER TABLE "HomeGalleryImage" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill: assign sequential positions based on current insertion order.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) - 1 AS rn
  FROM "HomeGalleryImage"
)
UPDATE "HomeGalleryImage" g
SET "position" = ranked.rn
FROM ranked
WHERE g."id" = ranked."id";
