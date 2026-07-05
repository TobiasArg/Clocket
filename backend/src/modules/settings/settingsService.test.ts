import { describe, expect, it, vi } from "vitest";
import { createAppSettingsService } from "./settingsService";
import type { AppSettingsRecord, AppSettingsRepository } from "./settingsRepository";

const settings: AppSettingsRecord = {
  currency: "USD",
  language: "es",
  notificationsEnabled: true,
  theme: "light",
  profile: { name: "Usuario", email: "usuario@email.com", avatarIcon: "user" },
  security: { pinHash: "stored-pin-hash" },
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const redactedSettings = {
  ...settings,
  security: { hasPin: true },
};

const resetSettings = {
  ...settings,
  security: { pinHash: null },
};

const redactedResetSettings = {
  ...resetSettings,
  security: { hasPin: false },
};

const createRepository = (): AppSettingsRepository => ({
  get: vi.fn().mockResolvedValue(settings),
  update: vi.fn().mockResolvedValue({ ...settings, currency: "ARS" }),
  reset: vi.fn().mockResolvedValue(resetSettings),
});

describe("app settings service", () => {
  it("gets, updates, and resets settings", async () => {
    const repository = createRepository();
    const service = createAppSettingsService({ repository });

    await expect(service.getSettings()).resolves.toEqual(redactedSettings);
    await expect(service.updateSettings({ currency: "ARS", profile: { name: "Ana" }, security: { pinHash: null } })).resolves.toMatchObject({ currency: "ARS" });
    await expect(service.resetSettings()).resolves.toEqual(redactedResetSettings);

    expect(repository.update).toHaveBeenCalledWith({ currency: "ARS", profile: { name: "Ana" }, security: { pinHash: null } });
  });

  it("redacts stored PIN hashes from settings responses", async () => {
    const service = createAppSettingsService({ repository: createRepository() });

    const response = await service.getSettings();

    expect(response.security.hasPin).toBe(true);
    expect(response.security).not.toHaveProperty("pinHash");
    expect(JSON.stringify(response)).not.toContain("stored-pin-hash");
  });

  it("rejects invalid settings payloads", async () => {
    const service = createAppSettingsService({ repository: createRepository() });

    await expect(service.updateSettings({ currency: "EUR" })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
    await expect(service.updateSettings({ security: { pinHash: 123 } })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
  });
});
