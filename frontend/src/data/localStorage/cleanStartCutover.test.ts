import { describe, expect, it, vi } from "vitest";
import {
  CORE_LOCAL_STORAGE_CLEAN_START_KEYS,
  FEATURE_LOCAL_STORAGE_CLEAN_START_KEYS,
  getCoreCleanStartStorageKeys,
  getFeatureCleanStartStorageKeys,
  isCoreLocalStorageCleanStartDomain,
  isFeatureLocalStorageCleanStartDomain,
  resetCoreLocalStorageForBackendCleanStart,
  resetFeatureLocalStorageForBackendCleanStart,
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

  it("documents feature domain keys as delete-at-cutover with no migration or legacy mapping", () => {
    expect(FEATURE_LOCAL_STORAGE_CLEAN_START_KEYS).toEqual([
      { domain: "budgets", storageKey: "clocket.budgets", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
      { domain: "goals", storageKey: "clocket.goals", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
      { domain: "cuotas", storageKey: "clocket.cuotas", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
      { domain: "investments", storageKey: "investments.positions", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
      { domain: "investments", storageKey: "investments.entries", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
      { domain: "investments", storageKey: "investments.snapshots", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
      { domain: "investments", storageKey: "investments.refs", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
      { domain: "app-settings", storageKey: "clocket.settings", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
    ]);
    expect(getFeatureCleanStartStorageKeys()).toEqual([
      "clocket.budgets",
      "clocket.goals",
      "clocket.cuotas",
      "investments.positions",
      "investments.entries",
      "investments.snapshots",
      "investments.refs",
      "clocket.settings",
    ]);
  });

  it("identifies only migrated feature domains as feature clean-start cutover domains", () => {
    expect(isFeatureLocalStorageCleanStartDomain("budgets")).toBe(true);
    expect(isFeatureLocalStorageCleanStartDomain("goals")).toBe(true);
    expect(isFeatureLocalStorageCleanStartDomain("cuotas")).toBe(true);
    expect(isFeatureLocalStorageCleanStartDomain("investments")).toBe(true);
    expect(isFeatureLocalStorageCleanStartDomain("app-settings")).toBe(true);
    expect(isFeatureLocalStorageCleanStartDomain("accounts")).toBe(false);
    expect(isFeatureLocalStorageCleanStartDomain("settings")).toBe(false);
  });

  it("removes feature localStorage keys and leaves core domain data intact", () => {
    const storage = new InMemoryStorage();
    storage.setItem("clocket.accounts", "accounts");
    storage.setItem("clocket.categories", "categories");
    storage.setItem("clocket.transactions", "transactions");
    storage.setItem("clocket.budgets", "budgets");
    storage.setItem("clocket.goals", "goals");
    storage.setItem("clocket.cuotas", "cuotas");
    storage.setItem("investments.positions", "positions");
    storage.setItem("investments.entries", "entries");
    storage.setItem("investments.snapshots", "snapshots");
    storage.setItem("investments.refs", "refs");
    storage.setItem("clocket.settings", "settings");

    const result = resetFeatureLocalStorageForBackendCleanStart(storage);

    expect(result).toEqual({
      skipped: false,
      removedKeys: [
        "clocket.budgets",
        "clocket.goals",
        "clocket.cuotas",
        "investments.positions",
        "investments.entries",
        "investments.snapshots",
        "investments.refs",
        "clocket.settings",
      ],
    });
    expect(storage.getItem("clocket.accounts")).toBe("accounts");
    expect(storage.getItem("clocket.categories")).toBe("categories");
    expect(storage.getItem("clocket.transactions")).toBe("transactions");
    expect(storage.getItem("clocket.budgets")).toBeNull();
    expect(storage.getItem("clocket.goals")).toBeNull();
    expect(storage.getItem("clocket.cuotas")).toBeNull();
    expect(storage.getItem("investments.positions")).toBeNull();
    expect(storage.getItem("investments.entries")).toBeNull();
    expect(storage.getItem("investments.snapshots")).toBeNull();
    expect(storage.getItem("investments.refs")).toBeNull();
    expect(storage.getItem("clocket.settings")).toBeNull();
  });
});
