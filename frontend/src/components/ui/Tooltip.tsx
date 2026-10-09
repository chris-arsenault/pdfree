import {
  cloneElement,
  useCallback,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type RefAttributes,
} from "react";
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";

export function Tooltip({
  label,
  detail,
  shortcut,
  children,
}: {
  label: string;
  detail?: string;
  shortcut?: string;
  children: ReactElement<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>>;
}) {
  const [open, setOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
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
    placement: "bottom",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  });
  const referenceRef = useCallback(
    (node: HTMLElement | null) => {
      setReference(node);
      setPortalRoot(node?.closest("dialog") ?? null);
    },
    [setReference]
  );
  const hover = useHover(context, {
    move: false,
    mouseOnly: true,
    delay: 150,
    handleClose: safePolygon(),
  });
  const focus = useFocus(context);
  // Pressing the control closes its tooltip so it cannot cover what the press opens.
  const dismiss = useDismiss(context, { referencePress: true });
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);
  return (
    <>
      {cloneElement(children, { ...getReferenceProps(children.props), ref: referenceRef })}
      {open && (
        <FloatingPortal root={portalRoot ?? undefined}>
          <div
            ref={setFloating}
            className="ui-tooltip"
            // eslint-disable-next-line ahara/no-inline-styles -- Floating UI positions the tooltip against its live anchor and viewport.
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <span className="tooltip-heading">
              {label}
              {shortcut && <kbd>{shortcut}</kbd>}
            </span>
            {detail && <span className="tooltip-detail">{detail}</span>}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
