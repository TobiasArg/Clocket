export const DEFAULT_ALPHA_VANTAGE_TIMEOUT_MS = 12_000;

export interface AlphaVantageConfig {
  apiKey?: string;
  timeoutMs: number;
}

export type RuntimeEnv = Record<string, string | undefined>;

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getAlphaVantageConfig = (
  env: RuntimeEnv = process.env,
): AlphaVantageConfig => {
  const apiKey = env.ALPHA_VANTAGE_API_KEY?.trim() || undefined;
  const timeoutMs = parsePositiveInteger(
    env.ALPHA_VANTAGE_TIMEOUT_MS,
    DEFAULT_ALPHA_VANTAGE_TIMEOUT_MS,
  );

  return {
    apiKey,
    timeoutMs,
  };
};
