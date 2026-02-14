import type { GoalCardSimple } from "@/types";
import { CardSection, PhosphorIcon } from "@/components";

export interface GoalsWidgetProps {
  goals: GoalCardSimple[];
  title: string;
}

export function GoalsWidget({
  goals,
  title,
}: GoalsWidgetProps) {
  return (
    <CardSection
      title={title}
      titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
      className="rounded-[24px] bg-[#F4F4F5] p-4"
    >
      <div className="flex gap-3 overflow-x-auto">
        {goals.map((goal) => (
          <div
            key={goal.name}
            className={`flex flex-col gap-3 rounded-[20px] p-4 min-w-[140px] ${
              goal.highlighted ? "bg-black" : "bg-[#F4F4F5]"
            }`}
          >
            <PhosphorIcon
              name={goal.icon}
              size="text-2xl"
              className={goal.highlighted ? "text-white" : "text-black"}
            />
            <div className="flex flex-col gap-1">
              <span
                className={`text-base font-bold font-['Outfit'] ${goal.highlighted ? "text-white" : "text-black"}`}
              >
                {goal.name}
              </span>
              <span
                className={`text-2xl font-light font-['Outfit'] ${goal.highlighted ? "text-[#A1A1AA]" : "text-[#71717A]"}`}
              >
                {goal.progress}
              </span>
            </div>
          </div>
        ))}
      </div>
    </CardSection>
  );
}
