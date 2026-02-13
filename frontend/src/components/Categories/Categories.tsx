import { useState } from "react";
import type { Category } from "@/types";
import { IconBadge } from "@/components";
import { ExpandableListItem } from "@/components";
import { PageHeader } from "@/components";

export interface CategoriesProps {
  headerTitle?: string;
  categories?: Category[];
  onBackClick?: () => void;
  onAddClick?: () => void;
  onCategoryClick?: (index: number) => void;
}

export function Categories({
  headerTitle = "Categorías",
  categories = [
    {
      icon: "fork-knife",
      iconBg: "bg-[#DC2626]",
      name: "Alimentación",
      subcategoryCount: 4,
      subcategories: ["Restaurantes", "Supermercado", "Delivery", "Cafeterías"],
    },
    { icon: "car", iconBg: "bg-[#2563EB]", name: "Transporte", subcategoryCount: 3 },
    { icon: "game-controller", iconBg: "bg-[#7C3AED]", name: "Entretenimiento", subcategoryCount: 5 },
    { icon: "heart", iconBg: "bg-[#059669]", name: "Salud", subcategoryCount: 2 },
    { icon: "shopping-bag", iconBg: "bg-[#EA580C]", name: "Compras", subcategoryCount: 6 },
    { icon: "wrench", iconBg: "bg-[#0891B2]", name: "Servicios", subcategoryCount: 4 },
  ],
  onBackClick,
  onAddClick,
  onCategoryClick,
}: CategoriesProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    const isExpanding = expandedIndex !== index;
    setExpandedIndex(isExpanding ? index : null);
    if (isExpanding) {
      onCategoryClick?.(index);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={onAddClick}
        actionIcon="plus"
      />
      <div className="flex-1 overflow-auto px-5 py-4">
        <div className="flex flex-col gap-6">
          {categories.map((cat, i) => (
            <ExpandableListItem
              key={cat.name}
              left={
                <IconBadge
                  icon={cat.icon}
                  bg={cat.iconBg}
                  size="w-[40px] h-[40px]"
                  rounded="rounded-xl"
                />
              }
              title={cat.name}
              subtitle={`${cat.subcategoryCount} subcategorías`}
              titleClassName="text-base font-semibold text-black font-['Outfit']"
              subtitleClassName="text-xs font-medium text-[#71717A]"
              isExpanded={expandedIndex === i && !!cat.subcategories?.length}
              onToggle={() => handleToggle(i)}
            >
              {cat.subcategories?.map((sub, si) => (
                <div
                  key={sub}
                  className={`py-3 ${si < (cat.subcategories?.length ?? 0) - 1 ? "border-b border-[#F4F4F5]" : ""}`}
                >
                  <span className="text-sm font-medium text-[#52525B]">{sub}</span>
                </div>
              ))}
            </ExpandableListItem>
          ))}
        </div>
      </div>
    </div>
  );
}
