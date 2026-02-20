import type { AppSettings } from "@/types";

export type AppSettingsItem = AppSettings;

export interface UpdateAppSettingsPatch {
  currency?: AppSettings["currency"];
  language?: AppSettings["language"];
  notificationsEnabled?: boolean;
  theme?: AppSettings["theme"];
  profile?: Partial<AppSettings["profile"]>;
  security?: {
    pinHash?: string | null;
  };
}

export interface AppSettingsRepository {
  get: () => Promise<AppSettingsItem>;
  update: (patch: UpdateAppSettingsPatch) => Promise<AppSettingsItem>;
  reset: () => Promise<AppSettingsItem>;
}
