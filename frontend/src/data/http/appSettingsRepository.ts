import type { AppSettingsItem, AppSettingsRepository, UpdateAppSettingsPatch } from "@/domain/app-settings/repository";
import { coreFinanceHttpClient, withCoreFinanceErrors } from "./coreFinanceHttpClient";
import { ensureFeatureBackendCleanStartCutover } from "./featureDomainCleanStart";

export class HttpAppSettingsRepository implements AppSettingsRepository {
  public constructor() { ensureFeatureBackendCleanStartCutover(); }

  public async get(): Promise<AppSettingsItem> {
    return withCoreFinanceErrors(async () => (await coreFinanceHttpClient.get<AppSettingsItem>("/api/settings")).data);
  }

  public async update(patch: UpdateAppSettingsPatch): Promise<AppSettingsItem> {
    return withCoreFinanceErrors(async () => (await coreFinanceHttpClient.patch<AppSettingsItem>("/api/settings", patch)).data);
  }

  public async reset(): Promise<AppSettingsItem> {
    return withCoreFinanceErrors(async () => (await coreFinanceHttpClient.delete<AppSettingsItem>("/api/settings")).data);
  }
}

export const httpAppSettingsRepository: AppSettingsRepository = new HttpAppSettingsRepository();
