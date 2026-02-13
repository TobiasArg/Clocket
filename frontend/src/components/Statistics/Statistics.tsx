import type { CategoryBreakdown, LegendItem, NavItem } from "@/types";
import { Dot } from "@/components";
import { PhosphorIcon } from "@/components";
import { TrendLine } from "@/components";
import { TextBadge } from "@/components";
import { StatDisplay } from "@/components";
import { BottomNavigation } from "@/components";
import { CardSection } from "@/components";
import { DonutChart } from "@/components";
import { PageHeader } from "@/components";
import { SummaryPanel } from "@/components";

function parsePercentage(value: string): number {
  const match = value.match(/\((\d+)%\)/);
  return match ? Number(match[1]) : 0;
}

const donutColors = ["#DC2626", "#2563EB", "#EA580C", "#71717A"];

export interface StatisticsProps {
  avatarInitials?: string;
  headerTitle?: string;
  periodLabel?: string;
  balanceTitle?: string;
  balanceLegend?: LegendItem[];
  totalIncomeLabel?: string;
  totalIncomeValue?: string;
  totalIncomeColor?: string;
  totalExpenseLabel?: string;
  totalExpenseValue?: string;
  totalExpenseColor?: string;
  categoryTitle?: string;
  categoryTotal?: string;
  categoryTotalLabel?: string;
  categories?: CategoryBreakdown[];
  savingsTitle?: string;
  savingsBadge?: string;
  savingsLabel?: string;
  savingsValue?: string;
  savingsGoalLabel?: string;
  savingsGoalValue?: string;
  savingsBg?: string;
  navItems?: NavItem[];
  onPeriodClick?: () => void;
  onNavItemClick?: (index: number) => void;
}

export function Statistics({
  avatarInitials = "JS",
  headerTitle = "Statistics",
  periodLabel = "Este mes",
  balanceTitle = "Balance Mensual",
  balanceLegend = [
    { color: "bg-[#16A34A]", label: "Ingresos" },
    { color: "bg-[#DC2626]", label: "Gastos" },
  ],
  totalIncomeLabel = "Total Ingresos",
  totalIncomeValue = "$8,420",
  totalIncomeColor = "text-[#16A34A]",
  totalExpenseLabel = "Total Gastos",
  totalExpenseValue = "$3,842",
  totalExpenseColor = "text-[#DC2626]",
  categoryTitle = "Gastos por Categoría",
  categoryTotal = "$3,842",
  categoryTotalLabel = "Total",
  categories = [
    { dotColor: "bg-[#DC2626]", name: "Alimentación", value: "$1,076 (28%)" },
    { dotColor: "bg-[#2563EB]", name: "Transporte", value: "$884 (23%)" },
    { dotColor: "bg-[#EA580C]", name: "Compras", value: "$730 (19%)" },
    { dotColor: "bg-[#71717A]", name: "Otros", value: "$1,152 (30%)" },
  ],
  savingsTitle = "Tendencia de Ahorro",
  savingsBadge = "+12.5%",
  savingsLabel = "Ahorrado este mes",
  savingsValue = "$4,578",
  savingsGoalLabel = "Meta mensual",
  savingsGoalValue = "$5,000",
  savingsBg = "bg-[#059669]",
  navItems = [
    { icon: "house", label: "Home" },
    { icon: "wallet", label: "Budgets" },
    { icon: "chart-bar", label: "Statistics", active: true },
    { icon: "trend-up", label: "Inversiones" },
    { icon: "dots-three", label: "Más" },
  ],
  onPeriodClick,
  onNavItemClick,
}: StatisticsProps) {
  const donutSegments = categories.map((cat, i) => ({
    color: donutColors[i % donutColors.length],
    name: cat.name,
    value: cat.value,
    percentage: parsePercentage(cat.value),
  }));

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="relative">
        <PageHeader title={headerTitle} avatarInitials={avatarInitials} />
        <button
          type="button"
          onClick={onPeriodClick}
          className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#F4F4F5] rounded-xl px-3 py-2"
          aria-label="Seleccionar periodo"
        >
          <span className="text-[13px] font-semibold text-black">{periodLabel}</span>
          <PhosphorIcon name="caret-down" className="text-black" size="text-[16px]" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-5 py-2 pb-5">
        <div className="flex flex-col gap-5">
          <CardSection
            title={balanceTitle}
            titleClassName="text-base font-bold text-black font-['Outfit']"
            action={
              <div className="flex items-center gap-3">
                {balanceLegend.map((item) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <Dot color={item.color} size="w-2 h-2" />
                    <span className="text-[10px] font-medium text-[#71717A]">{item.label}</span>
                  </div>
                ))}
              </div>
            }
            className="bg-[#F4F4F5] rounded-[20px] p-5"
          >
            <div className="flex justify-between w-full">
              <StatDisplay
                label={totalIncomeLabel}
                value={totalIncomeValue}
                labelClassName="text-[11px] font-medium text-[#71717A]"
                valueClassName={`text-xl font-bold font-['Outfit'] ${totalIncomeColor}`}
                gap="gap-0.5"
              />
              <StatDisplay
                label={totalExpenseLabel}
                value={totalExpenseValue}
                labelClassName="text-[11px] font-medium text-[#71717A]"
                valueClassName={`text-xl font-bold font-['Outfit'] ${totalExpenseColor}`}
                gap="gap-0.5"
                align="end"
              />
            </div>
          </CardSection>

          <CardSection
            title={categoryTitle}
            titleClassName="text-base font-bold text-black font-['Outfit']"
            className="bg-[#F4F4F5] rounded-[20px] p-5"
          >
            <DonutChart
              segments={donutSegments}
              centerValue={categoryTotal}
              centerLabel={categoryTotalLabel}
              bgFill="#F4F4F5"
            />
          </CardSection>

          <SummaryPanel
            bg={savingsBg}
            rounded="rounded-[20px]"
            padding="p-5"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-base font-bold text-white font-['Outfit']">{savingsTitle}</span>
              <TextBadge
                text={savingsBadge}
                bg="bg-white/20"
                textColor="text-white"
                rounded="rounded-lg"
                padding="px-2.5 py-1"
                fontSize="text-xs"
                fontWeight="font-semibold"
              />
            </div>
            <TrendLine />
            <div className="flex justify-between w-full">
              <StatDisplay
                label={savingsLabel}
                value={savingsValue}
                labelClassName="text-[11px] font-medium text-white/70"
                valueClassName="text-2xl font-bold text-white font-['Outfit']"
                gap="gap-0.5"
              />
              <StatDisplay
                label={savingsGoalLabel}
                value={savingsGoalValue}
                labelClassName="text-[11px] font-medium text-white/70"
                valueClassName="text-lg font-semibold text-white font-['Outfit']"
                gap="gap-0.5"
                align="end"
              />
            </div>
          </SummaryPanel>
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}
