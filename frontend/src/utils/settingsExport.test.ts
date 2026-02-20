import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appSettingsRepository, transactionsRepository } from "@/data/localStorage";
import { buildExportSnapshot, buildTransactionsCsv } from "./settingsExport";

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

describe("settingsExport", () => {
  beforeEach(async () => {
    vi.stubGlobal("window", {
      localStorage: new InMemoryStorage(),
      dispatchEvent: vi.fn(),
    });

    await Promise.all([
      appSettingsRepository.reset(),
      transactionsRepository.clearAll(),
    ]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds export snapshot with expected data sections", async () => {
    const snapshot = await buildExportSnapshot();

    expect(snapshot.version).toBe(1);
    expect(snapshot.exportedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(snapshot.data.settings).toHaveProperty("currency");
    expect(snapshot.data).toHaveProperty("accounts");
    expect(snapshot.data).toHaveProperty("transactions");
    expect(snapshot.data).toHaveProperty("investments");
  });

  it("builds CSV with headers and transaction rows", async () => {
    const transaction = await transactionsRepository.create({
      icon: "wallet",
      iconBg: "bg-[#09090B]",
      name: "Compra",
      category: "General",
      amount: "-$1200",
      amountColor: "text-[#DC2626]",
      meta: "2026-01-10 • smoke",
      accountId: "account_test",
      date: "2026-01-10",
    });

    const csv = buildTransactionsCsv([transaction]);

    expect(csv).toContain("id,date,name,category,amount,accountId,transactionType,goalId,meta");
    expect(csv).toContain("Compra");
    expect(csv).toContain("2026-01-10");
  });
});
