import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { useEditor } from "../hooks/editorContext";
import { useElementSize } from "../hooks/useElementSize";
import { ReferenceDivider } from "./ReferenceDivider";
import { PinnedPage } from "./PinnedPage";
import { referenceWidth } from "./referenceGeometry";

const phoneQuery = "(max-width: 760px)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(phoneQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const phoneSnapshot = () => window.matchMedia(phoneQuery).matches;

export function DocumentWorkspace({ children }: { children: ReactNode }) {
  const { pinned } = useEditor();
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const phone = useSyncExternalStore(subscribe, phoneSnapshot);
  const narrow = phone || size.width < 640;
  const docked = !!pinned.page && !pinned.view.floating && !narrow;
  return (
    <main className="workspace" aria-label="Document editor">
      <div
        ref={ref}
        className="reference-layout"
        style={{ "--reference-width": `${referenceWidth(size.width, pinned.view.split)}px` }}
      >
        <div className="main-page-view">{children}</div>
        {docked && <ReferenceDivider width={size.width} />}
        {pinned.page && size.width > 0 && <PinnedPage size={size} narrow={narrow} />}
      </div>
    </main>
  );
}
