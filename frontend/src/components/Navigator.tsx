import { message } from "../i18n/messages";
import { text as tr } from "../i18n/runtime";
import { useState, useCallback } from "react";
import { useEditor } from "../hooks/editorContext";
import { searchDocument, type NavigationItem } from "../services/navigation";
import { Search, X } from "lucide-react";
import { IconButton } from "./ui/IconButton";
import { PageNavigation } from "./PageNavigation";
import { PanelToggle } from "./PanelToggle";
import { ZoomControls } from "./ZoomControls";

/** View-only bar: panels, text search, page position and zoom. */
export function Navigator() {
  const editor = useEditor(),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<NavigationItem[]>([]),
    [searched, setSearched] = useState(false);
  const close = useCallback(() => setSearched(false), []);
  const search = () =>
    editor.task.run(message("task.searching"), async () => {
      setResults(await searchDocument(editor.document, query));
      setSearched(true);
    });
  return (
    <div className="navigator">
      <PanelToggle panel="pages" />
      <PanelToggle panel="bookmarks" />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <label>
          <span className="sr-only">{tr("navigator.findText")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr("navigator.input")}
          />
        </label>
        <IconButton
          label={tr("common.find")}
          icon={Search}
          disabled={!query.trim() || !!editor.task.busy}
          detail={query.trim() ? tr("navigator.hint") : tr("navigator.enter")}
          onClick={search}
        />
      </form>
      <div className="view-controls">
        <PageNavigation />
        <ZoomControls />
      </div>
      <PanelToggle panel="properties" />
      <PanelToggle panel="comments" />
      {searched && <SearchResults results={results} close={close} />}
    </div>
  );
}
function SearchResults({ results, close }: { results: NavigationItem[]; close: () => void }) {
  const editor = useEditor();
  return (
    <div className="navigation-results" role="region" aria-label={tr("navigator.results")}>
      <IconButton label={tr("navigator.close")} icon={X} onClick={close} />
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
              {tr("common.pageNumber", {
                number: editor.document.pages.findIndex((page) => page.id === result.pageId) + 1,
              })}
            </strong>{" "}
            {result.title}
          </button>
        ))
      ) : (
        <p>{tr("navigator.noResults")}</p>
      )}
    </div>
  );
}
