import { useEffect, useRef, type ReactNode, type KeyboardEvent } from "react";
import { ArrowUpRight, Maximize2, PanelRightClose, PinOff, X } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { boundedFrame } from "./referenceGeometry";
import { ReferenceFrameControl } from "./ReferenceFrameControl";
import { IconButton } from "./ui/IconButton";
import { ReferencePageView } from "./ReferencePageView";

type ViewerProps = { size: { width: number; height: number }; narrow: boolean };
export function PinnedPage({ size, narrow }: ViewerProps) {
  const editor = useEditor(),
    { pinned } = editor;
  const floating = pinned.view.floating && !narrow;
  const frame = boundedFrame(pinned.view.frame, size);
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!narrow) section.current?.focus();
  }, [narrow, pinned.view.focus, floating]);
  const close = () => pinned.setView((previous) => ({ ...previous, open: false }));
  const keyboard = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !floating) return;
    event.preventDefault();
    event.stopPropagation();
    pinned.setView((previous) => ({ ...previous, floating: false }));
  };
  const content = (
    <>
      <ReferenceHeader narrow={narrow} close={close}>
        {floating && <ReferenceFrameControl size={size} resize={false} />}
      </ReferenceHeader>
      <ReferencePageView key={pinned.page!.id} />
      {floating && <ReferenceFrameControl size={size} resize />}
    </>
  );
  if (narrow)
    return pinned.view.open ? (
      <ReferenceModal close={close}>{content}</ReferenceModal>
    ) : (
      <button className="reference-reopen" onClick={() => pinned.pin(pinned.page!.id)}>
        Show pinned page{" "}
        {editor.document.pages.findIndex((page) => page.id === pinned.page!.id) + 1}
      </button>
    );
  return (
    // The focusable viewer handles Escape in its floating presentation.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      ref={section}
      tabIndex={-1}
      className={`pinned-page ${floating ? "floating" : "docked"}`}
      role={floating ? "dialog" : "region"}
      aria-modal={floating ? false : undefined}
      aria-label="Pinned page"
      onKeyDown={keyboard}
      style={{
        "--reference-x": `${frame.x}px`,
        "--reference-y": `${frame.y}px`,
        "--floating-width": `${frame.width}px`,
        "--floating-height": `${frame.height}px`,
      }}
    >
      {content}
    </section>
  );
}

function ReferenceHeader({
  narrow,
  close,
  children,
}: {
  narrow: boolean;
  close: () => void;
  children: ReactNode;
}) {
  const editor = useEditor(),
    { pinned } = editor;
  const number = editor.document.pages.findIndex((page) => page.id === pinned.page!.id) + 1;
  const go = () => {
    editor.setActiveId(pinned.page!.id);
    editor.setObjectIds([]);
    if (narrow) close();
    document.querySelector<HTMLElement>(".main-page-view .page-surface")?.focus();
  };
  return (
    <div className="reference-header">
      {children}
      <strong>Pinned page {number}</strong>
      <IconButton label="Go to pinned page" icon={ArrowUpRight} onClick={go} />
      {!narrow && (
        <IconButton
          label={pinned.view.floating ? "Dock pinned page" : "Pop out pinned page"}
          icon={pinned.view.floating ? PanelRightClose : Maximize2}
          onClick={() =>
            pinned.setView((previous) => ({ ...previous, floating: !previous.floating }))
          }
        />
      )}
      <IconButton
        label="Unpin page"
        icon={PinOff}
        onClick={() => {
          pinned.reset();
          document.querySelector<HTMLElement>("[data-pin-current]")?.focus();
        }}
      />
      {narrow && <IconButton label="Close pinned viewer" icon={X} onClick={close} />}
    </div>
  );
}

function ReferenceModal({ close, children }: { close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const returnFocus = document.activeElement;
    dialog.showModal();
    // Start on the scrollable page, avoiding a button tooltip consuming the first Escape.
    dialog.querySelector<HTMLElement>(".reference-scroll")?.focus();
    return () => {
      dialog.close();
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
      else document.querySelector<HTMLElement>("[data-pin-current]")?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="reference-modal"
      aria-label="Pinned page"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="pinned-page">{children}</div>
    </dialog>
  );
}
