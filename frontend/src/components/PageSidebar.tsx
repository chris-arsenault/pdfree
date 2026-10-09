import { useState, type DragEvent } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";
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
      label={tab === "pages" ? "Pages" : "Bookmarks"}
      className="page-sidebar"
      open={editor.pagesOpen}
      onClose={() => editor.setPagesOpen(false)}
      drawer
    >
      <div className="panel-heading">
        <div className="panel-tabs" role="tablist" aria-label="Document contents">
          {(["pages", "bookmarks"] as const).map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              onClick={() => editor.setLeftTab(item)}
            >
              {item === "pages" ? "Pages" : "Bookmarks"}
              {item === "pages" && (
                <span className="panel-count">{editor.document.pages.length}</span>
              )}
            </button>
          ))}
        </div>
        <IconButton label={`Hide ${tab}`} icon={X} onClick={() => editor.setPagesOpen(false)} />
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
            Drop to add pages at the end
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
        aria-label={`Go to page ${index + 1}`}
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
            aria-label={`Select page ${index + 1}`}
          />
          {index + 1}
        </label>
        <div className="thumbnail-move">
          <IconButton
            label="Move page earlier"
            icon={ChevronUp}
            detail={
              index === 0 ? "This is already the first page." : `Move page ${index + 1} earlier.`
            }
            disabled={index === 0}
            onClick={() => editor.commit(movePage(editor.document, page.id, index - 1))}
          />
          <IconButton
            label="Move page later"
            icon={ChevronDown}
            detail={
              index === editor.document.pages.length - 1
                ? "This is already the last page."
                : `Move page ${index + 1} later.`
            }
            disabled={index === editor.document.pages.length - 1}
            onClick={() => editor.commit(movePage(editor.document, page.id, index + 1))}
          />
        </div>
      </div>
    </div>
  );
}
