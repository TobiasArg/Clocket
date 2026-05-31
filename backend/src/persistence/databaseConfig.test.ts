import { describe, expect, it } from "vitest";
import { DatabaseConfigError, getDatabaseConfig } from "./databaseConfig";

describe("getDatabaseConfig", () => {
  it("returns a trimmed DATABASE_URL", () => {
    expect(getDatabaseConfig({
      DATABASE_URL: "  postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public  ",
    })).toEqual({
      databaseUrl: "postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public",
    });
  });

  it("fails fast when DATABASE_URL is missing", () => {
    expect(() => getDatabaseConfig({})).toThrow(DatabaseConfigError);
  });
});
