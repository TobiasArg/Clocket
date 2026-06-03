import { createApiErrorResponse, type ApiErrorResponse } from "../../api/http";
import { TransactionRepositoryError } from "../transactions/transactionsRepository";

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
  | "SAVING_REQUIRES_GOAL"
  | "MISSING_INSTALLMENT_PLAN"
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

  return createCoreFinanceApiErrorResponse({
    error: "Unexpected core finance API failure.",
    code: "INTERNAL_ERROR",
    status: 500,
    retryable: true,
  });
};
