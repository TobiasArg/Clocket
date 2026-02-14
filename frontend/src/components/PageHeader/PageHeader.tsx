import { Avatar } from "../Avatar/Avatar";
import { PhosphorIcon } from "../PhosphorIcon/PhosphorIcon";

export interface PageHeaderProps {
  title: string;
  avatarInitials?: string;
  onBackClick?: () => void;
  onActionClick?: () => void;
  actionIcon?: string;
  actionAriaLabel?: string;
  actionButtonClassName?: string;
  actionIconClassName?: string;
}

export function PageHeader({
  title,
  avatarInitials,
  onBackClick,
  onActionClick,
  actionIcon = "plus",
  actionAriaLabel,
  actionButtonClassName = "bg-[#F4F4F5] border border-[#E4E4E7]",
  actionIconClassName = "text-[#3F3F46]",
}: PageHeaderProps) {
  return (
    <div className="flex min-w-0 items-center justify-between px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {avatarInitials ? (
          <Avatar initials={avatarInitials} className="shrink-0" />
        ) : onBackClick ? (
          <button
            type="button"
            onClick={onBackClick}
            className="flex shrink-0 items-center justify-center w-[44px] h-[44px] rounded-full bg-[#F4F4F5]"
            aria-label="Volver"
          >
            <PhosphorIcon name="arrow-left" className="text-black" />
          </button>
        ) : null}
        <span className="block truncate text-2xl font-bold text-black font-['Outfit']">
          {title}
        </span>
      </div>
      {onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          className={`flex shrink-0 items-center justify-center w-[44px] h-[44px] rounded-full ${actionButtonClassName}`}
          aria-label={actionAriaLabel ?? (actionIcon === "plus" ? "Agregar" : actionIcon)}
        >
          <PhosphorIcon name={actionIcon} className={actionIconClassName} />
        </button>
      )}
    </div>
  );
}
