import { Plans as PlansView } from "@/modules/plans";
import type { PlansProps } from "@/modules/plans";

export type { PlansProps } from "@/modules/plans";

export function Plans(props: PlansProps) {
  return <PlansView {...props} />;
}
