import type {
  AppSettingsItem,
  AppSettingsRepository,
  UpdateAppSettingsPatch,
} from "@/domain/app-settings/repository";

const LEGACY_STORAGE_VERSION = 1 as const;
const STORAGE_VERSION = 2 as const;
const DEFAULT_STORAGE_KEY = "clocket.settings";

interface AppSettingsStorageV1 {
  version: typeof LEGACY_STORAGE_VERSION;
  settings: {
    currency: "USD" | "EUR";
    language: "es" | "en";
    notificationsEnabled: boolean;
    theme: "light";
  };
}

interface AppSettingsStorageV2 {
  version: typeof STORAGE_VERSION;
  settings: AppSettingsItem;
}

const DEFAULT_SETTINGS: AppSettingsItem = {
  currency: "USD",
  language: "es",
  notificationsEnabled: true,
  theme: "light",
  profile: {
    name: "Usuario",
    email: "usuario@email.com",
    avatarIcon: "user",
  },
  security: {
    pinHash: null,
  },
};

const cloneSettings = (settings: AppSettingsItem): AppSettingsItem => ({
  ...settings,
  profile: {
    ...settings.profile,
  },
  security: {
    ...settings.security,
  },
});

const buildInitialState = (): AppSettingsStorageV2 => ({
  version: STORAGE_VERSION,
  settings: cloneSettings(DEFAULT_SETTINGS),
});

const isProfile = (
  value: unknown,
): value is AppSettingsItem["profile"] => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const profile = value as Partial<AppSettingsItem["profile"]>;
  return (
    typeof profile.name === "string" &&
    typeof profile.email === "string" &&
    typeof profile.avatarIcon === "string"
  );
};

const isSecurity = (
  value: unknown,
): value is AppSettingsItem["security"] => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const security = value as Partial<AppSettingsItem["security"]>;
  return security.pinHash === null || typeof security.pinHash === "string";
};

const isAppSettingsV2 = (value: unknown): value is AppSettingsItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const settings = value as Partial<AppSettingsItem>;
  const currency = (settings as { currency?: string }).currency;
  return (
    (currency === "USD" || currency === "ARS" || currency === "EUR") &&
    (settings.language === "es" || settings.language === "en") &&
    typeof settings.notificationsEnabled === "boolean" &&
    (settings.theme === "light" || settings.theme === "dark") &&
    isProfile(settings.profile) &&
    isSecurity(settings.security)
  );
};

const isLegacySettingsV1 = (
  value: unknown,
): value is AppSettingsStorageV1["settings"] => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const settings = value as Partial<AppSettingsStorageV1["settings"]>;
  return (
    (settings.currency === "USD" || settings.currency === "EUR") &&
    (settings.language === "es" || settings.language === "en") &&
    typeof settings.notificationsEnabled === "boolean" &&
    settings.theme === "light"
  );
};

const isStorageShapeV2 = (value: unknown): value is AppSettingsStorageV2 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<AppSettingsStorageV2>;
  return state.version === STORAGE_VERSION && isAppSettingsV2(state.settings);
};

const isStorageShapeV1 = (value: unknown): value is AppSettingsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<AppSettingsStorageV1>;
  return state.version === LEGACY_STORAGE_VERSION && isLegacySettingsV1(state.settings);
};

const normalizeText = (value: string, fallback: string): string => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const normalizePartialSettings = (
  settings: Partial<AppSettingsItem>,
): AppSettingsItem => {
  const profile = settings.profile ?? {};
  const security = settings.security ?? {};
  const currency = (settings as { currency?: string }).currency;

  return {
    currency: currency === "ARS" || currency === "EUR" ? "ARS" : "USD",
    language: settings.language === "en" ? "en" : "es",
    notificationsEnabled: settings.notificationsEnabled ?? true,
    theme: settings.theme === "dark" ? "dark" : "light",
    profile: {
      name: normalizeText(profile.name ?? DEFAULT_SETTINGS.profile.name, DEFAULT_SETTINGS.profile.name),
      email: normalizeText(profile.email ?? DEFAULT_SETTINGS.profile.email, DEFAULT_SETTINGS.profile.email),
      avatarIcon: normalizeText(
        profile.avatarIcon ?? DEFAULT_SETTINGS.profile.avatarIcon,
        DEFAULT_SETTINGS.profile.avatarIcon,
      ),
    },
    security: {
      pinHash: typeof security.pinHash === "string" ? security.pinHash : null,
    },
  };
};

const mergeSettings = (
  current: AppSettingsItem,
  patch: UpdateAppSettingsPatch,
): AppSettingsItem => {
  const nextProfile = patch.profile
    ? {
        ...current.profile,
        ...patch.profile,
      }
    : current.profile;

  const nextSecurity = patch.security
    ? {
        ...current.security,
        ...patch.security,
      }
    : current.security;

  return normalizePartialSettings({
    ...current,
    ...patch,
    profile: nextProfile,
    security: nextSecurity,
  });
};

const migrateFromV1 = (legacy: AppSettingsStorageV1): AppSettingsStorageV2 => ({
  version: STORAGE_VERSION,
  settings: normalizePartialSettings({
    ...legacy.settings,
    profile: DEFAULT_SETTINGS.profile,
    security: DEFAULT_SETTINGS.security,
  }),
});

export class LocalStorageAppSettingsRepository implements AppSettingsRepository {
  private readonly storageKey: string;

  private memoryState: AppSettingsStorageV2;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async get(): Promise<AppSettingsItem> {
    return cloneSettings(this.readState().settings);
  }

  public async update(patch: UpdateAppSettingsPatch): Promise<AppSettingsItem> {
    const state = this.readState();
    const next = mergeSettings(state.settings, patch);

    state.settings = next;
    this.writeState(state);

    return cloneSettings(next);
  }

  public async reset(): Promise<AppSettingsItem> {
    const initial = buildInitialState();
    this.writeState(initial);
    return cloneSettings(initial.settings);
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  }

  private readState(): AppSettingsStorageV2 {
    const storage = this.getStorage();

    if (!storage) {
      return {
        version: this.memoryState.version,
        settings: cloneSettings(this.memoryState.settings),
      };
    }

    const raw = storage.getItem(this.storageKey);
    if (!raw) {
      const initial = buildInitialState();
      this.writeState(initial);
      return initial;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (isStorageShapeV2(parsed)) {
        const normalizedSettings = normalizePartialSettings(parsed.settings);
        const isNormalizedDifferent = JSON.stringify(parsed.settings) !== JSON.stringify(normalizedSettings);
        if (isNormalizedDifferent) {
          const migrated: AppSettingsStorageV2 = {
            version: STORAGE_VERSION,
            settings: normalizedSettings,
          };
          this.writeState(migrated);
          return migrated;
        }

        return {
          version: parsed.version,
          settings: cloneSettings(normalizedSettings),
        };
      }

      if (isStorageShapeV1(parsed)) {
        const migrated = migrateFromV1(parsed);
        this.writeState(migrated);
        return migrated;
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: AppSettingsStorageV2): void {
    const next: AppSettingsStorageV2 = {
      version: state.version,
      settings: cloneSettings(state.settings),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));
  }
}

export const appSettingsRepository: AppSettingsRepository =
  new LocalStorageAppSettingsRepository();
