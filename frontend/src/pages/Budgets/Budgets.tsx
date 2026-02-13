import { Budgets as BudgetsView } from "@/modules/budgets";
import type { BudgetsProps } from "@/modules/budgets";

export type { BudgetsProps } from "@/modules/budgets";

export function Budgets(props: BudgetsProps) {
  return <BudgetsView {...props} />;
}
