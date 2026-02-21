export type CategoryColorKey =
  | "rose"
  | "orange"
  | "amber"
  | "emerald"
  | "cyan"
  | "blue"
  | "violet"
  | "zinc";

export interface CategoryColorOption {
  key: CategoryColorKey;
  label: string;
  iconBgClass: string;
}

export const CATEGORY_ICON_OPTIONS: string[] = [
  "tag",
  "fork-knife",
  "car",
  "wrench",
  "house",
  "shopping-bag",
  "briefcase",
  "graduation-cap",
  "barbell",
  "book",
  "camera",
  "gift",
  "game-controller",
  "music-note",
  "palette",
  "heartbeat",
];

export const CATEGORY_COLOR_OPTIONS: CategoryColorOption[] = [
  { key: "rose", label: "Rose", iconBgClass: "bg-[#DC2626]" },
  { key: "orange", label: "Orange", iconBgClass: "bg-[#F97316]" },
  { key: "amber", label: "Amber", iconBgClass: "bg-[#F59E0B]" },
  { key: "emerald", label: "Emerald", iconBgClass: "bg-[#10B981]" },
  { key: "cyan", label: "Cyan", iconBgClass: "bg-[#0891B2]" },
  { key: "blue", label: "Blue", iconBgClass: "bg-[#2563EB]" },
  { key: "violet", label: "Violet", iconBgClass: "bg-[#7C3AED]" },
  { key: "zinc", label: "Zinc", iconBgClass: "bg-[#71717A]" },
];

export const DEFAULT_CATEGORY_ICON = CATEGORY_ICON_OPTIONS[0] ?? "tag";
export const DEFAULT_CATEGORY_COLOR_KEY: CategoryColorKey = "blue";

const CATEGORY_COLOR_BY_KEY = new Map<CategoryColorKey, CategoryColorOption>(
  CATEGORY_COLOR_OPTIONS.map((item) => [item.key, item]),
);

export const getCategoryColorOption = (
  colorKey: CategoryColorKey | undefined,
): CategoryColorOption => {
  if (!colorKey) {
    return CATEGORY_COLOR_BY_KEY.get(DEFAULT_CATEGORY_COLOR_KEY) as CategoryColorOption;
  }

  return CATEGORY_COLOR_BY_KEY.get(colorKey) ??
    (CATEGORY_COLOR_BY_KEY.get(DEFAULT_CATEGORY_COLOR_KEY) as CategoryColorOption);
};
