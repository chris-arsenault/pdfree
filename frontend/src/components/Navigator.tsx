import { useState, useCallback } from "react";
import { useEditor } from "../hooks/editorContext";
import { searchDocument, documentOutline, type NavigationItem } from "../services/navigation";
import { selectedHighlights } from "../core/selectionHighlights";
import { replaceObjects } from "../core/objectOperations";
import { Bookmark, Search, TextSelect, X } from "lucide-react";
import { IconButton } from "./ui/IconButton";
import { PageNavigation } from "./PageNavigation";
import { PanelToggle } from "./PanelToggle";
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
      <PanelToggle panel="pages" />
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
        <IconButton
          label="Find"
          icon={Search}
          disabled={!query.trim() || !!editor.task.busy}
          detail={query.trim() ? "Find text in this document." : "Enter text to search for."}
          onClick={search}
        />
      </form>
      <IconButton
        label="Bookmarks"
        icon={Bookmark}
        detail="Navigate the document outline."
        onClick={outline}
      />
      <IconButton
        label="Highlight selected text"
        icon={TextSelect}
        detail="Select original PDF text first. For scans, use the area highlight tool."
        onPointerDown={(event) => event.preventDefault()}
        onClick={highlight}
      />
      <PageNavigation />
      <PanelToggle panel="properties" />
      <PanelToggle panel="comments" />
      {searched && <NavigationResults results={results} close={close} />}
    </div>
  );
}
function NavigationResults({ results, close }: { results: NavigationItem[]; close: () => void }) {
  const editor = useEditor();
  return (
    <div className="navigation-results">
      <IconButton label="Close results" icon={X} onClick={close} />
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
