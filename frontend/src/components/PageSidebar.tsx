import { formatNumber } from "../i18n/format";
import { text as tr } from "../i18n/runtime";
import { useState, type DragEvent } from "react";
import { ChevronUp, ChevronDown, ScanText, X, Pin } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { displaySize } from "../core/coordinates";
import { type Page } from "../core/model";
import { movePage } from "../core/pageOperations";
import { PageCanvas } from "./PageCanvas";
import { usePageWindow, thumbnailHeight } from "../hooks/usePageWindow";
import { PageActions } from "./PageActions";
import { BookmarksPanel } from "./BookmarksPanel";
import { IconButton } from "./ui/IconButton";
import { SidePanel } from "./ui/SidePanel";
/** Left panel: what is in the document, in order — page thumbnails or the bookmark outline. */
export function PageSidebar() {
  const editor = useEditor(),
    tab = editor.leftTab;
  return (
    <SidePanel
      id="pages-panel"
      label={tab === "pages" ? tr("common.pagesLabel") : tr("common.bookmarks")}
      className="page-sidebar"
      open={editor.pagesOpen}
      onClose={() => editor.setPagesOpen(false)}
      drawer
    >
      <div className="panel-heading">
        <div className="panel-tabs" role="tablist" aria-label={tr("pages.contents")}>
          {(["pages", "bookmarks"] as const).map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              onClick={() => editor.setLeftTab(item)}
            >
              {item === "pages" ? tr("common.pagesLabel") : tr("common.bookmarks")}
              {item === "pages" && (
                <span className="panel-count">{formatNumber(editor.document.pages.length)}</span>
              )}
            </button>
          ))}
        </div>
        <IconButton
          label={tr(tab === "pages" ? "pages.hidePages" : "pages.hideBookmarks")}
          icon={X}
          onClick={() => editor.setPagesOpen(false)}
        />
      </div>
      {tab === "pages" ? <PagesView /> : <BookmarksPanel />}
    </SidePanel>
  );
}
function PagesView() {
  const editor = useEditor();
  const {
    ref: listRef,
    start,
    visible,
  } = usePageWindow(editor.document.pages, editor.page?.id ?? "");
  const { dropping, ...dropTarget } = useAppendDrop();
  return (
    <>
      <PageActions />
      <div className={`thumbnail-list ${dropping ? "dropping" : ""}`} ref={listRef} {...dropTarget}>
        {dropping && (
          <p className="drop-hint" role="status">
            {tr("pages.dropAdd")}
          </p>
        )}
        <div
          className="thumbnail-space"
          style={{ "--list-height": `${editor.document.pages.length * thumbnailHeight}px` }}
        >
          {visible.map((page, index) => (
            <Thumbnail page={page} index={start + index} key={page.id} />
          ))}
        </div>
      </div>
    </>
  );
}
const carriesFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");
function useAppendDrop() {
  const editor = useEditor(),
    [dropping, setDropping] = useState(false);
  return {
    dropping,
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setDropping(true);
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(false);
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setDropping(false);
      const files = Array.from(event.dataTransfer.files);
      // A project replaces page content wholesale, so it opens as its own document instead.
      const project = files.some((file) => file.name.toLowerCase().endsWith(".pdfree"));
      editor.importFiles(files, project);
    },
  };
}
const RecognizedBadge = () => (
  <span className="thumbnail-badge" title={tr("pages.recognized")}>
    <ScanText size={12} aria-hidden="true" />
    <span className="sr-only">{tr("pages.recognized")}</span>
  </span>
);
function Thumbnail({ page, index }: { page: Page; index: number }) {
  const editor = useEditor(),
    source = editor.document.sources.find((item) => item.id === page.sourceId) ?? null;
  const size = displaySize(page),
    scale = Math.min(112 / size.width, 140 / size.height);
  return (
    <div
      className={`thumbnail-item ${page.id === editor.page?.id ? "active" : ""}`}
      style={{ "--item-top": `${index * thumbnailHeight}px` }}
    >
      <button
        className="thumbnail-button"
        draggable
        onDragStart={(event) => event.dataTransfer.setData("text/plain", page.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          if (carriesFiles(event)) return;
          event.preventDefault();
          editor.commit(movePage(editor.document, event.dataTransfer.getData("text/plain"), index));
        }}
        onClick={() => {
          editor.setActiveId(page.id);
          editor.setObjectIds([]);
          if (window.matchMedia("(max-width: 760px)").matches) editor.setPagesOpen(false);
        }}
        aria-label={tr("pages.goTo", { number: index + 1 })}
        aria-current={page.id === editor.page?.id ? "page" : undefined}
      >
        <PageCanvas page={page} source={source} scale={scale} thumbnail />
      </button>
      <div className="thumbnail-caption">
        <label>
          <input
            type="checkbox"
            checked={editor.pageIds.includes(page.id)}
            onChange={(event) =>
              editor.setPageIds(
                event.target.checked
                  ? [...editor.pageIds, page.id]
                  : editor.pageIds.filter((id) => id !== page.id)
              )
            }
            aria-label={tr("pages.select", { number: index + 1 })}
          />
          {formatNumber(index + 1)}
        </label>
        {page.recognition && <RecognizedBadge />}
        <ThumbnailMove page={page} index={index} />
      </div>
    </div>
  );
}
function ThumbnailPin({ pageId, number }: { pageId: string; number: number }) {
  const { pinned, setPagesOpen } = useEditor();
  const active = pinned.page?.id === pageId;
  return (
    <IconButton
      label={tr("pages.pinNumber", { number })}
      icon={Pin}
      aria-pressed={active}
      className={active ? "thumbnail-pin active" : "thumbnail-pin"}
      onClick={() => {
        pinned.pin(pageId);
        if (window.matchMedia("(max-width: 760px)").matches) setPagesOpen(false);
      }}
    />
  );
}

function ThumbnailMove({ page, index }: { page: Page; index: number }) {
  const editor = useEditor();
  return (
    <div className="thumbnail-move">
      <ThumbnailPin pageId={page.id} number={index + 1} />
      <IconButton
        label={tr("pages.earlier")}
        icon={ChevronUp}
        detail={
          index === 0 ? tr("pages.firstAlready") : tr("pages.earlierDetail", { number: index + 1 })
        }
        disabled={index === 0}
        onClick={() => editor.commit(movePage(editor.document, page.id, index - 1))}
      />
      <IconButton
        label={tr("pages.later")}
        icon={ChevronDown}
        detail={
          index === editor.document.pages.length - 1
            ? tr("pages.lastAlready")
            : tr("pages.laterDetail", { number: index + 1 })
        }
        disabled={index === editor.document.pages.length - 1}
        onClick={() => editor.commit(movePage(editor.document, page.id, index + 1))}
      />
    </div>
  );
}
