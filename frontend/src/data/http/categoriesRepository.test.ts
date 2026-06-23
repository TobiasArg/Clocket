import { beforeEach, describe, expect, it, vi } from "vitest";

const { httpDeleteMock, httpGetMock, httpPatchMock, httpPostMock, httpPutMock } = vi.hoisted(() => ({
  httpDeleteMock: vi.fn(),
  httpGetMock: vi.fn(),
  httpPatchMock: vi.fn(),
  httpPostMock: vi.fn(),
  httpPutMock: vi.fn(),
}));

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    delete: httpDeleteMock,
    get: httpGetMock,
    patch: httpPatchMock,
    post: httpPostMock,
    put: httpPutMock,
  }));
  const isAxiosError = (error: unknown): boolean => (
    typeof error === "object" && error !== null && "isAxiosError" in error
  );
  return { default: { create, isAxiosError }, create, isAxiosError };
});

import { HttpCategoriesRepository } from "./categoriesRepository";

const categoryPayload = {
  id: "category-1",
  name: "Food",
  icon: "fork",
  iconBg: "bg-red-500",
  subcategoryCount: 1,
  subcategories: [{
    id: "subcategory-1",
    categoryId: "category-1",
    name: "Groceries",
    sortOrder: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  }],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("HttpCategoriesRepository", () => {
  beforeEach(() => {
    httpDeleteMock.mockReset();
    httpGetMock.mockReset();
    httpPatchMock.mockReset();
    httpPostMock.mockReset();
    httpPutMock.mockReset();
  });

  it("lists categories and maps subcategory records to names", async () => {
    httpGetMock.mockResolvedValue({ data: { categories: [categoryPayload] } });

    await expect(new HttpCategoriesRepository().list()).resolves.toEqual([expect.objectContaining({
      id: "category-1",
      subcategoryCount: 1,
      subcategories: ["Groceries"],
    })]);
  });

  it("maps backend transaction editor options", async () => {
    httpGetMock.mockResolvedValue({
      data: {
        classifications: [{ classification: "income", label: "Ingreso", amountSign: "positive", requiresGoal: false }],
        categories: [{
          id: "category-1",
          name: "Consulting",
          icon: "briefcase",
          iconBg: "bg-emerald-500",
          eligibility: { income: true, expense: false, saving: false },
          subcategories: [{ id: "subcategory-1", categoryId: "category-1", name: "Clients", sortOrder: 0 }],
        }],
      },
    });

    await expect(new HttpCategoriesRepository().listTransactionEditorOptions()).resolves.toEqual({
      classifications: [expect.objectContaining({ classification: "income" })],
      categories: [expect.objectContaining({
        id: "category-1",
        eligibility: { income: true, expense: false, saving: false },
        subcategories: [expect.objectContaining({ name: "Clients" })],
      })],
    });
    expect(httpGetMock).toHaveBeenCalledWith("/api/categories/transaction-editor-options");
  });

  it("updates metadata before replacing subcategories", async () => {
    httpPatchMock.mockResolvedValue({ data: { ...categoryPayload, name: "Updated" } });
    httpPutMock.mockResolvedValue({ data: { ...categoryPayload, name: "Updated", subcategoryCount: 2 } });

    const updated = await new HttpCategoriesRepository().update("category-1", {
      name: "Updated",
      subcategories: ["Groceries", "Restaurants"],
    });

    expect(updated).toMatchObject({ name: "Updated", subcategoryCount: 2 });
    expect(httpPatchMock).toHaveBeenCalledWith("/api/categories/category-1", { name: "Updated" });
    expect(httpPutMock).toHaveBeenCalledWith("/api/categories/category-1/subcategories", {
      subcategories: ["Groceries", "Restaurants"],
    });
  });

  it("returns null/false on not-found operations", async () => {
    const notFound = {
      isAxiosError: true,
      response: { status: 404, data: { error: "Missing.", code: "NOT_FOUND", status: 404, retryable: false } },
    };
    httpGetMock.mockRejectedValueOnce(notFound);
    httpPatchMock.mockRejectedValueOnce(notFound);
    httpDeleteMock.mockRejectedValueOnce(notFound);

    const repository = new HttpCategoriesRepository();
    await expect(repository.getById("missing")).resolves.toBeNull();
    await expect(repository.update("missing", { name: "Nope" })).resolves.toBeNull();
    await expect(repository.remove("missing")).resolves.toBe(false);
  });
});
