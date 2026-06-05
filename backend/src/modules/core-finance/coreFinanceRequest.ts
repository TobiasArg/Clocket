import type { NextApiRequest } from "next";
import { readSingleQueryParam, type ApiResult } from "../../api/http";
import {
  createCoreFinanceApiErrorResponse,
  type CoreFinanceApiErrorCode,
} from "./coreFinanceApiErrors";

export const parseIdParam = (
  query: NextApiRequest["query"],
  key = "id",
): ApiResult<string, CoreFinanceApiErrorCode> => {
  const value = readSingleQueryParam(query[key]).trim();
  if (!value) {
    return {
      ok: false,
      response: createCoreFinanceApiErrorResponse({
        error: `Path parameter '${key}' is required.`,
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  return { ok: true, value };
};

export const parseJsonObjectBody = (
  body: unknown,
): ApiResult<Record<string, unknown>, CoreFinanceApiErrorCode> => {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      response: createCoreFinanceApiErrorResponse({
        error: "Request body must be a JSON object.",
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  return { ok: true, value: body as Record<string, unknown> };
};

export const readOptionalString = (
  body: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = body[key];
  return typeof value === "string" ? value.trim() : undefined;
};

export const readRequiredString = (
  body: Record<string, unknown>,
  key: string,
): ApiResult<string, CoreFinanceApiErrorCode> => {
  const value = readOptionalString(body, key);
  if (!value) {
    return {
      ok: false,
      response: createCoreFinanceApiErrorResponse({
        error: `Field '${key}' must be a non-empty string.`,
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  return { ok: true, value };
};

export const readOptionalNullableString = (
  body: Record<string, unknown>,
  key: string,
): string | null | undefined => {
  if (!(key in body)) {
    return undefined;
  }
  if (body[key] === null) {
    return null;
  }
  return readOptionalString(body, key) ?? null;
};

export const isValidCurrency = (value: unknown): value is "USD" | "ARS" => {
  return value === "USD" || value === "ARS";
};

export const readDecimalInput = (
  body: Record<string, unknown>,
  key: string,
  required: boolean,
): ApiResult<string | number | undefined, CoreFinanceApiErrorCode> => {
  const value = body[key];
  if (value === undefined && !required) {
    return { ok: true, value: undefined };
  }

  const isValid = typeof value === "number"
    ? Number.isFinite(value)
    : typeof value === "string" && value.trim().length > 0 && Number.isFinite(Number(value));

  if (!isValid) {
    return {
      ok: false,
      response: createCoreFinanceApiErrorResponse({
        error: `Field '${key}' must be a valid decimal value.`,
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  return { ok: true, value: value as string | number };
};

export const readDateOnlyInput = (
  body: Record<string, unknown>,
  key: string,
  required: boolean,
): ApiResult<string | undefined, CoreFinanceApiErrorCode> => {
  const value = body[key];
  if (value === undefined && !required) {
    return { ok: true, value: undefined };
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return {
      ok: false,
      response: createCoreFinanceApiErrorResponse({
        error: `Field '${key}' must be a date string in YYYY-MM-DD format.`,
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return {
      ok: false,
      response: createCoreFinanceApiErrorResponse({
        error: `Field '${key}' must be a valid date string.`,
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  return { ok: true, value };
};

export const readYearMonthInput = (
  body: Record<string, unknown>,
  key: string,
  required: boolean,
): ApiResult<string | undefined, CoreFinanceApiErrorCode> => {
  const value = body[key];
  if (value === undefined && !required) {
    return { ok: true, value: undefined };
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
    return {
      ok: false,
      response: createCoreFinanceApiErrorResponse({
        error: `Field '${key}' must be a month string in YYYY-MM format.`,
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  const parsed = new Date(`${value}-01T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 7) !== value) {
    return {
      ok: false,
      response: createCoreFinanceApiErrorResponse({
        error: `Field '${key}' must be a valid month string.`,
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  return { ok: true, value };
};

export const readIntegerInput = (
  body: Record<string, unknown>,
  key: string,
  required: boolean,
): ApiResult<number | undefined, CoreFinanceApiErrorCode> => {
  const value = body[key];
  if (value === undefined && !required) {
    return { ok: true, value: undefined };
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    return {
      ok: false,
      response: createCoreFinanceApiErrorResponse({
        error: `Field '${key}' must be an integer.`,
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  return { ok: true, value };
};
