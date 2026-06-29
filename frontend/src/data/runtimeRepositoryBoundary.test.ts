import { describe, expect, it } from "vitest";
import * as publicDataExports from "@/data";
import {
  accountsRepository,
  appSettingsRepository,
  budgetsRepository,
  categoriesRepository,
  cuotasRepository,
  goalsRepository,
  HttpAccountsRepository,
  HttpAppSettingsRepository,
  HttpBudgetsRepository,
  HttpCategoriesRepository,
  HttpCuotasRepository,
  HttpGoalsRepository,
  HttpInvestmentsRepository,
  HttpTransactionsRepository,
  investmentsRepository,
  transactionsRepository,
} from "@/utils";
import * as publicUtilsExports from "@/utils";

const forbiddenLegacyExportNames = [
  "LocalStorageAccountsRepository",
  "LocalStorageAppSettingsRepository",
  "LocalStorageBudgetsRepository",
  "LocalStorageCategoriesRepository",
  "LocalStorageCuotasRepository",
  "LocalStorageGoalsRepository",
  "LocalStorageInvestmentsPortfolioRepository",
  "LocalStorageInvestmentsRepository",
  "LocalStorageTransactionsRepository",
  "accountsRepository",
  "appSettingsRepository",
  "budgetsRepository",
  "categoriesRepository",
  "cuotasRepository",
  "goalsRepository",
  "investmentsPortfolioRepository",
  "investmentsRepository",
  "transactionsRepository",
];

describe("runtime repository boundaries", () => {
  it("does not expose localStorage repositories from the public data barrel", () => {
    expect(Object.keys(publicDataExports)).not.toEqual(
      expect.arrayContaining(forbiddenLegacyExportNames),
    );
  });

  it("does not expose localStorage repositories from the shared utils barrel", () => {
    expect(Object.keys(publicUtilsExports)).not.toEqual(
      expect.arrayContaining([
        "LocalStorageAccountsRepository",
        "LocalStorageAppSettingsRepository",
        "LocalStorageBudgetsRepository",
        "LocalStorageCategoriesRepository",
        "LocalStorageCuotasRepository",
        "LocalStorageGoalsRepository",
        "LocalStorageInvestmentsPortfolioRepository",
        "LocalStorageInvestmentsRepository",
        "LocalStorageTransactionsRepository",
        "investmentsPortfolioRepository",
      ]),
    );
  });

  it("keeps active runtime repository defaults backed by HTTP implementations", () => {
    expect(accountsRepository).toBeInstanceOf(HttpAccountsRepository);
    expect(appSettingsRepository).toBeInstanceOf(HttpAppSettingsRepository);
    expect(budgetsRepository).toBeInstanceOf(HttpBudgetsRepository);
    expect(categoriesRepository).toBeInstanceOf(HttpCategoriesRepository);
    expect(cuotasRepository).toBeInstanceOf(HttpCuotasRepository);
    expect(goalsRepository).toBeInstanceOf(HttpGoalsRepository);
    expect(investmentsRepository).toBeInstanceOf(HttpInvestmentsRepository);
    expect(transactionsRepository).toBeInstanceOf(HttpTransactionsRepository);
  });
});
