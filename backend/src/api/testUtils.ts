import type { NextApiRequest, NextApiResponse } from "next";

export const createMockRequest = (overrides: Partial<NextApiRequest> = {}): NextApiRequest => ({
  method: "GET",
  query: {},
  body: undefined,
  ...overrides,
} as NextApiRequest);

export const createMockResponse = <T>() => {
  const response = {
    headers: new Map<string, string>(),
    statusCode: 0,
    payload: undefined as T | undefined,
    setHeader(name: string, value: string) {
      response.headers.set(name, value);
      return response;
    },
    status(statusCode: number) {
      response.statusCode = statusCode;
      return response;
    },
    json(payload: T) {
      response.payload = payload;
      return response;
    },
  };

  return response as unknown as NextApiResponse<T> & typeof response;
};
