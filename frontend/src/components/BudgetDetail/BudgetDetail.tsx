import type { SubcategoryItem } from "@/types";
import { PhosphorIcon } from "@/components";
import { TextBadge } from "@/components";
import { CategoryItem } from "@/components";
import { ProgressSection } from "@/components";
import { BudgetHero } from "@/components";
import { CardSection } from "@/components";

export interface BudgetDetailProps {
  headerBg?: string;
  budgetIcon?: string;
  budgetName?: string;
  budgetDescription?: string;
  spentLabel?: string;
  spentValue?: string;
  percentBadgeText?: string;
  progressPercent?: number;
  progressColor?: string;
  progressUsedLabel?: string;
  progressRemainingLabel?: string;
  subcategoriesTitle?: string;
  addSubLabel?: string;
  subcategories?: SubcategoryItem[];
  onBackClick?: () => void;
  onEditClick?: () => void;
  onAddSubcategory?: () => void;
}

export function BudgetDetail({
  headerBg = "bg-[#DC2626]",
  budgetIcon = "fork-knife",
  budgetName = "Alimentación",
  budgetDescription = "Comidas y bebidas del mes",
  spentLabel = "Gastado",
  spentValue = "$420 / $600",
  percentBadgeText = "25% de ingresos",
  progressPercent = 70,
  progressColor = "bg-[#DC2626]",
  progressUsedLabel = "70% usado",
  progressRemainingLabel = "$180 restante",
  subcategoriesTitle = "Subcategorías",
  addSubLabel = "Agregar",
  subcategories = [
    { dotColor: "bg-[#DC2626]", name: "Restaurantes", amount: "$180", percent: "43%", barColor: "bg-[#DC2626]", barWidthPercent: 43 },
    { dotColor: "bg-[#F97316]", name: "Supermercado", amount: "$150", percent: "36%", barColor: "bg-[#F97316]", barWidthPercent: 36 },
    { dotColor: "bg-[#8B5CF6]", name: "Delivery", amount: "$60", percent: "14%", barColor: "bg-[#8B5CF6]", barWidthPercent: 14 },
    { dotColor: "bg-[#06B6D4]", name: "Cafeterías", amount: "$30", percent: "7%", barColor: "bg-[#06B6D4]", barWidthPercent: 7 },
  ],
  onBackClick,
  onEditClick,
  onAddSubcategory,
}: BudgetDetailProps) {
  const progressTextColor = progressColor.replace("bg-", "text-");

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <BudgetHero
        headerBg={headerBg}
        icon={budgetIcon}
        name={budgetName}
        description={budgetDescription}
        spentLabel={spentLabel}
        spentValue={spentValue}
        percentBadgeText={percentBadgeText}
        onBackClick={onBackClick}
        onEditClick={onEditClick}
      />

      <div className="flex flex-col gap-2 px-5 pt-5">
        <ProgressSection
          percent={progressPercent}
          barColor={progressColor}
          barHeight="h-2.5"
          leftLabel={progressUsedLabel}
          rightLabel={progressRemainingLabel}
          leftLabelClassName={`text-xs font-semibold ${progressTextColor}`}
          rightLabelClassName="text-xs font-medium text-[#71717A]"
        />
      </div>

      <div className="flex-1 overflow-auto p-5">
        <CardSection
          title={subcategoriesTitle}
          action={
            <button
              type="button"
              onClick={onAddSubcategory}
              className="flex items-center gap-1.5 bg-[#F4F4F5] rounded-xl px-3 py-2"
              aria-label={addSubLabel}
            >
              <PhosphorIcon name="plus" size="text-[16px]" className="text-black" />
              <TextBadge
                text={addSubLabel}
                bg=""
                textColor="text-black"
                padding=""
                rounded=""
                fontSize="text-xs"
                fontWeight="font-semibold"
              />
            </button>
          }
        >
          <div className="flex flex-col gap-3">
            {subcategories.map((sub) => (
              <CategoryItem
                key={sub.name}
                dotColor={sub.dotColor}
                name={sub.name}
                value={sub.amount}
                secondaryValue={sub.percent}
                nameClassName="text-[15px] font-semibold text-black font-['Outfit']"
                valueClassName="text-[15px] font-bold text-black font-['Outfit']"
                secondaryClassName="text-xs font-medium text-[#71717A]"
                progress={{
                  percent: sub.barWidthPercent,
                  barColor: sub.barColor,
                  trackColor: "bg-[#E4E4E7]",
                  barHeight: "h-1.5",
                }}
                containerClassName="bg-[#F4F4F5] rounded-2xl p-4"
              />
            ))}
          </div>
        </CardSection>
      </div>
    </div>
  );
}
