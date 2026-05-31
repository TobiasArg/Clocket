export interface DatabaseConfig {
  databaseUrl: string;
}

export class DatabaseConfigError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

export type DatabaseRuntimeEnv = Record<string, string | undefined>;

export const getDatabaseConfig = (
  env: DatabaseRuntimeEnv = process.env,
): DatabaseConfig => {
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new DatabaseConfigError("Missing DATABASE_URL environment variable.");
  }

  return { databaseUrl };
};
