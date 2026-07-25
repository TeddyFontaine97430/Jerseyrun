-- CreateTable
CREATE TABLE "ProductOptionValue" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductOptionValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductOptionValue_optionId_value_key" ON "ProductOptionValue"("optionId", "value");

-- AddForeignKey
ALTER TABLE "ProductOptionValue" ADD CONSTRAINT "ProductOptionValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: split existing ProductOption.values ("S,M,L,XL") into ProductOptionValue rows,
-- distributing each product's current total stock evenly across its option's values.
INSERT INTO "ProductOptionValue" ("id", "optionId", "value", "stock", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text || po."id" || v.value),
  po."id",
  trim(v.value),
  GREATEST(0, p."stock" / GREATEST(1, cardinality(string_to_array(po."values", ','))))::int,
  now()
FROM "ProductOption" po
JOIN "Product" p ON p."id" = po."productId"
CROSS JOIN LATERAL unnest(string_to_array(po."values", ',')) AS v(value)
WHERE po."values" IS NOT NULL AND trim(po."values") <> ''
ON CONFLICT ("optionId", "value") DO NOTHING;

-- DropColumn
ALTER TABLE "ProductOption" DROP COLUMN "values";
