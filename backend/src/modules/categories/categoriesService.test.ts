import { describe, expect, it, vi } from "vitest";
import { createCategoriesService } from "./categoriesService";
import type { CategoriesRepository, CategoryRecord } from "./categoriesRepository";

const category = (overrides: Partial<CategoryRecord> = {}): CategoryRecord => ({
  id: "category-1",
  name: "Food",
  icon: "utensils",
  iconBg: "bg-orange-500",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
  subcategories: [{
    id: "subcategory-1",
    categoryId: "category-1",
    name: "Groceries",
    sortOrder: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  }],
  ...overrides,
});

const createRepository = (): CategoriesRepository => ({
  listActive: vi.fn().mockResolvedValue([category()]),
  getById: vi.fn().mockResolvedValue(category()),
  create: vi.fn().mockResolvedValue(category({ id: "created" })),
  update: vi.fn().mockResolvedValue(category({ name: "Updated" })),
  replaceSubcategories: vi.fn().mockResolvedValue(category()),
  softDelete: vi.fn().mockResolvedValue(true),
});

describe("categories service", () => {
  it("lists categories with durable subcategory records", async () => {
    const repository = createRepository();
    await expect(createCategoriesService({ repository }).listCategories()).resolves.toEqual({
      categories: [expect.objectContaining({
        id: "category-1",
        subcategoryCount: 1,
        subcategories: [expect.objectContaining({ id: "subcategory-1", name: "Groceries" })],
      })],
    });
  });

  it("validates and creates categories with defaults", async () => {
    const repository = createRepository();
    await createCategoriesService({ repository }).createCategory({
      name: "Transport",
      subcategories: ["Bus", { name: "Train" }],
    });

    expect(repository.create).toHaveBeenCalledWith({
      name: "Transport",
      icon: "tag",
      iconBg: "bg-[#71717A]",
      subcategories: ["Bus", { name: "Train" }],
    });
  });

  it("replaces subcategories and maps missing categories", async () => {
    const repository = createRepository();
    const service = createCategoriesService({ repository });
    await service.replaceSubcategories("category-1", { subcategories: ["Rent"] });
    expect(repository.replaceSubcategories).toHaveBeenCalledWith("category-1", ["Rent"]);

    vi.mocked(repository.update).mockResolvedValue(null);
    await expect(service.updateCategory("missing", { name: "Nope" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });
});
