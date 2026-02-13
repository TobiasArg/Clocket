import { Transactions as TransactionsView } from "@/modules/transactions";
import type { TransactionsProps } from "@/modules/transactions";

export type { TransactionsProps } from "@/modules/transactions";

export function Transactions(props: TransactionsProps) {
  return <TransactionsView {...props} />;
}
