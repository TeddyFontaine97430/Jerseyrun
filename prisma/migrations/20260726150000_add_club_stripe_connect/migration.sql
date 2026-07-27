-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Club_stripeAccountId_key" ON "Club"("stripeAccountId");
