import { Accounts as AccountsView } from "@/modules/accounts";
import type { AccountsProps } from "@/modules/accounts";

export type { AccountsProps } from "@/modules/accounts";

export function Accounts(props: AccountsProps) {
  return <AccountsView {...props} />;
}
