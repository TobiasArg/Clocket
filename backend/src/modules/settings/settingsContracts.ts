import type { AppSettingsRecord } from "./settingsRepository";

export type AppSettingsResponse = Omit<AppSettingsRecord, "security"> & {
  security: {
    hasPin: boolean;
  };
};

export const toAppSettingsResponse = (settings: AppSettingsRecord): AppSettingsResponse => ({
  ...settings,
  security: {
    hasPin: Boolean(settings.security.pinHash),
  },
});
