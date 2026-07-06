import { createApiErrorResponse, type ApiErrorResponse } from "../../api/http";
import { TransactionRepositoryError } from "../transactions/transactionsRepository";
import { CategoryRepositoryError } from "../categories/categoriesRepository";

export type CoreFinanceApiErrorCode =
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "MISSING_ACCOUNT"
  | "MISSING_CATEGORY"
  | "MISSING_SUBCATEGORY"
  | "SUBCATEGORY_CATEGORY_MISMATCH"
  | "MISSING_GOAL"
  | "GOAL_IN_USE"
  | "ACCOUNT_IN_USE"
  | "SAVING_REQUIRES_GOAL"
  | "INVALID_AMOUNT_SIGN"
  | "CATEGORY_NOT_ELIGIBLE_FOR_CLASSIFICATION"
  | "MISSING_INSTALLMENT_PLAN"
  | "DUPLICATE_CATEGORY"
  | "DUPLICATE_SUBCATEGORY"
  | "CATEGORY_IN_USE"
  | "SUBCATEGORY_IN_USE"
  | "EMPTY_SCOPE"
  | "OVERLAPPING_BUDGET"
  | "INVALID_ASSET_TYPE"
  | "INVALID_TICKER"
  | "INVALID_ENTRY_TYPE"
  | "INVALID_AMOUNT"
  | "INVALID_PRICE"
  | "MISSING_TRANSACTION"
  | "TRANSACTION_ALREADY_LINKED"
  | "OVERSOLD_POSITION"
  | "INTERNAL_ERROR";

export type CoreFinanceApiErrorResponse = ApiErrorResponse<CoreFinanceApiErrorCode>;

export class CoreFinanceApiError extends Error {
  public readonly code: CoreFinanceApiErrorCode;
  public readonly status: number;
  public readonly retryable: boolean;
  public readonly details: string | undefined;

  public constructor(
    message: string,
    options: {
      code: CoreFinanceApiErrorCode;
      status: number;
      retryable?: boolean;
      details?: string;
    },
  ) {
    super(message);
    this.name = "CoreFinanceApiError";
    this.code = options.code;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

export const createCoreFinanceApiErrorResponse = ({
  error,
  code,
  status,
  retryable = false,
  details,
}: {
  error: string;
  code: CoreFinanceApiErrorCode;
  status: number;
  retryable?: boolean;
  details?: string;
}): CoreFinanceApiErrorResponse => createApiErrorResponse({
  error,
  code,
  status,
  retryable,
  details,
});

export const mapCoreFinanceError = (error: unknown): CoreFinanceApiErrorResponse => {
  if (error instanceof CoreFinanceApiError) {
    return createCoreFinanceApiErrorResponse({
      error: error.message,
      code: error.code,
      status: error.status,
      retryable: error.retryable,
      details: error.details,
    });
  }

  if (error instanceof TransactionRepositoryError) {
    return createCoreFinanceApiErrorResponse({
      error: error.message,
      code: error.code,
      status: 422,
    });
  }

  if (error instanceof CategoryRepositoryError) {
    return createCoreFinanceApiErrorResponse({
      error: error.message,
      code: error.code,
      status: 409,
    });
  }

  return createCoreFinanceApiErrorResponse({
    error: "Unexpected core finance API failure.",
    code: "INTERNAL_ERROR",
    status: 500,
    retryable: true,
  });
};
