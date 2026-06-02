import { describe, expect, it, vi } from "vitest";
import {
  CORE_LOCAL_STORAGE_CLEAN_START_KEYS,
  getCoreCleanStartStorageKeys,
  isCoreLocalStorageCleanStartDomain,
  resetCoreLocalStorageForBackendCleanStart,
} from "./cleanStartCutover";

class InMemoryStorage implements Pick<Storage, "getItem" | "removeItem" | "setItem"> {
  private readonly store = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  public removeItem(key: string): void {
    this.store.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("clean-start localStorage cutover", () => {
  it("documents core domain keys as delete-at-cutover with no migration or legacy mapping", () => {
    expect(CORE_LOCAL_STORAGE_CLEAN_START_KEYS).toEqual([
      {
        domain: "accounts",
        storageKey: "clocket.accounts",
        migrationRequired: false,
        legacyIdMappingRequired: false,
        cutoverAction: "delete-local-key-and-start-from-backend",
      },
      {
        domain: "categories",
        storageKey: "clocket.categories",
        migrationRequired: false,
        legacyIdMappingRequired: false,
        cutoverAction: "delete-local-key-and-start-from-backend",
      },
      {
        domain: "transactions",
        storageKey: "clocket.transactions",
        migrationRequired: false,
        legacyIdMappingRequired: false,
        cutoverAction: "delete-local-key-and-start-from-backend",
      },
    ]);
    expect(getCoreCleanStartStorageKeys()).toEqual([
      "clocket.accounts",
      "clocket.categories",
      "clocket.transactions",
    ]);
  });

  it("identifies only core domains as clean-start cutover domains", () => {
    expect(isCoreLocalStorageCleanStartDomain("accounts")).toBe(true);
    expect(isCoreLocalStorageCleanStartDomain("categories")).toBe(true);
    expect(isCoreLocalStorageCleanStartDomain("transactions")).toBe(true);
    expect(isCoreLocalStorageCleanStartDomain("budgets")).toBe(false);
    expect(isCoreLocalStorageCleanStartDomain("settings")).toBe(false);
  });

  it("removes only core localStorage keys and leaves unrelated domain data intact", () => {
    const storage = new InMemoryStorage();
    storage.setItem("clocket.accounts", "accounts");
    storage.setItem("clocket.categories", "categories");
    storage.setItem("clocket.transactions", "transactions");
    storage.setItem("clocket.budgets", "budgets");
    storage.setItem("clocket.settings", "settings");

    const result = resetCoreLocalStorageForBackendCleanStart(storage);

    expect(result).toEqual({
      skipped: false,
      removedKeys: [
        "clocket.accounts",
        "clocket.categories",
        "clocket.transactions",
      ],
    });
    expect(storage.getItem("clocket.accounts")).toBeNull();
    expect(storage.getItem("clocket.categories")).toBeNull();
    expect(storage.getItem("clocket.transactions")).toBeNull();
    expect(storage.getItem("clocket.budgets")).toBe("budgets");
    expect(storage.getItem("clocket.settings")).toBe("settings");
  });

  it("reports a safe no-op when browser storage is unavailable", () => {
    const removeItem = vi.fn();

    expect(resetCoreLocalStorageForBackendCleanStart(null)).toEqual({
      skipped: true,
      removedKeys: [],
      reason: "storage-unavailable",
    });
    expect(removeItem).not.toHaveBeenCalled();
  });
});
