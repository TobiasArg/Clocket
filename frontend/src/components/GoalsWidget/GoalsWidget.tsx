import type { GoalCardSimple } from "@/types";
import { getGoalColorOption } from "@/utils";
import { CardSection, IconBadge } from "@/components";

export interface GoalsWidgetProps {
  goals: GoalCardSimple[];
  title: string;
  onGoalClick?: (goalId: string) => void;
}

export function GoalsWidget({
  goals,
  title,
  onGoalClick,
}: GoalsWidgetProps) {
  return (
    <CardSection
      title={title}
      titleClassName="text-lg font-bold text-[#18181B] font-['Outfit']"
      gap="gap-3"
    >
      {goals.length === 0 ? (
        <span className="text-sm font-medium text-[#71717A]">No hay metas activas.</span>
      ) : (
        <div className="flex gap-3 overflow-x-auto">
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => onGoalClick?.(goal.id)}
              className="flex flex-col gap-3 rounded-[20px] bg-white p-4 min-w-[140px] text-left"
            >
              {/*
                Icon color is derived from the goal token so dashboard cards always
                match the same goal identity used in list/detail.
              */}
              <IconBadge
                icon={goal.icon}
                bg={getGoalColorOption(goal.colorKey).iconBgClass}
                iconColor="text-white"
                size="w-[40px] h-[40px]"
                rounded="rounded-[12px]"
              />
              <div className="flex flex-col gap-1">
                <span className="text-base font-bold font-['Outfit'] text-black">
                  {goal.name}
                </span>
                <span className="text-2xl font-light font-['Outfit'] text-[#71717A]">
                  {`${goal.progressPercent}%`}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </CardSection>
  );
}
