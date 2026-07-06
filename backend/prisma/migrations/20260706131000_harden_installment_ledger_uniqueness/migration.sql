-- Prevent duplicate active generated ledger effects for the same installment plan/index.
-- This is intentionally a PostgreSQL partial unique index because transactions are soft-deleted.
CREATE UNIQUE INDEX "transactions_active_installment_effect_unique"
ON "transactions"("installmentPlanId", "cuotaInstallmentIndex")
WHERE "deletedAt" IS NULL
  AND "installmentPlanId" IS NOT NULL
  AND "cuotaInstallmentIndex" IS NOT NULL;
