import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { isValidCurrency, parseJsonObjectBody } from "../core-finance/coreFinanceRequest";
import { toAppSettingsResponse, type AppSettingsResponse } from "./settingsContracts";
import type { AppSettingsRepository, UpdateAppSettingsInput } from "./settingsRepository";

export interface AppSettingsService {
  getSettings: () => Promise<AppSettingsResponse>;
  updateSettings: (body: unknown) => Promise<AppSettingsResponse>;
  resetSettings: () => Promise<AppSettingsResponse>;
}

interface ParsedSettingsUpdate {
  patch: UpdateAppSettingsInput;
  currentPinHash?: string | null;
}

const readObject = (value: unknown, key: string): Record<string, unknown> | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CoreFinanceApiError(`Field '${key}' must be a JSON object.`, { code: "INVALID_REQUEST", status: 400 });
  }
  return value as Record<string, unknown>;
};

const readOptionalString = (body: Record<string, unknown>, key: string): string | undefined => {
  if (!(key in body)) return undefined;
  if (typeof body[key] !== "string") throw new CoreFinanceApiError(`Field '${key}' must be a string.`, { code: "INVALID_REQUEST", status: 400 });
  return body[key].trim();
};

export const createAppSettingsService = ({ repository }: { repository: AppSettingsRepository }): AppSettingsService => {
  const parseUpdate = (body: unknown): ParsedSettingsUpdate => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const patch: UpdateAppSettingsInput = {};
    let currentPinHash: string | null | undefined;

    if ("currency" in parsedBody.value) {
      if (!isValidCurrency(parsedBody.value.currency)) throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", { code: "INVALID_REQUEST", status: 400 });
      patch.currency = parsedBody.value.currency;
    }
    if ("language" in parsedBody.value) {
      if (parsedBody.value.language !== "es" && parsedBody.value.language !== "en") throw new CoreFinanceApiError("Field 'language' must be 'es' or 'en'.", { code: "INVALID_REQUEST", status: 400 });
      patch.language = parsedBody.value.language;
    }
    if ("notificationsEnabled" in parsedBody.value) {
      if (typeof parsedBody.value.notificationsEnabled !== "boolean") throw new CoreFinanceApiError("Field 'notificationsEnabled' must be a boolean.", { code: "INVALID_REQUEST", status: 400 });
      patch.notificationsEnabled = parsedBody.value.notificationsEnabled;
    }
    if ("theme" in parsedBody.value) {
      if (parsedBody.value.theme !== "light" && parsedBody.value.theme !== "dark") throw new CoreFinanceApiError("Field 'theme' must be 'light' or 'dark'.", { code: "INVALID_REQUEST", status: 400 });
      patch.theme = parsedBody.value.theme;
    }
    const profile = readObject(parsedBody.value.profile, "profile");
    if (profile) {
      patch.profile = {
        ...("name" in profile ? { name: readOptionalString(profile, "name") ?? "" } : {}),
        ...("email" in profile ? { email: readOptionalString(profile, "email") ?? "" } : {}),
        ...("avatarIcon" in profile ? { avatarIcon: readOptionalString(profile, "avatarIcon") ?? "user" } : {}),
      };
    }
    const security = readObject(parsedBody.value.security, "security");
    if (security && "pinHash" in security) {
      if (security.pinHash !== null && typeof security.pinHash !== "string") throw new CoreFinanceApiError("Field 'security.pinHash' must be a string or null.", { code: "INVALID_REQUEST", status: 400 });
      patch.security = { pinHash: security.pinHash };
    }
    if (security && "currentPinHash" in security) {
      if (security.currentPinHash !== null && typeof security.currentPinHash !== "string") throw new CoreFinanceApiError("Field 'security.currentPinHash' must be a string or null.", { code: "INVALID_REQUEST", status: 400 });
      currentPinHash = security.currentPinHash;
    }

    return { patch, currentPinHash };
  };

  const assertPinWriteAllowed = async ({ patch, currentPinHash }: ParsedSettingsUpdate): Promise<void> => {
    if (!patch.security || !("pinHash" in patch.security)) {
      return;
    }

    const currentSettings = await repository.get();
    const storedPinHash = currentSettings.security.pinHash;
    if (!storedPinHash) {
      return;
    }

    if (!currentPinHash || currentPinHash !== storedPinHash) {
      throw new CoreFinanceApiError("Current PIN is required to update security settings.", { code: "INVALID_REQUEST", status: 400 });
    }
  };

  return {
    async getSettings() {
      return toAppSettingsResponse(await repository.get());
    },
    async updateSettings(body) {
      const parsedUpdate = parseUpdate(body);
      await assertPinWriteAllowed(parsedUpdate);
      return toAppSettingsResponse(await repository.update(parsedUpdate.patch));
    },
    async resetSettings() {
      return toAppSettingsResponse(await repository.reset());
    },
  };
};
