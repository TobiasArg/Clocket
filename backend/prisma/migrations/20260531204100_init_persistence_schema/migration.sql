-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('USD', 'ARS');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('regular', 'saving');

-- CreateEnum
CREATE TYPE "BudgetScopeMode" AS ENUM ('all_subcategories', 'selected_subcategories');

-- CreateEnum
CREATE TYPE "GoalColorKey" AS ENUM ('emerald', 'sky', 'indigo', 'violet', 'rose', 'amber', 'cyan', 'lime');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('stock', 'crypto');

-- CreateEnum
CREATE TYPE "InvestmentEntryType" AS ENUM ('ingreso', 'egreso');

-- CreateEnum
CREATE TYPE "SnapshotSource" AS ENUM ('GLOBAL_QUOTE', 'CURRENCY_EXCHANGE_RATE');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "iconBg" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "categoryId" UUID,
    "subcategoryId" UUID,
    "goalId" UUID,
    "installmentPlanId" UUID,
    "transactionType" "TransactionType" NOT NULL DEFAULT 'regular',
    "name" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "date" DATE NOT NULL,
    "notes" TEXT,
    "uiIcon" TEXT,
    "uiIconBg" TEXT,
    "cuotaInstallmentIndex" INTEGER,
    "cuotaInstallmentsCount" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "categoryId" UUID,
    "name" TEXT NOT NULL,
    "limitAmount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "periodMonth" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_scope_rules" (
    "id" UUID NOT NULL,
    "budgetId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "mode" "BudgetScopeMode" NOT NULL,

    CONSTRAINT "budget_scope_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_scope_subcategories" (
    "id" UUID NOT NULL,
    "budgetScopeRuleId" UUID NOT NULL,
    "subcategoryId" UUID NOT NULL,

    CONSTRAINT "budget_scope_subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetAmount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "deadlineDate" DATE NOT NULL,
    "icon" TEXT NOT NULL,
    "colorKey" "GoalColorKey" NOT NULL,
    "categoryId" UUID,
    "subcategoryId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installment_plans" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "installmentsCount" INTEGER NOT NULL,
    "installmentAmount" DECIMAL(18,2) NOT NULL,
    "startMonth" DATE NOT NULL,
    "paidInstallmentsCount" INTEGER NOT NULL DEFAULT 0,
    "categoryId" UUID,
    "subcategoryId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "installment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_assets" (
    "id" UUID NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "ticker" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "investment_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_positions" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "totalInvested" DECIMAL(18,2) NOT NULL,
    "averageBuyPrice" DECIMAL(28,10) NOT NULL,
    "amount" DECIMAL(28,10) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "investment_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_entries" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "entryType" "InvestmentEntryType" NOT NULL,
    "amountUsd" DECIMAL(18,2) NOT NULL,
    "buyPrice" DECIMAL(28,10) NOT NULL,
    "units" DECIMAL(28,10) NOT NULL,
    "transactionId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_quote_snapshots" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "price" DECIMAL(28,10) NOT NULL,
    "source" "SnapshotSource" NOT NULL,
    "bid" DECIMAL(28,10),
    "ask" DECIMAL(28,10),
    "providerAsOf" TIMESTAMPTZ(3),
    "fetchedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_quote_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_asset_refs" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "dailyRefPrice" DECIMAL(28,10) NOT NULL,
    "dailyRefTimestamp" TIMESTAMPTZ(3) NOT NULL,
    "monthRefPrice" DECIMAL(28,10) NOT NULL,
    "monthRefTimestamp" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "investment_asset_refs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "language" TEXT NOT NULL DEFAULT 'es',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "profileName" TEXT NOT NULL DEFAULT '',
    "profileEmail" TEXT NOT NULL DEFAULT '',
    "avatarIcon" TEXT NOT NULL DEFAULT 'user',
    "pinHash" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_deletedAt_idx" ON "accounts"("deletedAt");

-- CreateIndex
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");

-- CreateIndex
CREATE INDEX "subcategories_categoryId_idx" ON "subcategories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_categoryId_name_key" ON "subcategories"("categoryId", "name");

-- CreateIndex
CREATE INDEX "transactions_accountId_date_idx" ON "transactions"("accountId", "date");

-- CreateIndex
CREATE INDEX "transactions_categoryId_date_idx" ON "transactions"("categoryId", "date");

-- CreateIndex
CREATE INDEX "transactions_subcategoryId_date_idx" ON "transactions"("subcategoryId", "date");

-- CreateIndex
CREATE INDEX "transactions_goalId_idx" ON "transactions"("goalId");

-- CreateIndex
CREATE INDEX "transactions_installmentPlanId_idx" ON "transactions"("installmentPlanId");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "transactions_deletedAt_idx" ON "transactions"("deletedAt");

-- CreateIndex
CREATE INDEX "budgets_periodMonth_idx" ON "budgets"("periodMonth");

-- CreateIndex
CREATE INDEX "budgets_categoryId_idx" ON "budgets"("categoryId");

-- CreateIndex
CREATE INDEX "budgets_deletedAt_idx" ON "budgets"("deletedAt");

-- CreateIndex
CREATE INDEX "budget_scope_rules_categoryId_idx" ON "budget_scope_rules"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_scope_rules_budgetId_categoryId_key" ON "budget_scope_rules"("budgetId", "categoryId");

-- CreateIndex
CREATE INDEX "budget_scope_subcategories_subcategoryId_idx" ON "budget_scope_subcategories"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_scope_subcategories_budgetScopeRuleId_subcategoryId_key" ON "budget_scope_subcategories"("budgetScopeRuleId", "subcategoryId");

-- CreateIndex
CREATE INDEX "goals_deadlineDate_idx" ON "goals"("deadlineDate");

-- CreateIndex
CREATE INDEX "goals_categoryId_idx" ON "goals"("categoryId");

-- CreateIndex
CREATE INDEX "goals_subcategoryId_idx" ON "goals"("subcategoryId");

-- CreateIndex
CREATE INDEX "goals_deletedAt_idx" ON "goals"("deletedAt");

-- CreateIndex
CREATE INDEX "installment_plans_startMonth_idx" ON "installment_plans"("startMonth");

-- CreateIndex
CREATE INDEX "installment_plans_categoryId_idx" ON "installment_plans"("categoryId");

-- CreateIndex
CREATE INDEX "installment_plans_subcategoryId_idx" ON "installment_plans"("subcategoryId");

-- CreateIndex
CREATE INDEX "installment_plans_deletedAt_idx" ON "installment_plans"("deletedAt");

-- CreateIndex
CREATE INDEX "investment_assets_ticker_idx" ON "investment_assets"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "investment_assets_assetType_ticker_key" ON "investment_assets"("assetType", "ticker");

-- CreateIndex
CREATE INDEX "investment_positions_deletedAt_idx" ON "investment_positions"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "investment_positions_assetId_key" ON "investment_positions"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "investment_entries_transactionId_key" ON "investment_entries"("transactionId");

-- CreateIndex
CREATE INDEX "investment_entries_positionId_createdAt_idx" ON "investment_entries"("positionId", "createdAt");

-- CreateIndex
CREATE INDEX "investment_entries_assetId_createdAt_idx" ON "investment_entries"("assetId", "createdAt");

-- CreateIndex
CREATE INDEX "market_quote_snapshots_assetId_fetchedAt_idx" ON "market_quote_snapshots"("assetId", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "investment_asset_refs_assetId_key" ON "investment_asset_refs"("assetId");

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_installmentPlanId_fkey" FOREIGN KEY ("installmentPlanId") REFERENCES "installment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_scope_rules" ADD CONSTRAINT "budget_scope_rules_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_scope_rules" ADD CONSTRAINT "budget_scope_rules_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_scope_subcategories" ADD CONSTRAINT "budget_scope_subcategories_budgetScopeRuleId_fkey" FOREIGN KEY ("budgetScopeRuleId") REFERENCES "budget_scope_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_scope_subcategories" ADD CONSTRAINT "budget_scope_subcategories_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_positions" ADD CONSTRAINT "investment_positions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "investment_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_entries" ADD CONSTRAINT "investment_entries_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "investment_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_entries" ADD CONSTRAINT "investment_entries_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "investment_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_entries" ADD CONSTRAINT "investment_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_quote_snapshots" ADD CONSTRAINT "market_quote_snapshots_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "investment_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_asset_refs" ADD CONSTRAINT "investment_asset_refs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "investment_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
