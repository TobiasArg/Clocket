import type { GoalColorKey } from "@/types";

export interface GoalColorOption {
  key: GoalColorKey;
  label: string;
  iconBgClass: string;
  barClass: string;
  textClass: string;
  softBgClass: string;
}

export const GOAL_ICON_OPTIONS: string[] = [
  "target",
  "piggy-bank",
  "airplane-tilt",
  "device-mobile",
  "car",
  "house",
  "briefcase",
  "graduation-cap",
  "barbell",
  "book",
  "camera",
  "gift",
  "shopping-bag",
  "game-controller",
  "music-note",
  "fork-knife",
  "palette",
  "heartbeat",
  "globe-hemisphere-west",
  "mountains",
];

export const GOAL_COLOR_OPTIONS: GoalColorOption[] = [
  {
    key: "emerald",
    label: "Emerald",
    iconBgClass: "bg-[#10B981]",
    barClass: "bg-[#10B981]",
    textClass: "text-[#10B981]",
    softBgClass: "bg-[#D1FAE5]",
  },
  {
    key: "sky",
    label: "Sky",
    iconBgClass: "bg-[#0EA5E9]",
    barClass: "bg-[#0EA5E9]",
    textClass: "text-[#0EA5E9]",
    softBgClass: "bg-[#E0F2FE]",
  },
  {
    key: "indigo",
    label: "Indigo",
    iconBgClass: "bg-[#4F46E5]",
    barClass: "bg-[#4F46E5]",
    textClass: "text-[#4F46E5]",
    softBgClass: "bg-[#E0E7FF]",
  },
  {
    key: "violet",
    label: "Violet",
    iconBgClass: "bg-[#7C3AED]",
    barClass: "bg-[#7C3AED]",
    textClass: "text-[#7C3AED]",
    softBgClass: "bg-[#EDE9FE]",
  },
  {
    key: "rose",
    label: "Rose",
    iconBgClass: "bg-[#E11D48]",
    barClass: "bg-[#E11D48]",
    textClass: "text-[#E11D48]",
    softBgClass: "bg-[#FFE4E6]",
  },
  {
    key: "amber",
    label: "Amber",
    iconBgClass: "bg-[#F59E0B]",
    barClass: "bg-[#F59E0B]",
    textClass: "text-[#D97706]",
    softBgClass: "bg-[#FEF3C7]",
  },
  {
    key: "cyan",
    label: "Cyan",
    iconBgClass: "bg-[#06B6D4]",
    barClass: "bg-[#06B6D4]",
    textClass: "text-[#0891B2]",
    softBgClass: "bg-[#CFFAFE]",
  },
  {
    key: "lime",
    label: "Lime",
    iconBgClass: "bg-[#65A30D]",
    barClass: "bg-[#65A30D]",
    textClass: "text-[#4D7C0F]",
    softBgClass: "bg-[#ECFCCB]",
  },
];

const GOAL_COLOR_BY_KEY = new Map<GoalColorKey, GoalColorOption>(
  GOAL_COLOR_OPTIONS.map((item) => [item.key, item]),
);

export const DEFAULT_GOAL_COLOR_KEY: GoalColorKey = "emerald";

export const getGoalColorOption = (
  colorKey: GoalColorKey | undefined,
): GoalColorOption => {
  if (!colorKey) {
    return GOAL_COLOR_BY_KEY.get(DEFAULT_GOAL_COLOR_KEY) as GoalColorOption;
  }

  return GOAL_COLOR_BY_KEY.get(colorKey) ??
    (GOAL_COLOR_BY_KEY.get(DEFAULT_GOAL_COLOR_KEY) as GoalColorOption);
};

export const getGoalCategoryName = (title: string): string => `Goal - "${title}"`;
