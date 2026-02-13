import type { GoalListItem, NavItem } from "@/types";
import { IconBadge } from "@/components";
import { TextBadge } from "@/components";
import { ProgressSection } from "@/components";
import { StatDisplay } from "@/components";
import { BottomNavigation } from "@/components";
import { CardSection } from "@/components";
import { PageHeader } from "@/components";
import { SummaryPanel } from "@/components";

export interface GoalsProps {
  avatarInitials?: string;
  headerTitle?: string;
  summaryTitle?: string;
  totalLabel?: string;
  totalValue?: string;
  goalLabel?: string;
  goalValue?: string;
  progressPercent?: number;
  progressLabel?: string;
  sectionTitle?: string;
  goals?: GoalListItem[];
  navItems?: NavItem[];
  onAddClick?: () => void;
  onNavItemClick?: (index: number) => void;
}

export function Goals({
  avatarInitials = "JS",
  headerTitle = "Goals",
  summaryTitle = "RESUMEN DE AHORRO",
  totalLabel = "Total Ahorrado",
  totalValue = "$2,555",
  goalLabel = "Meta Total",
  goalValue = "$4,700",
  progressPercent = 54,
  progressLabel = "54% completado",
  sectionTitle = "Mis Goals",
  goals = [
    { icon: "airplane-tilt", name: "Vacaciones", date: "Meta: Julio 2024", percentText: "65%", percentColor: "text-[#10B981]", percentBg: "bg-[#D1FAE5]", barColor: "bg-[#10B981]", barWidthPercent: 65, currentAmount: "$1,950", targetAmount: "$3,000" },
    { icon: "device-mobile", name: "iPhone Nuevo", date: "Meta: Septiembre 2024", percentText: "40%", percentColor: "text-[#D97706]", percentBg: "bg-[#FEF3C7]", barColor: "bg-[#D97706]", barWidthPercent: 40, currentAmount: "$480", targetAmount: "$1,200" },
    { icon: "graduation-cap", name: "Curso Online", date: "Meta: Marzo 2024", percentText: "25%", percentColor: "text-[#DC2626]", percentBg: "bg-[#FEE2E2]", barColor: "bg-[#DC2626]", barWidthPercent: 25, currentAmount: "$125", targetAmount: "$500" },
  ],
  navItems = [
    { icon: "house", label: "Home" },
    { icon: "wallet", label: "Budgets" },
    { icon: "chart-pie-slice", label: "Statistics" },
    { icon: "trend-up", label: "Inversiones" },
    { icon: "dots-three-outline", label: "Más", active: true },
  ],
  onAddClick,
  onNavItemClick,
}: GoalsProps) {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        avatarInitials={avatarInitials}
        onActionClick={onAddClick}
        actionIcon="plus"
      />
      <div className="flex-1 overflow-auto">
        <SummaryPanel title={summaryTitle}>
          <div className="flex justify-between w-full">
            <StatDisplay label={totalLabel} value={totalValue} />
            <StatDisplay label={goalLabel} value={goalValue} align="end" />
          </div>
          <ProgressSection
            percent={progressPercent}
            barColor="bg-[#10B981]"
            trackColor="bg-[#3F3F46]"
            leftLabel={progressLabel}
            leftLabelClassName="text-xs font-normal text-[#10B981]"
          />
        </SummaryPanel>

        <CardSection
          title={sectionTitle}
          titleClassName="text-lg font-bold text-black font-['Outfit']"
          className="p-5"
        >
          {goals.map((goal) => (
            <div key={goal.name} className="flex flex-col gap-4 bg-[#F4F4F5] rounded-[20px] p-5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <IconBadge
                    icon={goal.icon}
                    size="w-[48px] h-[48px]"
                    rounded="rounded-[14px]"
                    iconSize="text-2xl"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-semibold text-black font-['Outfit']">{goal.name}</span>
                    <span className="text-xs font-normal text-[#71717A]">{goal.date}</span>
                  </div>
                </div>
                <TextBadge
                  text={goal.percentText}
                  bg={goal.percentBg}
                  textColor={goal.percentColor}
                  rounded="rounded-[10px]"
                  fontWeight="font-semibold"
                />
              </div>
              <ProgressSection
                percent={goal.barWidthPercent}
                barColor={goal.barColor}
                trackColor="bg-[#E4E4E7]"
                leftLabel={goal.currentAmount}
                rightLabel={goal.targetAmount}
                leftLabelClassName="text-sm font-semibold text-black font-['Outfit']"
                rightLabelClassName="text-sm font-normal text-[#71717A]"
              />
            </div>
          ))}
        </CardSection>
      </div>
      <BottomNavigation
        items={navItems}
        activeColor="text-[#10B981]"
        onItemClick={onNavItemClick}
      />
    </div>
  );
}
