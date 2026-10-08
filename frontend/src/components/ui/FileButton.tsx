import { useRef } from "react";
import { type LucideIcon } from "lucide-react";

export function FileButton({
  label,
  icon: Icon,
  accept,
  multiple,
  onFiles,
  disabled = false,
  className = "button secondary",
  detail,
}: {
  label: string;
  icon: LucideIcon;
  accept: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  detail?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <span className="file-control">
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
        <span>
          {label}
          {detail && <small>{detail}</small>}
        </span>
      </button>
      <input
        ref={input}
        hidden
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
    </span>
  );
}
