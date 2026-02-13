import { Statistics as StatisticsView } from "@/modules/statistics";
import type { StatisticsProps } from "@/modules/statistics";

export type { StatisticsProps } from "@/modules/statistics";

export function Statistics(props: StatisticsProps) {
  return <StatisticsView {...props} />;
}
