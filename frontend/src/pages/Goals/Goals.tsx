import { Goals as GoalsView } from "@/modules/goals";
import type { GoalsProps } from "@/modules/goals";

export type { GoalsProps } from "@/modules/goals";

export function Goals(props: GoalsProps) {
  return <GoalsView {...props} />;
}
