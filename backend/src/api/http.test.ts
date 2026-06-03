import { describe, expect, it } from "vitest";
import { createMockRequest, createMockResponse } from "./testUtils";
import { createApiErrorResponse, readSingleQueryParam, requireMethod } from "./http";

describe("HTTP API helpers", () => {
  it("reads the first query parameter value", () => {
    expect(readSingleQueryParam(["first", "second"])).toBe("first");
    expect(readSingleQueryParam("only")).toBe("only");
    expect(readSingleQueryParam(undefined)).toBe("");
  });

  it("creates controlled error responses", () => {
    expect(createApiErrorResponse({
      error: "Invalid request.",
      code: "INVALID_REQUEST",
      status: 400,
    })).toEqual({
      error: "Invalid request.",
      code: "INVALID_REQUEST",
      status: 400,
      retryable: false,
    });
  });

  it("returns 405 and Allow header for unsupported methods", () => {
    const response = createMockResponse();
    const allowed = requireMethod(
      createMockRequest({ method: "POST" }),
      response,
      "GET",
      "INVALID_REQUEST",
    );

    expect(allowed).toBe(false);
    expect(response.statusCode).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
    expect(response.payload).toMatchObject({ code: "INVALID_REQUEST", status: 405 });
  });
});
