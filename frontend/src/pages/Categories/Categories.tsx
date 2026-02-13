import { Categories as CategoriesView } from "@/modules/categories";
import type { CategoriesProps } from "@/modules/categories";

export type { CategoriesProps } from "@/modules/categories";

export function Categories(props: CategoriesProps) {
  return <CategoriesView {...props} />;
}
