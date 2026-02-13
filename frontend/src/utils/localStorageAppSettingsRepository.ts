import type {
  AppSettingsItem,
  AppSettingsRepository,
  UpdateAppSettingsPatch,
} from "@/utils";

const STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.settings";

interface AppSettingsStorageV1 {
  version: typeof STORAGE_VERSION;
  settings: AppSettingsItem;
}

const DEFAULT_SETTINGS: AppSettingsItem = {
  currency: "USD",
  language: "es",
  notificationsEnabled: true,
  theme: "light",
};

const buildInitialState = (): AppSettingsStorageV1 => ({
  version: STORAGE_VERSION,
  settings: { ...DEFAULT_SETTINGS },
});

const isAppSettings = (value: unknown): value is AppSettingsItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const settings = value as Partial<AppSettingsItem>;
  return (
    (settings.currency === "USD" || settings.currency === "EUR") &&
    (settings.language === "es" || settings.language === "en") &&
    typeof settings.notificationsEnabled === "boolean" &&
    settings.theme === "light"
  );
};

const isStorageShape = (value: unknown): value is AppSettingsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<AppSettingsStorageV1>;
  return state.version === STORAGE_VERSION && isAppSettings(state.settings);
};

const cloneSettings = (settings: AppSettingsItem): AppSettingsItem => ({
  ...settings,
});

export class LocalStorageAppSettingsRepository implements AppSettingsRepository {
  private readonly storageKey: string;

  private memoryState: AppSettingsStorageV1;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async get(): Promise<AppSettingsItem> {
    return cloneSettings(this.readState().settings);
  }

  public async update(patch: UpdateAppSettingsPatch): Promise<AppSettingsItem> {
    const state = this.readState();
    const next: AppSettingsItem = {
      ...state.settings,
      ...patch,
    };

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

  private readState(): AppSettingsStorageV1 {
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
      if (isStorageShape(parsed)) {
        return {
          version: parsed.version,
          settings: cloneSettings(parsed.settings),
        };
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: AppSettingsStorageV1): void {
    const next: AppSettingsStorageV1 = {
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
