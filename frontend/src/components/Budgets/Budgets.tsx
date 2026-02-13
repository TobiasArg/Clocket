import type { BudgetListItem, NavItem } from "@/types";
import { IconBadge } from "@/components";
import { TextBadge } from "@/components";
import { ProgressSection } from "@/components";
import { StatDisplay } from "@/components";
import { BottomNavigation } from "@/components";
import { CardSection } from "@/components";
import { PageHeader } from "@/components";
import { SummaryPanel } from "@/components";

export interface BudgetsProps {
  avatarInitials?: string;
  headerTitle?: string;
  summaryTitle?: string;
  summaryLeftLabel?: string;
  summaryLeftValue?: string;
  summaryRightLabel?: string;
  summaryRightValue?: string;
  summaryProgressPercent?: number;
  summaryProgressLabel?: string;
  sectionTitle?: string;
  budgets?: BudgetListItem[];
  navItems?: NavItem[];
  onAddClick?: () => void;
  onBudgetClick?: (index: number) => void;
  onNavItemClick?: (index: number) => void;
}

export function Budgets({
  avatarInitials = "JS",
  headerTitle = "Budgets",
  summaryTitle = "RESUMEN DE PRESUPUESTO",
  summaryLeftLabel = "Total Gastado",
  summaryLeftValue = "$1,095",
  summaryRightLabel = "Presupuesto Total",
  summaryRightValue = "$1,680",
  summaryProgressPercent = 65,
  summaryProgressLabel = "65% usado",
  sectionTitle = "Mis Budgets",
  budgets = [
    { icon: "hamburger", name: "Alimentación", meta: "Meta: Julio 2024", percentText: "70%", percentColor: "text-[#DC2626]", percentBg: "bg-[#FEE2E2]", barColor: "bg-[#DC2626]", barWidthPercent: 70, spentAmount: "$420", totalAmount: "$600" },
    { icon: "car", name: "Transporte", meta: "Meta: Julio 2024", percentText: "50%", percentColor: "text-[#2563EB]", percentBg: "bg-[#DBEAFE]", barColor: "bg-[#2563EB]", barWidthPercent: 50, spentAmount: "$180", totalAmount: "$360" },
    { icon: "popcorn", name: "Entretenimiento", meta: "Meta: Julio 2024", percentText: "81%", percentColor: "text-[#7C3AED]", percentBg: "bg-[#EDE9FE]", barColor: "bg-[#7C3AED]", barWidthPercent: 81, spentAmount: "$195", totalAmount: "$240" },
    { icon: "heartbeat", name: "Salud", meta: "Meta: Julio 2024", percentText: "63%", percentColor: "text-[#059669]", percentBg: "bg-[#D1FAE5]", barColor: "bg-[#059669]", barWidthPercent: 63, spentAmount: "$300", totalAmount: "$480" },
  ],
  navItems = [
    { icon: "house", label: "Home" },
    { icon: "wallet", label: "Budgets", active: true },
    { icon: "chart-bar", label: "Statistics" },
    { icon: "trend-up", label: "Inversiones" },
    { icon: "dots-three", label: "Más" },
  ],
  onAddClick,
  onBudgetClick,
  onNavItemClick,
}: BudgetsProps) {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        avatarInitials={avatarInitials}
        onActionClick={onAddClick}
        actionIcon="plus"
      />
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-4 py-5">
          <SummaryPanel title={summaryTitle}>
            <div className="flex justify-between w-full">
              <StatDisplay label={summaryLeftLabel} value={summaryLeftValue} />
              <StatDisplay label={summaryRightLabel} value={summaryRightValue} align="end" />
            </div>
            <ProgressSection
              percent={summaryProgressPercent}
              barColor="bg-[#10B981]"
              trackColor="bg-[#3F3F46]"
              leftLabel={summaryProgressLabel}
              leftLabelClassName="text-xs font-normal text-[#10B981]"
            />
          </SummaryPanel>

          <CardSection
            title={sectionTitle}
            titleClassName="text-lg font-bold text-black font-['Outfit']"
            className="px-5"
          >
            {budgets.map((budget, i) => (
              <button
                key={budget.name}
                type="button"
                onClick={() => onBudgetClick?.(i)}
                className="flex flex-col gap-4 bg-[#F4F4F5] rounded-[20px] p-5 text-left"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <IconBadge
                      icon={budget.icon}
                      size="w-[40px] h-[40px]"
                      rounded="rounded-[20px]"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-semibold text-[#18181B] font-['Outfit']">{budget.name}</span>
                      <span className="text-xs font-normal text-[#71717A]">{budget.meta}</span>
                    </div>
                  </div>
                  <TextBadge
                    text={budget.percentText}
                    bg={budget.percentBg}
                    textColor={budget.percentColor}
                    rounded="rounded-[10px]"
                    fontWeight="font-semibold"
                  />
                </div>
                <ProgressSection
                  percent={budget.barWidthPercent}
                  barColor={budget.barColor}
                  trackColor="bg-[#E4E4E7]"
                  leftLabel={budget.spentAmount}
                  rightLabel={budget.totalAmount}
                  leftLabelClassName="text-sm font-semibold text-[#18181B] font-['Outfit']"
                  rightLabelClassName="text-sm font-normal text-[#71717A]"
                />
              </button>
            ))}
          </CardSection>
        </div>
      </div>
      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}
