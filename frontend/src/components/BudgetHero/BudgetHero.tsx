import { IconBadge } from "@/components";
import { PhosphorIcon } from "@/components";

export interface BudgetHeroProps {
  headerBg?: string;
  icon: string;
  name: string;
  description: string;
  spentLabel?: string;
  spentValue: string;
  percentBadgeText?: string;
  onBackClick?: () => void;
  onEditClick?: () => void;
  className?: string;
}

export function BudgetHero({
  headerBg = "bg-[#DC2626]",
  icon,
  name,
  description,
  spentLabel = "Gastado",
  spentValue,
  percentBadgeText,
  onBackClick,
  onEditClick,
  className = "",
}: BudgetHeroProps) {
  return (
    <div className={`flex flex-col justify-between ${headerBg} px-5 pt-4 pb-6 min-h-[220px] ${className}`}>
      <div className="flex justify-between w-full">
        <button
          type="button"
          onClick={onBackClick}
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white/20"
          aria-label="Volver"
        >
          <PhosphorIcon name="arrow-left" className="text-white" />
        </button>
        <button
          type="button"
          onClick={onEditClick}
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white/20"
          aria-label="Editar"
        >
          <PhosphorIcon name="pencil-simple" className="text-white" />
        </button>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <IconBadge
            icon={icon}
            bg="bg-white/20"
            iconColor="text-white"
            iconSize="text-[26px]"
            size="w-[52px] h-[52px]"
            rounded="rounded-[14px]"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="block truncate text-2xl font-bold text-white font-['Outfit']">{name}</span>
            <span className="block truncate text-[13px] font-medium text-white/70">{description}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-end justify-between w-full gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[11px] font-medium text-white/70">{spentLabel}</span>
            <span className="block truncate text-[clamp(1.25rem,7vw,1.75rem)] font-extrabold text-white font-['Outfit']">{spentValue}</span>
          </div>
          {percentBadgeText && (
            <div className="max-w-[96px] shrink-0 rounded-2xl bg-white/20 px-4 py-2">
              <span className="block truncate text-sm font-semibold text-white font-['Outfit']">{percentBadgeText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
