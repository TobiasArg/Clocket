ALTER TABLE "categories"
  ADD COLUMN "income_eligible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "expense_eligible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "saving_eligible" BOOLEAN NOT NULL DEFAULT true;
