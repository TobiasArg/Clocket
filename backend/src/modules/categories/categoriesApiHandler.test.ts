import { describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "../../api/testUtils";
import { createCategoriesCollectionHandler, createCategoryItemHandler, createCategorySubcategoriesHandler, createCategoryTransactionEditorOptionsHandler } from "./categoriesApiHandler";
import type { CategoriesService } from "./categoriesService";

const categoryResponse = {
  id: "category-1",
  name: "Food",
  icon: "utensils",
  iconBg: "bg-orange-500",
  eligibility: { income: false, expense: true, saving: true },
  subcategoryCount: 0,
  subcategories: [],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const createService = (): CategoriesService => ({
  listCategories: vi.fn().mockResolvedValue({ categories: [categoryResponse] }),
  listTransactionEditorOptions: vi.fn().mockResolvedValue({ classifications: [], categories: [] }),
  getCategory: vi.fn().mockResolvedValue(categoryResponse),
  createCategory: vi.fn().mockResolvedValue({ ...categoryResponse, id: "created" }),
  updateCategory: vi.fn().mockResolvedValue({ ...categoryResponse, name: "Updated" }),
  replaceSubcategories: vi.fn().mockResolvedValue({ ...categoryResponse, subcategoryCount: 1 }),
  deleteCategory: vi.fn().mockResolvedValue({ deleted: true }),
});

describe("categories API handlers", () => {
  it("handles collection list and create", async () => {
    const service = createService();
    const handler = createCategoriesCollectionHandler({ service });
    const listResponse = createMockResponse();
    const createResponse = createMockResponse();

    await handler(createMockRequest({ method: "GET" }), listResponse);
    await handler(createMockRequest({ method: "POST", body: { name: "Food" } }), createResponse);

    expect(listResponse.statusCode).toBe(200);
    expect(createResponse.statusCode).toBe(201);
    expect(service.createCategory).toHaveBeenCalledWith({ name: "Food" });
  });

  it("handles item and subcategory routes", async () => {
    const service = createService();
    const itemHandler = createCategoryItemHandler({ service });
    const subcategoriesHandler = createCategorySubcategoriesHandler({ service });
    const itemResponse = createMockResponse();
    const subcategoriesResponse = createMockResponse();

    await itemHandler(createMockRequest({ method: "PATCH", query: { id: "category-1" }, body: { name: "Updated" } }), itemResponse);
    await subcategoriesHandler(createMockRequest({ method: "PUT", query: { id: "category-1" }, body: { subcategories: ["Rent"] } }), subcategoriesResponse);

    expect(itemResponse.statusCode).toBe(200);
    expect(subcategoriesResponse.statusCode).toBe(200);
    expect(service.updateCategory).toHaveBeenCalledWith("category-1", { name: "Updated" });
    expect(service.replaceSubcategories).toHaveBeenCalledWith("category-1", { subcategories: ["Rent"] });
  });

  it("returns 405 for unsupported methods", async () => {
    const response = createMockResponse();
    await createCategorySubcategoriesHandler({ service: createService() })(
      createMockRequest({ method: "POST", query: { id: "category-1" } }),
      response,
    );

    expect(response.statusCode).toBe(405);
    expect(response.headers.get("Allow")).toBe("PUT");
  });

  it("handles transaction editor options route", async () => {
    const service = createService();
    const handler = createCategoryTransactionEditorOptionsHandler({ service });
    const response = createMockResponse();

    await handler(createMockRequest({ method: "GET" }), response);

    expect(response.statusCode).toBe(200);
    expect(service.listTransactionEditorOptions).toHaveBeenCalled();
  });
});
