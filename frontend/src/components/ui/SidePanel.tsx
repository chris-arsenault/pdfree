import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

const query = "(max-width: 760px)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const snapshot = () => window.matchMedia(query).matches;

export function SidePanel({
  id,
  label,
  className,
  open,
  onClose,
  drawer = false,
  children,
}: {
  id: string;
  label: string;
  className: string;
  open: boolean;
  onClose: () => void;
  drawer?: boolean;
  children: ReactNode;
}) {
  const narrow = useSyncExternalStore(subscribe, snapshot);
  if (!open) return null;
  if (drawer && narrow)
    return (
      <Drawer id={id} label={label} onClose={onClose}>
        <div className={className}>{children}</div>
      </Drawer>
    );
  return (
    <aside id={id} className={className} aria-label={label}>
      {children}
    </aside>
  );
}

function Drawer({
  id,
  label,
  onClose,
  children,
}: {
  id: string;
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} id={id} className="side-drawer" aria-label={label} onCancel={onClose}>
      {children}
    </dialog>
  );
}
