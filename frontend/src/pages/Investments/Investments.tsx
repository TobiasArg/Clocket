import { Investments as InvestmentsView } from "@/modules/investments";
import type { InvestmentsProps } from "@/modules/investments";

export type { InvestmentsProps } from "@/modules/investments";

export function Investments(props: InvestmentsProps) {
  return <InvestmentsView {...props} />;
}
