import { text as tr } from "../i18n/runtime";
import { useEditor } from "../hooks/editorContext";
import { displaySize } from "../core/coordinates";
import { PageCanvas } from "./PageCanvas";
import { NativeFields } from "./NativeFields";
import { ObjectLayer } from "./ObjectLayer";
import { usePlacement } from "../hooks/usePlacement";
import { toDisplay } from "../core/coordinates";
import { ObjectAppearance } from "./ObjectAppearance";
import { TextLayer } from "./TextLayer";
import { useInitialZoom } from "../hooks/useInitialZoom";
import { tools } from "./toolDefinitions";
import { hasPlacementAsset } from "../core/editorOperations";
import { CommentMarkers } from "./CommentMarkers";
import { RulesLayer } from "./RulesLayer";
import { ScanNotice } from "./ScanNotice";
import { DocumentWorkspace } from "./DocumentWorkspace";
import { useReadingPosition } from "../hooks/useReadingPosition";
import { useRef } from "react";
import { useMessages } from "../i18n/react";
import { warningKeys } from "../i18n/diagnostics";

export function Workspace() {
  const { text } = useMessages();
  const editor = useEditor(),
    page = editor.page;
  const placement = usePlacement();
  const scrollRef = useInitialZoom();
  const position = useRef({ x: 0.5, y: 0 });
  const { remember } = useReadingPosition(scrollRef, position, editor.zoom, editor.activeId);
  if (!page) return null;
  const source = editor.document.sources.find((item) => item.id === page.sourceId) ?? null;
  const dimensions = displaySize(page);
  return (
    <DocumentWorkspace>
      {!!source?.warnings.length && (
        <div className="inline-warning">
          {source.warnings.map((warning) => text(warningKeys[warning])).join(" ")}
        </div>
      )}
      <ScanNotice key={editor.documentEpoch} />
      <div className="page-scroll" ref={scrollRef} onScroll={remember}>
        <div
          className={`page-surface tool-${editor.tool}`}
          role="region"
          tabIndex={-1}
          aria-label={tr("pages.pdf")}
          onPointerDown={placement.start}
          onPointerMove={placement.move}
          onPointerUp={placement.end}
          onPointerCancel={placement.end}
          style={{
            "--page-width": `${dimensions.width * editor.zoom}px`,
            "--page-height": `${dimensions.height * editor.zoom}px`,
          }}
        >
          <PageCanvas page={page} source={source} scale={editor.zoom} thumbnail={false} />
          <TextLayer
            page={page}
            source={source}
            scale={editor.zoom}
            revealed={editor.showRecognition}
          />
          <NativeFields />
          <ObjectLayer />
          <RulesLayer />
          <CommentMarkers />
          {placement.preview && (
            <div
              className={`placement-preview kind-${placement.preview.kind}`}
              style={{
                "--x": `${toDisplay({ x: placement.preview.x, y: placement.preview.y + placement.preview.height }, page).x * editor.zoom}px`,
                "--y": `${toDisplay({ x: placement.preview.x, y: placement.preview.y + placement.preview.height }, page).y * editor.zoom}px`,
                "--w": `${placement.preview.width * editor.zoom}px`,
                "--h": `${placement.preview.height * editor.zoom}px`,
                "--angle": `${page.rotation}deg`,
                "--object-color": placement.preview.color,
                "--font-size": `${placement.preview.fontSize * editor.zoom}px`,
                "--opacity": placement.preview.opacity,
                "--stroke-width": placement.preview.strokeWidth,
              }}
            >
              <ObjectAppearance object={placement.preview} assets={editor.document.assets} />
            </div>
          )}
        </div>
      </div>
      {editor.tool !== "select" && (
        <div className="workspace-hint" role="status">
          {editor.tool === "image" && hasPlacementAsset(editor.document, editor.pendingObject)
            ? tr("image.place")
            : tools.find((tool) => tool.id === editor.tool)?.hint}
        </div>
      )}
    </DocumentWorkspace>
  );
}
