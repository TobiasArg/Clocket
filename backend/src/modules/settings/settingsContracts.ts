import type { AppSettingsRecord } from "./settingsRepository";

export type AppSettingsResponse = AppSettingsRecord;

export const toAppSettingsResponse = (settings: AppSettingsRecord): AppSettingsResponse => settings;
