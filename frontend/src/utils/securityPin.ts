const PIN_PATTERN = /^\d{4}$/;

const toHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let hex = "";

  for (const value of bytes) {
    hex += value.toString(16).padStart(2, "0");
  }

  return hex;
};

const fallbackHash = (pin: string): string => {
  let hash = 5381;

  for (let index = 0; index < pin.length; index += 1) {
    hash = ((hash << 5) + hash) ^ pin.charCodeAt(index);
  }

  return `fallback-${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

export const isValidPin = (pin: string): boolean => PIN_PATTERN.test(pin);

export const hashPin = async (pin: string): Promise<string> => {
  if (!isValidPin(pin)) {
    throw new Error("PIN must contain exactly 4 digits.");
  }

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoded = new TextEncoder().encode(pin);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return toHex(digest);
  }

  return fallbackHash(pin);
};

export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  if (!isValidPin(pin)) {
    return false;
  }

  return (await hashPin(pin)) === hash;
};
