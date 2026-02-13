import { Home as HomeView } from "@/modules/home";
import type { HomeProps } from "@/modules/home";

export type { HomeProps } from "@/modules/home";

export function Home(props: HomeProps) {
  return <HomeView {...props} />;
}
