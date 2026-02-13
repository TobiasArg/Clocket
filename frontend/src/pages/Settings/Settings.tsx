import { Settings as SettingsView } from "@/modules/settings";
import type { SettingsProps } from "@/modules/settings";

export type { SettingsProps } from "@/modules/settings";

export function Settings(props: SettingsProps) {
  return <SettingsView {...props} />;
}
