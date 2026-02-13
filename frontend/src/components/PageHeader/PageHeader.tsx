import { Avatar } from "@/components";
import { PhosphorIcon } from "@/components";

export interface PageHeaderProps {
  title: string;
  avatarInitials?: string;
  onBackClick?: () => void;
  onActionClick?: () => void;
  actionIcon?: string;
}

export function PageHeader({
  title,
  avatarInitials,
  onBackClick,
  onActionClick,
  actionIcon = "plus",
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        {avatarInitials ? (
          <Avatar initials={avatarInitials} />
        ) : onBackClick ? (
          <button
            type="button"
            onClick={onBackClick}
            className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-[#F4F4F5]"
            aria-label="Volver"
          >
            <PhosphorIcon name="arrow-left" className="text-black" />
          </button>
        ) : null}
        <span className="text-2xl font-bold text-black font-['Outfit']">
          {title}
        </span>
      </div>
      {onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-black"
          aria-label={actionIcon === "plus" ? "Agregar" : actionIcon}
        >
          <PhosphorIcon name={actionIcon} className="text-white" />
        </button>
      )}
    </div>
  );
}
