import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { displaySize } from "../core/coordinates";
import { type Page } from "../core/model";
import { movePage, insertBlank } from "../core/pageOperations";
import { PageCanvas } from "./PageCanvas";
import { usePageWindow, thumbnailHeight } from "../hooks/usePageWindow";
export function PageSidebar() {
  const editor = useEditor();
  const {
    ref: listRef,
    start,
    visible,
  } = usePageWindow(editor.document.pages, editor.page?.id ?? "");
  return (
    <aside className="page-sidebar" aria-label="Pages">
      <div className="sidebar-heading">
        <strong>Pages</strong>
        <span>{editor.document.pages.length}</span>
      </div>
      <div className="thumbnail-list" ref={listRef}>
        <div
          className="thumbnail-space"
          style={{ "--list-height": `${editor.document.pages.length * thumbnailHeight}px` }}
        >
          {visible.map((page, index) => (
            <Thumbnail page={page} index={start + index} key={page.id} />
          ))}
        </div>
      </div>
      <button
        className="button secondary full"
        onClick={() => editor.commit(insertBlank(editor.document, editor.page?.id ?? ""))}
      >
        <Plus size={15} /> Blank page
      </button>
    </aside>
  );
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
          event.preventDefault();
          editor.commit(movePage(editor.document, event.dataTransfer.getData("text/plain"), index));
        }}
        onClick={() => {
          editor.setActiveId(page.id);
          editor.setObjectIds([]);
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
          <button
            title="Move page earlier"
            disabled={index === 0}
            onClick={() => editor.commit(movePage(editor.document, page.id, index - 1))}
          >
            <ChevronUp size={13} />
          </button>
          <button
            title="Move page later"
            disabled={index === editor.document.pages.length - 1}
            onClick={() => editor.commit(movePage(editor.document, page.id, index + 1))}
          >
            <ChevronDown size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
