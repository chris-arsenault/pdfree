import { type ButtonHTMLAttributes } from "react";
import { type LucideIcon } from "lucide-react";
import { Tooltip } from "./Tooltip";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title"> & {
  label: string;
  icon: LucideIcon;
  detail?: string;
  shortcut?: string;
};

export function IconButton({
  label,
  icon: Icon,
  detail,
  shortcut,
  disabled = false,
  className = "",
  onClick,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip label={label} detail={detail} shortcut={shortcut}>
      <button
        {...props}
        type="button"
        className={`icon-button ${className}`}
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
      >
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
