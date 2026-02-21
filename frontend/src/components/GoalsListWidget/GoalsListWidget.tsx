import { CardSection, TextBadge } from "@/components";
import { IconBadge } from "../IconBadge/IconBadge";
import { ProgressSection } from "../ProgressSection/ProgressSection";
import type { GoalListPresentation } from "@/hooks";

export interface GoalsListWidgetProps {
  emptyHint?: string;
  emptyTitle?: string;
  errorLabel?: string;
  hasError?: boolean;
  isLoading?: boolean;
  items?: GoalListPresentation[];
  loadingLabel?: string;
  onOpenGoal?: (id: string) => void;
  sectionTitle?: string;
}

export function GoalsListWidget({
  emptyHint = "Agrega una meta para empezar a ahorrar con foco.",
  emptyTitle = "No hay metas",
  errorLabel = "No pudimos cargar las metas. Intenta nuevamente.",
  hasError = false,
  isLoading = false,
  items = [],
  loadingLabel = "Cargando metas...",
  onOpenGoal,
  sectionTitle = "Mis Goals",
}: GoalsListWidgetProps) {
  return (
    <CardSection
      title={sectionTitle}
      titleClassName="text-lg font-bold text-black font-['Outfit']"
      className="p-5"
    >
      {isLoading && items.length === 0 && (
        <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
      )}

      {!isLoading && hasError && (
        <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
      )}

      {!isLoading && !hasError && items.length === 0 && (
        <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
          <span className="block text-sm font-semibold text-black font-['Outfit']">{emptyTitle}</span>
          <span className="block text-xs font-medium text-[#71717A] mt-1">{emptyHint}</span>
        </div>
      )}

      {items.map((goal) => (
        <button
          key={goal.id}
          type="button"
          onClick={() => onOpenGoal?.(goal.id)}
          className="w-full text-left flex flex-col gap-4 bg-[#F4F4F5] rounded-[20px] p-5"
        >
          <div className="flex min-w-0 items-center justify-between w-full gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <IconBadge
                icon={goal.icon}
                bg={goal.iconBgClass}
                size="w-[48px] h-[48px]"
                rounded="rounded-[14px]"
                iconSize="text-2xl"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="block truncate text-base font-semibold text-black font-['Outfit']">
                  {goal.title}
                </span>
                <span className="block truncate text-xs font-normal text-[#71717A]">
                  Límite: {goal.deadlineLabel}
                </span>
              </div>
            </div>
            <TextBadge
              text={`${goal.percent}%`}
              bg={goal.percentBg}
              textColor={goal.percentColor}
              rounded="rounded-[10px]"
              fontWeight="font-semibold"
              className="shrink-0"
            />
          </div>
          <ProgressSection
            percent={goal.percent}
            barColor={goal.barColor}
            trackColor="bg-[#E4E4E7]"
            leftLabel={goal.savedAmountLabel}
            rightLabel={goal.targetAmountLabel}
            leftLabelClassName="text-sm font-semibold text-black font-['Outfit']"
            rightLabelClassName="text-sm font-normal text-[#71717A]"
          />
        </button>
      ))}
    </CardSection>
  );
}
