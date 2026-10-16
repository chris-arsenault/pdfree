import { useRef } from "react";
import { useEditor } from "../hooks/editorContext";
import { useElementSize } from "../hooks/useElementSize";
import { useReadingPosition } from "../hooks/useReadingPosition";
import { useReferencePan } from "../hooks/useReferencePan";
import { displaySize } from "../core/coordinates";
import { PageCanvas } from "./PageCanvas";
import { TextLayer } from "./TextLayer";
import { NativeFields } from "./NativeFields";
import { ObjectLayer } from "./ObjectLayer";
import { RulesLayer } from "./RulesLayer";
import { CommentMarkers } from "./CommentMarkers";
import { ReferenceZoom } from "./ReferenceZoom";

export function ReferencePageView() {
  const editor = useEditor(),
    { pinned } = editor;
  const page = pinned.page!;
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const dimensions = displaySize(page);
  const fitWidth = (size.width - 32) / dimensions.width;
  const fitPage = Math.min(fitWidth, (size.height - 32) / dimensions.height);
  const fittedScale = pinned.view.fit === "width" ? fitWidth : fitPage;
  const scale = pinned.view.fit ? Math.max(0.1, fittedScale) : pinned.view.zoom;
  const { remember } = useReadingPosition(ref, pinned.position, scale, page.id);
  const { active, ...pan } = useReferencePan(pinned.view.pan);
  const source = editor.document.sources.find((item) => item.id === page.sourceId) ?? null;
  return (
    <>
      <ReferenceZoom scale={scale} />
      <div
        ref={ref}
        className={`reference-scroll ${active ? "panning" : ""}`}
        // Keyboard users need to focus this independently scrollable region.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="region"
        aria-label="Pinned page viewport"
        onScroll={remember}
        {...pan}
      >
        <div
          className="page-surface tool-select reference-surface"
          role="region"
          aria-label="Pinned PDF page"
          style={{
            "--page-width": `${dimensions.width * scale}px`,
            "--page-height": `${dimensions.height * scale}px`,
          }}
        >
          <PageCanvas page={page} source={source} scale={scale} thumbnail={false} />
          <TextLayer page={page} source={source} scale={scale} revealed={false} />
          <NativeFields page={page} scale={scale} readOnly />
          <ObjectLayer page={page} scale={scale} readOnly />
          <RulesLayer page={page} scale={scale} />
          <CommentMarkers page={page} scale={scale} readOnly />
        </div>
      </div>
    </>
  );
}
