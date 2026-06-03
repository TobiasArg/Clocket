import { describe, expect, it } from "vitest";
import { TransactionRepositoryError } from "../transactions/transactionsRepository";
import { CoreFinanceApiError, mapCoreFinanceError } from "./coreFinanceApiErrors";

describe("core finance API error mapping", () => {
  it("maps core finance errors directly", () => {
    expect(mapCoreFinanceError(new CoreFinanceApiError("Missing record.", {
      code: "NOT_FOUND",
      status: 404,
    }))).toEqual({
      error: "Missing record.",
      code: "NOT_FOUND",
      status: 404,
      retryable: false,
    });
  });

  it("maps transaction repository validation errors", () => {
    expect(mapCoreFinanceError(new TransactionRepositoryError(
      "MISSING_ACCOUNT",
      "Active account was not found.",
    ))).toEqual({
      error: "Active account was not found.",
      code: "MISSING_ACCOUNT",
      status: 422,
      retryable: false,
    });
  });
});
