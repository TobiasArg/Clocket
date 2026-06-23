ALTER TABLE "categories"
  ADD COLUMN "income_eligible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "expense_eligible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "saving_eligible" BOOLEAN NOT NULL DEFAULT true;

-- One-time backfill for existing ledgers that already had income categories.
-- Runtime classification remains backend-owned through persisted eligibility flags.
UPDATE "categories"
SET "income_eligible" = true,
    "expense_eligible" = false,
    "saving_eligible" = false
WHERE "deletedAt" IS NULL
  AND (
    lower("name") LIKE '%ingreso%'
    OR lower("name") LIKE '%income%'
  );
