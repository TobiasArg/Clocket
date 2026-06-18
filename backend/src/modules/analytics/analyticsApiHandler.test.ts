import { describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "../../api/testUtils";
import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { createAnalyticsHomeHandler, createAnalyticsStatisticsHandler } from "./analyticsApiHandler";
import type { AnalyticsService } from "./analyticsService";

const createService = (): AnalyticsService => ({
  getHomeAnalytics: vi.fn().mockResolvedValue({ periodMonth: "2026-06", totalBalance: "0.00" }),
  getStatisticsAnalytics: vi.fn().mockResolvedValue({ scope: "month", periodMonth: "2026-06" }),
});

describe("analytics API handlers", () => {
  it("handles home analytics requests", async () => {
    const service = createService();
    const response = createMockResponse();

    await createAnalyticsHomeHandler({ service })(createMockRequest({ method: "GET" }), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({ periodMonth: "2026-06" });
    expect(service.getHomeAnalytics).toHaveBeenCalledWith({});
  });

  it("handles statistics analytics requests", async () => {
    const service = createService();
    const response = createMockResponse();

    await createAnalyticsStatisticsHandler({ service })(createMockRequest({ method: "GET", query: { scope: "month" } }), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({ scope: "month" });
    expect(service.getStatisticsAnalytics).toHaveBeenCalledWith({ scope: "month" });
  });

  it("maps errors and unsupported methods", async () => {
    const service = createService();
    vi.mocked(service.getStatisticsAnalytics).mockRejectedValue(new CoreFinanceApiError("Invalid scope.", { code: "INVALID_REQUEST", status: 400 }));
    const invalidResponse = createMockResponse();
    const methodResponse = createMockResponse();
    const handler = createAnalyticsStatisticsHandler({ service });

    await handler(createMockRequest({ method: "GET", query: { scope: "bad" } }), invalidResponse);
    await handler(createMockRequest({ method: "POST" }), methodResponse);

    expect(invalidResponse.statusCode).toBe(400);
    expect(invalidResponse.payload).toMatchObject({ code: "INVALID_REQUEST" });
    expect(methodResponse.statusCode).toBe(405);
    expect(methodResponse.headers.get("Allow")).toBe("GET");
  });
});
