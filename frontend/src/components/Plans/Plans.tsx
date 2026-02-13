import type { PlanListItem } from "@/types";
import { TextBadge } from "@/components";
import { ProgressSection } from "@/components";
import { StatDisplay } from "@/components";
import { PageHeader } from "@/components";

export interface PlansProps {
  headerTitle?: string;
  cuotaLabel?: string;
  totalLabel?: string;
  plans?: PlanListItem[];
  onBackClick?: () => void;
  onAddClick?: () => void;
  onPlanClick?: (index: number) => void;
}

export function Plans({
  headerTitle = "Planes de Cuotas",
  cuotaLabel = "Cuota mensual",
  totalLabel = "Costo total",
  plans = [
    { name: "iPhone 15 Pro", description: "Apple Store - 128GB Space Black", currentInstallment: 3, totalInstallments: 6, monthlyAmount: "$199.00", totalCost: "$1,194.00", highlighted: true },
    { name: "MacBook Air M3", description: "Apple Store - 256GB Midnight", currentInstallment: 8, totalInstallments: 12, monthlyAmount: "$125.00", totalCost: "$1,500.00" },
    { name: "Seguro Auto", description: "Seguros La Nacional - Cobertura Full", currentInstallment: 2, totalInstallments: 4, monthlyAmount: "$89.00", totalCost: "$356.00" },
    { name: "PlayStation 5", description: "Sony Store - Digital Edition", currentInstallment: 1, totalInstallments: 3, monthlyAmount: "$166.33", totalCost: "$499.00" },
  ],
  onBackClick,
  onAddClick,
  onPlanClick,
}: PlansProps) {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={onAddClick}
        actionIcon="plus"
      />
      <div className="flex-1 overflow-auto px-5 py-4">
        <div className="flex flex-col gap-4">
          {plans.map((plan, i) => {
            const isHL = plan.highlighted ?? false;
            const progressPercent = (plan.currentInstallment / plan.totalInstallments) * 100;

            return (
              <button
                key={plan.name}
                type="button"
                onClick={() => onPlanClick?.(i)}
                className={`flex flex-col gap-4 rounded-[20px] p-5 text-left ${isHL ? "bg-black" : "bg-[#F4F4F5]"}`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col gap-1">
                    <span className={`text-lg font-bold font-['Outfit'] ${isHL ? "text-white" : "text-black"}`}>
                      {plan.name}
                    </span>
                    <span className={`text-xs font-medium ${isHL ? "text-[#A1A1AA]" : "text-[#71717A]"}`}>
                      {plan.description}
                    </span>
                  </div>
                  <TextBadge
                    text={`${plan.currentInstallment}/${plan.totalInstallments}`}
                    bg={isHL ? "bg-white" : "bg-black"}
                    textColor={isHL ? "text-black" : "text-white"}
                    rounded="rounded-xl"
                    padding="px-3 py-1.5"
                    fontSize="text-sm"
                    fontWeight="font-bold"
                  />
                </div>

                <ProgressSection
                  percent={progressPercent}
                  barColor={isHL ? "bg-white" : "bg-black"}
                  trackColor={isHL ? "bg-[#3F3F46]" : "bg-[#D4D4D8]"}
                />

                <div className="flex justify-between w-full">
                  <StatDisplay
                    label={cuotaLabel}
                    value={plan.monthlyAmount}
                    labelClassName={`text-[11px] font-medium ${isHL ? "text-[#A1A1AA]" : "text-[#71717A]"}`}
                    valueClassName={`text-xl font-bold font-['Outfit'] ${isHL ? "text-white" : "text-black"}`}
                    gap="gap-0.5"
                  />
                  <StatDisplay
                    label={totalLabel}
                    value={plan.totalCost}
                    labelClassName={`text-[11px] font-medium ${isHL ? "text-[#A1A1AA]" : "text-[#71717A]"}`}
                    valueClassName={`text-xl font-bold font-['Outfit'] ${isHL ? "text-white" : "text-black"}`}
                    gap="gap-0.5"
                    align="end"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
