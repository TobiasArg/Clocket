const BG_CLASS_PATTERN = /^bg-\[(.+)\](?:\/\d+)?$/;

export const DEFAULT_CATEGORY_FLOW_COLOR = "#71717A";

export const resolveCssColorFromBgClass = (
  bgClass: string | undefined,
  fallbackColor: string = DEFAULT_CATEGORY_FLOW_COLOR,
): string => {
  if (!bgClass) {
    return fallbackColor;
  }

  const tokens = bgClass.trim().split(/\s+/);
  for (const token of tokens) {
    const match = BG_CLASS_PATTERN.exec(token);
    if (match?.[1]) {
      return match[1];
    }
  }

  if (bgClass.startsWith("#") || bgClass.startsWith("var(")) {
    return bgClass;
  }

  return fallbackColor;
};
