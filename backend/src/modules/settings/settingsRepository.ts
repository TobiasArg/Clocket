import type { CurrencyCode, PrismaClient } from "../../generated/prisma/client";

export interface AppSettingsRecord {
  currency: CurrencyCode;
  language: "es" | "en";
  notificationsEnabled: boolean;
  theme: "light" | "dark";
  profile: {
    name: string;
    email: string;
    avatarIcon: string;
  };
  security: {
    pinHash: string | null;
  };
  updatedAt: string;
}

export interface UpdateAppSettingsInput {
  currency?: CurrencyCode;
  language?: "es" | "en";
  notificationsEnabled?: boolean;
  theme?: "light" | "dark";
  profile?: Partial<AppSettingsRecord["profile"]>;
  security?: {
    pinHash?: string | null;
  };
}

export interface AppSettingsRepository {
  get: () => Promise<AppSettingsRecord>;
  update: (input: UpdateAppSettingsInput) => Promise<AppSettingsRecord>;
  reset: () => Promise<AppSettingsRecord>;
}

const SETTINGS_ID = "default";

const DEFAULT_SETTINGS = {
  currency: "USD" as CurrencyCode,
  language: "es",
  notificationsEnabled: true,
  theme: "light",
  profileName: "Usuario",
  profileEmail: "usuario@email.com",
  avatarIcon: "user",
  pinHash: null,
};

type AppSettingsModel = NonNullable<Awaited<ReturnType<PrismaClient["appSettings"]["findUnique"]>>>;

const toIso = (value: Date): string => value.toISOString();

const toRecord = (settings: AppSettingsModel): AppSettingsRecord => ({
  currency: settings.currency,
  language: settings.language === "en" ? "en" : "es",
  notificationsEnabled: settings.notificationsEnabled,
  theme: settings.theme === "dark" ? "dark" : "light",
  profile: {
    name: settings.profileName,
    email: settings.profileEmail,
    avatarIcon: settings.avatarIcon,
  },
  security: {
    pinHash: settings.pinHash,
  },
  updatedAt: toIso(settings.updatedAt),
});

export const createAppSettingsRepository = (prisma: PrismaClient): AppSettingsRepository => {
  const upsertDefaults = () => prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID, ...DEFAULT_SETTINGS },
  });

  return {
    async get() {
      return toRecord(await upsertDefaults());
    },

    async update(input) {
      await upsertDefaults();
      const settings = await prisma.appSettings.update({
        where: { id: SETTINGS_ID },
        data: {
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.language !== undefined ? { language: input.language } : {}),
          ...(input.notificationsEnabled !== undefined ? { notificationsEnabled: input.notificationsEnabled } : {}),
          ...(input.theme !== undefined ? { theme: input.theme } : {}),
          ...(input.profile?.name !== undefined ? { profileName: input.profile.name } : {}),
          ...(input.profile?.email !== undefined ? { profileEmail: input.profile.email } : {}),
          ...(input.profile?.avatarIcon !== undefined ? { avatarIcon: input.profile.avatarIcon } : {}),
          ...(input.security && "pinHash" in input.security ? { pinHash: input.security.pinHash ?? null } : {}),
        },
      });

      return toRecord(settings);
    },

    async reset() {
      const settings = await prisma.appSettings.upsert({
        where: { id: SETTINGS_ID },
        update: DEFAULT_SETTINGS,
        create: { id: SETTINGS_ID, ...DEFAULT_SETTINGS },
      });
      return toRecord(settings);
    },
  };
};
