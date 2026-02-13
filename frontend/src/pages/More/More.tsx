import { More as MoreView } from "@/modules/more";
import type { MoreProps } from "@/modules/more";

export type { MoreProps } from "@/modules/more";

export function More(props: MoreProps) {
  return <MoreView {...props} />;
}
