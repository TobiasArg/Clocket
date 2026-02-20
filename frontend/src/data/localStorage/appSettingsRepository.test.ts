import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageAppSettingsRepository } from "./appSettingsRepository";

class InMemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  public get length(): number {
    return this.store.size;
  }

  public clear(): void {
    this.store.clear();
  }

  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  public key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  public removeItem(key: string): void {
    this.store.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("LocalStorageAppSettingsRepository", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: new InMemoryStorage(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns v2 defaults", async () => {
    const repository = new LocalStorageAppSettingsRepository("clocket.settings.test.v2");

    const settings = await repository.get();

    expect(settings.currency).toBe("USD");
    expect(settings.theme).toBe("light");
    expect(settings.profile.name).toBe("Usuario");
    expect(settings.security.pinHash).toBeNull();
  });

  it("migrates legacy v1 payload to v2", async () => {
    const storageKey = "clocket.settings.test.migration";
    window.localStorage.setItem(storageKey, JSON.stringify({
      version: 1,
      settings: {
        currency: "EUR",
        language: "en",
        notificationsEnabled: false,
        theme: "light",
      },
    }));

    const repository = new LocalStorageAppSettingsRepository(storageKey);
    const settings = await repository.get();

    expect(settings.currency).toBe("EUR");
    expect(settings.language).toBe("en");
    expect(settings.profile.avatarIcon).toBe("user");

    const raw = window.localStorage.getItem(storageKey);
    expect(raw).toContain("\"version\":2");
  });

  it("supports deep partial update for profile and security", async () => {
    const repository = new LocalStorageAppSettingsRepository("clocket.settings.test.merge");

    await repository.update({
      profile: {
        name: "Tobias",
      },
      security: {
        pinHash: "abc123",
      },
    });

    const settings = await repository.get();

    expect(settings.profile.name).toBe("Tobias");
    expect(settings.profile.email).toBe("usuario@email.com");
    expect(settings.security.pinHash).toBe("abc123");
  });

  it("resets to defaults", async () => {
    const repository = new LocalStorageAppSettingsRepository("clocket.settings.test.reset");

    await repository.update({
      theme: "dark",
      profile: {
        name: "Custom",
        email: "custom@email.com",
        avatarIcon: "star",
      },
      security: {
        pinHash: "hash",
      },
    });

    const settings = await repository.reset();

    expect(settings.theme).toBe("light");
    expect(settings.profile.name).toBe("Usuario");
    expect(settings.security.pinHash).toBeNull();
  });
});
