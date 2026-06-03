import axios from "axios";

export interface CoreFinanceApiErrorPayload {
  error: string;
  code: string;
  status: number;
  retryable: boolean;
  details?: string;
}

export class CoreFinanceHttpError extends Error {
  public readonly code: string;

  public readonly status: number;

  public readonly retryable: boolean;

  public constructor(message: string, details: {
    code: string;
    status: number;
    retryable?: boolean;
  }) {
    super(message);
    this.name = "CoreFinanceHttpError";
    this.code = details.code;
    this.status = details.status;
    this.retryable = details.retryable ?? false;
  }
}

export const coreFinanceHttpClient = axios.create({
  timeout: 12_000,
  headers: {
    Accept: "application/json",
  },
});

const isApiErrorPayload = (value: unknown): value is CoreFinanceApiErrorPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<CoreFinanceApiErrorPayload>;
  return (
    typeof payload.error === "string" &&
    typeof payload.code === "string" &&
    typeof payload.status === "number"
  );
};

export const toCoreFinanceHttpError = (error: unknown): CoreFinanceHttpError => {
  if (error instanceof CoreFinanceHttpError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 503;
    const data = error.response?.data;
    if (isApiErrorPayload(data)) {
      return new CoreFinanceHttpError(data.error, {
        code: data.code,
        status: data.status,
        retryable: data.retryable,
      });
    }

    return new CoreFinanceHttpError(error.message || "Core finance request failed.", {
      code: error.response ? "HTTP_ERROR" : "NETWORK_ERROR",
      status,
      retryable: status >= 500,
    });
  }

  return new CoreFinanceHttpError("Unknown core finance request error.", {
    code: "UNKNOWN",
    status: 503,
    retryable: true,
  });
};

export const isNotFoundError = (error: unknown): boolean => {
  return error instanceof CoreFinanceHttpError &&
    (error.status === 404 || error.code === "NOT_FOUND");
};

export const withCoreFinanceErrors = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw toCoreFinanceHttpError(error);
  }
};
