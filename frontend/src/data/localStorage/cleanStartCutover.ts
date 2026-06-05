export type CoreLocalStorageDomain = "accounts" | "categories" | "transactions";
export type FeatureLocalStorageDomain = "budgets" | "goals" | "cuotas" | "investments" | "app-settings";

export interface CoreLocalStorageCleanStartKey {
  domain: CoreLocalStorageDomain;
  storageKey: string;
  migrationRequired: false;
  legacyIdMappingRequired: false;
  cutoverAction: "delete-local-key-and-start-from-backend";
}

export interface FeatureLocalStorageCleanStartKey {
  domain: FeatureLocalStorageDomain;
  storageKey: string;
  migrationRequired: false;
  legacyIdMappingRequired: false;
  cutoverAction: "delete-local-key-and-start-from-backend";
}

export interface CleanStartResetResult {
  skipped: boolean;
  removedKeys: string[];
  reason?: "storage-unavailable";
}

type LocalStorageCutoverStorage = Pick<Storage, "removeItem">;

export const CORE_LOCAL_STORAGE_CLEAN_START_KEYS = [
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
] as const satisfies readonly CoreLocalStorageCleanStartKey[];

export const FEATURE_LOCAL_STORAGE_CLEAN_START_KEYS = [
  { domain: "budgets", storageKey: "clocket.budgets", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
  { domain: "goals", storageKey: "clocket.goals", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
  { domain: "cuotas", storageKey: "clocket.cuotas", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
  { domain: "investments", storageKey: "investments.positions", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
  { domain: "investments", storageKey: "investments.entries", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
  { domain: "investments", storageKey: "investments.snapshots", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
  { domain: "investments", storageKey: "investments.refs", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
  { domain: "app-settings", storageKey: "clocket.settings", migrationRequired: false, legacyIdMappingRequired: false, cutoverAction: "delete-local-key-and-start-from-backend" },
] as const satisfies readonly FeatureLocalStorageCleanStartKey[];

const CORE_LOCAL_STORAGE_DOMAINS = new Set<CoreLocalStorageDomain>(
  CORE_LOCAL_STORAGE_CLEAN_START_KEYS.map((entry) => entry.domain),
);
const FEATURE_LOCAL_STORAGE_DOMAINS = new Set<FeatureLocalStorageDomain>(
  FEATURE_LOCAL_STORAGE_CLEAN_START_KEYS.map((entry) => entry.domain),
);

const resolveBrowserLocalStorage = (): LocalStorageCutoverStorage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const getCoreCleanStartStorageKeys = (): string[] => (
  CORE_LOCAL_STORAGE_CLEAN_START_KEYS.map((entry) => entry.storageKey)
);

export const getFeatureCleanStartStorageKeys = (): string[] => (
  FEATURE_LOCAL_STORAGE_CLEAN_START_KEYS.map((entry) => entry.storageKey)
);

export const isCoreLocalStorageCleanStartDomain = (
  domain: string,
): domain is CoreLocalStorageDomain => (
  CORE_LOCAL_STORAGE_DOMAINS.has(domain as CoreLocalStorageDomain)
);

export const isFeatureLocalStorageCleanStartDomain = (
  domain: string,
): domain is FeatureLocalStorageDomain => (
  FEATURE_LOCAL_STORAGE_DOMAINS.has(domain as FeatureLocalStorageDomain)
);

export const resetCoreLocalStorageForBackendCleanStart = (
  storage: LocalStorageCutoverStorage | null = resolveBrowserLocalStorage(),
): CleanStartResetResult => {
  if (!storage) {
    return {
      skipped: true,
      removedKeys: [],
      reason: "storage-unavailable",
    };
  }

  const removedKeys = getCoreCleanStartStorageKeys();

  for (const storageKey of removedKeys) {
    storage.removeItem(storageKey);
  }

  return {
    skipped: false,
    removedKeys,
  };
};

export const resetFeatureLocalStorageForBackendCleanStart = (
  storage: LocalStorageCutoverStorage | null = resolveBrowserLocalStorage(),
): CleanStartResetResult => {
  if (!storage) {
    return {
      skipped: true,
      removedKeys: [],
      reason: "storage-unavailable",
    };
  }

  const removedKeys = getFeatureCleanStartStorageKeys();

  for (const storageKey of removedKeys) {
    storage.removeItem(storageKey);
  }

  return {
    skipped: false,
    removedKeys,
  };
};
