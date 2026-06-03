import type { NextApiRequest, NextApiResponse } from "next";

export type ApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ApiErrorResponse<Code extends string = string> {
  error: string;
  code: Code;
  status: number;
  retryable: boolean;
  details?: string;
}

export type ApiResult<T, Code extends string = string> =
  | { ok: true; value: T }
  | { ok: false; response: ApiErrorResponse<Code> };

export const readSingleQueryParam = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

export const createApiErrorResponse = <Code extends string>({
  error,
  code,
  status,
  retryable = false,
  details,
}: {
  error: string;
  code: Code;
  status: number;
  retryable?: boolean;
  details?: string;
}): ApiErrorResponse<Code> => ({
  error,
  code,
  status,
  retryable,
  ...(details !== undefined ? { details } : {}),
});

export const sendJson = <T>(res: NextApiResponse<T>, status: number, payload: T): void => {
  res.status(status).json(payload);
};

export const sendError = <Code extends string>(
  res: NextApiResponse<ApiErrorResponse<Code>>,
  response: ApiErrorResponse<Code>,
): void => {
  sendJson(res, response.status, response);
};

export const requireMethod = <Code extends string>(
  req: NextApiRequest,
  res: NextApiResponse<ApiErrorResponse<Code>>,
  allowed: ApiMethod | ApiMethod[],
  errorCode: Code,
): boolean => {
  const allowedMethods = Array.isArray(allowed) ? allowed : [allowed];
  if (req.method && allowedMethods.includes(req.method as ApiMethod)) {
    return true;
  }

  res.setHeader("Allow", allowedMethods.join(", "));
  sendError(res, createApiErrorResponse({
    error: "Method not allowed.",
    code: errorCode,
    status: 405,
  }));
  return false;
};
