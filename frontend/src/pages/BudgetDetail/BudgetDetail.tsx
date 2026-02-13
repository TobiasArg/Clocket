import { BudgetDetail as BudgetDetailView } from "@/modules/budget-detail";
import type { BudgetDetailProps } from "@/modules/budget-detail";

export type { BudgetDetailProps } from "@/modules/budget-detail";

export function BudgetDetail(props: BudgetDetailProps) {
  return <BudgetDetailView {...props} />;
}
