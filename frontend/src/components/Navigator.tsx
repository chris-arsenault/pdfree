import { useState, useCallback } from "react";
import { useEditor } from "../hooks/editorContext";
import { searchDocument, documentOutline, type NavigationItem } from "../services/navigation";
import { selectedHighlights } from "../core/selectionHighlights";
import { replaceObjects } from "../core/objectOperations";
export function Navigator() {
  const editor = useEditor(),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<NavigationItem[]>([]),
    [searched, setSearched] = useState(false);
  const close = useCallback(() => setSearched(false), []);
  const search = () =>
    editor.task.run("Searching text", async () => {
      setResults(await searchDocument(editor.document, query));
      setSearched(true);
    });
  const outline = () =>
    editor.task.run("Reading bookmarks", async () => {
      setResults(await documentOutline(editor.document));
      setSearched(true);
    });
  const highlight = () =>
    editor.task.run("Highlighting selection", () => {
      const surface = document.querySelector<HTMLElement>(".page-surface");
      if (!surface || !editor.page) return;
      editor.commit(
        replaceObjects(editor.document, editor.page.id, [
          ...editor.page.objects,
          ...selectedHighlights(surface, editor.page, editor.zoom),
        ])
      );
    });
  return (
    <div className="navigator">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <label>
          <span className="sr-only">Find text</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find text in document"
          />
        </label>
        <button disabled={!query.trim() || !!editor.task.busy}>Find</button>
      </form>
      <button onClick={outline}>Bookmarks</button>
      <button onPointerDown={(event) => event.preventDefault()} onClick={highlight}>
        Highlight selected text
      </button>
      <label>
        Page{" "}
        <input
          className="page-jump"
          type="number"
          min="1"
          max={editor.document.pages.length}
          value={editor.page ? editor.document.pages.indexOf(editor.page) + 1 : 1}
          onChange={(event) => {
            const page = editor.document.pages[Number(event.target.value) - 1];
            if (page) {
              editor.setActiveId(page.id);
              editor.setObjectIds([]);
            }
          }}
        />
      </label>
      {searched && <NavigationResults results={results} close={close} />}
    </div>
  );
}
function NavigationResults({ results, close }: { results: NavigationItem[]; close: () => void }) {
  const editor = useEditor();
  return (
    <div className="navigation-results">
      <button className="text-button" onClick={close}>
        Close results
      </button>
      {results.length ? (
        results.map((result, index) => (
          <button
            key={`${result.pageId}-${index}`}
            onClick={() => {
              editor.setActiveId(result.pageId);
              editor.setObjectIds([]);
            }}
          >
            <strong>
              Page {editor.document.pages.findIndex((page) => page.id === result.pageId) + 1}
            </strong>{" "}
            {result.title}
          </button>
        ))
      ) : (
        <p>No matching text or bookmarks. Scans need OCR before text search.</p>
      )}
    </div>
  );
}
