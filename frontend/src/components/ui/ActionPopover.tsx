import { useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";

export function ActionPopover({
  label,
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  icon: LucideIcon;
  children: (close: () => void) => ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const {
    refs: { setReference, setFloating },
    floatingStyles,
    context,
  } = useFloating({
    open,
    onOpenChange: (next, event, reason) => {
      if (reason === "escape-key") event?.preventDefault();
      setOpen(next);
    },
    placement: "bottom-start",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);
  return (
    <>
      <button
        type="button"
        ref={setReference}
        className={`popover-trigger ${className}`}
        aria-label={label}
        {...getReferenceProps()}
      >
        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={setFloating}
            className="action-popover"
            aria-label={label}
            // eslint-disable-next-line ahara/no-inline-styles -- Floating UI positions the popover against its live anchor and viewport.
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {children(() => setOpen(false))}
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
}
