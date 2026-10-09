import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { newId, type Bookmark } from "../core/model";
import { validateUtilities } from "../core/utilityModel";
import { documentOutline, type NavigationItem } from "../services/navigation";
import { IconButton } from "./ui/IconButton";

/** Left-panel outline: jump to bookmarked pages, or edit the outline in place. */
export function BookmarksPanel() {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <BookmarkEditor onDone={() => setEditing(false)} />
  ) : (
    <BookmarkOutline onEdit={() => setEditing(true)} />
  );
}
function BookmarkOutline({ onEdit }: { onEdit: () => void }) {
  const editor = useEditor(),
    [items, setItems] = useState<NavigationItem[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    documentOutline(editor.document)
      .then((outline) => {
        if (!cancelled) setItems(outline);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [editor.document]);
  return (
    <div className="bookmark-outline">
      <button className="button secondary full" onClick={onEdit}>
        <Pencil size={15} aria-hidden="true" /> Edit bookmarks
      </button>
      {items === null && <p className="field-note">Reading bookmarks…</p>}
      {items?.length === 0 && <p className="field-note">This document has no bookmarks.</p>}
      <ul aria-label="Document outline">
        {items?.map((item, index) => (
          <li key={`${item.pageId}-${index}`}>
            <button
              aria-current={item.pageId === editor.page?.id ? "page" : undefined}
              onClick={() => {
                editor.setActiveId(item.pageId);
                editor.setObjectIds([]);
                if (window.matchMedia("(max-width: 760px)").matches) editor.setPagesOpen(false);
              }}
            >
              <span>{item.title}</span>
              <small>
                {editor.document.pages.findIndex((page) => page.id === item.pageId) + 1}
              </small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
function useBookmarkDraft(onDone: () => void) {
  const editor = useEditor(),
    [bookmarks, setBookmarks] = useState(editor.document.bookmarks ?? []);
  const [dragged, setDragged] = useState(""),
    [error, setError] = useState("");
  const unsupported = editor.document.sources
    .filter((source) => editor.document.pages.some((page) => page.sourceId === source.id))
    .some((source) =>
      source.structuralWarnings.some((warning) =>
        ["document bookmarks", "internal page links", "named destinations or attachments"].includes(
          warning
        )
      )
    );
  const change = (id: string, update: Partial<Bookmark>) =>
    setBookmarks((items) => items.map((item) => (item.id === id ? { ...item, ...update } : item)));
  const depth = (bookmark: Bookmark): number =>
    bookmark.parentId ? 1 + depth(bookmarks.find((item) => item.id === bookmark.parentId)!) : 0;
  const descendants = (id: string): string[] =>
    bookmarks
      .filter((item) => item.parentId === id)
      .flatMap((item) => [item.id, ...descendants(item.id)]);
  const reorder = (id: string, targetId: string) => {
    const moving = new Set([id, ...descendants(id)]);
    if (moving.has(targetId)) return;
    const target = bookmarks.find((item) => item.id === targetId)!;
    const remaining = bookmarks.filter((item) => !moving.has(item.id));
    remaining.splice(
      remaining.findIndex((item) => item.id === targetId),
      0,
      ...bookmarks
        .filter((item) => moving.has(item.id))
        .map((item) => (item.id === id ? { ...item, parentId: target.parentId } : item))
    );
    setBookmarks(remaining);
  };
  const add = () =>
    setBookmarks([
      ...bookmarks,
      {
        id: newId(),
        parentId: null,
        title: `Page ${editor.document.pages.findIndex((page) => page.id === editor.page?.id) + 1}`,
        destination: { pageId: editor.page!.id, mode: "Fit", coordinates: [] },
      },
    ]);
  const save = () => {
    try {
      const next = { ...editor.document, bookmarks };
      validateUtilities(next);
      editor.commit(next);
      onDone();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid bookmarks.");
    }
  };
  return {
    editor,
    bookmarks,
    setBookmarks,
    dragged,
    setDragged,
    error,
    add,
    save,
    unsupported,
    change,
    depth,
    descendants,
    reorder,
  };
}
function BookmarkEditor({ onDone }: { onDone: () => void }) {
  const draft = useBookmarkDraft(onDone);
  return (
    <div className="bookmark-editor" role="group" aria-label="Edit bookmarks">
      <p className="field-note">
        Bookmarks follow their target page when pages move. Deleting a target removes its bookmark
        and disables links to it. Duplicating a page keeps existing bookmarks pointing to the
        original.
      </p>
      {draft.unsupported ? (
        <>
          <p className="inline-warning">
            This source contains unsupported navigation or catalog structures. Keep its original
            outline intact; editing bookmarks is unavailable.
          </p>
          <button className="button secondary" onClick={onDone}>
            Back to outline
          </button>
        </>
      ) : (
        <BookmarkRows draft={draft} onDone={onDone} />
      )}
    </div>
  );
}
function BookmarkRows({
  draft,
  onDone,
}: {
  draft: ReturnType<typeof useBookmarkDraft>;
  onDone: () => void;
}) {
  const { bookmarks, setBookmarks, dragged, setDragged, error, add, save } = draft;
  const { change, depth, descendants, reorder } = draft;
  return (
    <>
      {bookmarks.map((bookmark, index) => (
        <BookmarkRow
          key={bookmark.id}
          bookmark={bookmark}
          index={index}
          bookmarks={bookmarks}
          depth={depth(bookmark)}
          change={change}
          reorder={reorder}
          parents={bookmarks.filter(
            (item) => item.id !== bookmark.id && !descendants(bookmark.id).includes(item.id)
          )}
          start={() => setDragged(bookmark.id)}
          drop={() => reorder(dragged, bookmark.id)}
          remove={() => {
            const ids = new Set([bookmark.id, ...descendants(bookmark.id)]);
            setBookmarks(bookmarks.filter((item) => !ids.has(item.id)));
          }}
        />
      ))}
      {!bookmarks.length && <p className="field-note">No bookmarks yet.</p>}
      <button className="button secondary" onClick={add}>
        <Plus size={16} />
        Add current page
      </button>
      {error && (
        <p role="alert" className="inline-warning">
          {error}
        </p>
      )}
      <div className="bookmark-actions">
        <button className="button secondary" onClick={onDone}>
          Cancel
        </button>
        <button className="button primary" onClick={save}>
          Save bookmarks
        </button>
      </div>
    </>
  );
}
type BookmarkRowProps = {
  bookmark: Bookmark;
  index: number;
  bookmarks: Bookmark[];
  depth: number;
  change: (id: string, change: Partial<Bookmark>) => void;
  reorder: (id: string, targetId: string) => void;
  parents: Bookmark[];
  start: () => void;
  drop: () => void;
  remove: () => void;
};
function BookmarkRow({
  bookmark,
  index,
  bookmarks,
  depth,
  change,
  reorder,
  parents,
  start,
  drop,
  remove,
}: BookmarkRowProps) {
  return (
    <div
      className="bookmark-row"
      draggable
      onDragStart={start}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        drop();
      }}
      style={{ "--bookmark-depth": depth }}
    >
      <input
        aria-label={`Bookmark ${index + 1} title`}
        value={bookmark.title}
        onChange={(event) => change(bookmark.id, { title: event.target.value })}
      />
      <BookmarkTargets bookmark={bookmark} index={index} change={change} parents={parents} />
      <IconButton
        label={`Move bookmark ${index + 1} up`}
        icon={ArrowUp}
        disabled={!index}
        onClick={() => reorder(bookmark.id, bookmarks[index - 1].id)}
      />
      <IconButton
        label={`Move bookmark ${index + 1} down`}
        icon={ArrowDown}
        disabled={index === bookmarks.length - 1}
        onClick={() => reorder(bookmarks[index + 1].id, bookmark.id)}
      />
      <IconButton label={`Delete bookmark ${index + 1}`} icon={Trash2} onClick={remove} />
    </div>
  );
}
function BookmarkTargets({
  bookmark,
  index,
  change,
  parents,
}: Pick<BookmarkRowProps, "bookmark" | "index" | "change" | "parents">) {
  const editor = useEditor();
  return (
    <>
      <select
        aria-label={`Bookmark ${index + 1} page`}
        value={bookmark.destination.pageId}
        onChange={(event) =>
          change(bookmark.id, {
            destination: { pageId: event.target.value, mode: "Fit", coordinates: [] },
          })
        }
      >
        {editor.document.pages.map((page, number) => (
          <option key={page.id} value={page.id}>
            Page {number + 1}
          </option>
        ))}
      </select>
      <select
        aria-label={`Bookmark ${index + 1} parent`}
        value={bookmark.parentId ?? ""}
        onChange={(event) => change(bookmark.id, { parentId: event.target.value || null })}
      >
        <option value="">Root</option>
        {parents.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
    </>
  );
}
