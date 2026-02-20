import { describe, expect, it } from "vitest";
import { hashPin, isValidPin, verifyPin } from "./securityPin";

describe("securityPin", () => {
  it("validates 4-digit PIN format", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("abcd")).toBe(false);
  });

  it("generates deterministic hash", async () => {
    const first = await hashPin("1234");
    const second = await hashPin("1234");
    const third = await hashPin("4321");

    expect(first).toBe(second);
    expect(first).not.toBe(third);
  });

  it("verifies PIN against hash", async () => {
    const hash = await hashPin("2468");

    expect(await verifyPin("2468", hash)).toBe(true);
    expect(await verifyPin("1357", hash)).toBe(false);
  });
});
